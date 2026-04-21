using System.Text.Json;
using HotelManagement.Data;
using HotelManagement.Dtos;
using HotelManagement.Entities;
using HotelManagement.Repositories.Interfaces;
using HotelManagement.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/momo")]
public class MomoController : ControllerBase
{
    private readonly IMomoService _momoService;
    private readonly IBookingRepository _bookingRepository;
    private readonly IBookingService _bookingService;
    private readonly IInvoiceService _invoiceService;
    private readonly IPaymentRepository _paymentRepository;
    private readonly AppDbContext _dbContext;
    private readonly ILogger<MomoController> _logger;

    private const string BookingType = "booking";
    private const string InvoiceType = "invoice";

    public MomoController(
        IMomoService momoService,
        IBookingRepository bookingRepository,
        IBookingService bookingService,
        IInvoiceService invoiceService,
        IPaymentRepository paymentRepository,
        AppDbContext dbContext,
        ILogger<MomoController> logger)
    {
        _momoService = momoService;
        _bookingRepository = bookingRepository;
        _bookingService = bookingService;
        _invoiceService = invoiceService;
        _paymentRepository = paymentRepository;
        _dbContext = dbContext;
        _logger = logger;
    }

    [HttpPost("create")]
    public async Task<IActionResult> CreatePayment([FromBody] MomoCreatePaymentRequestDto request)
    {
        if (request == null || request.TargetId <= 0 || string.IsNullOrWhiteSpace(request.Type))
        {
            throw new BadRequestException("Type and targetId are required.");
        }

        var paymentType = request.Type.Trim().ToLowerInvariant();
        decimal amount;
        int? bookingId = null;
        int? invoiceId = null;

        if (paymentType == BookingType)
        {
            var booking = await _bookingRepository.GetBookingByIdWithDetailsAsync(request.TargetId);
            if (booking == null)
            {
                throw new NotFoundException($"Booking with ID {request.TargetId} not found.");
            }

            if (string.Equals(booking.Status, "Confirmed", StringComparison.OrdinalIgnoreCase))
            {
                throw new ConflictException($"Booking #{booking.Id} is already confirmed.");
            }

            var hasCompletedPayment = await _paymentRepository.HasCompletedBookingPaymentAsync(booking.Id);
            if (hasCompletedPayment)
            {
                throw new ConflictException($"Booking #{booking.Id} is already paid.");
            }

            amount = booking.Deposit ?? 0m;
            bookingId = booking.Id;
        }
        else if (paymentType == InvoiceType)
        {
            var invoice = await _invoiceService.GetInvoiceByIdAsync(request.TargetId);
            if (invoice == null)
            {
                throw new NotFoundException($"Invoice with ID {request.TargetId} not found.");
            }

            var hasCompletedPayment = await _paymentRepository.HasCompletedInvoicePaymentAsync(invoice.Id);
            if (hasCompletedPayment)
            {
                var outstanding = await _invoiceService.GetOutstandingAmountAsync(invoice.Id);
                if (outstanding <= 0)
                {
                    throw new ConflictException($"Invoice #{invoice.Id} is already fully paid.");
                }
            }

            amount = await _invoiceService.GetOutstandingAmountAsync(invoice.Id);
            bookingId = invoice.BookingId;
            invoiceId = invoice.Id;
        }
        else
        {
            throw new BadRequestException("Type must be 'booking' or 'invoice'.");
        }

        if (amount <= 0)
        {
            throw new ConflictException("No outstanding amount to pay.");
        }

        var amountLong = Convert.ToInt64(Math.Round(amount, 0, MidpointRounding.AwayFromZero));
        var momoOrderId = Guid.NewGuid().ToString("N");
        var requestId = Guid.NewGuid().ToString("N");
        var extraData = new MomoExtraDataDto
        {
            Type = paymentType,
            BookingId = bookingId,
            InvoiceId = invoiceId,
            ExpectedAmount = amount,
            MomoOrderId = momoOrderId,
            RequestId = requestId,
            TimestampUnix = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
        };

        var serializedExtraData = JsonSerializer.Serialize(extraData);
        var extraDataBase64 = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(serializedExtraData));

        var momoResponse = await _momoService.CreatePaymentAsync(new MomoCreatePaymentGatewayRequestDto
        {
            Amount = amountLong,
            OrderInfo = paymentType == BookingType
                ? $"Booking deposit payment #{bookingId}"
                : $"Invoice payment #{invoiceId}",
            ExtraData = extraDataBase64,
            OrderId = momoOrderId,
            RequestId = requestId,
        });

        await _paymentRepository.AddAsync(new Payment
        {
            InvoiceId = invoiceId,
            BookingId = bookingId,
            PaymentMethod = "Momo",
            AmountPaid = amount,
            TransactionCode = null,
            MomoOrderId = momoResponse.OrderId,
            RequestId = momoResponse.RequestId,
            PaymentForType = paymentType,
            Status = "Pending",
            PaymentDate = null,
            RawIpn = null,
        });
        await _paymentRepository.SaveChangesAsync();

        _logger.LogInformation("Created MoMo payment link: type={Type}, targetId={TargetId}, orderId={OrderId}, amount={Amount}", paymentType, request.TargetId, momoResponse.OrderId, amountLong);

        return Ok(new
        {
            payUrl = momoResponse.PayUrl,
            orderId = momoResponse.OrderId,
            requestId = momoResponse.RequestId,
            amount = amountLong,
            type = paymentType,
        });
    }

    [HttpPost("ipn")]
    public async Task<IActionResult> MomoIpn([FromBody] MomoIpnRequestDto ipn)
    {
        if (ipn == null)
        {
            throw new BadRequestException("Invalid IPN payload.");
        }

        if (string.IsNullOrWhiteSpace(ipn.OrderId))
        {
            throw new BadRequestException("IPN orderId is required.");
        }

        if (!_momoService.VerifyIpnSignature(ipn))
        {
            throw new BadRequestException("Invalid MoMo IPN signature.");
        }

        var rawIpn = JsonSerializer.Serialize(ipn);
        var extraData = _momoService.DecodeExtraData(ipn.ExtraData);

        var payment = await _paymentRepository.GetByMomoOrderIdAsync(ipn.OrderId);
        if (payment == null)
        {
            throw new NotFoundException($"Payment with orderId {ipn.OrderId} not found.");
        }

        var transactionCode = (ipn.TransId ?? ipn.TransactionId)?.ToString();
        if (!string.IsNullOrWhiteSpace(transactionCode))
        {
            var duplicated = await _paymentRepository.GetByTransactionCodeAsync(transactionCode);
            if (duplicated != null && duplicated.Id != payment.Id)
            {
                throw new ConflictException($"Transaction {transactionCode} already processed.");
            }
        }

        if (string.Equals(payment.Status, "Completed", StringComparison.OrdinalIgnoreCase))
        {
            throw new ConflictException($"Order {ipn.OrderId} already processed.");
        }

        using var dbTransaction = await _dbContext.Database.BeginTransactionAsync();
        try
        {
            payment.TransactionCode = transactionCode;
            payment.RawIpn = rawIpn;
            payment.PaymentDate = DateTime.UtcNow;

            if (ipn.ResultCode != 0)
            {
                payment.Status = "Failed";
                _paymentRepository.Update(payment);
                await _paymentRepository.SaveChangesAsync();
                await dbTransaction.CommitAsync();

                _logger.LogWarning("MoMo IPN failed: orderId={OrderId}, transactionCode={TransactionCode}, resultCode={ResultCode}, message={Message}", ipn.OrderId, transactionCode, ipn.ResultCode, ipn.Message);
                return Ok(new { message = "Payment failed and recorded." });
            }

            var paidAmount = Convert.ToDecimal(ipn.Amount);
            if (extraData != null && extraData.ExpectedAmount > 0 && paidAmount != extraData.ExpectedAmount)
            {
                throw new BadRequestException($"IPN amount mismatch for order {ipn.OrderId}.");
            }

            payment.AmountPaid = paidAmount;
            payment.Status = "Completed";

            var resolvedType = (extraData?.Type ?? payment.PaymentForType ?? string.Empty).Trim().ToLowerInvariant();
            if (resolvedType == BookingType)
            {
                var resolvedBookingId = extraData?.BookingId ?? payment.BookingId;
                if (!resolvedBookingId.HasValue)
                {
                    throw new BadRequestException("Cannot resolve bookingId from IPN payload.");
                }

                var booking = await _bookingRepository.GetBookingByIdWithDetailsAsync(resolvedBookingId.Value);
                if (booking == null)
                {
                    throw new NotFoundException($"Booking #{resolvedBookingId.Value} not found.");
                }

                if (string.Equals(booking.Status, "Pending", StringComparison.OrdinalIgnoreCase))
                {
                    await _bookingService.ChangeBookingStatusAsync(booking.Id, "Confirmed");
                }
            }
            else if (resolvedType == InvoiceType)
            {
                var resolvedInvoiceId = extraData?.InvoiceId ?? payment.InvoiceId;
                if (!resolvedInvoiceId.HasValue)
                {
                    throw new BadRequestException("Cannot resolve invoiceId from IPN payload.");
                }

                var invoice = await _invoiceService.GetInvoiceByIdAsync(resolvedInvoiceId.Value);
                if (invoice == null)
                {
                    throw new NotFoundException($"Invoice #{resolvedInvoiceId.Value} not found.");
                }

                payment.InvoiceId = invoice.Id;
                payment.BookingId = invoice.BookingId;

                _paymentRepository.Update(payment);
                await _paymentRepository.SaveChangesAsync();

                var remaining = await _invoiceService.GetOutstandingAmountAsync(invoice.Id);
                if (remaining <= 0)
                {
                    await _invoiceService.CompleteInvoiceByIdAsync(invoice.Id);
                }

                await dbTransaction.CommitAsync();

                _logger.LogInformation("MoMo IPN processed for invoice: orderId={OrderId}, invoiceId={InvoiceId}, transactionCode={TransactionCode}, amount={Amount}", ipn.OrderId, invoice.Id, transactionCode, paidAmount);
                return Ok(new { message = "IPN processed successfully." });
            }
            else
            {
                throw new BadRequestException("Unsupported payment type in IPN extraData.");
            }

            _paymentRepository.Update(payment);
            await _paymentRepository.SaveChangesAsync();
            await dbTransaction.CommitAsync();

            _logger.LogInformation("MoMo IPN processed for booking: orderId={OrderId}, bookingId={BookingId}, transactionCode={TransactionCode}, amount={Amount}", ipn.OrderId, payment.BookingId, transactionCode, paidAmount);
            return Ok(new { message = "IPN processed successfully." });
        }
        catch
        {
            await dbTransaction.RollbackAsync();
            throw;
        }
    }
}
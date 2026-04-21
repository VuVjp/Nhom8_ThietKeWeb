using HotelManagement.Dtos;
using HotelManagement.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace HotelManagement.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InvoicesController : ControllerBase
{
    private readonly IInvoiceService _invoiceService;
    private readonly INotificationService _notificationService;

    public InvoicesController(IInvoiceService invoiceService, INotificationService notificationService)
    {
        _invoiceService = invoiceService;
        _notificationService = notificationService;
    }

    private async Task NotifyRolesAsync(IEnumerable<RoleName> roles, CreateNotificationDto dto)
    {
        var tasks = roles.Distinct().Select(role => _notificationService.SendByRoleAsync(role, dto));
        await Task.WhenAll(tasks);
    }

    private async Task TryNotifyRolesAsync(IEnumerable<RoleName> roles, CreateNotificationDto dto)
    {
        try
        {
            await NotifyRolesAsync(roles, dto);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Notification Warning] {ex.Message}");
        }
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<InvoiceDto>>> GetAll()
    {
        var invoices = await _invoiceService.GetAllInvoicesAsync();
        var dtos = await Task.WhenAll(invoices.Select(MapToDtoAsync));
        return Ok(dtos);
    }

    [HttpGet("paged")]
    public async Task<ActionResult<PaginatedResultDto<InvoiceDto>>> GetPaged([FromQuery] InvoiceQueryDto query)
    {
        var result = await _invoiceService.GetPagedInvoicesAsync(query);
        var dtos = (await Task.WhenAll(result.Items.Select(MapToDtoAsync))).ToList();

        return Ok(new PaginatedResultDto<InvoiceDto>
        {
            Items = dtos,
            Total = result.Total,
            Page = result.Page,
            PageSize = result.PageSize
        });
    }

    private async Task<InvoiceDto> MapToDtoAsync(Entities.Invoice i)
    {
        // For the paged list, we show the first room number if it's a split invoice
        var isSplit = i.BookingDetails.Count < (i.Booking?.BookingDetails.Count ?? 0);
        var roomNumber = i.BookingDetails.FirstOrDefault()?.Room?.RoomNumber;

        var paidAmount = await _invoiceService.GetPaidAmountAsync(i.Id);
        var allocatedDeposit = await _invoiceService.GetAllocatedDepositAsync(i.Id);
        var remainingAmount = Math.Max(0m, (i.FinalTotal ?? 0m) - paidAmount - allocatedDeposit);

        return new InvoiceDto
        {
            Id = i.Id,
            BookingId = i.BookingId,
            InvoiceCode = i.InvoiceCode,
            GuestName = i.Booking?.GuestName,
            BookingCode = i.Booking?.BookingCode,
            TotalRoomAmount = i.TotalRoomAmount ?? 0,
            TotalServiceAmount = i.TotalServiceAmount ?? 0,
            TotalLossDamageAmount = i.TotalLossDamageAmount ?? 0,
            DiscountAmount = i.DiscountAmount ?? 0,
            TaxAmount = i.TaxAmount ?? 0,
            FinalTotal = i.FinalTotal ?? 0,
            PaidAmount = paidAmount,
            AllocatedDeposit = allocatedDeposit,
            RemainingAmount = remainingAmount,
            Status = i.Status,
            CreatedAt = i.CreatedAt,
            CompletedAt = i.CompletedAt,
            IsSplit = isSplit,
            RoomNumber = i.BookingDetails.Count == 1 ? roomNumber : null
        };
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<InvoiceDetailDto>> GetById(int id)
    {
        var invoice = await _invoiceService.GetInvoiceByIdAsync(id);
        if (invoice == null) return NotFound();

        var booking = invoice.Booking;
        if (booking == null) return NotFound("Booking data not found for this invoice");

        var targetDetails = invoice.BookingDetails.ToList();
        var isSplit = targetDetails.Count < (booking.BookingDetails.Count);
        var paidAmount = await _invoiceService.GetPaidAmountAsync(invoice.Id);
        var allocatedDeposit = await _invoiceService.GetAllocatedDepositAsync(invoice.Id);
        var remainingAmount = Math.Max(0m, (invoice.FinalTotal ?? 0m) - paidAmount - allocatedDeposit);

        var dto = new InvoiceDetailDto
        {
            Id = invoice.Id,
            BookingId = invoice.BookingId,
            InvoiceCode = invoice.InvoiceCode,
            GuestName = booking.GuestName,
            BookingCode = booking.BookingCode,
            TotalRoomAmount = invoice.TotalRoomAmount ?? 0,
            TotalServiceAmount = invoice.TotalServiceAmount ?? 0,
            TotalLossDamageAmount = invoice.TotalLossDamageAmount ?? 0,
            DiscountAmount = invoice.DiscountAmount ?? 0,
            TaxAmount = invoice.TaxAmount ?? 0,
            FinalTotal = invoice.FinalTotal ?? 0,
            PaidAmount = paidAmount,
            AllocatedDeposit = allocatedDeposit,
            RemainingAmount = remainingAmount,
            Status = invoice.Status,
            CreatedAt = invoice.CreatedAt,
            CompletedAt = invoice.CompletedAt,
            IsSplit = isSplit,
            RoomNumber = targetDetails.Count == 1 ? targetDetails.First().Room?.RoomNumber : null,
            RoomDetails = targetDetails.Select(bd => new InvoiceRoomDetailDto
            {
                Id = bd.Id,
                RoomNumber = bd.Room?.RoomNumber ?? "N/A",
                RoomType = bd.RoomType?.Name ?? "N/A",
                CheckIn = bd.CheckInDate,
                CheckOut = bd.CheckOutDate,
                ActualCheckOut = bd.ActualCheckOutDate,
                PricePerNight = bd.PricePerNight,
                Subtotal = CalculateRoomSubtotal(bd)
            }).ToList(),
            ServiceDetails = targetDetails.SelectMany(bd => bd.OrderServices.SelectMany(os => os.OrderServiceDetails.Select(osd => new InvoiceServiceDetailDto
            {
                ServiceName = osd.Service?.Name ?? "N/A",
                Quantity = osd.Quantity,
                Price = osd.UnitPrice,
                Total = osd.Quantity * osd.UnitPrice,
                OrderDate = os.OrderDate
            }))).ToList(),
            LossDamageDetails = targetDetails.SelectMany(bd => bd.LossAndDamages.Select(ld => new InvoiceLossDamageDetailDto
            {
                ItemName = ld.RoomInventory?.ItemName ?? "N/A",
                Quantity = ld.Quantity,
                PenaltyAmount = ld.PenaltyAmount,
                Description = ld.Description
            })).ToList()
        };

        return Ok(dto);
    }

    [HttpPost("{id}/split")]
    public async Task<IActionResult> Split(int id)
    {
        var ok = await _invoiceService.SplitInvoiceAsync(id);
        if (!ok) return BadRequest("Could not split invoice. Ensure it is a multi-room invoice.");

        await TryNotifyRolesAsync(
            new[] { RoleName.Admin, RoleName.Manager, RoleName.Accountant },
            new CreateNotificationDto
            {
                Title = "Invoice split",
                Content = $"Invoice #{id} has been split by room.",
                Type = NotificationAction.InvoiceSplit,
                ReferenceLink = "admin/invoices"
            });

        return Ok();
    }

    [HttpPost("{id}/split-multiple")]
    public async Task<IActionResult> SplitMultiple(int id, [FromBody] List<int> roomDetailIds)
    {
        var ok = await _invoiceService.SplitMultipleAsync(id, roomDetailIds);
        if (!ok) return BadRequest("Could not split selected rooms. Ensure you are not moving all rooms.");

        await TryNotifyRolesAsync(
            new[] { RoleName.Admin, RoleName.Manager, RoleName.Accountant },
            new CreateNotificationDto
            {
                Title = "Invoice split for selected rooms",
                Content = $"Invoice #{id} was split for {roomDetailIds.Count} room detail(s).",
                Type = NotificationAction.InvoiceSplit,
                ReferenceLink = "admin/invoices"
            });

        return Ok();
    }

    [HttpPost("{id}/complete")]
    public async Task<IActionResult> Complete(int id)
    {
        var ok = await _invoiceService.CompleteInvoiceByIdAsync(id);
        if (!ok) return BadRequest("Could not complete invoice. It may already be completed or not exist.");

        await TryNotifyRolesAsync(
            new[] { RoleName.Admin, RoleName.Manager, RoleName.Accountant },
            new CreateNotificationDto
            {
                Title = "Invoice completed",
                Content = $"Invoice #{id} was marked as completed.",
                Type = NotificationAction.InvoiceCompleted,
                ReferenceLink = $"admin/invoices/{id}"
            });

        return Ok();
    }

    private decimal CalculateRoomSubtotal(Entities.BookingDetail detail)
    {
        var effectiveCheckOut = detail.ActualCheckOutDate ?? detail.CheckOutDate;
        var duration = effectiveCheckOut - detail.CheckInDate;
        if (duration <= TimeSpan.Zero) return 0;

        if (detail.CheckInDate.Date == effectiveCheckOut.Date)
        {
            var hours = (decimal)Math.Ceiling(duration.TotalHours);
            var hourlyRate = Math.Ceiling(detail.PricePerNight / 24m);
            return Math.Max(1, hours) * hourlyRate;
        }
        else
        {
            var nights = (decimal)Math.Ceiling(duration.TotalDays);
            return Math.Max(1, nights) * detail.PricePerNight;
        }
    }
}

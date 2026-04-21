using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using HotelManagement.Dtos;

public class MomoService : IMomoService
{
    private readonly IConfiguration _config;
    private readonly HttpClient _http;

    public MomoService(IConfiguration config, HttpClient http)
    {
        _config = config;
        _http = http;
    }

    public async Task<MomoCreatePaymentGatewayResponseDto> CreatePaymentAsync(MomoCreatePaymentGatewayRequestDto gatewayRequest)
    {
        string accessKey = _config["Momo:AccessKey"] ?? "F8BBA842ECF85";
        string secretKey = _config["Momo:SecretKey"] ?? "K951B6PE1waDMi640xX08PD3vg6EkVlz";

        MomoCreateRequestDto request = new MomoCreateRequestDto();
        request.orderInfo = _config["Momo:OrderInfo"] ?? "Momo Payment";
        request.partnerCode = _config["Momo:PartnerCode"] ?? "MOMO";
        request.redirectUrl = _config["Momo:RedirectUrl"] ?? "http://localhost:5173/";
        request.ipnUrl = _config["Momo:IpnUrl"] ?? "https://localhost:5082/api/momo/ipn";
        request.amount = gatewayRequest.Amount;
        request.orderId = string.IsNullOrWhiteSpace(gatewayRequest.OrderId) ? Guid.NewGuid().ToString("N") : gatewayRequest.OrderId;
        request.requestId = string.IsNullOrWhiteSpace(gatewayRequest.RequestId) ? Guid.NewGuid().ToString("N") : gatewayRequest.RequestId;
        request.extraData = gatewayRequest.ExtraData;
        request.partnerName = _config["Momo:PartnerName"] ?? "MoMo Payment";
        request.storeId = _config["Momo:StoreId"] ?? "Test Store";
        request.orderGroupId = "";
        request.autoCapture = true;
        request.lang = "en";
        request.requestType = _config["Momo:RequestType"] ?? "captureWallet";

        var rawSignature =
        "accessKey=" + accessKey +
        "&amount=" + request.amount +
        "&extraData=" + request.extraData +
        "&ipnUrl=" + request.ipnUrl +
        "&orderId=" + request.orderId +
        "&orderInfo=" + request.orderInfo +
        "&partnerCode=" + request.partnerCode +
        "&redirectUrl=" + request.redirectUrl +
        "&requestId=" + request.requestId +
        "&requestType=" + request.requestType;


        request.signature = Sign(rawSignature, secretKey);

        StringContent httpContent = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");

        var endpoint = _config["Momo:Endpoint"];
        var response = await _http.PostAsync(
            endpoint,
            httpContent
        );

        var json = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<JsonElement>(json);

        var resultCode = result.TryGetProperty("resultCode", out var resultCodeEl)
            ? resultCodeEl.GetInt32()
            : -1;

        var message = result.TryGetProperty("message", out var messageEl)
            ? messageEl.GetString() ?? "Unknown MoMo response"
            : "Unknown MoMo response";

        if (!response.IsSuccessStatusCode || resultCode != 0)
        {
            throw new BadRequestException($"Create MoMo payment failed: {message}");
        }

        return new MomoCreatePaymentGatewayResponseDto
        {
            PayUrl = result.GetProperty("payUrl").GetString() ?? string.Empty,
            OrderId = result.GetProperty("orderId").GetString() ?? request.orderId,
            RequestId = result.GetProperty("requestId").GetString() ?? request.requestId,
            ResultCode = resultCode,
            Message = message
        };
    }

    public bool VerifyIpnSignature(MomoIpnRequestDto ipn)
    {
        if (ipn == null || string.IsNullOrWhiteSpace(ipn.Signature))
        {
            return false;
        }

        var providedSignature = ipn.Signature.Trim().ToLowerInvariant();
        var expectedSignature = ComputeIpnSignature(ipn);

        return string.Equals(providedSignature, expectedSignature, StringComparison.OrdinalIgnoreCase);
    }

    public MomoExtraDataDto? DecodeExtraData(string? base64ExtraData)
    {
        if (string.IsNullOrWhiteSpace(base64ExtraData))
        {
            return null;
        }

        try
        {
            var bytes = Convert.FromBase64String(base64ExtraData);
            var json = Encoding.UTF8.GetString(bytes);
            return JsonSerializer.Deserialize<MomoExtraDataDto>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
        }
        catch
        {
            return null;
        }
    }

    private string ComputeIpnSignature(MomoIpnRequestDto ipn)
    {
        var accessKey = _config["Momo:AccessKey"] ?? string.Empty;
        var secretKey = _config["Momo:SecretKey"] ?? string.Empty;
        var transactionId = ipn.TransId ?? ipn.TransactionId ?? 0;

        var rawSignature =
            "accessKey=" + accessKey +
            "&amount=" + ipn.Amount +
            "&extraData=" + (ipn.ExtraData ?? string.Empty) +
            "&message=" + (ipn.Message ?? string.Empty) +
            "&orderId=" + (ipn.OrderId ?? string.Empty) +
            "&orderInfo=" + (ipn.OrderInfo ?? string.Empty) +
            "&orderType=" + (ipn.OrderType ?? string.Empty) +
            "&partnerCode=" + (ipn.PartnerCode ?? string.Empty) +
            "&payType=" + (ipn.PayType ?? string.Empty) +
            "&requestId=" + (ipn.RequestId ?? string.Empty) +
            "&responseTime=" + ipn.ResponseTime +
            "&resultCode=" + ipn.ResultCode +
            "&transId=" + transactionId;

        return Sign(rawSignature, secretKey);
    }

    private string Sign(string rawData, string secretKey)
    {
        var keyBytes = Encoding.UTF8.GetBytes(secretKey);
        var dataBytes = Encoding.UTF8.GetBytes(rawData);

        using var hmac = new HMACSHA256(keyBytes);
        var hash = hmac.ComputeHash(dataBytes);

        return BitConverter.ToString(hash).Replace("-", "").ToLower();
    }
}
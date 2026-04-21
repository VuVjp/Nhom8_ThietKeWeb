using System.Text.Json.Serialization;

namespace HotelManagement.Dtos;

public class MomoCreateRequestDto
{
    public string orderInfo { get; set; } = string.Empty;
    public string partnerCode { get; set; } = string.Empty;
    public string redirectUrl { get; set; } = string.Empty;
    public string ipnUrl { get; set; } = string.Empty;
    public long amount { get; set; }
    public string orderId { get; set; } = string.Empty;
    public string requestId { get; set; } = string.Empty;
    public string extraData { get; set; } = string.Empty;
    public string partnerName { get; set; } = string.Empty;
    public string storeId { get; set; } = string.Empty;
    public string paymentCode { get; set; } = string.Empty;
    public string orderGroupId { get; set; } = string.Empty;
    public bool autoCapture { get; set; }
    public string lang { get; set; } = string.Empty;
    public string signature { get; set; } = string.Empty;
    public string requestType { get; set; } = string.Empty;
}

public class MomoCreatePaymentRequestDto
{
    public string Type { get; set; } = string.Empty; // booking | invoice
    public int TargetId { get; set; }
}

public class MomoCreatePaymentGatewayRequestDto
{
    public long Amount { get; set; }
    public string OrderInfo { get; set; } = string.Empty;
    public string ExtraData { get; set; } = string.Empty;
    public string? OrderId { get; set; }
    public string? RequestId { get; set; }
}

public class MomoCreatePaymentGatewayResponseDto
{
    public string PayUrl { get; set; } = string.Empty;
    public string OrderId { get; set; } = string.Empty;
    public string RequestId { get; set; } = string.Empty;
    public int ResultCode { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class MomoExtraDataDto
{
    public string Type { get; set; } = string.Empty; // booking | invoice
    public int? BookingId { get; set; }
    public int? InvoiceId { get; set; }
    public decimal ExpectedAmount { get; set; }
    public string? MomoOrderId { get; set; }
    public string? RequestId { get; set; }
    public long TimestampUnix { get; set; }
}

public class MomoIpnRequestDto
{
    [JsonPropertyName("partnerCode")]
    public string PartnerCode { get; set; } = string.Empty;

    [JsonPropertyName("orderId")]
    public string OrderId { get; set; } = string.Empty;

    [JsonPropertyName("requestId")]
    public string RequestId { get; set; } = string.Empty;

    [JsonPropertyName("amount")]
    public long Amount { get; set; }

    [JsonPropertyName("orderInfo")]
    public string OrderInfo { get; set; } = string.Empty;

    [JsonPropertyName("orderType")]
    public string OrderType { get; set; } = string.Empty;

    [JsonPropertyName("transId")]
    public long? TransId { get; set; }

    [JsonPropertyName("transactionId")]
    public long? TransactionId { get; set; }

    [JsonPropertyName("resultCode")]
    public int ResultCode { get; set; }

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("payType")]
    public string PayType { get; set; } = string.Empty;

    [JsonPropertyName("responseTime")]
    public long ResponseTime { get; set; }

    [JsonPropertyName("extraData")]
    public string ExtraData { get; set; } = string.Empty;

    [JsonPropertyName("signature")]
    public string Signature { get; set; } = string.Empty;
}
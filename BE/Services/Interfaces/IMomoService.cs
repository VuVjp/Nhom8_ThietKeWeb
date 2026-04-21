using HotelManagement.Dtos;

public interface IMomoService
{
    Task<MomoCreatePaymentGatewayResponseDto> CreatePaymentAsync(MomoCreatePaymentGatewayRequestDto request);
    bool VerifyIpnSignature(MomoIpnRequestDto ipn);
    MomoExtraDataDto? DecodeExtraData(string? base64ExtraData);
}
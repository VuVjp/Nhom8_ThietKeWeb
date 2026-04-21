public class BookingAutoCancelSettings
{
    public bool Enabled { get; set; } = true;
    public int CheckInGraceMinutes { get; set; } = 60;
    public int PendingGraceMinutes { get; set; } = 15;
    public int ScanIntervalMinutes { get; set; } = 1;
}

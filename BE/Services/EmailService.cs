using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using System.Text.RegularExpressions;

public class EmailService : IEmailService
{
    private readonly EmailSettings _settings;

    public EmailService(IOptions<EmailSettings> settings)
    {
        _settings = settings.Value;
    }

    public async Task SendAsync(string toEmail, string subject, string htmlBody)
    {
        if (string.IsNullOrWhiteSpace(_settings.SenderEmail) || string.IsNullOrWhiteSpace(_settings.SenderPassword))
        {
            throw new InvalidOperationException("Email settings are not configured. Please set EmailSettings in appsettings.");
        }

        var smtpPassword = _settings.SenderPassword.Trim();
        if (_settings.Host.Contains("gmail", StringComparison.OrdinalIgnoreCase))
        {
            // Gmail app passwords are often shown with spaces every 4 chars.
            smtpPassword = Regex.Replace(smtpPassword, "\\s+", string.Empty);
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_settings.SenderName, _settings.SenderEmail));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;
        message.Body = new BodyBuilder { HtmlBody = htmlBody }.ToMessageBody();

        try
        {
            using var smtpClient = new SmtpClient();
            await smtpClient.ConnectAsync(_settings.Host, _settings.Port, SecureSocketOptions.StartTls);
            await smtpClient.AuthenticateAsync(_settings.SenderEmail, smtpPassword);
            await smtpClient.SendAsync(message);
            await smtpClient.DisconnectAsync(true);
        }
        catch (Exception ex) when (ex.Message.Contains("5.7.8") || ex.Message.Contains("BadCredentials", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "SMTP authentication failed. For Gmail, use a valid 16-character App Password (2-Step Verification required)."
            );
        }
    }
}

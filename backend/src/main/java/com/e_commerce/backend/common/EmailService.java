package com.e_commerce.backend.common;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Sends transactional emails over SMTP (e.g. Gmail with an App Password), or through Brevo's HTTPS API
 * when {@code app.brevo.api-key} is set. Brevo is used on hosts that block outgoing SMTP, such as Render's free tier.
 * <p>
 * Spring Boot only creates a {@link JavaMailSender} when {@code spring.mail.host} is configured.
 * Without it, the service runs in development mode and writes the email to the application log,
 * so the full sign-up flow can be tried locally without any mail account.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private static final URI BREVO_SEND = URI.create("https://api.brevo.com/v3/smtp/email");

    private final ObjectProvider<JavaMailSender> mailSender;
    private final String from;
    private final String brevoApiKey;
    private final String brevoSenderEmail;
    private final String brevoSenderName;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    private final JsonMapper json = JsonMapper.builder().build();

    public EmailService(ObjectProvider<JavaMailSender> mailSender,
                        @Value("${app.mail.from:${spring.mail.username:no-reply@e-commerce.dev}}") String from,
                        @Value("${app.brevo.api-key:}") String brevoApiKey,
                        @Value("${app.brevo.sender-email:}") String brevoSenderEmail,
                        @Value("${app.brevo.sender-name:e-commerce}") String brevoSenderName) {
        this.mailSender = mailSender;
        this.from = from;
        this.brevoApiKey = brevoApiKey;
        this.brevoSenderEmail = brevoSenderEmail;
        this.brevoSenderName = brevoSenderName;
    }

    public void sendVerificationCode(String to, String name, String code, long validMinutes) {
        String subject = code + " is your e-commerce verification code";
        String text = """
                Hi %s,

                Your e-commerce verification code is: %s

                It expires in %d minutes. If you didn't create an account, you can ignore this email.
                """.formatted(name, code, validMinutes);
        String html = """
                <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
                  <div style="background:#0b1220;border-radius:12px 12px 0 0;padding:18px 24px">
                    <span style="color:#ffffff;font-size:22px;font-weight:800">e-commerce</span>
                  </div>
                  <div style="border:1px solid #e2e8f0;border-top:0;border-radius:0 0 12px 12px;padding:24px">
                    <p style="margin:0 0 12px">Hi %s,</p>
                    <p style="margin:0 0 16px">Use this code to verify your email address:</p>
                    <p style="font-size:34px;font-weight:800;letter-spacing:8px;margin:0 0 16px;color:#0d9488">%s</p>
                    <p style="margin:0;color:#475569;font-size:14px">It expires in %d minutes. If you didn't create an account, you can ignore this email.</p>
                  </div>
                </div>
                """.formatted(HtmlUtils.htmlEscape(name), code, validMinutes);
        send(to, subject, text, html);
    }

    private void send(String to, String subject, String text, String html) {
        if (!brevoApiKey.isBlank()) {
            sendWithBrevo(to, subject, text, html);
            return;
        }
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null) {
            log.info("""

                    ===== EMAIL (development mode: set spring.mail.* to send real emails) =====
                    To:      {}
                    Subject: {}

                    {}
                    ===========================================================================""", to, subject, text);
            return;
        }
        try {
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(text, html);
            sender.send(message);
        } catch (MessagingException | MailException e) {
            log.error("Failed to send email to {}", to, e);
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "We couldn't send the email right now. Please try again in a moment.");
        }
    }

    /** Sends through Brevo's transactional email API over HTTPS (port 443), which works where SMTP ports are blocked. */
    private void sendWithBrevo(String to, String subject, String text, String html) {
        Map<String, Object> body = Map.of(
                "sender", Map.of("name", brevoSenderName, "email", brevoSenderEmail),
                "to", List.of(Map.of("email", to)),
                "subject", subject,
                "textContent", text,
                "htmlContent", html);
        try {
            HttpRequest request = HttpRequest.newBuilder(BREVO_SEND)
                    .timeout(Duration.ofSeconds(10))
                    .header("api-key", brevoApiKey)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body)))
                    .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() / 100 != 2) {
                log.error("Brevo rejected the email to {}: HTTP {} {}", to, response.statusCode(), response.body());
                throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "We couldn't send the email right now. Please try again in a moment.");
            }
        } catch (IOException e) {
            log.error("Failed to reach Brevo for email to {}", to, e);
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "We couldn't send the email right now. Please try again in a moment.");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "We couldn't send the email right now. Please try again in a moment.");
        }
    }
}

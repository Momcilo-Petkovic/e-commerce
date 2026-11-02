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

/**
 * Sends transactional emails over SMTP (e.g. Gmail with an App Password).
 * <p>
 * Spring Boot only creates a {@link JavaMailSender} when {@code spring.mail.host} is configured.
 * Without it, the service runs in development mode and writes the email to the application log,
 * so the full sign-up flow can be tried locally without any mail account.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final ObjectProvider<JavaMailSender> mailSender;
    private final String from;

    public EmailService(ObjectProvider<JavaMailSender> mailSender,
                        @Value("${app.mail.from:${spring.mail.username:no-reply@e-commerce.dev}}") String from) {
        this.mailSender = mailSender;
        this.from = from;
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
}

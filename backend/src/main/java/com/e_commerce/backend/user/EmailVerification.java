package com.e_commerce.backend.user;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * A pending email verification: a one-time 6-digit code, stored only as a hash,
 * with an expiry time and a limit on wrong guesses. One row per unverified user.
 */
@Entity
@Table(name = "email_verifications")
public class EmailVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(unique = true)
    private User user;

    @Column(nullable = false)
    private String codeHash;

    @Column(nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private Instant sentAt;

    @Column(nullable = false)
    private int failedAttempts;

    protected EmailVerification() {}

    public EmailVerification(User user) {
        this.user = user;
    }

    /** Replaces the code (on first send and on every resend) and resets the attempt counter. */
    public void reset(String codeHash, Instant sentAt, Instant expiresAt) {
        this.codeHash = codeHash;
        this.sentAt = sentAt;
        this.expiresAt = expiresAt;
        this.failedAttempts = 0;
    }

    public void recordFailedAttempt() {
        failedAttempts++;
    }

    public User getUser() { return user; }
    public String getCodeHash() { return codeHash; }
    public Instant getExpiresAt() { return expiresAt; }
    public Instant getSentAt() { return sentAt; }
    public int getFailedAttempts() { return failedAttempts; }
}

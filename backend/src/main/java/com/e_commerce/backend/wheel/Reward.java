package com.e_commerce.backend.wheel;

import com.e_commerce.backend.user.User;
import jakarta.persistence.*;

import java.time.Instant;

/** A prize won on the wheel, redeemable once at checkout before it expires. */
@Entity
@Table(name = "rewards")
public class Reward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RewardType type;

    @Column(nullable = false)
    private int value;

    @Column(nullable = false)
    private String label;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant expiresAt;

    private Instant usedAt;

    private String usedOnOrder;

    protected Reward() {}

    public Reward(User user, RewardType type, int value, String label, Instant expiresAt) {
        this.user = user;
        this.type = type;
        this.value = value;
        this.label = label;
        this.expiresAt = expiresAt;
    }

    public boolean isUsable() {
        return usedAt == null && expiresAt.isAfter(Instant.now());
    }

    public void markUsed(String orderNumber) {
        this.usedAt = Instant.now();
        this.usedOnOrder = orderNumber;
    }

    /** Called when the order a reward was used on gets cancelled. */
    public void release() {
        this.usedAt = null;
        this.usedOnOrder = null;
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public RewardType getType() { return type; }
    public int getValue() { return value; }
    public String getLabel() { return label; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getExpiresAt() { return expiresAt; }
    public Instant getUsedAt() { return usedAt; }
    public String getUsedOnOrder() { return usedOnOrder; }
}

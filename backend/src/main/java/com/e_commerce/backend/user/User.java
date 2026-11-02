package com.e_commerce.backend.user;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.CUSTOMER;

    /**
     * Set once the customer confirms the code sent to their email. The column default marks accounts
     * that existed before verification was introduced as verified.
     */
    @Column(nullable = false, columnDefinition = "boolean not null default true")
    private boolean emailVerified = false;

    /** Each account gets exactly one spin of the Wheel of Fortune. */
    @Column(nullable = false)
    private boolean wheelSpun = false;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected User() {}

    public User(String email, String passwordHash, String fullName, Role role) {
        this.email = email;
        this.passwordHash = passwordHash;
        this.fullName = fullName;
        this.role = role;
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public boolean isEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }
    public boolean isWheelSpun() { return wheelSpun; }
    public void setWheelSpun(boolean wheelSpun) { this.wheelSpun = wheelSpun; }
    public Instant getCreatedAt() { return createdAt; }
}

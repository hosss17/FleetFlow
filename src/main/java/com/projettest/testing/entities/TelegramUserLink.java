package com.projettest.testing.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "telegram_user_links",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_telegram_user_links_user", columnNames = "user_id"),
        @UniqueConstraint(name = "uk_telegram_user_links_telegram", columnNames = "telegram_id"),
        @UniqueConstraint(name = "uk_telegram_user_links_code", columnNames = "verification_code")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TelegramUserLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "telegram_id", length = 100)
    private String telegramId;

    @Column(name = "verification_code", length = 10)
    private String verificationCode;

    @Column(name = "code_expires_at")
    private LocalDateTime codeExpiresAt;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(nullable = false)
    private Boolean active;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (active == null) {
            active = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

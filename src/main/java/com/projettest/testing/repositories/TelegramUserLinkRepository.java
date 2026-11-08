package com.projettest.testing.repositories;

import com.projettest.testing.entities.TelegramUserLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface TelegramUserLinkRepository extends JpaRepository<TelegramUserLink, Integer> {

    Optional<TelegramUserLink> findByUserId(Integer userId);

    Optional<TelegramUserLink> findByTelegramIdAndActiveTrue(String telegramId);

    Optional<TelegramUserLink> findByVerificationCodeAndCodeExpiresAtAfterAndActiveTrue(
        String verificationCode,
        LocalDateTime now
    );
}

package com.projettest.testing.services;

import com.projettest.testing.entities.TelegramUserLink;
import com.projettest.testing.entities.User;
import com.projettest.testing.repositories.TelegramUserLinkRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class TelegramLinkService {

    private static final int CODE_TTL_MINUTES = 10;
    private static final int CODE_ATTEMPTS = 5;

    private final TelegramUserLinkRepository telegramUserLinkRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public TelegramLinkService(TelegramUserLinkRepository telegramUserLinkRepository) {
        this.telegramUserLinkRepository = telegramUserLinkRepository;
    }

    @Transactional
    public TelegramUserLink generateVerificationCode(User user) {
        TelegramUserLink link = telegramUserLinkRepository.findByUserId(user.getId())
            .orElseGet(() -> {
                TelegramUserLink created = new TelegramUserLink();
                created.setUser(user);
                created.setActive(true);
                return created;
            });

        link.setVerificationCode(generateUniqueCode());
        link.setCodeExpiresAt(LocalDateTime.now().plusMinutes(CODE_TTL_MINUTES));
        link.setActive(true);

        return telegramUserLinkRepository.save(link);
    }

    @Transactional
    public LinkResult verifyCodeAndLink(String telegramId, String code) {
        if (telegramId == null || telegramId.isBlank() || code == null || code.isBlank()) {
            return LinkResult.invalid("Invalid link command. Use: LINK 123456");
        }

        Optional<TelegramUserLink> codeMatch = telegramUserLinkRepository
            .findByVerificationCodeAndCodeExpiresAtAfterAndActiveTrue(code.trim(), LocalDateTime.now());

        if (codeMatch.isEmpty()) {
            return LinkResult.invalid("Invalid or expired code. Generate a new code in the app.");
        }

        TelegramUserLink linkToActivate = codeMatch.get();
        Optional<TelegramUserLink> existingTelegram = telegramUserLinkRepository.findByTelegramIdAndActiveTrue(telegramId);
        if (existingTelegram.isPresent() && !existingTelegram.get().getId().equals(linkToActivate.getId())) {
            return LinkResult.invalid("This Telegram account is already linked to another user.");
        }

        linkToActivate.setTelegramId(telegramId.trim());
        linkToActivate.setVerificationCode(null);
        linkToActivate.setCodeExpiresAt(null);
        linkToActivate.setVerifiedAt(LocalDateTime.now());
        linkToActivate.setActive(true);

        TelegramUserLink saved = telegramUserLinkRepository.save(linkToActivate);
        return LinkResult.success(saved.getUser());
    }

    @Transactional(readOnly = true)
    public Optional<User> findLinkedActiveUserByTelegramId(String telegramId) {
        if (telegramId == null || telegramId.isBlank()) {
            return Optional.empty();
        }

        return telegramUserLinkRepository.findByTelegramIdAndActiveTrue(telegramId.trim())
            .map(TelegramUserLink::getUser)
            .filter(user -> user.getStatus() == User.UserStatus.ACTIVE);
    }

    @Transactional(readOnly = true)
    public Optional<TelegramUserLink> getByUserId(Integer userId) {
        return telegramUserLinkRepository.findByUserId(userId);
    }

    @Transactional
    public void unlinkByUserId(Integer userId) {
        telegramUserLinkRepository.findByUserId(userId).ifPresent(link -> {
            link.setTelegramId(null);
            link.setVerificationCode(null);
            link.setCodeExpiresAt(null);
            link.setVerifiedAt(null);
            link.setActive(false);
            telegramUserLinkRepository.save(link);
        });
    }

    @Transactional
    public boolean unlinkByTelegramId(String telegramId) {
        if (telegramId == null || telegramId.isBlank()) {
            return false;
        }

        Optional<TelegramUserLink> existing = telegramUserLinkRepository.findByTelegramIdAndActiveTrue(telegramId.trim());
        if (existing.isEmpty()) {
            return false;
        }

        TelegramUserLink link = existing.get();
        link.setTelegramId(null);
        link.setVerificationCode(null);
        link.setCodeExpiresAt(null);
        link.setVerifiedAt(null);
        link.setActive(false);
        telegramUserLinkRepository.save(link);
        return true;
    }

    private String generateUniqueCode() {
        for (int i = 0; i < CODE_ATTEMPTS; i++) {
            String candidate = String.format("%06d", secureRandom.nextInt(1_000_000));
            Optional<TelegramUserLink> existing = telegramUserLinkRepository
                .findByVerificationCodeAndCodeExpiresAtAfterAndActiveTrue(candidate, LocalDateTime.now());
            if (existing.isEmpty()) {
                return candidate;
            }
        }

        return String.format("%06d", secureRandom.nextInt(1_000_000));
    }

    public record LinkResult(boolean linked, String message, User user) {
        public static LinkResult success(User user) {
            return new LinkResult(true, "Account linked successfully.", user);
        }

        public static LinkResult invalid(String message) {
            return new LinkResult(false, message, null);
        }
    }
}

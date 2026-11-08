package com.projettest.testing.controllers;

import com.projettest.testing.entities.TelegramUserLink;
import com.projettest.testing.entities.User;
import com.projettest.testing.services.TelegramLinkService;
import com.projettest.testing.services.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Optional;

@RestController
@RequestMapping("/api/telegram-link")
@CrossOrigin(origins = "*")
public class TelegramLinkController {

    private final TelegramLinkService telegramLinkService;
    private final UserService userService;

    public TelegramLinkController(TelegramLinkService telegramLinkService, UserService userService) {
        this.telegramLinkService = telegramLinkService;
        this.userService = userService;
    }

    @GetMapping("/status")
    public ResponseEntity<TelegramLinkStatusResponse> getStatus() {
        Optional<User> currentUser = resolveCurrentUser();
        if (currentUser.isEmpty()) {
            return ResponseEntity.status(401).build();
        }

        Optional<TelegramUserLink> link = telegramLinkService.getByUserId(currentUser.get().getId());
        if (link.isEmpty() || link.get().getTelegramId() == null || !Boolean.TRUE.equals(link.get().getActive())) {
            return ResponseEntity.ok(new TelegramLinkStatusResponse(false, null, null));
        }

        TelegramUserLink linked = link.get();
        return ResponseEntity.ok(new TelegramLinkStatusResponse(
            true,
            maskTelegramId(linked.getTelegramId()),
            linked.getVerifiedAt()
        ));
    }

    @PostMapping("/code")
    public ResponseEntity<GenerateCodeResponse> generateCode() {
        Optional<User> currentUser = resolveCurrentUser();
        if (currentUser.isEmpty()) {
            return ResponseEntity.status(401).build();
        }

        TelegramUserLink link = telegramLinkService.generateVerificationCode(currentUser.get());

        return ResponseEntity.ok(new GenerateCodeResponse(
            link.getVerificationCode(),
            link.getCodeExpiresAt(),
            "Send this command to Telegram: LINK " + link.getVerificationCode()
        ));
    }

    @PostMapping("/unlink")
    public ResponseEntity<SimpleMessageResponse> unlink() {
        Optional<User> currentUser = resolveCurrentUser();
        if (currentUser.isEmpty()) {
            return ResponseEntity.status(401).build();
        }

        telegramLinkService.unlinkByUserId(currentUser.get().getId());
        return ResponseEntity.ok(new SimpleMessageResponse("Telegram account unlinked."));
    }

    private Optional<User> resolveCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            return Optional.empty();
        }

        return userService.getUserByEmail(authentication.getName().trim().toLowerCase());
    }

    private String maskTelegramId(String telegramId) {
        String value = telegramId == null ? "" : telegramId.trim();
        if (value.length() <= 4) {
            return "****";
        }

        return "****" + value.substring(value.length() - 4);
    }

    public record TelegramLinkStatusResponse(boolean linked, String telegramIdMasked, LocalDateTime linkedAt) {}

    public record GenerateCodeResponse(String code, LocalDateTime expiresAt, String instructions) {}

    public record SimpleMessageResponse(String message) {}
}

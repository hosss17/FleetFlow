package com.projettest.testing.controllers;

import com.projettest.testing.entities.Mission;
import com.projettest.testing.entities.User;
import com.projettest.testing.entities.Vehicle;
import com.projettest.testing.services.MissionService;
import com.projettest.testing.services.TelegramLinkService;
import com.projettest.testing.services.UserService;
import com.projettest.testing.services.VehicleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

@RestController
@RequestMapping("/api/bot")
@CrossOrigin(origins = "*")
public class BotController {

    private final MissionService missionService;
    private final VehicleService vehicleService;
    private final UserService userService;
    private final TelegramLinkService telegramLinkService;

    public BotController(
        MissionService missionService,
        VehicleService vehicleService,
        UserService userService,
        TelegramLinkService telegramLinkService
    ) {
        this.missionService = missionService;
        this.vehicleService = vehicleService;
        this.userService = userService;
        this.telegramLinkService = telegramLinkService;
    }

    @PostMapping("/command")
    public ResponseEntity<BotReply> command(@RequestBody BotCommandRequest request) {
        if (request == null || request.getText() == null || request.getText().isBlank()) {
            return ResponseEntity.ok(new BotReply("Send a command like: missions, vehicles, users, help."));
        }

        String text = normalizeCommandText(request.getText());
        String senderTelegramId = request.getPhone() == null ? "" : request.getPhone().trim();

        if (text.contains("help")) {
            return ResponseEntity.ok(new BotReply("Commands: LINK 123456, UNLINK, missions, available vehicles, users."));
        }

        if (text.startsWith("link ")) {
            return ResponseEntity.ok(handleLinkCommand(senderTelegramId, text));
        }

        if (text.equals("unlink") || text.equals("unlink account")) {
            return ResponseEntity.ok(handleUnlinkCommand(senderTelegramId));
        }

        if (text.contains("pending mission") || text.contains("missions pending") || text.equals("missions")) {
            return ResponseEntity.ok(handleMissionsCommand(senderTelegramId));
        }

        if (text.contains("available vehicle") || text.contains("vehicles") || text.contains("vehicle")) {
            List<Vehicle> vehicles = vehicleService.getAvailableVehicles();
            return ResponseEntity.ok(new BotReply("Available vehicles: " + vehicles.size()));
        }

        if (text.contains("users") || text.contains("user")) {
            List<User> users = userService.getAllActiveUsers();
            return ResponseEntity.ok(new BotReply("Active users: " + users.size()));
        }

        return ResponseEntity.ok(new BotReply("Unknown command. Try: help."));
    }

    @GetMapping("/health")
    public ResponseEntity<BotReply> health() {
        return ResponseEntity.ok(new BotReply("Bot endpoint is running."));
    }

    private BotReply handleLinkCommand(String senderTelegramId, String text) {
        String code = text.substring(5).trim();
        TelegramLinkService.LinkResult result = telegramLinkService.verifyCodeAndLink(senderTelegramId, code);
        if (!result.linked()) {
            return new BotReply(result.message());
        }

        User linkedUser = result.user();
        return new BotReply("Linked successfully to " + linkedUser.getName() + ".");
    }

    private BotReply handleUnlinkCommand(String senderTelegramId) {
        boolean unlinked = telegramLinkService.unlinkByTelegramId(senderTelegramId);
        if (!unlinked) {
            return new BotReply("No linked account found for this Telegram user.");
        }

        return new BotReply("Your Telegram account has been unlinked.");
    }

    private BotReply handleMissionsCommand(String senderTelegramId) {
        if (senderTelegramId.isBlank()) {
            return new BotReply("Unable to identify Telegram user. Please try again.");
        }

        Optional<User> linkedUser = telegramLinkService.findLinkedActiveUserByTelegramId(senderTelegramId);
        if (linkedUser.isEmpty()) {
            return new BotReply("Account not linked. Generate a code in the app, then send: LINK 123456");
        }

        List<Mission> missions = missionService.getPendingMissionsByUserId(linkedUser.get().getId());
        return new BotReply(linkedUser.get().getName() + ", your pending missions: " + missions.size());
    }

    private String normalizeCommandText(String rawText) {
        String normalized = rawText == null ? "" : rawText.trim().toLowerCase(Locale.ROOT);

        // n8n expressions can accidentally pass values prefixed with '='.
        while (normalized.startsWith("=")) {
            normalized = normalized.substring(1).trim();
        }

        return normalized;
    }

    public static final class BotCommandRequest {
        private String phone;
        private String text;

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

        public String getText() {
            return text;
        }

        public void setText(String text) {
            this.text = text;
        }
    }

    public static final class BotReply {
        private String replyText;

        public BotReply() {
        }

        public BotReply(String replyText) {
            this.replyText = replyText;
        }

        public String getReplyText() {
            return replyText;
        }

        public void setReplyText(String replyText) {
            this.replyText = replyText;
        }
    }
}
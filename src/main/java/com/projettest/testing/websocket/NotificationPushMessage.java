package com.projettest.testing.websocket;

import java.time.LocalDateTime;

public record NotificationPushMessage(
    Integer id,
    Integer userId,
    Integer missionId,
    String type,
    String message,
    String readStatus,
    LocalDateTime createdAt
) {}

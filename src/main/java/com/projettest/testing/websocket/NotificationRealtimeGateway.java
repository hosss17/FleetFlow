package com.projettest.testing.websocket;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.projettest.testing.entities.Notification;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class NotificationRealtimeGateway {

    private final ObjectMapper objectMapper;
    private final ConcurrentHashMap<Integer, Set<WebSocketSession>> sessionsByUserId = new ConcurrentHashMap<>();

    public NotificationRealtimeGateway(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public void register(Integer userId, WebSocketSession session) {
        sessionsByUserId.computeIfAbsent(userId, ignored -> ConcurrentHashMap.newKeySet()).add(session);
    }

    public void unregister(Integer userId, WebSocketSession session) {
        Set<WebSocketSession> sessions = sessionsByUserId.get(userId);
        if (sessions == null) {
            return;
        }

        sessions.remove(session);
        if (sessions.isEmpty()) {
            sessionsByUserId.remove(userId);
        }
    }

    public void pushToUser(Notification notification) {
        Integer userId = notification.getUser() == null ? null : notification.getUser().getId();
        if (userId == null) {
            return;
        }

        Set<WebSocketSession> sessions = sessionsByUserId.get(userId);
        if (sessions == null || sessions.isEmpty()) {
            return;
        }

        NotificationPushMessage payload = new NotificationPushMessage(
            notification.getId(),
            userId,
            notification.getMission() == null ? null : notification.getMission().getId(),
            notification.getType(),
            notification.getMessage(),
            notification.getReadStatus() == null ? "NON_LU" : notification.getReadStatus().name(),
            notification.getCreatedAt()
        );

        String serialized;
        try {
            serialized = objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException ex) {
            return;
        }

        TextMessage message = new TextMessage(serialized);
        for (WebSocketSession session : sessions) {
            if (!session.isOpen()) {
                continue;
            }

            try {
                session.sendMessage(message);
            } catch (IOException ignored) {
                // Ignore send errors for a single session and continue.
            }
        }
    }
}

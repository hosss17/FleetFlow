package com.projettest.testing.websocket;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class NotificationWebSocketHandler extends TextWebSocketHandler {

    private static final String USER_ID_ATTRIBUTE = "userId";

    private final NotificationRealtimeGateway notificationRealtimeGateway;

    public NotificationWebSocketHandler(NotificationRealtimeGateway notificationRealtimeGateway) {
        this.notificationRealtimeGateway = notificationRealtimeGateway;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        Integer userId = (Integer) session.getAttributes().get(USER_ID_ATTRIBUTE);
        if (userId != null) {
            notificationRealtimeGateway.register(userId, session);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Integer userId = (Integer) session.getAttributes().get(USER_ID_ATTRIBUTE);
        if (userId != null) {
            notificationRealtimeGateway.unregister(userId, session);
        }
    }
}

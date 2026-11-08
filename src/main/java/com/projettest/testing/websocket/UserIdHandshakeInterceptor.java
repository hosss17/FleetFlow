package com.projettest.testing.websocket;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Component
public class UserIdHandshakeInterceptor implements HandshakeInterceptor {

    private static final String USER_ID_ATTRIBUTE = "userId";

    @Override
    public boolean beforeHandshake(
        ServerHttpRequest request,
        ServerHttpResponse response,
        WebSocketHandler wsHandler,
        Map<String, Object> attributes
    ) {
        if (!(request instanceof ServletServerHttpRequest servletRequest)) {
            return false;
        }

        String userIdValue = servletRequest.getServletRequest().getParameter("userId");
        if (userIdValue == null || userIdValue.isBlank()) {
            return false;
        }

        try {
            Integer userId = Integer.parseInt(userIdValue);
            attributes.put(USER_ID_ATTRIBUTE, userId);
            return true;
        } catch (NumberFormatException ex) {
            return false;
        }
    }

    @Override
    public void afterHandshake(
        ServerHttpRequest request,
        ServerHttpResponse response,
        WebSocketHandler wsHandler,
        Exception exception
    ) {
        // No-op.
    }
}

package com.projettest.testing.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final NotificationWebSocketHandler notificationWebSocketHandler;
    private final UserIdHandshakeInterceptor userIdHandshakeInterceptor;

    public WebSocketConfig(
        NotificationWebSocketHandler notificationWebSocketHandler,
        UserIdHandshakeInterceptor userIdHandshakeInterceptor
    ) {
        this.notificationWebSocketHandler = notificationWebSocketHandler;
        this.userIdHandshakeInterceptor = userIdHandshakeInterceptor;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(notificationWebSocketHandler, "/ws/notifications")
            .addInterceptors(userIdHandshakeInterceptor)
            .setAllowedOriginPatterns("*");
    }
}

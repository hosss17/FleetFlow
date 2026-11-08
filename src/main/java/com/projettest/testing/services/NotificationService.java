package com.projettest.testing.services;

import com.projettest.testing.entities.Notification;
import com.projettest.testing.entities.User;
import com.projettest.testing.entities.Mission;
import com.projettest.testing.repositories.NotificationRepository;
import com.projettest.testing.repositories.UserRepository;
import com.projettest.testing.websocket.NotificationRealtimeGateway;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * NotificationService - Handles business logic for Notification operations
 */
@Service
public class NotificationService {
    
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationRealtimeGateway notificationRealtimeGateway;
    
    public NotificationService(
        NotificationRepository notificationRepository,
        UserRepository userRepository,
        NotificationRealtimeGateway notificationRealtimeGateway
    ) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.notificationRealtimeGateway = notificationRealtimeGateway;
    }
    
    // Save or update a notification
    public Notification saveNotification(Notification notification) {
        Notification saved = notificationRepository.save(notification);
        notificationRealtimeGateway.pushToUser(saved);
        return saved;
    }
    
    // Get all notifications
    public List<Notification> getAllNotifications() {
        return notificationRepository.findAll();
    }
    
    // Get notification by ID
    public Optional<Notification> getNotificationById(Integer id) {
        return notificationRepository.findById(id);
    }
    
    // Get all notifications for a user
    public List<Notification> getNotificationsByUserId(Integer userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return List.of();
        }

        User user = userOpt.get();
        Set<String> allowedTypes = allowedTypesForRole(user.getRole());

        return notificationRepository.findByUserId(userId).stream()
            .filter(notification -> allowedTypes.contains(notification.getType()))
            .collect(Collectors.toList());
    }
    
    // Get unread notifications for a user
    public List<Notification> getUnreadNotifications(Integer userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return List.of();
        }

        User user = userOpt.get();
        Set<String> allowedTypes = allowedTypesForRole(user.getRole());

        return notificationRepository.findByUserIdAndReadStatus(userId, Notification.NotificationStatus.NON_LU).stream()
            .filter(notification -> allowedTypes.contains(notification.getType()))
            .collect(Collectors.toList());
    }
    
    // Get notifications for a mission
    public List<Notification> getNotificationsByMissionId(Integer missionId) {
        return notificationRepository.findByMissionId(missionId);
    }
    
    // Mark notification as read
    public Notification markAsRead(Integer notificationId) {
        Optional<Notification> notification = notificationRepository.findById(notificationId);
        if (notification.isPresent()) {
            Notification notif = notification.get();
            notif.setReadStatus(Notification.NotificationStatus.LU);
            return notificationRepository.save(notif);
        }
        return null;
    }
    
    // Delete notification
    public void deleteNotification(Integer id) {
        notificationRepository.deleteById(id);
    }

    public void notifyResponsables(String type, String message, Mission mission) {
        List<User> managers = userRepository.findByRole(User.UserRole.RESPONSABLE);
        for (User manager : managers) {
            Notification notification = new Notification();
            notification.setUser(manager);
            notification.setMission(mission);
            notification.setType(type);
            notification.setMessage(message);
            notification.setReadStatus(Notification.NotificationStatus.NON_LU);
            saveNotification(notification);
        }
    }

    private Set<String> allowedTypesForRole(User.UserRole role) {
        if (role == User.UserRole.RESPONSABLE) {
            return Set.of("MISSION_DEMANDEE", "RESERVATION_DEMANDEE", "INCIDENT_SIGNALE");
        }

        return Set.of("MISSION_APPROUVEE", "MISSION_REFUSEE");
    }
}






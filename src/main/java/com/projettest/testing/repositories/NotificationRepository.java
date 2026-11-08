package com.projettest.testing.repositories;

import com.projettest.testing.entities.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * NotificationRepository - Provides database operations for Notification entity
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    
    // Find all notifications for a user
    List<Notification> findByUserId(Integer userId);
    
    // Find unread notifications for a user
    List<Notification> findByUserIdAndReadStatus(Integer userId, Notification.NotificationStatus readStatus);
    
    // Find notifications related to a mission
    List<Notification> findByMissionId(Integer missionId);
}






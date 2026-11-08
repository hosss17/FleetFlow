package com.projettest.testing.repositories;

import com.projettest.testing.entities.Mission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * MissionRepository - Provides database operations for Mission entity
 */
@Repository
public interface MissionRepository extends JpaRepository<Mission, Integer> {
    
    // Find all missions for a specific user
    List<Mission> findByUserId(Integer userId);
    
    // Find all missions with specific status
    List<Mission> findByStatus(Mission.MissionStatus status);

    // Find missions for a specific user and status
    List<Mission> findByUserIdAndStatus(Integer userId, Mission.MissionStatus status);
    
    // Find all missions with specific priority
    List<Mission> findByPriority(Mission.MissionPriority priority);
    
    // Find all missions assigned to a vehicle
    List<Mission> findByVehicleId(Integer vehicleId);
}






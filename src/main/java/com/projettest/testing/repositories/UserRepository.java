package com.projettest.testing.repositories;

import com.projettest.testing.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;


@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    
    // Find user by email
    Optional<User> findByEmail(String email);
    
    // Find all users with specific role
    List<User> findByRole(User.UserRole role);
    
    // Find all users with specific status
    List<User> findByStatus(User.UserStatus status);
    
    // Check if user exists with email
    boolean existsByEmail(String email);
}






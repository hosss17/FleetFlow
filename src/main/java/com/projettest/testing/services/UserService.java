package com.projettest.testing.services;

import com.projettest.testing.entities.User;
import com.projettest.testing.repositories.UserRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

/**
 * Service layer sits between Controller and Repository
 */
@Service
public class UserService {
    
    private final UserRepository userRepository;
    
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    
    // Create or update a user
    public User saveUser(User user) {
        return userRepository.save(user);
    }
    
    // Get all users
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    // Get user by ID
    public Optional<User> getUserById(Integer id) {
        return userRepository.findById(id);
    }
    
    // Get user by email
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    // Get all employees
    public List<User> getAllEmployees() {
        return userRepository.findByRole(User.UserRole.EMPLOYE);
    }
    
    // Get all managers
    public List<User> getAllManagers() {
        return userRepository.findByRole(User.UserRole.RESPONSABLE);
    }
    
    // Get all active users
    public List<User> getAllActiveUsers() {
        return userRepository.findByStatus(User.UserStatus.ACTIVE);
    }
    
    // Delete user by ID
    public void deleteUser(Integer id) {
        userRepository.deleteById(id);
    }
    
    // Check if email exists
    public boolean emailExists(String email) {
        return userRepository.existsByEmail(email);
    }
}






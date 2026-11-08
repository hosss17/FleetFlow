package com.projettest.testing.controllers;

import com.projettest.testing.entities.User;
import com.projettest.testing.services.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;


@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {
    
    private final UserService userService;
    
    public UserController(UserService userService) {
        this.userService = userService;
    }
    
    /**
     * GET - Get all users
     */
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }
    
    /**
     * GET - Get user by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Integer id) {
        Optional<User> user = userService.getUserById(id);
        return user.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
    
    /**
     * POST - Create a new user
     */
    @PostMapping
    public ResponseEntity<User> createUser(@Valid @RequestBody User user) {
        User savedUser = userService.saveUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
    }
    
    /**
     * PUT - Update a user
     */
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Integer id, @Valid @RequestBody User user) {
        Optional<User> existingUser = userService.getUserById(id);
        if (existingUser.isPresent()) {
            user.setId(id);
            User updatedUser = userService.saveUser(user);
            return ResponseEntity.ok(updatedUser);
        }
        return ResponseEntity.notFound().build();
    }
    
    /**
     * DELETE - Delete a user
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Integer id) {
        Optional<User> existingUser = userService.getUserById(id);
        if (existingUser.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        if (existingUser.get().getRole() == User.UserRole.RESPONSABLE) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * GET - Get all employees
     */
    @GetMapping("/role/employees")
    public ResponseEntity<List<User>> getAllEmployees() {
        List<User> employees = userService.getAllEmployees();
        return ResponseEntity.ok(employees);
    }
    
    /**
     * GET - Get all managers
     */
    @GetMapping("/role/managers")
    public ResponseEntity<List<User>> getAllManagers() {
        List<User> managers = userService.getAllManagers();
        return ResponseEntity.ok(managers);
    }
    
    /**
     * GET - Get all active users
     */
    @GetMapping("/status/active")
    public ResponseEntity<List<User>> getAllActiveUsers() {
        List<User> activeUsers = userService.getAllActiveUsers();
        return ResponseEntity.ok(activeUsers);
    }
}




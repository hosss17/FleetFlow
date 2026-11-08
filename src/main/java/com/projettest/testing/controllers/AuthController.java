package com.projettest.testing.controllers;

import com.projettest.security.JwtService;
import com.projettest.testing.entities.User;
import com.projettest.testing.services.UserService;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class AuthController {

    private static final String REFRESH_COOKIE_NAME = "refreshToken";

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    public AuthController(
        UserService userService,
        AuthenticationManager authenticationManager,
        PasswordEncoder passwordEncoder,
        JwtService jwtService,
        UserDetailsService userDetailsService
    ) {
        this.userService = userService;
        this.authenticationManager = authenticationManager;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody User user) {
        if (user != null && user.getPassword() != null && !user.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        User savedUser = userService.saveUser(user);
        return ResponseEntity.ok(savedUser);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        if (request == null || request.email() == null || request.password() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String normalizedEmail = request.email().trim().toLowerCase();
        Optional<User> user = userService.getUserByEmail(normalizedEmail);
        if (user.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User existingUser = user.get();

        // Backward compatibility: existing rows may still store plain text passwords.
        boolean matchesEncoded = false;
        try {
            matchesEncoded = passwordEncoder.matches(request.password(), existingUser.getPassword());
        } catch (IllegalArgumentException ignored) {
            matchesEncoded = false;
        }
        boolean matchesLegacy = existingUser.getPassword().equals(request.password());
        if (!matchesEncoded && !matchesLegacy) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (existingUser.getStatus() != User.UserStatus.ACTIVE) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        if (matchesEncoded) {
            try {
                authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(normalizedEmail, request.password())
                );
            } catch (BadCredentialsException ex) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(normalizedEmail);
        String token = jwtService.generateAccessToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);
        ResponseCookie refreshCookie = buildRefreshCookie(refreshToken);

        if (matchesLegacy) {
            existingUser.setPassword(passwordEncoder.encode(request.password()));
            userService.saveUser(existingUser);
        }

        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
            .body(new LoginResponse(
                token,
                existingUser.getId(),
                existingUser.getName(),
                existingUser.getEmail(),
                existingUser.getRole(),
                existingUser.getStatus()
            ));
    }

    @PostMapping("/refresh")
    public ResponseEntity<RefreshResponse> refresh(@CookieValue(name = REFRESH_COOKIE_NAME, required = false) String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String username;
        try {
            username = jwtService.extractUsername(refreshToken);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Optional<User> user = userService.getUserByEmail(username);
        if (user.isEmpty() || user.get().getStatus() != User.UserStatus.ACTIVE) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        if (!jwtService.isRefreshTokenValid(refreshToken, userDetails)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String accessToken = jwtService.generateAccessToken(userDetails);
        String rotatedRefreshToken = jwtService.generateRefreshToken(userDetails);
        ResponseCookie refreshCookie = buildRefreshCookie(rotatedRefreshToken);

        return ResponseEntity.ok()
            .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
            .body(new RefreshResponse(accessToken));
    }

    public record LoginRequest(String email, String password) {}

    public record LoginResponse(
        String token,
        Integer userId,
        String name,
        String email,
        User.UserRole role,
        User.UserStatus status
    ) {}

    public record RefreshResponse(String token) {}

    private ResponseCookie buildRefreshCookie(String refreshToken) {
        return ResponseCookie.from(REFRESH_COOKIE_NAME, refreshToken)
            .httpOnly(true)
            .secure(false)
            .sameSite("Lax")
            .path("/api/auth")
            .maxAge(604800)
            .build();
    }
}

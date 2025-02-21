package com.timestr.backend.controller;

import com.timestr.backend.dto.LoginRequest;
import com.timestr.backend.dto.RegisterRequest;
import com.timestr.backend.model.User;
import com.timestr.backend.security.JwtTokenProvider;
import com.timestr.backend.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private final UserService userService;

    @Autowired
    private final JwtTokenProvider jwtTokenProvider;

    public AuthController(UserService userService, JwtTokenProvider jwtTokenProvider) {
        this.userService = userService;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    // Registration endpoint
    @PostMapping("/register")
    public ResponseEntity<User> registerUser(@RequestBody RegisterRequest request) {
        User user = userService.registerUser(request);
        return ResponseEntity.ok(user);
    }

    // Login endpoint
    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> loginUser(@RequestBody LoginRequest request, HttpServletResponse response) {
        User user = userService.authenticateUser(request.getEmail(), request.getPassword());

        if (user == null) {
            return ResponseEntity.status(401).body(Collections.singletonMap("message", "Invalid email or password"));
        }

        String token = jwtTokenProvider.generateToken(user);

        Cookie cookie = new Cookie("JWT", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/");

        response.addCookie(cookie);

        Map<String, String> responseBody = new HashMap<>();
        responseBody.put("message", "Login successful");

        return ResponseEntity.ok(responseBody);
    }


    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, String>> getDashboardData(@CookieValue(value = "JWT", defaultValue = "") String token) {
        if (token.isEmpty() || !jwtTokenProvider.validateToken(token)) {
            return ResponseEntity.status(401).body(Collections.singletonMap("message", "Unauthorized"));
        }

        String email = jwtTokenProvider.getUsernameFromToken(token);
        User user = userService.getUserByEmail(email);

        Map<String, String> response = new HashMap<>();
        response.put("name", user.getName());
        response.put("email", user.getEmail());

        return ResponseEntity.ok(response);
    }
}
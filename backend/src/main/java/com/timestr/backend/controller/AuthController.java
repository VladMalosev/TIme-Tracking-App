package com.timestr.backend.controller;

import com.timestr.backend.configuration.OnlineUserTracker;
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
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private final UserService userService;

    @Autowired
    private final JwtTokenProvider jwtTokenProvider;


    private OnlineUserTracker onlineUserTracker;

    public AuthController(UserService userService, JwtTokenProvider jwtTokenProvider, OnlineUserTracker onlineUserTracker) {
        this.userService = userService;
        this.jwtTokenProvider = jwtTokenProvider;
        this.onlineUserTracker = onlineUserTracker;
    }


    @PostMapping("/register")
    public ResponseEntity<User> registerUser(@RequestBody RegisterRequest request) {
        User user = userService.registerUser(request);
        return ResponseEntity.ok(user);
    }


    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> loginUser(@RequestBody LoginRequest request, HttpServletResponse response) {
        User user = userService.authenticateUser(request.getEmail(), request.getPassword());

        if (user == null) {
            return ResponseEntity.status(401).body(Collections.singletonMap("message", "Invalid email or password"));
        }

        String token = jwtTokenProvider.generateToken(user);

        Cookie cookie = new Cookie("JWT", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // for local testing without https
        cookie.setPath("/");

        response.addCookie(cookie);

        onlineUserTracker.setUsersOnline(user.getEmail());

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

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logoutUser(@CookieValue(value = "JWT", defaultValue = "") String token, HttpServletResponse response) {
        if (token.isEmpty() || !jwtTokenProvider.validateToken(token)) {
            return ResponseEntity.status(401).body(Collections.singletonMap("message", "Unauthorized"));
        }

        String email = jwtTokenProvider.getUsernameFromToken(token);
        onlineUserTracker.setUserOffline(email);

        Cookie cookie = new Cookie("JWT", token);
        cookie.setMaxAge(0);
        cookie.setPath("/");
        response.addCookie(cookie);

        return ResponseEntity.ok(Collections.singletonMap("message", "Logout successful"));
    }


    @GetMapping("/online-users")
    public ResponseEntity<List<String>> getOnlineUsers() {
        List<String> onlineUsers = onlineUserTracker.getOnlineUsers();
        System.out.println("Online Users: " + onlineUsers);
        return ResponseEntity.ok(onlineUsers);
    }

    @GetMapping("/current-user")
    public ResponseEntity<Map<String, String>> getCurrentUser(@CookieValue(value = "JWT", defaultValue = "") String token) {
        if (token.isEmpty() || !jwtTokenProvider.validateToken(token)) {
            return ResponseEntity.status(401).body(Collections.singletonMap("message", "Unauthorized"));
        }

        String email = jwtTokenProvider.getUsernameFromToken(token);
        Map<String, String> response = new HashMap<>();
        response.put("email", email);

        return ResponseEntity.ok(response);
    }
}


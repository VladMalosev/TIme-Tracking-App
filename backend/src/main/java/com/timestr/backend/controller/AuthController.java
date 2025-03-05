package com.timestr.backend.controller;

import com.timestr.backend.configuration.OnlineUserTracker;
import com.timestr.backend.dto.LoginRequest;
import com.timestr.backend.dto.RegisterRequest;
import com.timestr.backend.model.*;
import com.timestr.backend.repository.ProjectRepository;
import com.timestr.backend.repository.WorkspaceRepository;
import com.timestr.backend.repository.WorkspaceUserRepository;
import com.timestr.backend.security.JwtTokenProvider;
import com.timestr.backend.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private final UserService userService;

    @Autowired
    private final WorkspaceRepository workspaceRepository;

    @Autowired
    private final WorkspaceUserRepository workspaceUserRepository;

    @Autowired
    private final JwtTokenProvider jwtTokenProvider;

    @Autowired
    private OnlineUserTracker onlineUserTracker;

    @Autowired
    private final ProjectRepository projectRepository;

    public AuthController(UserService userService, JwtTokenProvider jwtTokenProvider, OnlineUserTracker onlineUserTracker, WorkspaceRepository workspaceRepository, WorkspaceUserRepository workspaceUserRepository, ProjectRepository projectRepository) {
        this.userService = userService;
        this.jwtTokenProvider = jwtTokenProvider;
        this.onlineUserTracker = onlineUserTracker;
        this.workspaceRepository = workspaceRepository;
        this.workspaceUserRepository = workspaceUserRepository;
        this.projectRepository = projectRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<User> registerUser(@RequestBody RegisterRequest request) {
        request.setRole(Role.USER);
        User user = userService.registerUser(request);

        // create def workspace for the user
        Workspace defaultWorkspace = new Workspace();
        defaultWorkspace.setName(user.getName() + "'s Workspace");
        defaultWorkspace.setDescription("Workspace for " + user.getName());
        defaultWorkspace.setCreatedAt(LocalDateTime.now());
        defaultWorkspace.setUpdatedAt(LocalDateTime.now());
        workspaceRepository.save(defaultWorkspace);


        WorkspaceUser workspaceUser = new WorkspaceUser();
        workspaceUser.setUser(user);
        workspaceUser.setWorkspace(defaultWorkspace);
        workspaceUser.setRole(WorkspaceRole.OWNER);
        workspaceUser.setCreatedAt(LocalDateTime.now());
        workspaceUser.setUpdatedAt(LocalDateTime.now());
        workspaceUserRepository.save(workspaceUser);

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
        response.put("userId", user.getId().toString());

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

    @GetMapping("/current-user-role/{projectId}")
    public ResponseEntity<Map<String, String>> getCurrentUserRole(
            @PathVariable UUID projectId,
            @CookieValue(value = "JWT", defaultValue = "") String token) {

        if (token.isEmpty() || !jwtTokenProvider.validateToken(token)) {
            return ResponseEntity.status(401).body(Collections.singletonMap("message", "Unauthorized"));
        }

        String email = jwtTokenProvider.getUsernameFromToken(token);
        User user = userService.getUserByEmail(email);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        WorkspaceUser workspaceUser = workspaceUserRepository.findByUserIdAndWorkspaceId(user.getId(), project.getWorkspace().getId())
                .orElseThrow(() -> new RuntimeException("User is not part of this workspace"));

        Map<String, String> response = new HashMap<>();
        response.put("role", workspaceUser.getRole().name());

        return ResponseEntity.ok(response);
    }
}
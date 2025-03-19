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
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.logging.Logger;

@RestController
@RequestMapping("/api/auth")
@Tag(name="Authentication", description = "Endpoints for user authentication and registration")
public class AuthController {

    private static final Logger logger = Logger.getLogger(AuthController.class.getName());

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

    @Operation(summary = "Register a new user", description = "Creates a new user account and assigns a default workspace")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User registered successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input")
    })
    @PostMapping("/register")
    public ResponseEntity<User> registerUser(@RequestBody RegisterRequest request) {
        logger.info("Registering new user: " + request.getEmail());
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

        logger.info("User registered successfully: " + user.getEmail());
        return ResponseEntity.ok(user);
    }

    @Operation(summary = "Login a user", description = "Authenticates a user and returns a JWT token.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Login successful"),
            @ApiResponse(responseCode = "401", description = "Invalid email or password")
    })
    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> loginUser(@RequestBody LoginRequest request, HttpServletResponse response) {
        logger.info("Login attempt for user: " + request.getEmail());
        User user = userService.authenticateUser(request.getEmail(), request.getPassword());

        if (user == null) {
            logger.warning("Invalid email or password for user: " + request.getEmail());
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

        logger.info("Login successful for user: " + user.getEmail());
        return ResponseEntity.ok(responseBody);
    }

    @Operation(summary = "Get dashboard data", description = "Returns user-specific data for the dashboard.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Dashboard data retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, String>> getDashboardData(@CookieValue(value = "JWT", defaultValue = "") String token) {
        logger.info("Fetching dashboard data");
        if (token.isEmpty() || !jwtTokenProvider.validateToken(token)) {
            logger.warning("Unauthorized access to dashboard");
            return ResponseEntity.status(401).body(Collections.singletonMap("message", "Unauthorized"));
        }

        String email = jwtTokenProvider.getUsernameFromToken(token);
        User user = userService.getUserByEmail(email);

        Map<String, String> response = new HashMap<>();
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("userId", user.getId().toString());

        logger.info("Dashboard data retrieved for user: " + user.getEmail());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Logout a user", description = "Logs out the user and invalidates the JWT token.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Logout successful"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logoutUser(@CookieValue(value = "JWT", defaultValue = "") String token, HttpServletResponse response) {
        logger.info("Logout request received");
        if (token.isEmpty() || !jwtTokenProvider.validateToken(token)) {
            logger.warning("Unauthorized logout attempt");
            return ResponseEntity.status(401).body(Collections.singletonMap("message", "Unauthorized"));
        }

        String email = jwtTokenProvider.getUsernameFromToken(token);
        onlineUserTracker.setUserOffline(email);

        Cookie cookie = new Cookie("JWT", token);
        cookie.setMaxAge(0);
        cookie.setPath("/");
        response.addCookie(cookie);

        logger.info("Logout successful for user: " + email);
        return ResponseEntity.ok(Collections.singletonMap("message", "Logout successful"));
    }

    @Operation(summary = "Get online users", description = "Returns a list of currently online users.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Online users retrieved successfully")
    })
    @GetMapping("/online-users")
    public ResponseEntity<List<String>> getOnlineUsers() {
        List<String> onlineUsers = onlineUserTracker.getOnlineUsers();
        logger.info("Online users: " + onlineUsers);
        return ResponseEntity.ok(onlineUsers);
    }

    @Operation(summary = "Get current user", description = "Returns the email of the currently authenticated user.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Current user retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @GetMapping("/current-user")
    public ResponseEntity<Map<String, String>> getCurrentUser(@CookieValue(value = "JWT", defaultValue = "") String token) {
        logger.info("Fetching current user");
        if (token.isEmpty() || !jwtTokenProvider.validateToken(token)) {
            logger.warning("Unauthorized access to current user endpoint");
            return ResponseEntity.status(401).body(Collections.singletonMap("message", "Unauthorized"));
        }

        String email = jwtTokenProvider.getUsernameFromToken(token);
        Map<String, String> response = new HashMap<>();
        response.put("email", email);

        logger.info("Current user retrieved: " + email);
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Get current user role in a project", description = "Returns the role of the current user in the specified project.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "User role retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "Project or user not found")
    })
    @GetMapping("/current-user-role/{projectId}")
    public ResponseEntity<Map<String, String>> getCurrentUserRole(
            @PathVariable UUID projectId,
            @CookieValue(value = "JWT", defaultValue = "") String token) {

        logger.info("Fetching current user role for project: " + projectId);
        if (token.isEmpty() || !jwtTokenProvider.validateToken(token)) {
            logger.warning("Unauthorized access to current user role endpoint");
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

        logger.info("Current user role retrieved: " + response.get("role"));
        return ResponseEntity.ok(response);
    }



}
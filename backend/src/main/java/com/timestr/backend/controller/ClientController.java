package com.timestr.backend.controller;

import com.timestr.backend.model.Client;
import com.timestr.backend.model.Project;
import com.timestr.backend.model.User;
import com.timestr.backend.repository.UserRepository;
import com.timestr.backend.service.ClientService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/clients")
@Tag(name = "Client Management", description = "Endpoints for managing clients")
@SecurityRequirement(name = "bearerAuth")
public class ClientController {

    private final ClientService clientService;
    private final UserRepository userRepository;

    public ClientController(ClientService clientService, UserRepository userRepository) {
        this.clientService = clientService;
        this.userRepository = userRepository;
    }

    @Operation(summary = "Create a new client", description = "Creates a new client")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Client created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid input"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping
    public ResponseEntity<Client> createClient(@RequestBody Client client) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User creator = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Client createdClient = clientService.createClient(client, creator);
        return ResponseEntity.ok(createdClient);
    }


    @Operation(summary = "Get client details", description = "Retrieves details of a specific client")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Client retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Client not found")
    })
    @GetMapping("/{clientId}")
    public ResponseEntity<Client> getClientById(@PathVariable UUID clientId) {
        return ResponseEntity.ok(clientService.getClientById(clientId));
    }

    @Operation(summary = "Update client", description = "Updates details of an existing client")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Client updated successfully"),
            @ApiResponse(responseCode = "404", description = "Client not found")
    })
    @PutMapping("/{clientId}")
    public ResponseEntity<Client> updateClient(
            @PathVariable UUID clientId,
            @RequestBody Client clientDetails) {
        return ResponseEntity.ok(clientService.updateClient(clientId, clientDetails));
    }

    @Operation(summary = "Delete client", description = "Deletes a client from the system")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Client deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Client not found")
    })
    @DeleteMapping("/{clientId}")
    public ResponseEntity<Void> deleteClient(@PathVariable UUID clientId) {
        clientService.deleteClient(clientId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Get clients by creator", description = "Retrieves all clients created by a specific user")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Clients retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "User not found")
    })
    @GetMapping("/created-by/{userId}")
    public ResponseEntity<List<Client>> getClientsCreatedByUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(clientService.getClientsCreatedByUser(userId));
    }

    @Operation(summary = "Get clients by project", description = "Retrieves all clients associated with a project")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Clients retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Project not found")
    })
    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<Client>> getClientsByProject(@PathVariable UUID projectId) {
        return ResponseEntity.ok(clientService.getClientsByProject(projectId));
    }

    @Operation(summary = "Search clients by name", description = "Searches clients by name (case-insensitive)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Clients retrieved successfully")
    })
    @GetMapping("/search")
    public ResponseEntity<List<Client>> searchClientsByName(@RequestParam String name) {
        return ResponseEntity.ok(clientService.searchClientsByName(name));
    }

    @Operation(summary = "Get projects for client", description = "Retrieves all projects associated with a client")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Projects retrieved successfully"),
            @ApiResponse(responseCode = "404", description = "Client not found")
    })
    @GetMapping("/{clientId}/projects")
    public ResponseEntity<List<Project>> getProjectsForClient(@PathVariable UUID clientId) {
        return ResponseEntity.ok(clientService.getProjectsForClient(clientId));
    }

    @Operation(summary = "Assign client to project", description = "Assigns a client to a project (replaces any existing client)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Client assigned to project successfully"),
            @ApiResponse(responseCode = "404", description = "Client or project not found")
    })
    @PostMapping("/{clientId}/projects/{projectId}")
    public ResponseEntity<Project> assignClientToProject(
            @PathVariable UUID clientId,
            @PathVariable UUID projectId) {
        return ResponseEntity.ok(clientService.assignClientToProject(clientId, projectId));
    }

    @Operation(summary = "Remove client from project", description = "Removes the client assignment from a project")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Client removed from project successfully"),
            @ApiResponse(responseCode = "404", description = "Project not found")
    })
    @DeleteMapping("/projects/{projectId}/client")
    public ResponseEntity<Project> removeClientFromProject(
            @PathVariable UUID projectId) {
        return ResponseEntity.ok(clientService.removeClientFromProject(projectId));
    }

    @Operation(summary = "Get all clients", description = "Retrieves a list of all clients")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Clients retrieved successfully"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping
    public ResponseEntity<List<Client>> getUserClients() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = authentication.getName();
        User currentUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(clientService.getClientsCreatedByUser(currentUser.getId()));
    }
}
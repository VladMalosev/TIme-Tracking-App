package com.timestr.backend.service;

import com.timestr.backend.model.Client;
import com.timestr.backend.model.Project;
import com.timestr.backend.model.User;
import com.timestr.backend.repository.ClientRepository;
import com.timestr.backend.repository.ProjectRepository;
import com.timestr.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ClientService {

    private final ClientRepository clientRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;

    @Autowired
    public ClientService(ClientRepository clientRepository,
                         UserRepository userRepository,
                         ProjectRepository projectRepository) {
        this.clientRepository = clientRepository;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
    }

    @Transactional
    public Client createClient(Client client, User creator) {
        client.setCreatedBy(creator);
        return clientRepository.save(client);
    }

    public Client getClientById(UUID clientId) {
        return clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client not found"));
    }

    @Transactional
    public Client updateClient(UUID clientId, Client clientDetails) {
        Client client = getClientById(clientId);

        if (clientDetails.getName() != null) {
            client.setName(clientDetails.getName());
        }
        if (clientDetails.getContactEmail() != null) {
            client.setContactEmail(clientDetails.getContactEmail());
        }
        if (clientDetails.getContactPhone() != null) {
            client.setContactPhone(clientDetails.getContactPhone());
        }

        return clientRepository.save(client);
    }

    @Transactional
    public void deleteClient(UUID clientId) {
        Client client = getClientById(clientId);
        List<Project> projectsWithClient = projectRepository.findByClientId(clientId);
        for (Project project : projectsWithClient) {
            project.setClient(null);
            projectRepository.save(project);
        }
        clientRepository.delete(client);
    }

    public List<Client> getClientsCreatedByUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return clientRepository.findByCreatedBy(user);
    }

    public List<Client> getClientsByProject(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        if (project.getClient() == null) {
            return List.of();
        }
        return List.of(project.getClient());
    }

    public List<Client> searchClientsByName(String name) {
        return clientRepository.searchByName(name);
    }

    @Transactional
    public Project assignClientToProject(UUID clientId, UUID projectId) {
        Client client = getClientById(clientId);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        project.setClient(client);
        return projectRepository.save(project);
    }

    @Transactional
    public Project removeClientFromProject(UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        project.setClient(null);
        return projectRepository.save(project);
    }

    public List<Project> getProjectsForClient(UUID clientId) {
        return projectRepository.findByClientId(clientId);
    }

    public List<Client> getAllClients() {
        return clientRepository.findAll();
    }
}
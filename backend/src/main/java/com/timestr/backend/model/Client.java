package com.timestr.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "clients")
public class Client {

    @Id
    @UuidGenerator
    private UUID id;

    @NotBlank(message = "Client name cannot be blank")
    @Size(max = 100, message = "Client name cannot exceed 100 characters")
    @Column(nullable = false, unique = true)
    private String name;

    @Size(max = 255)
    private String contactEmail;

    @Size(max = 20)
    private String contactPhone;

    @OneToMany(mappedBy = "client", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Project> projects;

    private LocalDateTime createdAt = LocalDateTime.now();

    public void setId(UUID id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }

    public void setProjects(List<Project> projects) {
        this.projects = projects;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public List<Project> getProjects() {
        return projects;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
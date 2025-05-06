package com.timestr.backend.repository;

import com.timestr.backend.model.Client;
import com.timestr.backend.model.Project;
import com.timestr.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClientRepository extends JpaRepository<Client, UUID> {
    List<Client> findByCreatedBy(User user);

    @Query("SELECT c FROM Client c WHERE LOWER(c.name) LIKE LOWER(concat('%', :name,'%'))")
    List<Client> searchByName(@Param("name") String name);

}
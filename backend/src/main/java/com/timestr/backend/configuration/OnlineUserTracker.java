package com.timestr.backend.configuration;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class OnlineUserTracker {
    private final ConcurrentHashMap<String, Boolean> onlineUsers = new ConcurrentHashMap<>();

    public void setUsersOnline(String email) {
        onlineUsers.put(email, true);
        System.out.println("User online: " + email);
    }

    public void setUserOffline(String email) {
        onlineUsers.remove(email);
        System.out.println("User offline: " + email);
    }

    public List<String> getOnlineUsers() {
        System.out.println("Current online users: " + onlineUsers.keySet());
        return new ArrayList<>(onlineUsers.keySet());
    }
}
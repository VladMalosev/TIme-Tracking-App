package com.timestr.backend.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/config")
public class AllowedEmailController {

    @Value("${allowed.email}")
    private String allowedEmail;

    @GetMapping("/allowed-email")
    public Map<String, String> getAllowedEmail() {
        return Collections.singletonMap("allowedEmail", allowedEmail);
    }
}

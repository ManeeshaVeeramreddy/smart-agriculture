package com.samagri.dto;

import jakarta.validation.constraints.NotBlank;

public class VoiceQueryRequest {

    @NotBlank(message = "Voice query text cannot be blank")
    private String query;

    private String language; // "en" or "te"

    public VoiceQueryRequest() {
    }

    public VoiceQueryRequest(String query, String language) {
        this.query = query;
        this.language = language;
    }

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }
}

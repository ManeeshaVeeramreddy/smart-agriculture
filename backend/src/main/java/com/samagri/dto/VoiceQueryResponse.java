package com.samagri.dto;

import java.util.Map;

public class VoiceQueryResponse {

    private String intent;
    private String displayText;
    private String spokenText;
    private String action; // NAVIGATE, READ_DATA, POPULATE_FORM, NONE
    private String redirectUrl;
    private Map<String, Object> data;

    public VoiceQueryResponse() {
    }

    public VoiceQueryResponse(String intent, String displayText, String spokenText, String action, String redirectUrl, Map<String, Object> data) {
        this.intent = intent;
        this.displayText = displayText;
        this.spokenText = spokenText;
        this.action = action;
        this.redirectUrl = redirectUrl;
        this.data = data;
    }

    public String getIntent() {
        return intent;
    }

    public void setIntent(String intent) {
        this.intent = intent;
    }

    public String getDisplayText() {
        return displayText;
    }

    public void setDisplayText(String displayText) {
        this.displayText = displayText;
    }

    public String getSpokenText() {
        return spokenText;
    }

    public void setSpokenText(String spokenText) {
        this.spokenText = spokenText;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getRedirectUrl() {
        return redirectUrl;
    }

    public void setRedirectUrl(String redirectUrl) {
        this.redirectUrl = redirectUrl;
    }

    public Map<String, Object> getData() {
        return data;
    }

    public void setData(Map<String, Object> data) {
        this.data = data;
    }
}

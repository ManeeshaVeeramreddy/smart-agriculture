package com.samagri.dto;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * One piece of plain-language farming advice.
 * The frontend translates {@code code} + {@code params} into the farmer's own language
 * (and reads it aloud); {@code message} is the English fallback.
 */
public class AdviceItemDto {

    private String code;       // e.g. IRRIGATE_NOW, TOO_WET, HEAT_STRESS
    private String severity;   // URGENT, WARNING, INFO, GOOD
    private String message;    // English text
    private Map<String, Object> params = new LinkedHashMap<>();

    public AdviceItemDto() {
    }

    public AdviceItemDto(String code, String severity, String message, Map<String, Object> params) {
        this.code = code;
        this.severity = severity;
        this.message = message;
        if (params != null) {
            this.params = params;
        }
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Map<String, Object> getParams() {
        return params;
    }

    public void setParams(Map<String, Object> params) {
        this.params = params;
    }
}

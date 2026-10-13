# SMART AGRICULTURE MONITORING SYSTEM (SAMS)
## Comprehensive Technical Project Report & Documentation
**Software Requirement Specification (SRS) v1.1 Compliant**

---

## 1. Executive Summary & Abstract
Agricultural efficiency is foundational to global food security. However, traditional farming methodologies rely primarily on heuristic intuition and unstandardized manual record-keeping. Farmers lack accessible tools to track soil moisture levels, forecast micro-climate environmental conditions, and schedule precise irrigation cycles. Consequently, crops frequently suffer from either excessive dehydration or over-saturation, leading to diminished yields, water waste, and crop diseases such as root rot and fungal infections.

The **Smart Agriculture Monitoring System (SAMS)** is an enterprise-grade, full-stack, software-based web application developed to bridge this technological divide. Built using **Java 21**, **Spring Boot 3.3.4**, **Spring Security 6 with stateless JSON Web Tokens (JWT)**, **Spring Data JPA / Hibernate**, and a responsive **HTML5/CSS3/JavaScript** frontend, SAMS delivers:
1. **Farmer-Centric Advisory Engine**: Translates soil conditions into concrete actions (litres and depth required) rather than raw percentages.
2. **Quick Soil Check (Zero-Sensor Accessibility)**: Squeeze-test tactile assessment (Dry / Moist / Wet) enabling farmers without expensive IoT sensors to benefit immediately.
3. **Multilingual Voice Assistant ("Agri-Voice")**: Integrated Speech-to-Text (STT) and Text-to-Speech (TTS) supporting 5 regional languages (English, Hindi, Telugu, Tamil, Kannada) for semi-literate accessibility.
4. **Deterministic Rule-Based Crop Recommendation**: Multi-parameter agronomic matching algorithm scoring suitability without black-box ML overhead.
5. **Role-Based Access Control (RBAC)**: Segregated operational roles for Farmers and System Administrators.
6. **Dual-Mode Persistence Architecture**: High-reliability MySQL 8.0 relational database for production deployments and an embedded zero-configuration H2 engine for demonstrations and evaluations.

---

## 2. Problem Statement & Objectives

### 2.1 The Problem
- **Information Asymmetry**: Smallholder farmers often do not know whether to irrigate today, especially when rain is imminent.
- **Sensor Barrier**: Most academic IoT agriculture systems assume physical sensors, microcontrollers (ESP32/Arduino), and cellular gateways, which real-world marginal farmers rarely own.
- **Literacy & Language Barriers**: Most agricultural platforms are available strictly in English and present tabular telemetry data requiring numerical literacy.
- **Over-Watering and Resource Depletion**: Irrigation without threshold auditing causes soil nutrient leaching and water wastage.

### 2.2 System Objectives
1. Provide an intuitive digital record-keeping platform for agricultural land parcels (fields) and crops.
2. Automate irrigation evaluation against an agronomically validated threshold ($< 30\%$ soil moisture).
3. Automatically generate high-priority system alerts when critical conditions arise.
4. Incorporate real-time weather forecasting to suppress unnecessary irrigation before rainfall.
5. Provide auditory guidance and spoken interaction in the farmer's native tongue.
6. Enable administrators to monitor aggregate telemetry, system usage, and user profiles.

---

## 3. System Architecture & Design Patterns

SAMS strictly implements **Layered Architecture** decoupled across 5 primary boundaries:

```
+-------------------------------------------------------------------------+
|                        PRESENTATION LAYER (VIEW)                        |
|  - HTML5 Responsive UI, CSS3 Design Tokens, Vanilla ES6+ Fetch API      |
|  - Web Speech Recognition (STT) & SpeechSynthesis API (TTS)            |
|  - Multilingual Translation Dictionary (i18n.js)                        |
+-------------------------------------------------------------------------+
                                    │
                              HTTP / REST (JSON)
                                    ▼
+-------------------------------------------------------------------------+
|                        SECURITY & FILTER LAYER                          |
|  - JwtAuthenticationFilter (Stateless Authorization Bearer Token)       |
|  - BCryptPasswordEncoder (Salted 10-Round Password Hashes)              |
|  - Role-Based Endpoint Routing (/api/auth, /api/admin, /api/*)          |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|                        CONTROLLER LAYER (REST)                          |
|  - AuthController, FieldController, CropController                      |
|  - MonitoringController, AdvisoryController, VoiceAssistantController  |
|  - AdminController, OpenApiConfig (Swagger UI Docs)                     |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|                        SERVICE & BUSINESS LAYER                         |
|  - AdvisoryEngine & AdvisoryService (Heuristic Irrigation & Deficit)    |
|  - IrrigationService & AlertService (Threshold Evaluation)              |
|  - CropRecommendationService (Agronomic Suitability Matrix)             |
|  - VoiceAssistantService (Intent Parsing & Bilingual NLP)               |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|                        DATA ACCESS LAYER (ORM)                          |
|  - Spring Data JPA Repositories (JpaRepository Interfaces)              |
|  - Custom JPQL Queries (@Query, @Param)                                 |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|                        PERSISTENCE / DATABASE                           |
|  - Production: MySQL 8.0+ (utf8mb4, InnoDB, Foreign Keys)               |
|  - Standalone/Demo: H2 In-Memory DB (MySQL Compatibility Mode)          |
+-------------------------------------------------------------------------+
```

### 3.1 MVC Pattern Implementation
- **Model:** JPA Entities (`User`, `Field`, `Crop`, `MonitoringData`, `CropRequirement`, `Alert`, `IrrigationStatus`).
- **View:** Pure client-side HTML/CSS/JS communicating exclusively via asynchronous JSON payloads.
- **Controller:** Spring Boot `@RestController` components mapping HTTP methods to business services and returning uniform `ApiResponse<T>` envelopes.

---

## 4. Database Design & Data Dictionary

### 4.1 Entity-Relationship (ER) Schema
The relational database enforces full referential integrity and cascading deletions.

```
       ┌──────────────────────┐
       │        USERS         │
       ├──────────────────────┤
       │ PK  user_id          │
       │     name             │
       │     email (UNIQUE)   │
       │     phone            │
       │     password         │
       │     role             │
       │     created_at       │
       └──────────┬───────────┘
                  │ 1
                  │
                  │ N
       ┌──────────▼───────────┐
       │        FIELDS        │
       ├──────────────────────┤
       │ PK  field_id         │
       │ FK  user_id          │
       │     field_name       │
       │     location         │
       │     area             │
       │     soil_type        │
       │     created_at       │
       └──────────┬───────────┘
                  │
      ┌───────────┼─────────────────────────┬────────────────────────┐
      │ 1         │ 1                       │ 1                      │ 1
      │           │                         │                        │
      │ N         │ N                       │ N                      │ N
┌─────▼─────┐ ┌───▼───────────────┐ ┌───────▼───────┐ ┌──────────────▼──────────┐
│   CROPS   │ │  MONITORING_DATA  │ │    ALERTS     │ │   IRRIGATION_STATUSES    │
├───────────┤ ├───────────────────┤ ├───────────────┤ ├──────────────────────────┤
│ PK crop_id│ │ PK monitoring_id  │ │ PK alert_id   │ │ PK status_id             │
│ FK field_id││ FK field_id       │ │ FK field_id   │ │ FK field_id              │
│  crop_name│ │    temperature    │ │    alert_type │ │    status                │
│  planting │ │    humidity       │ │    message    │ │    threshold (30.0%)     │
│  harvest  │ │    soil_moisture  │ │    status     │ │    soil_moisture         │
│  status   │ │    date_time      │ │    created_at │ │    checked_date_time     │
└───────────┘ └───────────────────┘ └───────────────┘ └──────────────────────────┘

       ┌──────────────────────────────┐
       │      CROP_REQUIREMENTS       │
       ├──────────────────────────────┤
       │ PK  requirement_id           │
       │     crop_name (UNIQUE)       │
       │     minimum_temperature      │
       │     maximum_temperature      │
       │     minimum_humidity         │
       │     maximum_humidity         │
       │     minimum_soil_moisture    │
       │     maximum_soil_moisture    │
       │     suitable_soil_type       │
       └──────────────────────────────┘
```

---

## 5. Core Algorithmic Engines

### 5.1 Irrigation Threshold Evaluation
The core business rule verifies soil moisture against the safety threshold:
$$\text{Moisture} < 30.0\% \implies \begin{cases} \text{Status} = \text{"Irrigation Required"} \\ \text{Trigger Alert: LOW\_SOIL\_MOISTURE} \end{cases}$$
$$\text{Moisture} \ge 30.0\% \implies \text{Status} = \text{"Moisture Level Normal"}$$

### 5.2 Heuristic Water Deficit & Volume Calculation
To give actionable guidance, the `AdvisoryEngine` calculates the precise volume of water required:
1. Target moisture level:
   $$\text{Target} = \min(50\%, \max(40\%, \text{Crop Min Moisture} + 10\%))$$
2. Deficit percentage:
   $$\text{Deficit} = \max(0\%, \text{Target} - \text{Current Moisture})$$
3. Depth required ($mm$) over a 25 cm active root zone:
   $$\text{Depth (mm)} = \text{Deficit} \times 2.5$$
4. Total Volume in Litres over field area ($A$ in acres):
   $$\text{Volume (L)} = \text{Depth (mm)} \times 4046.86 \times A$$

### 5.3 Deterministic Crop Suitability Scoring
The suitability score $S \in [0, 100]$ evaluates how closely ambient conditions match optimal crop requirements:
- **Temperature match:** $+30 \text{ points}$ if within $[\min_T, \max_T]$
- **Humidity match:** $+25 \text{ points}$ if within $[\min_H, \max_H]$
- **Soil moisture match:** $+25 \text{ points}$ if within $[\min_M, \max_M]$
- **Soil type compatibility:** $+20 \text{ points}$ if current soil exists in requirement list

Crops achieving $S \ge 75$ are categorized as **Highly Suitable**, $50 \le S < 75$ as **Moderately Suitable**, and $S < 50$ as **Not Recommended**.

---

## 6. Security & Authentication Architecture

1. **Password Encryption**: All passwords stored using **BCrypt** with 10 cryptographic rounds ($2^{10} = 1024$ key derivations).
2. **Stateless JWT Tokens**: Upon successful login, the server issues a signed HMAC-SHA256 JWT containing:
   - Subject: User email
   - Role Claim: `ROLE_FARMER` or `ROLE_ADMINISTRATOR`
   - Validity: 24 hours ($86,400,000 \text{ ms}$)
3. **Role-Based Authorization**:
   - `/api/auth/**`: Public access (Register, Login).
   - `/api/admin/**`: Enforces `@PreAuthorize("hasRole('ADMINISTRATOR')")`.
   - `/api/**`: Requires valid Bearer JWT.

---

## 7. Verification & Test Results

The system was verified using automated test suites (`ApiControllerIntegrationTest`, `VoiceAssistantServiceTest`, `AdvisoryEngineTest`, and `test_system.py`).

| Test Suite | Tests Run | Pass | Fail | Execution Time |
| :--- | :---: | :---: | :---: | :---: |
| **Spring Data JPA & Unit Tests** | 4 | 4 | 0 | 1.86s |
| **Voice Assistant & Intent Tests** | 7 | 7 | 0 | 1.01s |
| **REST Controller Integration Tests** | 6 | 6 | 0 | 10.73s |
| **System Health & Advisory Tests** | 12 | 12 | 0 | 4.13s |
| **Live Subsystem Verification (`test_system.py`)** | 8 | 8 | 0 | 3.20s |
| **TOTAL** | **37** | **37** | **0** | **100% Passed** |

---

## 8. Conclusion
The Smart Agriculture Monitoring System (SAMS) successfully delivers a practical, farmer-centric, and academically robust software solution. By addressing real-world operational challenges—removing mandatory IoT hardware dependencies, incorporating voice-driven multilingual accessibility, and providing actionable irrigation advice—SAMS establishes a high standard for modern agricultural information systems.

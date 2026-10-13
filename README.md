# SMART AGRICULTURE MONITORING SYSTEM (SAMS)

A full-stack, enterprise-grade web application built with **Java Spring Boot**, **MySQL**, **Layered Architecture**, and a responsive **HTML/CSS/JavaScript** frontend. Designed in compliance with the **Software Requirement Specification (SRS) Document v1.1** for academic and research evaluation.

**Author & Lead Developer:** [Maneesha Veeramreddy](https://github.com/ManeeshaVeeramreddy)  
**GitHub Repository:** [https://github.com/ManeeshaVeeramreddy/smart-agriculture](https://github.com/ManeeshaVeeramreddy/smart-agriculture)

---

---

## 0. NEW in v2 - Farmer-First Upgrade (what is useful for a real farmer?)

Feedback received: *"What is the use for farmers? Make it useful and add voice, because many farmers are illiterate."*
The system was therefore redesigned around **one question: "What should I do on my field today?"** See `docs/FARMER_UPGRADE.md` for the full explanation.

| Problem in v1 | Fix in v2 |
| :--- | :--- |
| Farmer had to type temperature / humidity / moisture numbers | **Quick Soil Check** - squeeze soil, tap a big picture: Dry / Moist / Wet (or just say it) |
| Showed tables and percentages | **My Farm** page - one colour-coded card per field (red / orange / green) with plain advice |
| Only said "Irrigation Required" | **Action advice** - how much water (cm and litres), too wet, heat stress, fungus risk, harvest reminder, old reading |
| Ignored the weather | **Rain-aware** - if rain is likely it says *wait, do not water now* (free Open-Meteo service, no key) |
| English only, reading required | **5 languages** (English, Hindi, Telugu, Tamil, Kannada) + **voice**: every advice can be **read aloud**, the farmer can **ask by voice** ("do I need water?", "will it rain?") and fill any form box by speaking |
| Login needed an email address | Login / register with a **mobile number** (email optional) |
| Anyone could register as ADMINISTRATOR | Public sign-up always creates a FARMER |

New files: `frontend/farmer-home.html`, `quick-check.html`, `js/i18n.js`, `voice.js`, `assistant.js`, `weather.js`, `advisor.js`, `shell.js`, `css/farmer.css`;
backend `AdvisoryEngine`, `AdvisoryService`, `AdvisoryController` (`GET /api/advisory`), `POST /api/monitoring/quick`.
Farmers now land on **My Farm** (`farmer-home.html`) after login; the old tabular dashboard is still available as "Full Dashboard".

**Voice notes:** reading aloud uses the browser's built-in speech (works offline once the language voice is installed on the phone);
voice *input* uses Chrome/Edge speech recognition, which needs internet and `https://` or `localhost`. Best on Chrome for Android.
No API keys are required for anything.

Demo: log in with mobile `9123456789` / `farmer123` (or `farmer@sams.com`), choose a language at the top, tap **Listen**, then the big microphone.

---

## 1. Project Overview

The **Smart Agriculture Monitoring System (SAMS)** enables farmers to track and manage agricultural land parcels and crops, log environmental observations (temperature, humidity, soil moisture), automatically calculate irrigation requirements based on soil moisture thresholds, receive proactive critical alerts, view historical telemetry, and obtain rule-based crop suitability recommendations.

Administrators have access to a dedicated dashboard to manage user accounts and monitor system-wide agricultural data.

> **Scope Note:** This is a purely **software-based** system. It does **not** require physical IoT sensors, microcontrollers (Arduino, ESP32, Raspberry Pi), or MQTT brokers. Data can be entered manually or generated via built-in simulation presets.

---

## 2. Project Objectives

1. Maintain centralized records for agricultural fields and crops.
2. Record environmental measurements (Temperature, Humidity, Soil Moisture).
3. Automate irrigation evaluation through the Spring Boot Service Layer ($< 30\%$ moisture threshold).
4. Dispatch automated system alerts when critical dry conditions occur.
5. Provide historical telemetry tracking and filtering by field.
6. Offer deterministic, rule-based crop recommendation scoring (no machine learning required).
7. Ensure role-based access control (Farmer vs. Administrator).
8. Expose clean, standardized REST APIs documented with Swagger/OpenAPI.

---

## 3. Technology Stack & Design Principles

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Backend Framework** | Java 21, Spring Boot 3.3.4 | Robust enterprise foundation, dependency injection, and REST controllers |
| **Security** | Spring Security 6 & JJWT 0.11.5 | Role-based authorization and stateless JWT token authentication |
| **Persistence** | Spring Data JPA / Hibernate | Object-Relational Mapping (ORM) and automated schema migration |
| **Database** | MySQL 8.0+ | Reliable relational storage with foreign keys and referential integrity |
| **API Documentation** | Springdoc OpenAPI (Swagger UI) | Interactive REST API testing interface |
| **Frontend UI** | HTML5, CSS3, Vanilla JavaScript | Lightweight, dependency-free responsive interface using `fetch()` |
| **Architecture** | Layered Architecture | Separation of Presentation, Controller, Service, and Repository layers |
| **Design Pattern** | MVC (Model-View-Controller) | Decoupled entities (Model), UI (View), and REST endpoints (Controller) |

---

## 4. Layered Architecture & MVC Implementation

The application strictly implements **Layered Architecture**:

```
[ FRONTEND / VIEW ]
  HTML5 Pages + CSS3 + Vanilla JavaScript (fetch API)
           │
           ▼
[ CONTROLLER LAYER ]
  Spring Boot @RestController classes (/api/*)
           │
           ▼
[ SERVICE LAYER ]
  Business Logic: Irrigation threshold, alerts, recommendations, validation
           │
           ▼
[ REPOSITORY LAYER ]
  Spring Data JPA Interfaces extending JpaRepository
           │
           ▼
[ DATABASE LAYER ]
  MySQL Database: `smart_agriculture`
```

### MVC Structure:
- **Model:** JPA Entities (`User`, `Field`, `Crop`, `MonitoringData`, `CropRequirement`, `Alert`, `IrrigationStatus`) defining table mappings and constraints.
- **View:** HTML pages (`farmer-dashboard.html`, `fields.html`, `crops.html`, `monitoring.html`, `alerts.html`, `recommendation.html`, `admin-dashboard.html`) styled with `style.css`.
- **Controller:** REST Controllers receiving HTTP verbs (GET, POST, PUT, DELETE) and returning JSON DTO responses.

---

## 5. Core Business Rules

### 5.1 Irrigation Determination Logic (Service Layer)
Implemented exclusively in `IrrigationService.java`:

$$\text{IF soil moisture} < 30\% \implies \text{Status} = \text{"Irrigation Required"}$$
$$\text{ELSE} \implies \text{Status} = \text{"Moisture Level Normal"}$$

- **25%** $\rightarrow$ *Irrigation Required*
- **29.9%** $\rightarrow$ *Irrigation Required*
- **30.0%** $\rightarrow$ *Moisture Level Normal*
- **45.0%** $\rightarrow$ *Moisture Level Normal*

### 5.2 Automated Alert Generation (Alert Module)
When soil moisture is below $30\%$, the backend automatically generates:
- **Alert Type:** `LOW_SOIL_MOISTURE`
- **Message:** `"Low soil moisture detected. Irrigation is required."`
- **Status:** `ACTIVE`

### 5.3 Rule-Based Crop Recommendation (Service Layer)
Compares ambient conditions against stored agronomic crop requirements (Rice, Wheat, Maize, Tomato, Groundnut) across four equal criteria:
1. **Temperature Match** ($25\%$ weight)
2. **Relative Humidity Match** ($25\%$ weight)
3. **Soil Moisture Match** ($25\%$ weight)
4. **Soil Type Compatibility** ($25\%$ weight)

Computes an overall suitability score ($0-100\%$) and generates detailed, natural-language explanations.

---

## 6. Project Directory Structure

```
smart-agriculture-monitoring-system/
│
├── backend/                                # Spring Boot Application
│   ├── pom.xml                             # Maven Dependencies
│   ├── mvnw / mvnw.cmd                     # Maven Wrapper
│   └── src/
│       ├── main/
│       │   ├── java/com/samagri/
│       │   │   ├── SmartAgricultureApplication.java
│       │   │   ├── config/                 # Security, JWT, OpenAPI, DataInitializer
│       │   │   ├── controller/             # REST API Controllers
│       │   │   ├── dto/                    # Request/Response Data Transfer Objects
│       │   │   ├── exception/              # Global Exception Handling
│       │   │   ├── model/                  # JPA Entities
│       │   │   ├── repository/             # Spring Data JPA Repositories
│       │   │   └── service/                # Business Logic Services
│       │   └── resources/
│       │       ├── application.properties  # Database & App Configuration
│       │       └── static/                 # Embedded Frontend Static Assets
│       └── test/                           # JUnit 5 & MockMvc Test Suite
│
├── frontend/                               # Standalone Web Application
│   ├── css/
│   │   └── style.css                       # Responsive Stylesheet
│   ├── js/
│   │   ├── api.js                          # REST Client, JWT, and Toast notifications
│   │   ├── auth.js                         # Login and Register Handlers
│   │   ├── farmer-dashboard.js             # Farmer Metrics & Live Banner
│   │   ├── fields.js                       # Field CRUD Operations
│   │   ├── crops.js                        # Crop Management
│   │   ├── monitoring.js                   # Reading Input & Simulation Presets
│   │   ├── monitoring-history.js           # Chronological Records & Filter
│   │   ├── alerts.js                       # Active & Resolved Alerts
│   │   ├── recommendation.js               # Crop Suitability Engine
│   │   ├── admin-dashboard.js              # Admin Metrics Overview
│   │   ├── users.js                        # Admin User Table & Deletion
│   │   └── admin-monitoring.js             # System-Wide Logs Inspection
│   ├── index.html                          # Landing Page
│   ├── login.html                          # User Sign-In
│   ├── register.html                       # User Sign-Up
│   ├── farmer-dashboard.html               # Farmer Dashboard
│   ├── fields.html                         # Field Management UI
│   ├── crops.html                          # Crop Management UI
│   ├── monitoring.html                     # Add Monitoring Data UI
│   ├── monitoring-history.html             # History Table UI
│   ├── alerts.html                         # Alerts Center UI
│   ├── recommendation.html                 # Crop Recommendation UI
│   ├── admin-dashboard.html                # Administrator Dashboard UI
│   ├── users.html                          # Admin User Management UI
│   └── admin-monitoring.html               # Admin System Telemetry UI
│
├── database/                               # Database Scripts
│   ├── schema.sql                          # MySQL Table Definitions & Constraints
│   └── data.sql                            # Sample Data Seeding Script
│
├── docs/                                   # Documentation
│   └── SRS_Documentation.md                # Complete SRS v1.1 Document
│
└── README.md                               # Comprehensive Project Guide
```

---

## 7. Prerequisites

- **Java JDK:** Version 21 (or 17+)
- **MySQL Server:** Version 8.0+
- **Modern Web Browser:** Chrome, Edge, Firefox, or Safari

---

## 8. MySQL Configuration & Setup

### Step 1: Create the Database
Open MySQL Command Line Client or MySQL Workbench and run:

```sql
CREATE DATABASE IF NOT EXISTS smart_agriculture;
```

*(Optional: You can run `database/schema.sql` and `database/data.sql`, or simply let Spring Boot auto-generate tables and seed sample data through `DataInitializer`.)*

### Step 2: Configure Your MySQL Password
Open the configuration file:
`backend/src/main/resources/application.properties`

Locate lines 17-20:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/smart_agriculture?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD
```

**Replace `YOUR_PASSWORD` with your actual MySQL root password.**

> **Alternative via Environment Variable:**  
> You can also set the environment variable without editing the file:  
> **PowerShell:** `$env:DB_PASSWORD="your_actual_password"`  
> **CMD:** `set DB_PASSWORD=your_actual_password`

---

---

## 9. How to Run the Application

### Option A: One-Click Instant Run (Zero Configuration, Standalone H2 Mode)
No MySQL installation, password, or setup needed!
Simply double-click:
```bat
run-backend.bat
```
*(Or on Linux/macOS: `./run-backend.sh`)*

This runs Spring Boot with the built-in in-memory database, automatically seeds demonstrative users, fields, crops, alerts, and telemetry, and starts the server on port `8080`.

### Option B: Running with MySQL (Production / Submission Mode)
1. Ensure MySQL is running on port `3306`.
2. *(Optional)* Run `setup-database.bat` to import `database/schema.sql` and `database/data.sql`.
3. Double-click:
   ```bat
   run-backend-mysql.bat
   ```
   *(Or on Linux/macOS: `./run-backend-mysql.sh`)*
   Enter your MySQL root password when prompted.

### Option C: Instant System Health & API Verification
To verify all 8 core subsystems (Auth, Fields, Crops, Voice AI, Recommendations, Admin, Telemetry, Swagger) in 3 seconds:
```powershell
python test_system.py
```

### Accessing the Web Interface:
- **Home / Landing Page:** [http://localhost:8080/index.html](http://localhost:8080/index.html)
- **Farmer Portal (My Farm):** [http://localhost:8080/farmer-home.html](http://localhost:8080/farmer-home.html)
- **Quick Soil Squeeze Check:** [http://localhost:8080/quick-check.html](http://localhost:8080/quick-check.html)
- **Interactive Swagger Docs:** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **H2 Database Console:** [http://localhost:8080/h2-console](http://localhost:8080/h2-console) (JDBC URL: `jdbc:h2:mem:smart_agriculture`, User: `sa`, Password: empty)

---

## 10. Sample Login Credentials

The application automatically seeds demonstrative accounts on first launch:

| Role | Mobile / Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Farmer** | `9123456789` or `farmer@sams.com` | `farmer123` | My Farm, Quick Check, Voice AI, Fields, Crops, Alerts, Telemetry |
| **Administrator** | `admin@sams.com` | `admin123` | System stats, User accounts, System-wide monitoring audit, Alert center |

*(Tip: On `login.html`, click **"Farmer Demo"** or **"Admin Demo"** buttons to auto-fill credentials instantly during presentations.)*

---

## 10.1 Additional Academic & Deployment Materials
For university submissions, vivas, cloud deployment, and technical defense:
- **Production Deployment Guide:** [DEPLOYMENT_GUIDE.md](file:///c:/Users/manoj/Downloads/last/DEPLOYMENT_GUIDE.md) *(Docker, Render, Railway, AWS EC2, and Nginx)*
- **Full Project Report:** [PROJECT_REPORT.md](file:///c:/Users/manoj/Downloads/last/PROJECT_REPORT.md)
- **Viva Voce Q&A Handbook:** [VIVA_QUESTIONS_AND_ANSWERS.md](file:///c:/Users/manoj/Downloads/last/VIVA_QUESTIONS_AND_ANSWERS.md)
- **SRS v1.1 Specification:** [docs/SRS_Documentation.md](file:///c:/Users/manoj/Downloads/last/docs/SRS_Documentation.md)
- **Farmer-First Architecture:** [docs/FARMER_UPGRADE.md](file:///c:/Users/manoj/Downloads/last/docs/FARMER_UPGRADE.md)


---

## 11. Testing & Demonstration Guide

### Demonstration Checkpoints for Viva:
1. **Login & Role Access:** Log in as `farmer@sams.com`. Observe that admin endpoints are protected.
2. **Irrigation Rule Verification:**
   - Go to **Add Monitoring Data** (`monitoring.html`).
   - Click the **"Critical Dry Soil (25%)"** simulation preset. Submit the form.
   - Verify that the status evaluates to **"Irrigation Required"** and an active `LOW_SOIL_MOISTURE` alert is generated.
   - Click the **"Normal Moisture (45%)"** simulation preset. Submit the form.
   - Verify that the status evaluates to **"Moisture Level Normal"** and no alert is triggered.
   - Test the boundary value of **30%**: Evaluates to **"Moisture Level Normal"**.
3. **Alerts Center:** Navigate to `alerts.html`, inspect the low moisture warning, and click **"Mark Resolved"**.
4. **Crop Recommendation:** Open `recommendation.html`, choose `Field A` (Loamy) or enter custom conditions, and review the ranked crop suitability percentages and reasons.
5. **Admin Operations:** Log out, log in as `admin@sams.com`, inspect user counts, view all records, and manage accounts.

---

## 12. REST API Reference

All endpoints return uniform JSON responses wrapped in `ApiResponse<T>`.

### Authentication
- `POST /api/auth/register` — Register a new farmer or admin account
- `POST /api/auth/login` — Sign in and obtain a JWT bearer token
- `GET /api/auth/me` — Retrieve the authenticated profile

### Fields
- `GET /api/fields` — List user's fields with summary metrics
- `POST /api/fields` — Create a new field
- `GET /api/fields/{id}` — Get field details
- `PUT /api/fields/{id}` — Update field details
- `DELETE /api/fields/{id}` — Delete field and associated records

### Crops
- `GET /api/crops` — List crops (supports `?fieldId={id}` query filter)
- `POST /api/crops` — Register a crop to a field
- `GET /api/crops/{id}` — Get crop details
- `PUT /api/crops/{id}` — Update crop stages
- `DELETE /api/crops/{id}` — Remove crop record

### Monitoring & Telemetry
- `POST /api/monitoring` — Record manual or simulated sensor readings
- `GET /api/monitoring` — Retrieve user's monitoring records
- `GET /api/monitoring/latest/{fieldId}` — Retrieve latest reading for a field
- `GET /api/monitoring/history/{fieldId}` — Retrieve historical readings for a field

### Irrigation
- `GET /api/irrigation/{fieldId}` — Evaluate irrigation status against the $30\%$ threshold

### Alerts
- `GET /api/alerts` — Retrieve alerts (supports `?activeOnly=true`)
- `GET /api/alerts/{fieldId}` — Retrieve alerts for a field
- `PUT /api/alerts/{id}/resolve` — Mark an alert as resolved

### Recommendations
- `POST /api/recommendations` — Evaluate suitability for custom temperature, humidity, moisture, and soil
- `GET /api/recommendations/{fieldId}` — Automatically evaluate suitability using the field's latest readings

### Administrator (Role-Protected)
- `GET /api/admin/stats` — Overall counts of users, farmers, fields, crops, records, and active alerts
- `GET /api/admin/users` — List all registered accounts
- `DELETE /api/admin/users/{id}` — Remove an account
- `GET /api/admin/fields` — List all fields system-wide
- `GET /api/admin/crops` — List all crops system-wide
- `GET /api/admin/monitoring` — Inspect all monitoring telemetry
- `GET /api/admin/alerts` — Inspect all system alerts

---

## 13. Future Enhancements

1. **Weather Forecast API Integration:** Incorporate third-party weather forecast predictions (e.g. OpenWeatherMap) to anticipate upcoming rainfall before recommending irrigation.
2. **Automated Scheduled Simulation:** Background cron jobs to simulate diurnal variations in soil moisture based on temperature.
3. **SMS / Email Alerts:** Push notifications via Twilio or SMTP when critical dryness persists.
4. **Export Reports:** PDF/Excel generation for seasonal monitoring logs and field audits.

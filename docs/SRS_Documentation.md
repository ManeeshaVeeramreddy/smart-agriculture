# Software Requirement Specification (SRS) Document

## Smart Agriculture Monitoring System (SAMS)
**Version 1.1**  
**Date Created:** 03/09/26  

### Prepared By:
- **V. MANEESHA** - 23MIC7240
- **M. RINAAZ** - 23MIC7047
- **V. MOHITHA** - 23MIC7081
- **V. POOJITHA** - 23MIC7162  
**Institution:** VIT-AP UNIVERSITY

---

## 1. Introduction
The **Smart Agriculture Monitoring System (SAMS)** is a web-based agricultural management and environmental monitoring platform designed to help farmers manage field and crop details, enter and observe agricultural parameters (temperature, humidity, soil moisture), evaluate irrigation status, and receive rule-based crop suitability recommendations.

Administrators have oversight capabilities to manage user accounts, review agricultural telemetry, inspect generated alerts, and monitor overall system operations.

---

## 2. Abstract
Traditional farming frequently relies on manual, unstandardized field observation. Keeping physical logs of soil moisture, ambient temperature, and humidity across multiple land plots leads to delayed irrigation decisions, crop stress, and poor yield.

SAMS unifies these operations into a centralized, layered web application. Farmers maintain digital profiles for their fields and crops, input observed or simulated conditions, check automated irrigation triggers based on soil moisture thresholds, receive alerts, review historical logs, and obtain crop recommendations based on agronomic requirements.

---

## 3. Scope & Scope Boundaries
### 3.1 Software-Only Implementation
- **Scope:** The system is **entirely software-based**.
- **No Physical IoT Sensors:** Does **not** implement Arduino, ESP32, Raspberry Pi, MQTT, or physical sensors.
- **Data Entry:** Environmental telemetry (temperature, relative humidity, soil moisture percentage) is recorded manually or through built-in simulation presets.
- **Crop Recommendation:** Employs a deterministic, rule-based algorithm comparing current observations against reference agronomic ranges (no machine learning required).

---

## 4. Architectural Design: Layered Architecture & MVC

The system strictly adheres to **Layered Architecture** and **MVC (Model-View-Controller)** principles:

```
[ Presentation Layer / View ]
      (HTML5, CSS3, JavaScript fetch)
                ↓
    [ Controller Layer ]
      (Spring Boot REST Controllers @RestController)
                ↓
     [ Service Layer ]
      (Business Logic, Irrigation Rules, Alerts, Recommendations)
                ↓
    [ Repository Layer ]
      (Spring Data JPA Repositories @Repository)
                ↓
     [ Database Layer ]
      (MySQL Database: smart_agriculture)
```

### Layer Responsibilities
1. **Presentation Layer (View):** HTML pages, responsive CSS, and JavaScript fetch API calls providing intuitive dashboards for farmers and administrators.
2. **Controller Layer:** Exposes versioned REST APIs (`/api/auth`, `/api/fields`, `/api/crops`, `/api/monitoring`, `/api/irrigation`, `/api/alerts`, `/api/recommendations`, `/api/admin`), parses requests, validates parameters, and returns standardized JSON responses.
3. **Service Layer:** Executes domain business logic. Calculates whether soil moisture requires irrigation, dispatches system alerts, evaluates crop suitability scores, and enforces role-based access rules.
4. **Repository Layer:** Spring Data JPA interfaces handling persistent CRUD operations, queries, and constraints.
5. **Database Layer:** Relational MySQL database (`smart_agriculture`) with foreign-key relationships.

---

## 5. Functional Requirements

### 5.1 User Management & Authentication
- **Registration:** Captures Name, Email, Phone, Password, and Role (`FARMER` or `ADMINISTRATOR`).
- **Validation:** Validates email format, prevents duplicate emails, and hashes passwords securely using BCrypt.
- **Authentication:** Issues stateless JSON Web Tokens (JWT) for secure REST API communication.
- **Role-Based Authorization:** Grants access to Farmer Dashboard for farmers and Admin Console for administrators.

### 5.2 Field Management
- Farmers can create, read, update, and delete field records.
- Attributes: `fieldId`, `fieldName`, `location`, `area` (in acres), `soilType` (Loamy, Clay, Sandy, Black, Red, Silty).

### 5.3 Crop Management
- Farmers can track crop plantings associated with specific fields.
- Attributes: `cropId`, `cropName`, `fieldId`, `plantingDate`, `expectedHarvestDate`, `cropStatus` (Sown, Vegetative, Growing, Flowering, Ripening, Harvested).

### 5.4 Monitoring Module
- Farmers enter observation readings: Field, Temperature (°C), Humidity (0-100%), Soil Moisture (0-100%), and Timestamp.
- Data validation ensures ranges are strictly enforced.

### 5.5 Irrigation Business Logic
Core business rule implemented in Spring Boot Service layer:
$$\text{Soil Moisture} < 30\% \implies \text{Status} = \text{"Irrigation Required"}$$
$$\text{Soil Moisture} \ge 30\% \implies \text{Status} = \text{"Moisture Level Normal"}$$

- **25%** $\rightarrow$ *Irrigation Required*
- **29.9%** $\rightarrow$ *Irrigation Required*
- **30.0%** $\rightarrow$ *Moisture Level Normal*
- **45.0%** $\rightarrow$ *Moisture Level Normal*

### 5.6 Automated Alert Generation
- Whenever recorded soil moisture is below $30\%$, the service automatically generates an `Alert`:
  - `alertType`: `LOW_SOIL_MOISTURE`
  - `message`: *"Low soil moisture detected. Irrigation is required."*
  - `status`: `ACTIVE`
  - Linked to the affected field and user.
- Farmers can view active alerts on their dashboard and mark them resolved.

### 5.7 Monitoring History
- Persists all past readings in MySQL.
- Displays chronological logs with field filtering, environmental values, and irrigation status indicators.

### 5.8 Rule-Based Crop Recommendations
- Compares ambient conditions against reference requirements for Rice, Wheat, Maize, Tomato, and Groundnut:
  1. Temperature range match ($25\%$)
  2. Relative humidity range match ($25\%$)
  3. Soil moisture range match ($25\%$)
  4. Soil type compatibility ($25\%$)
- Computes overall Suitability Score ($0-100\%$) and generates detailed, natural-language explanations.

### 5.9 Administrator Console
- Metrics: Total Users, Total Farmers, Total Fields, Total Crops, Total Monitoring Records, Active Alerts.
- Administrative inspection and deletion of user records.
- System-wide monitoring and alert observation.

---

## 6. System Diagrams & UML Models

### 6.1 Use Case Diagram Summary
- **Farmer Actor:** Register, Login, Manage Fields, Manage Crops, Enter Monitoring Data, View Monitoring Data, Check Soil Moisture, Check Irrigation Status, View Alerts, View Monitoring History, View Dashboard, Get Crop Recommendations.
- **Administrator Actor:** Login, Manage Users, View System Data, View Fields, View Crops, View All Monitoring Data, View System Alerts.

### 6.2 Class Diagram Summary
- **User:** `userId`, `name`, `email`, `phone`, `password`, `role` (1 to Many with Field).
- **Field:** `fieldId`, `fieldName`, `location`, `area`, `soilType` (1 to Many with Crop, MonitoringData, Alert, IrrigationStatus).
- **Crop:** `cropId`, `cropName`, `plantingDate`, `expectedHarvestDate`, `cropStatus`.
- **MonitoringData:** `monitoringId`, `temperature`, `humidity`, `soilMoisture`, `dateTime`.
- **Alert:** `alertId`, `alertType`, `message`, `status`, `createdDateTime`.
- **IrrigationStatus:** `statusId`, `status`, `threshold`, `soilMoisture`, `checkedDateTime`.
- **CropRequirement:** `requirementId`, `cropName`, `minTemp`, `maxTemp`, `minHumidity`, `maxHumidity`, `minSoilMoisture`, `maxSoilMoisture`, `suitableSoilType`.

---

## 7. Non-Functional Requirements
1. **Performance:** REST API response latency $< 150\text{ ms}$ under standard loads.
2. **Security:** BCrypt password hashing, JWT authentication, and Spring Security authorization filters.
3. **Usability:** Responsive, accessible web design themed for agriculture.
4. **Reliability:** Relational referential integrity with cascading constraints.

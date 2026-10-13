# SMART AGRICULTURE MONITORING SYSTEM (SAMS)
## Comprehensive Viva Voce Questions & Answers Guide

This guide prepares you for academic project defense, viva voce examinations, technical reviews, and job interviews.

---

### Category 1: Project Overview & Architecture

#### Q1: What is the Smart Agriculture Monitoring System (SAMS)?
**Answer:**
SAMS is a full-stack, enterprise-grade agricultural management web application built with Java 21, Spring Boot 3.3.4, Spring Security 6 with stateless JWT authentication, Spring Data JPA / Hibernate, and a responsive HTML5/CSS3/Vanilla JavaScript frontend. It enables farmers to manage land parcels, track crops, enter environmental observations, calculate automated irrigation thresholds ($<30\%$), receive critical alerts, consult rule-based crop recommendations, and interact hands-free using a multilingual voice assistant ("Agri-Voice") in 5 languages.

#### Q2: What architecture pattern does SAMS use?
**Answer:**
SAMS strictly implements **Layered Architecture** adhering to **MVC (Model-View-Controller)**:
1. **Presentation Layer (View):** Client-side HTML5, CSS3 tokens, and JavaScript Fetch API.
2. **Controller Layer:** Spring Boot `@RestController` classes handling HTTP requests and serializing responses.
3. **Service Layer:** Houses core business logic (irrigation threshold calculation, heuristic water deficit formulas, crop recommendation scoring).
4. **Data Access Layer:** Spring Data JPA `@Repository` interfaces executing database operations.
5. **Database Layer:** MySQL 8.0 for production / H2 in-memory engine for zero-configuration demonstrations.

#### Q3: Why is this system software-based rather than requiring physical IoT hardware?
**Answer:**
In many rural agricultural areas, smallholder and marginal farmers do not possess expensive IoT hardware, microcontrollers (ESP32/Arduino), or stable cellular IoT gateways. SAMS addresses this reality by offering **Quick Soil Check** (a tactile squeeze-test mapping physical feel to moisture percentages) and manual telemetry logging, ensuring the system is immediately beneficial without high upfront capital expenditure.

---

### Category 2: Backend & Spring Boot

#### Q4: Why did you choose Spring Boot 3 for this project?
**Answer:**
1. **Productivity & Auto-Configuration:** Eliminates extensive XML and boilerplate configuration.
2. **Embedded Servlet Container:** Bundles Tomcat, enabling standalone execution via single command (`mvnw spring-boot:run` or `.bat`).
3. **Spring Data JPA Integration:** Provides seamless ORM mapping with automated schema generation and migration.
4. **Spring Security 6 Integration:** Native support for modern lambda DSLs and stateless JWT token authentication.
5. **Java 21 LTS Compatibility:** Leverages virtual threads, records, pattern matching, and modern JVM performance enhancements.

#### Q5: What is the purpose of `@RestController` vs `@Controller`?
**Answer:**
`@Controller` is traditionally used to return views (like Thymeleaf or JSP templates). `@RestController` combines `@Controller` and `@ResponseBody`, ensuring that every method return value is automatically serialized directly into HTTP response bodies as JSON or XML.

#### Q6: How does Dependency Injection (DI) work in SAMS?
**Answer:**
SAMS uses **Constructor-Based Dependency Injection**, which is the recommended best practice in Spring. For example, in `AuthController`:
```java
public AuthController(AuthService authService) {
    this.authService = authService;
}
```
This guarantees immutability (`final` fields), eliminates reflection overhead, and makes unit testing effortless by allowing mock dependencies to be passed directly.

#### Q7: How does `DataInitializer` work?
**Answer:**
`DataInitializer` implements Spring Boot's `CommandLineRunner` interface. When the application context completes startup, Spring executes its `run()` method. If the database tables are empty, it automatically seeds reference crop requirements, default test users (`admin@sams.com`, `farmer@sams.com`), sample fields, crops, and telemetry data.

---

### Category 3: Security & JWT

#### Q8: How does JWT authentication work in this application?
**Answer:**
SAMS implements **stateless token-based authentication**:
1. Farmer or Admin sends credentials (`email` or `phone` and `password`) to `/api/auth/login`.
2. `AuthService` verifies credentials against the BCrypt password hash.
3. If valid, `JwtTokenProvider` signs a cryptographic JWT token (HMAC-SHA256) containing the user's identity and role claim.
4. The client stores this token in browser `localStorage`.
5. For all subsequent API requests, the client attaches the header `Authorization: Bearer <token>`.
6. `JwtAuthenticationFilter` intercepts the request, validates the signature and expiry, and populates the `SecurityContextHolder`.

#### Q9: How are passwords secured in the database?
**Answer:**
Passwords are never stored in plaintext. They are hashed using **BCryptPasswordEncoder** with an algorithmic work factor of 10. BCrypt incorporates a random 16-byte salt into each hash, protecting passwords against dictionary attacks and pre-computed rainbow table lookups.

#### Q10: How is Role-Based Access Control (RBAC) enforced?
**Answer:**
- In `SecurityConfig`, public endpoints (`/api/auth/**`, `/*.html`, `/swagger-ui/**`) are permitted to all.
- Method security (`@EnableMethodSecurity`) is enabled. Admin controllers are protected with `@PreAuthorize("hasRole('ADMINISTRATOR')")`. If a user with `ROLE_FARMER` attempts to access admin endpoints, Spring Security rejects the request with HTTP `403 Forbidden`.

---

### Category 4: Database & Spring Data JPA

#### Q11: Explain the database relationship between Users, Fields, Crops, and Alerts.
**Answer:**
- A **User** has a One-to-Many (`@OneToMany`) relationship with **Fields**.
- A **Field** has a One-to-Many relationship with **Crops**.
- A **Field** has a One-to-Many relationship with **MonitoringData**, **Alerts**, and **IrrigationStatuses**.
- Foreign keys enforce cascading deletes (`ON DELETE CASCADE`), ensuring referential integrity if an entity is removed.

#### Q12: What is the difference between JPA and Hibernate?
**Answer:**
- **JPA (Jakarta Persistence API):** A Java specification / standard defining interfaces and annotations (`@Entity`, `@Table`, `@Id`).
- **Hibernate:** The actual ORM implementation that implements the JPA specification, handling SQL generation, caching, and dialect mapping.

#### Q13: What does `spring.jpa.hibernate.ddl-auto=update` do?
**Answer:**
It tells Hibernate to automatically compare the JPA entity classes against the database schema on startup and execute incremental `ALTER TABLE` or `CREATE TABLE` statements without dropping existing data.

#### Q14: How does SAMS support both MySQL and H2 databases?
**Answer:**
By leveraging Spring Boot **Profiles**:
- `application-h2.properties`: Activates embedded H2 in-memory database with MySQL syntax compatibility mode (`MODE=MySQL`). Works out of the box with zero external dependencies.
- `application-mysql.properties`: Configures production connection to MySQL 8.0 on port 3306.
Users can switch effortlessly via environment variable `SPRING_PROFILES_ACTIVE=mysql` or one-click batch scripts.

---

### Category 5: Business Logic & Algorithms

#### Q15: How is irrigation calculated? What is the threshold?
**Answer:**
Per SRS specification, the threshold is **30.0% soil moisture**:
- If latest soil moisture $< 30.0\%$, the system sets status to `"Irrigation Required"` and automatically generates an active `LOW_SOIL_MOISTURE` alert.
- If latest soil moisture $\ge 30.0\%$, the system sets status to `"Moisture Level Normal"`.

#### Q16: How does the Advisory Engine calculate required water in litres?
**Answer:**
`AdvisoryEngine` implements an agronomic heuristic:
1. Target moisture is determined based on the crop's minimum threshold + 10%, clamped between 40% and 50%.
2. Deficit percentage $= \text{Target} - \text{Current Moisture}$.
3. Depth required $= \text{Deficit} \times 2.5 \text{ mm}$ (assuming standard 25 cm root zone).
4. Total water required $= \text{Depth (mm)} \times 4046.86 \text{ Litres/acre} \times \text{Field Area (acres)}$.

#### Q17: How does the Rule-Based Crop Recommendation Algorithm work?
**Answer:**
Instead of an opaque black-box machine learning model, SAMS uses a deterministic agronomic rule-scoring matrix comparing ambient temperature, relative humidity, soil moisture, and soil type against reference ranges in `crop_requirements`:
- Temperature match: $+30 \text{ points}$
- Humidity match: $+25 \text{ points}$
- Soil moisture match: $+25 \text{ points}$
- Soil type compatibility: $+20 \text{ points}$
Total score $\ge 75$: Highly Suitable; $50-74$: Moderately Suitable; $<50$: Not Recommended.

---

### Category 6: Multilingual Voice AI ("Agri-Voice")

#### Q18: How does the voice assistant work in the frontend?
**Answer:**
1. **Speech-to-Text (Voice Input):** Uses the W3C standard **Web Speech Recognition API** (`webkitSpeechRecognition`). When the farmer taps the microphone, the browser streams audio to speech recognition and converts it to text in the chosen language.
2. **Natural Language Processing (Intent Matching):** The transcribed text is sent to `POST /api/voice/process` where `VoiceAssistantService` parses keywords across multiple languages (English and Telugu) to identify intents such as `IRRIGATION_STATUS`, `WEATHER_CHECK`, `CHECK_ALERTS`, or `CROP_RECOMMENDATION`.
3. **Text-to-Speech (Voice Output):** Uses the browser's built-in `window.speechSynthesis` API with language voices (`te-IN`, `hi-IN`, `ta-IN`, `kn-IN`, `en-IN`) to speak advice aloud.

#### Q19: Which languages are supported?
**Answer:**
5 languages: **English**, **Hindi (हिन्दी)**, **Telugu (తెలుగు)**, **Tamil (தமிழ்)**, and **Kannada (ಕನ್ನಡ)**.

---

### Category 7: Frontend & API Design

#### Q20: Why did you use Vanilla JavaScript instead of heavy frameworks like React or Angular?
**Answer:**
1. **Zero Build Step:** Runs directly in any browser without needing Node.js, Webpack, or npm builds.
2. **Lightweight & Fast:** Immediate load times on low-bandwidth rural mobile networks.
3. **Direct Spring Boot Serving:** Static assets are served directly from Spring Boot's `classpath:/static/` on the same port (`8080`), eliminating CORS issues and multi-server deployments.

#### Q21: What is the Swagger / OpenAPI documentation endpoint?
**Answer:**
Interactive Swagger UI is hosted at `http://localhost:8080/swagger-ui.html`, and the OpenAPI JSON schema is accessible at `http://localhost:8080/api-docs`.

---

### Quick Reference Cheat Sheet for Examiners:
| Feature | Implementation | File / Component |
| :--- | :--- | :--- |
| **Backend Framework** | Java 21, Spring Boot 3.3.4 | `backend/pom.xml` |
| **Security** | Spring Security 6, JWT, BCrypt | `SecurityConfig.java`, `JwtTokenProvider.java` |
| **Database** | MySQL 8.0 & H2 In-Memory | `application.properties`, `schema.sql` |
| **Irrigation Rule** | $<30.0\%$ moisture threshold | `IrrigationService.java`, `AlertService.java` |
| **Water Heuristic** | $1\% \approx 2.5\text{mm} \approx 4046.86\text{L/acre}$ | `AdvisoryEngine.java` |
| **Voice AI** | Web Speech API + Spring NLP | `VoiceAssistantService.java`, `voice.js` |
| **Languages** | English, Hindi, Telugu, Tamil, Kannada | `frontend/js/i18n.js` |
| **Admin Controls** | Total users, fields, telemetry audit | `AdminController.java`, `admin-dashboard.html` |
| **Quick Check** | Squeeze test (Dry/Moist/Wet) | `quick-check.html`, `MonitoringController.java` |

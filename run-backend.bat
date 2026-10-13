@echo off
title Smart Agriculture Monitoring System (SAMS) - Standalone Runner
color 0A
echo ===============================================================================
echo       SMART AGRICULTURE MONITORING SYSTEM (SAMS) - ZERO CONFIG RUNNER
echo ===============================================================================
echo.
echo Mode: Standalone In-Memory Database (H2 with MySQL syntax compatibility)
echo Port: http://localhost:8080
echo.
echo Pre-configured Test Accounts:
echo   - Farmer:        farmer@sams.com (or Mobile: 9123456789)  / Password: farmer123
echo   - Administrator: admin@sams.com                          / Password: admin123
echo.
echo Web Pages:
echo   - Home:          http://localhost:8080/index.html
echo   - Farmer Portal: http://localhost:8080/farmer-home.html
echo   - Swagger Docs:  http://localhost:8080/swagger-ui.html
echo   - H2 Console:    http://localhost:8080/h2-console
echo.
echo ===============================================================================
echo Starting Spring Boot backend...
echo ===============================================================================

cd backend
call mvnw.cmd spring-boot:run
pause

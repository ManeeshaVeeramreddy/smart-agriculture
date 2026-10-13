@echo off
title Smart Agriculture Monitoring System (SAMS) - MySQL Runner
color 0B
echo ===============================================================================
echo          SMART AGRICULTURE MONITORING SYSTEM (SAMS) - MYSQL RUNNER
echo ===============================================================================
echo.
echo Mode: MySQL Database (Host: localhost:3306, DB: smart_agriculture)
echo.
set /p DB_PASS="Enter your MySQL root password (press Enter for default): "
if "%DB_PASS%"=="" (
    set DB_PASSWORD=root
) else (
    set DB_PASSWORD=%DB_PASS%
)

set SPRING_PROFILES_ACTIVE=mysql
echo.
echo Connecting to MySQL with root password...
echo ===============================================================================
echo Starting Spring Boot backend...
echo ===============================================================================

cd backend
call mvnw.cmd spring-boot:run
pause

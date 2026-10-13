#!/usr/bin/env bash
echo "==============================================================================="
echo "      SMART AGRICULTURE MONITORING SYSTEM (SAMS) - ZERO CONFIG RUNNER"
echo "==============================================================================="
echo "Mode: Standalone In-Memory Database (H2 with MySQL syntax compatibility)"
echo "Port: http://localhost:8080"
echo "==============================================================================="
cd backend || exit
chmod +x ./mvnw
./mvnw spring-boot:run

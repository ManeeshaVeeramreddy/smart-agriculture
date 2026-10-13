#!/usr/bin/env bash
echo "==============================================================================="
echo "         SMART AGRICULTURE MONITORING SYSTEM (SAMS) - MYSQL RUNNER"
echo "==============================================================================="
read -rsp "Enter MySQL root password (default: root): " DB_PASS
echo ""
export DB_PASSWORD=${DB_PASS:-root}
export SPRING_PROFILES_ACTIVE=mysql

cd backend || exit
chmod +x ./mvnw
./mvnw spring-boot:run

-- ===================================================================
-- SMART AGRICULTURE MONITORING SYSTEM (SAMS)
-- MySQL Database Schema
-- Database Name: smart_agriculture
-- ===================================================================

CREATE DATABASE IF NOT EXISTS smart_agriculture
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smart_agriculture;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Fields Table
CREATE TABLE IF NOT EXISTS fields (
    field_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    field_name VARCHAR(100) NOT NULL,
    location VARCHAR(150) NOT NULL,
    area DOUBLE NOT NULL,
    soil_type VARCHAR(50) NOT NULL,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fields_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 3. Crops Table
CREATE TABLE IF NOT EXISTS crops (
    crop_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    crop_name VARCHAR(100) NOT NULL,
    field_id BIGINT NOT NULL,
    planting_date DATE NOT NULL,
    expected_harvest_date DATE,
    crop_status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_crops_field FOREIGN KEY (field_id) REFERENCES fields(field_id) ON DELETE CASCADE
);

-- 4. Crop Requirements Table (Reference criteria for rule-based recommendation)
CREATE TABLE IF NOT EXISTS crop_requirements (
    requirement_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    crop_name VARCHAR(100) NOT NULL UNIQUE,
    minimum_temperature DOUBLE NOT NULL,
    maximum_temperature DOUBLE NOT NULL,
    minimum_humidity DOUBLE NOT NULL,
    maximum_humidity DOUBLE NOT NULL,
    minimum_soil_moisture DOUBLE NOT NULL,
    maximum_soil_moisture DOUBLE NOT NULL,
    suitable_soil_type VARCHAR(100) NOT NULL
);

-- 5. Monitoring Data Table (Temperature, Humidity, Soil Moisture)
CREATE TABLE IF NOT EXISTS monitoring_data (
    monitoring_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    field_id BIGINT NOT NULL,
    temperature DOUBLE NOT NULL,
    humidity DOUBLE NOT NULL,
    soil_moisture DOUBLE NOT NULL,
    date_time DATETIME NOT NULL,
    CONSTRAINT fk_monitoring_field FOREIGN KEY (field_id) REFERENCES fields(field_id) ON DELETE CASCADE
);

-- 6. Alerts Table (Triggered when soil moisture < 30%)
CREATE TABLE IF NOT EXISTS alerts (
    alert_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    field_id BIGINT NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    message VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL,
    created_date_time DATETIME NOT NULL,
    CONSTRAINT fk_alerts_field FOREIGN KEY (field_id) REFERENCES fields(field_id) ON DELETE CASCADE
);

-- 7. Irrigation Statuses Table (Evaluation log against 30.0% threshold)
CREATE TABLE IF NOT EXISTS irrigation_statuses (
    status_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    field_id BIGINT NOT NULL,
    status VARCHAR(60) NOT NULL,
    threshold DOUBLE NOT NULL DEFAULT 30.0,
    soil_moisture DOUBLE NOT NULL,
    checked_date_time DATETIME NOT NULL,
    CONSTRAINT fk_irrigation_field FOREIGN KEY (field_id) REFERENCES fields(field_id) ON DELETE CASCADE
);

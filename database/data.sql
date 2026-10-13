-- ===================================================================
-- SMART AGRICULTURE MONITORING SYSTEM (SAMS)
-- Initial Seed Data
-- ===================================================================

USE smart_agriculture;

-- 1. Insert Reference Crop Requirements
INSERT INTO crop_requirements (crop_name, minimum_temperature, maximum_temperature, minimum_humidity, maximum_humidity, minimum_soil_moisture, maximum_soil_moisture, suitable_soil_type)
VALUES
('Rice', 20.0, 38.0, 60.0, 85.0, 50.0, 80.0, 'Clay, Loamy'),
('Wheat', 15.0, 25.0, 40.0, 65.0, 35.0, 60.0, 'Loamy, Clay'),
('Maize', 18.0, 32.0, 45.0, 75.0, 30.0, 65.0, 'Loamy, Sandy'),
('Tomato', 18.0, 30.0, 50.0, 70.0, 35.0, 65.0, 'Loamy, Sandy'),
('Groundnut', 22.0, 35.0, 40.0, 70.0, 25.0, 55.0, 'Sandy, Loamy')
ON DUPLICATE KEY UPDATE crop_name = crop_name;

-- 2. Insert Users (BCrypt hashes for 'admin123' and 'farmer123')
-- $2a$10$wE9mH60x8VvXWkK30b1eGePq7uP9/G6R2U9N5L8A2I4P9W7Y3B0qS is a standard BCrypt password hash
INSERT INTO users (name, email, phone, password, role)
VALUES
('System Administrator', 'admin@sams.com', '9876543210', '$2a$10$hK.Gk6f1m3qC3y1kYk6J3e2xPq7uP9G6R2U9N5L8A2I4P9W7Y3B0q', 'ADMINISTRATOR'),
('Ramesh Kumar', 'farmer@sams.com', '9123456789', '$2a$10$hK.Gk6f1m3qC3y1kYk6J3e2xPq7uP9G6R2U9N5L8A2I4P9W7Y3B0q', 'FARMER')
ON DUPLICATE KEY UPDATE email = email;

-- 3. Insert Sample Fields for Farmer
INSERT INTO fields (field_name, location, area, soil_type, user_id)
SELECT 'Field A', 'Amaravati', 2.5, 'Loamy', user_id FROM users WHERE email = 'farmer@sams.com' LIMIT 1;

INSERT INTO fields (field_name, location, area, soil_type, user_id)
SELECT 'Field B', 'Guntur', 4.0, 'Clay', user_id FROM users WHERE email = 'farmer@sams.com' LIMIT 1;

-- 4. Insert Sample Crops
INSERT INTO crops (crop_name, field_id, planting_date, expected_harvest_date, crop_status)
SELECT 'Rice', field_id, DATE_SUB(CURDATE(), INTERVAL 30 DAY), DATE_ADD(CURDATE(), INTERVAL 90 DAY), 'Growing'
FROM fields WHERE field_name = 'Field A' LIMIT 1;

INSERT INTO crops (crop_name, field_id, planting_date, expected_harvest_date, crop_status)
SELECT 'Maize', field_id, DATE_SUB(CURDATE(), INTERVAL 15 DAY), DATE_ADD(CURDATE(), INTERVAL 75 DAY), 'Vegetative'
FROM fields WHERE field_name = 'Field A' LIMIT 1;

INSERT INTO crops (crop_name, field_id, planting_date, expected_harvest_date, crop_status)
SELECT 'Wheat', field_id, DATE_SUB(CURDATE(), INTERVAL 45 DAY), DATE_ADD(CURDATE(), INTERVAL 60 DAY), 'Flowering'
FROM fields WHERE field_name = 'Field B' LIMIT 1;

INSERT INTO crops (crop_name, field_id, planting_date, expected_harvest_date, crop_status)
SELECT 'Tomato', field_id, DATE_SUB(CURDATE(), INTERVAL 10 DAY), DATE_ADD(CURDATE(), INTERVAL 80 DAY), 'Sown'
FROM fields WHERE field_name = 'Field B' LIMIT 1;

-- 5. Insert Demonstrative Monitoring Records
-- Record 1: Soil Moisture = 45.0% -> Expected: Moisture Level Normal
INSERT INTO monitoring_data (field_id, temperature, humidity, soil_moisture, date_time)
SELECT field_id, 26.5, 70.0, 45.0, DATE_SUB(NOW(), INTERVAL 1 DAY)
FROM fields WHERE field_name = 'Field B' LIMIT 1;

INSERT INTO irrigation_statuses (field_id, status, threshold, soil_moisture, checked_date_time)
SELECT field_id, 'Moisture Level Normal', 30.0, 45.0, DATE_SUB(NOW(), INTERVAL 1 DAY)
FROM fields WHERE field_name = 'Field B' LIMIT 1;

-- Record 2: Soil Moisture = 25.0% -> Expected: Irrigation Required + Low soil moisture alert
INSERT INTO monitoring_data (field_id, temperature, humidity, soil_moisture, date_time)
SELECT field_id, 31.0, 58.0, 25.0, DATE_SUB(NOW(), INTERVAL 2 HOUR)
FROM fields WHERE field_name = 'Field A' LIMIT 1;

INSERT INTO irrigation_statuses (field_id, status, threshold, soil_moisture, checked_date_time)
SELECT field_id, 'Irrigation Required', 30.0, 25.0, DATE_SUB(NOW(), INTERVAL 2 HOUR)
FROM fields WHERE field_name = 'Field A' LIMIT 1;

INSERT INTO alerts (field_id, alert_type, message, status, created_date_time)
SELECT field_id, 'LOW_SOIL_MOISTURE', 'Low soil moisture detected. Irrigation is required.', 'ACTIVE', DATE_SUB(NOW(), INTERVAL 2 HOUR)
FROM fields WHERE field_name = 'Field A' LIMIT 1;

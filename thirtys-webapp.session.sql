-- database/schema.sql
CREATE DATABASE IF NOT EXISTS photo_studio_booking;
USE photo_studio_booking;

-- Drop existing tables if any (for fresh setup)
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS time_slots;
DROP TABLE IF EXISTS service_packages;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS admins;

-- Admin users table
CREATE TABLE admins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Services table
CREATE TABLE services (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  has_time_slots BOOLEAN DEFAULT FALSE,
  discount_percentage INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Service packages table
CREATE TABLE service_packages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  service_id INT,
  package_name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

-- Time slots table
CREATE TABLE time_slots (
  id INT PRIMARY KEY AUTO_INCREMENT,
  service_id INT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_booked BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  UNIQUE KEY unique_slot (service_id, date, start_time)
);

-- Bookings table
CREATE TABLE bookings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_code VARCHAR(20) UNIQUE NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  service_id INT,
  package_id INT,
  booking_date DATE NOT NULL,
  time_slot_id INT NULL,
  faculty VARCHAR(100) NULL,
  university VARCHAR(100) NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  payment_type ENUM('down_payment', 'full_payment') NOT NULL,
  payment_proof VARCHAR(255),
  status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id),
  FOREIGN KEY (package_id) REFERENCES service_packages(id),
  FOREIGN KEY (time_slot_id) REFERENCES time_slots(id)
);

-- Insert default admin (password: admin123)
INSERT INTO admins (username, password) VALUES 
('admin', '$2a$10$YourHashedPasswordHere');

-- Insert services
INSERT INTO services (name, base_price, has_time_slots, description) VALUES
('Self Photo', 50000, TRUE, 'Professional self photo session in studio'),
('Graduation Photography', 300000, TRUE, 'Capture your graduation moment'),
('Wedding Photography', 5000000, FALSE, 'Full day wedding photography coverage'),
('Wedding Videography', 7000000, FALSE, 'Professional wedding video documentation'),
('Prewedding Photography', 3000000, FALSE, 'Prewedding photo session'),
('Prewedding Videography', 4000000, FALSE, 'Prewedding video session'),
('Photo Product', 100000, FALSE, 'Product photography for business');

-- Insert service packages
INSERT INTO service_packages (service_id, package_name, price, description) VALUES
-- Self Photo packages
(1, 'Basic (30 minutes)', 50000, '10 edited photos'),
(1, 'Premium (1 hour)', 100000, '20 edited photos + all raw files'),
-- Graduation packages
(2, 'Personal Package', 300000, 'Individual graduation photo session'),
(2, 'Couple Package', 400000, 'Photo session for 2 people'),
(2, 'Group Package (3-5)', 600000, 'Photo session for 3-5 people'),
(2, 'Large Group (6-10)', 900000, 'Photo session for 6-10 people'),
-- Wedding Photography packages
(3, 'Basic Package', 5000000, 'Half day coverage + 100 edited photos'),
(3, 'Standard Package', 8000000, 'Full day coverage + 200 edited photos'),
(3, 'Premium Package', 12000000, 'Full day + prewedding + 300 edited photos'),
-- Wedding Videography packages
(4, 'Basic Package', 7000000, 'Highlight video + ceremony coverage'),
(4, 'Premium Package', 10000000, 'Full documentation + cinematic video'),
-- Prewedding Photography packages
(5, 'Basic Package', 3000000, '1 location + 50 edited photos'),
(5, 'Premium Package', 5000000, '2 locations + 100 edited photos'),
-- Prewedding Videography packages
(6, 'Basic Package', 4000000, '3-5 minutes cinematic video'),
(6, 'Premium Package', 6000000, '5-8 minutes cinematic video + behind the scenes'),
-- Photo Product packages
(7, 'Basic Package', 100000, '10 product photos'),
(7, 'Standard Package', 250000, '25 product photos + lifestyle shots'),
(7, 'Premium Package', 500000, '50 product photos + video content');

-- Generate time slots for Self Photo and Graduation Photography
-- For the next 30 days
DELIMITER //
CREATE PROCEDURE GenerateTimeSlots()
BEGIN
    DECLARE date_counter DATE DEFAULT CURDATE();
    DECLARE end_date DATE DEFAULT DATE_ADD(CURDATE(), INTERVAL 30 DAY);
    
    WHILE date_counter <= end_date DO
        -- Self Photo slots (1 hour each)
        INSERT INTO time_slots (service_id, date, start_time, end_time) VALUES
        (1, date_counter, '09:00:00', '10:00:00'),
        (1, date_counter, '10:00:00', '11:00:00'),
        (1, date_counter, '11:00:00', '12:00:00'),
        (1, date_counter, '13:00:00', '14:00:00'),
        (1, date_counter, '14:00:00', '15:00:00'),
        (1, date_counter, '15:00:00', '16:00:00'),
        (1, date_counter, '16:00:00', '17:00:00');
        
        -- Graduation Photography slots (2 hours each)
        INSERT INTO time_slots (service_id, date, start_time, end_time) VALUES
        (2, date_counter, '09:00:00', '11:00:00'),
        (2, date_counter, '11:00:00', '13:00:00'),
        (2, date_counter, '14:00:00', '16:00:00'),
        (2, date_counter, '16:00:00', '18:00:00');
        
        SET date_counter = DATE_ADD(date_counter, INTERVAL 1 DAY);
    END WHILE;
END//
DELIMITER ;

CALL GenerateTimeSlots();
DROP PROCEDURE GenerateTimeSlots;
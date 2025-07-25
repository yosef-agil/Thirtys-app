USE railway;

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

(1, 'Basic (30 minutes)', 50000, '10 edited photos'),
(1, 'Premium (1 hour)', 100000, '20 edited photos + all raw files'),

(2, 'Personal Package', 300000, 'Individual graduation photo session'),
(2, 'Couple Package', 400000, 'Photo session for 2 people'),
(2, 'Group Package (3-5)', 600000, 'Photo session for 3-5 people'),
(2, 'Large Group (6-10)', 900000, 'Photo session for 6-10 people'),

(3, 'Basic Package', 5000000, 'Half day coverage + 100 edited photos'),
(3, 'Standard Package', 8000000, 'Full day coverage + 200 edited photos'),
(3, 'Premium Package', 12000000, 'Full day + prewedding + 300 edited photos'),

(4, 'Basic Package', 7000000, 'Highlight video + ceremony coverage'),
(4, 'Premium Package', 10000000, 'Full documentation + cinematic video'),

(5, 'Basic Package', 3000000, '1 location + 50 edited photos'),
(5, 'Premium Package', 5000000, '2 locations + 100 edited photos'),

(6, 'Basic Package', 4000000, '3-5 minutes cinematic video'),
(6, 'Premium Package', 6000000, '5-8 minutes cinematic video + behind the scenes'),

(7, 'Basic Package', 100000, '10 product photos'),
(7, 'Standard Package', 250000, '25 product photos + lifestyle shots'),
(7, 'Premium Package', 500000, '50 product photos + video content');

-- Generate time slots for Self Photo and Graduation Photography
-- For the next 30 days
DELIMITER //
CREATE OR REPLACE PROCEDURE GenerateTimeSlots()  
BEGIN  
    DECLARE date_counter DATE DEFAULT CURDATE();  
    DECLARE end_date DATE DEFAULT DATE_ADD(CURDATE(), INTERVAL 30 DAY);  

    WHILE date_counter <= end_date DO  
        -- Service 1
        INSERT INTO time_slots (service_id, date, start_time, end_time) VALUES  
        (1, date_counter, '09:00:00', '10:00:00'),  
        (1, date_counter, '10:00:00', '11:00:00'),  
        (1, date_counter, '11:00:00', '12:00:00'),  
        (1, date_counter, '13:00:00', '14:00:00'),  
        (1, date_counter, '14:00:00', '15:00:00'),  
        (1, date_counter, '15:00:00', '16:00:00'),  
        (1, date_counter, '16:00:00', '17:00:00');  
        
        -- Service 2
        INSERT INTO time_slots (service_id, date, start_time, end_time) VALUES  
        (2, date_counter, '09:00:00', '11:00:00'),  
        (2, date_counter, '11:00:00', '13:00:00'),  
        (2, date_counter, '14:00:00', '16:00:00'),  
        (2, date_counter, '16:00:00', '18:00:00');  
        
        SET date_counter = DATE_ADD(date_counter, INTERVAL 1 DAY);  
    END WHILE;  
END //
DELIMITER ;

CALL GenerateTimeSlots();
DROP PROCEDURE GenerateTimeSlots;

INSERT INTO admins (username, password) VALUES 
('admin', '$2a$10$5vJn0r6W6fHmcMxvVYeGXuXsHYH5DxDmxHTpH9ZzBBmz.FtYCCLS6');

-- Tambah kolom max_capacity ke time_slots
ALTER TABLE time_slots 
ADD COLUMN max_capacity INT DEFAULT 1 AFTER end_time;

-- Buat tabel junction
CREATE TABLE time_slot_bookings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  time_slot_id INT NOT NULL,
  booking_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (time_slot_id) REFERENCES time_slots(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  UNIQUE KEY unique_booking_slot (time_slot_id, booking_id)
);

-- Set capacity untuk existing slots
UPDATE time_slots SET max_capacity = 3 WHERE service_id = 1; -- Self Photo
UPDATE time_slots SET max_capacity = 2 WHERE service_id = 2; -- Graduation

-- Add payment_method and selected_bank columns to bookings table
ALTER TABLE bookings 
ADD COLUMN payment_method ENUM('qris', 'transfer', 'cash') DEFAULT 'transfer' AFTER payment_type,
ADD COLUMN selected_bank VARCHAR(50) NULL AFTER payment_method;

-- Update existing records to have default payment_method
UPDATE bookings 
SET payment_method = 'transfer' 
WHERE payment_method IS NULL;




-- Run this migration in Railway MySQL console

-- Check if columns already exist before adding
SET @dbname = DATABASE();
SET @tablename = 'bookings';
SET @columnname1 = 'payment_method';
SET @columnname2 = 'selected_bank';

-- Add payment_method column if not exists
SET @preparedStatement = (
  SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = @dbname 
     AND TABLE_NAME = @tablename 
     AND COLUMN_NAME = @columnname1) > 0,
    'SELECT 1',
    CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN payment_method ENUM(''qris'', ''transfer'', ''cash'') DEFAULT ''transfer'' AFTER payment_type')
  )
);
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add selected_bank column if not exists
SET @preparedStatement = (
  SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = @dbname 
     AND TABLE_NAME = @tablename 
     AND COLUMN_NAME = @columnname2) > 0,
    'SELECT 1',
    CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN selected_bank VARCHAR(50) NULL AFTER payment_method')
  )
);
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Update existing records to have default payment_method
UPDATE bookings 
SET payment_method = 'transfer' 
WHERE payment_method IS NULL;

-- Create time_slot_bookings table if not exists
CREATE TABLE IF NOT EXISTS time_slot_bookings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  time_slot_id INT NOT NULL,
  booking_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (time_slot_id) REFERENCES time_slots(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  UNIQUE KEY unique_booking (time_slot_id, booking_id)
);

-- Update max_capacity in time_slots if column doesn't exist
SET @preparedStatement = (
  SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = @dbname 
     AND TABLE_NAME = 'time_slots' 
     AND COLUMN_NAME = 'max_capacity') > 0,
    'SELECT 1',
    'ALTER TABLE time_slots ADD COLUMN max_capacity INT DEFAULT 1 AFTER end_time'
  )
);
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;











-- Add display_code column to bookings table
ALTER TABLE bookings 
ADD COLUMN display_code VARCHAR(20) NULL AFTER booking_code;

-- Create index for display_code for faster searches
CREATE INDEX idx_display_code ON bookings(display_code);

-- Update existing bookings with THIRTY format
UPDATE bookings 
SET display_code = CONCAT('THIRTY', LPAD(id, 3, '0'))
WHERE display_code IS NULL;

-- Create trigger to auto-generate display_code for new bookings
DELIMITER //
CREATE TRIGGER generate_display_code 
BEFORE INSERT ON bookings
FOR EACH ROW
BEGIN
    -- Get the next AUTO_INCREMENT value
    DECLARE next_id INT;
    SELECT AUTO_INCREMENT INTO next_id
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'bookings';
    
    -- Set display_code
    SET NEW.display_code = CONCAT('THIRTY', LPAD(next_id, 3, '0'));
END//
DELIMITER ;

-- Note: If you want to reset the numbering system in the future, you can run:
-- UPDATE bookings SET display_code = CONCAT('THIRTY', LPAD(id, 3, '0'));







CREATE OR REPLACE VIEW customer_summary AS
SELECT 
  b.customer_name,
  b.phone_number,
  COUNT(DISTINCT b.id) as total_bookings,
  SUM(b.total_price) as total_spent,
  MIN(b.created_at) as first_booking,
  MAX(b.created_at) as last_booking,
  COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_bookings,
  COUNT(CASE WHEN b.status = 'pending' THEN 1 END) as pending_bookings,
  COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings,
  COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) as cancelled_bookings,
  GROUP_CONCAT(DISTINCT s.name SEPARATOR ', ') as used_services
FROM bookings b
JOIN services s ON b.service_id = s.id
GROUP BY b.customer_name, b.phone_number
ORDER BY total_spent DESC;

-- Optional: Tabel untuk customer notes/tags (jika diperlukan di masa depan)
CREATE TABLE IF NOT EXISTS customer_notes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_phone VARCHAR(20) NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  note TEXT,
  tag VARCHAR(50),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES admins(id),
  INDEX idx_customer_phone (customer_phone),
  INDEX idx_customer_name (customer_name)
);

-- Index untuk optimasi query customers
CREATE INDEX IF NOT EXISTS idx_bookings_customer_name ON bookings(customer_name);
CREATE INDEX IF NOT EXISTS idx_bookings_phone_number ON bookings(phone_number);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_combo ON bookings(customer_name, phone_number);


-- 1. Drop customer_summary view
DROP VIEW IF EXISTS customer_summary;

-- 2. Drop customer_notes table (jika ada)
DROP TABLE IF EXISTS customer_notes;

-- 3. Drop indexes yang dibuat untuk customers (jika ada)
DROP INDEX IF EXISTS idx_bookings_customer_name ON bookings;
DROP INDEX IF EXISTS idx_bookings_phone_number ON bookings;
DROP INDEX IF EXISTS idx_bookings_customer_combo ON bookings;
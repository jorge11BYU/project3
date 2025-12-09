-- SQL script that can be run in pgAdmin to create the structure for the database
-- I named my database "condo_project3" but you should be able to name it whatever you'd like

-- ====================================================
-- 1. DROP EVERYTHING (CLEAN SLATE)
-- This ensures you don't get errors if tables already exist
-- ====================================================
DROP TABLE IF EXISTS calendar_events CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS maintenance_requests CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ====================================================
-- 2. BUILD THE HOUSE (CREATE TABLES)
-- ====================================================

-- Users Table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, 
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone VARCHAR(20)
);

-- Properties Table
CREATE TABLE properties (
    property_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    street VARCHAR(100),
    city VARCHAR(50),
    state VARCHAR(50),
    zip VARCHAR(10),
    nickname VARCHAR(50),
    property_type VARCHAR(50)
);

-- Maintenance Table
CREATE TABLE maintenance_requests (
    request_id SERIAL PRIMARY KEY,
    property_id INT REFERENCES properties(property_id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending',
    date_reported DATE DEFAULT CURRENT_DATE,
    date_completed DATE
);

-- Expenses Table
CREATE TABLE expenses (
    expense_id SERIAL PRIMARY KEY,
    property_id INT REFERENCES properties(property_id) ON DELETE CASCADE,
    expense_category VARCHAR(50),
    amount DECIMAL(10, 2),
    expense_date DATE DEFAULT CURRENT_DATE,
    vendor VARCHAR(100)
);

-- Messages Table
CREATE TABLE messages (
    message_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    property_id INT REFERENCES properties(property_id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Calendar Table
CREATE TABLE calendar_events (
    event_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    property_id INT REFERENCES properties(property_id) ON DELETE SET NULL,
    event_title VARCHAR(100),
    start_time TIMESTAMP,
    end_time TIMESTAMP
);

-- ====================================================
-- 3. FURNISH THE HOUSE (INSERT DATA)
-- ====================================================

-- Users (Password is 'password')
INSERT INTO users (username, password_hash, first_name, last_name, phone) VALUES 
('ganderson', 'admin', 'Greg', 'Anderson', '801-555-0100'),
('bwood', 'password', 'Brandon', 'Wood', '801-555-0101'),
('sjorgensen', 'password', 'Spencer', 'Jorgensen', '801-555-0102'),
('jclarke', 'password', 'Josh', 'Clarke', '801-555-0103'),
('bcuartas', 'password', 'Broc', 'Cuartas', '801-555-0104'); 

-- Properties
INSERT INTO properties (user_id, nickname, street, city, state, zip, property_type) VALUES 
(1, 'Riverside Condo', '123 River Lane', 'Provo', 'UT', '84604', 'Condo'),
(1, 'Mountain View', '456 Alpine Dr', 'Orem', 'UT', '84057', 'Townhouse'),
(1, 'The Lofts #402', '789 Center St', 'Salt Lake City', 'UT', '84101', 'Apartment'),
(1, 'Sunset Studio', '321 West Ave', 'Lehi', 'UT', '84043', 'Studio');

-- Maintenance Requests
INSERT INTO maintenance_requests (property_id, description, status, date_reported, date_completed) VALUES 
(1, 'Leaky faucet in the master bath', 'Pending', CURRENT_DATE - 2, NULL),
(2, 'Garage door opener keypad not working', 'Pending', CURRENT_DATE - 5, NULL),
(3, 'HVAC making loud banging noise', 'Completed', '2023-11-01', '2023-11-03'),
(1, 'Replace hallway smoke detector battery', 'Completed', '2023-11-10', '2023-11-10'),
(4, 'Window screen torn', 'Pending', CURRENT_DATE - 10, NULL);

-- Expenses
INSERT INTO expenses (property_id, expense_category, amount, expense_date, vendor) VALUES 
(1, 'Utilities', 120.50, CURRENT_DATE - 2, 'Provo Water & Power'),
(2, 'Insurance', 850.00, CURRENT_DATE - 15, 'State Farm'),
(1, 'Repairs', 45.00, '2023-11-10', 'Home Depot'),
(3, 'Management', 200.00, CURRENT_DATE - 5, 'HOA Fees'),
(2, 'Repairs', 1200.00, '2023-10-25', 'Garage Door Pros'),
(4, 'Utilities', 89.99, CURRENT_DATE - 1, 'Rocky Mtn Power');

-- Messages
INSERT INTO messages (user_id, message, created_time) VALUES 
(1, 'Welcome to the new tenant portal! Let me know if you have issues.', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(2, 'Has anyone else noticed the recycling bin is full early this week?', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(3, 'Just a heads up, I am having furniture delivered on Tuesday morning.', CURRENT_TIMESTAMP - INTERVAL '2 hours');

-- Calendar Events
INSERT INTO calendar_events (user_id, property_id, event_title, start_time, end_time) VALUES 
(1, NULL, 'Annual HOA Meeting', CURRENT_TIMESTAMP + INTERVAL '2 days', CURRENT_TIMESTAMP + INTERVAL '2 days 2 hours'),
(1, 1, 'Plumbing Inspection - Riverside', CURRENT_TIMESTAMP + INTERVAL '5 days', CURRENT_TIMESTAMP + INTERVAL '5 days 1 hour'),
(1, NULL, 'Trash Pickup Holiday Schedule', CURRENT_TIMESTAMP + INTERVAL '10 days', CURRENT_TIMESTAMP + INTERVAL '10 days 12 hours'),
(1, 2, 'Garage Repair Appointment', '2023-10-25 10:00:00', '2023-10-25 12:00:00');
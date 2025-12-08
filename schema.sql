-- SQL script that can be run in pgAdmin to create the structure for the database
-- I named my database "condo_project3" but you should be able to name it whatever you'd like

-- 1. Create Users Table First (Referenced by others)
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Storing plain text for this assignment as per your index.js
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone VARCHAR(20)
);

-- 2. Create Properties Table (Links to Users)
CREATE TABLE properties (
    property_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE, -- Owner of the property
    street VARCHAR(100),
    city VARCHAR(50),
    state VARCHAR(50),
    zip VARCHAR(10),
    nickname VARCHAR(50), -- e.g. "Downtown Condo"
    property_type VARCHAR(50)
);

-- 3. Create Maintenance Requests (Links to Properties)
CREATE TABLE maintenance_requests (
    request_id SERIAL PRIMARY KEY,
    property_id INT REFERENCES properties(property_id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending', -- Pending, Completed
    date_reported DATE DEFAULT CURRENT_DATE,
    date_completed DATE
);

-- 4. Create Expenses (Links to Properties)
CREATE TABLE expenses (
    expense_id SERIAL PRIMARY KEY,
    property_id INT REFERENCES properties(property_id) ON DELETE CASCADE,
    expense_category VARCHAR(50), -- Utilities, Repairs, etc.
    amount DECIMAL(10, 2),
    expense_date DATE DEFAULT CURRENT_DATE,
    vendor VARCHAR(100)
);

-- 5. Create Messages (Links to Users and Properties)
CREATE TABLE messages (
    message_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    property_id INT REFERENCES properties(property_id) ON DELETE SET NULL, -- Optional if message is general
    message TEXT NOT NULL,
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create Calendar Events (Links to Users and Properties)
CREATE TABLE calendar_events (
    event_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    property_id INT REFERENCES properties(property_id) ON DELETE SET NULL,
    event_title VARCHAR(100),
    start_time TIMESTAMP,
    end_time TIMESTAMP
);

-- =============================================
-- OPTIONAL: SEED DATA (Run this to be able to login)
-- =============================================

-- Create a Test User (Password is 'password')
INSERT INTO users (username, password_hash, first_name, last_name, phone)
VALUES ('admin', 'password', 'Test', 'User', '555-0199');

-- Create a Test Property for that user
INSERT INTO properties (user_id, street, city, state, zip, nickname, property_type)
VALUES (1, '123 Main St', 'Provo', 'UT', '84604', 'Riverside Condo', 'Condo');

-- Create a Test Maintenance Request
INSERT INTO maintenance_requests (property_id, description, status, date_reported)
VALUES (1, 'Leaky faucet in kitchen', 'Pending', '2023-10-01');
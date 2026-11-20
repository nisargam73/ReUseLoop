-- ReUseLoop MySQL database schema
-- Run this script once in MySQL Workbench or the MySQL command line.

CREATE DATABASE IF NOT EXISTS reuseloop_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE reuseloop_db;

CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL,
  city VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS items (
  item_id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  category_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  item_condition ENUM('New', 'Like New', 'Good', 'Fair') NOT NULL DEFAULT 'Good',
  listing_type ENUM('Sale', 'Exchange', 'Donation') NOT NULL,
  price DECIMAL(10,2) DEFAULT NULL,
  city VARCHAR(100) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'Available',
  image_url VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_items_user FOREIGN KEY (owner_id)
    REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_items_category FOREIGN KEY (category_id)
    REFERENCES categories(category_id) ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_items_status_created (status, created_at),
  INDEX idx_items_category (category_id),
  INDEX idx_items_listing_type (listing_type)
) ENGINE=InnoDB;

-- Demo owner used by the current Add Item form (owner_id = 1).
INSERT INTO users (user_id, full_name, email, city)
VALUES (1, 'ReUseLoop Demo User', 'demo@reuseloop.local', 'Mysuru')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

INSERT IGNORE INTO categories (category_id, category_name) VALUES
  (1, 'Electronics'),
  (2, 'Books'),
  (3, 'Clothing'),
  (4, 'Furniture'),
  (5, 'Home Appliances'),
  (6, 'Sports'),
  (7, 'Other');

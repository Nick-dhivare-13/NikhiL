CREATE DATABASE IF NOT EXISTS solarsphere CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE solarsphere;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  phone VARCHAR(10) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(140) NOT NULL,
  description TEXT NOT NULL,
  is_fictional BOOLEAN NOT NULL DEFAULT TRUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS packages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  name VARCHAR(140) NOT NULL,
  capacity_kw DECIMAL(6,2) NOT NULL,
  price_inr DECIMAL(12,2) NOT NULL,
  warranty_years INT NOT NULL DEFAULT 5,
  subsidy_inr DECIMAL(12,2) NOT NULL DEFAULT 0,
  subsidy_note VARCHAR(255) NOT NULL DEFAULT 'Fictional classroom example; not an actual government subsidy.',
  details TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_packages_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS app_settings (
  id TINYINT PRIMARY KEY DEFAULT 1,
  system_price_inr DECIMAL(12,2) NOT NULL DEFAULT 187500,
  down_payment_inr DECIMAL(12,2) NOT NULL DEFAULT 37500,
  annual_interest_percent DECIMAL(5,2) NOT NULL DEFAULT 9.5,
  default_loan_years INT NOT NULL DEFAULT 5,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_single_settings CHECK (id = 1)
);

CREATE TABLE IF NOT EXISTS enquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reference_code VARCHAR(24) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  package_id INT NOT NULL,
  company_name_snapshot VARCHAR(140) NOT NULL,
  package_name_snapshot VARCHAR(140) NOT NULL,
  price_snapshot DECIMAL(12,2) NOT NULL,
  monthly_bill DECIMAL(12,2) NOT NULL,
  roof_area_sqft DECIMAL(10,2) NOT NULL,
  pincode CHAR(6) NOT NULL,
  address VARCHAR(500) NOT NULL,
  status ENUM('Received','Reviewing','Site visit planned','Estimate prepared','Closed') NOT NULL DEFAULT 'Received',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_enquiries_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_enquiries_package FOREIGN KEY (package_id) REFERENCES packages(id)
);

CREATE TABLE IF NOT EXISTS enquiry_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  enquiry_id INT NOT NULL,
  status VARCHAR(40) NOT NULL,
  note VARCHAR(255) NOT NULL DEFAULT '',
  changed_by INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_history_enquiry FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE CASCADE,
  CONSTRAINT fk_history_admin FOREIGN KEY (changed_by) REFERENCES users(id)
);

INSERT IGNORE INTO app_settings (id) VALUES (1);
INSERT INTO companies (id,name,description,is_fictional,active) VALUES
 (1,'Sunrise Demo Energy','Fictional Jalgaon installer profile created for the college prototype.',TRUE,TRUE),
 (2,'BrightRoof Sample Solar','Fictional comparison provider for classroom demonstrations.',TRUE,TRUE)
 ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO packages (id,company_id,name,capacity_kw,price_inr,warranty_years,subsidy_inr,subsidy_note,details,active) VALUES
 (1,1,'Home Start',2,135000,5,15000,'Illustrative sample only. Not an official or claimable subsidy.','Grid-tied sample package with monitoring.',TRUE),
 (2,1,'Family Plus',3,190000,5,20000,'Illustrative sample only. Not an official or claimable subsidy.','Fictional mid-size package for a home.',TRUE),
 (3,2,'Roof Saver',3,205000,8,10000,'Illustrative sample only. Not an official or claimable subsidy.','Fictional package with an example extended warranty.',TRUE),
 (4,2,'Power Max',5,305000,8,25000,'Illustrative sample only. Not an official or claimable subsidy.','Fictional larger system for comparison.',TRUE)
 ON DUPLICATE KEY UPDATE name=VALUES(name);

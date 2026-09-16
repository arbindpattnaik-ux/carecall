CREATE DATABASE IF NOT EXISTS carecall CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE carecall;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(80) PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'teacher') NOT NULL,
  assigned_groups JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS groups_table (
  id VARCHAR(80) PRIMARY KEY,
  class_name VARCHAR(100) NOT NULL,
  section_name VARCHAR(50) NOT NULL,
  group_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_group (class_name, section_name, group_name)
);

CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(80) PRIMARY KEY,
  sno VARCHAR(30),
  student_name VARCHAR(150) NOT NULL,
  father_name VARCHAR(150) NOT NULL,
  father_mobile VARCHAR(40) NOT NULL,
  mother_name VARCHAR(150),
  mother_mobile VARCHAR(40),
  guardian_name VARCHAR(150),
  guardian_mobile VARCHAR(40),
  email VARCHAR(200),
  city_of_residence VARCHAR(120),
  class_name VARCHAR(100) NOT NULL,
  section_name VARCHAR(50) NOT NULL,
  group_name VARCHAR(100) NOT NULL,
  group_id VARCHAR(80) NOT NULL,
  teacher_ids JSON,
  parent_name VARCHAR(150),
  parent_mobile VARCHAR(40),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_students_group (group_id)
);

CREATE TABLE IF NOT EXISTS call_logs (
  id VARCHAR(80) PRIMARY KEY,
  class_name VARCHAR(100) NOT NULL,
  section_name VARCHAR(50) NOT NULL,
  student_name VARCHAR(150) NOT NULL,
  parent_name VARCHAR(150),
  call_summary TEXT NOT NULL,
  teacher_username VARCHAR(100) NOT NULL,
  teacher_name VARCHAR(150) NOT NULL,
  created_at DATETIME NOT NULL
);

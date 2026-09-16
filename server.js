require('dotenv').config();
const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');

const app = express();
const port = Number(process.env.PORT || 8000);
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'carecall',
  multipleStatements: true,
  waitForConnections: true,
  connectionLimit: 10
});

app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

const parseJson = value => {
  if (Array.isArray(value)) return value;
  try { return JSON.parse(value || '[]'); } catch { return []; }
};

async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(80) PRIMARY KEY, full_name VARCHAR(150) NOT NULL,
      username VARCHAR(100) NOT NULL UNIQUE, password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'teacher') NOT NULL, assigned_groups JSON NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS groups_table (
      id VARCHAR(80) PRIMARY KEY, class_name VARCHAR(100) NOT NULL,
      section_name VARCHAR(50) NOT NULL, group_name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_group (class_name, section_name, group_name)
    );
    CREATE TABLE IF NOT EXISTS students (
      id VARCHAR(80) PRIMARY KEY, sno VARCHAR(30), student_name VARCHAR(150) NOT NULL,
      father_name VARCHAR(150) NOT NULL, father_mobile VARCHAR(40) NOT NULL,
      mother_name VARCHAR(150), mother_mobile VARCHAR(40), guardian_name VARCHAR(150),
      guardian_mobile VARCHAR(40), email VARCHAR(200), city_of_residence VARCHAR(120),
      class_name VARCHAR(100) NOT NULL, section_name VARCHAR(50) NOT NULL,
      group_name VARCHAR(100) NOT NULL, group_id VARCHAR(80) NOT NULL,
      teacher_ids JSON, parent_name VARCHAR(150), parent_mobile VARCHAR(40),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_students_group (group_id)
    );
    CREATE TABLE IF NOT EXISTS call_logs (
      id VARCHAR(80) PRIMARY KEY, class_name VARCHAR(100) NOT NULL,
      section_name VARCHAR(50) NOT NULL, student_name VARCHAR(150) NOT NULL,
      parent_name VARCHAR(150), call_summary TEXT NOT NULL,
      teacher_username VARCHAR(100) NOT NULL, teacher_name VARCHAR(150) NOT NULL,
      created_at DATETIME NOT NULL
    );
  `);
}

app.get('/api/health', async (req, res) => {
  try { await pool.query('SELECT 1'); res.json({ ok: true, database: process.env.DB_NAME || 'carecall' }); }
  catch (error) { res.status(503).json({ ok: false, error: error.message }); }
});

app.get('/api/bootstrap', async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, full_name AS fullName, username, password, role, assigned_groups AS assignedGroups FROM users ORDER BY created_at');
    const [groups] = await pool.query('SELECT id, class_name AS className, section_name AS sectionName, group_name AS groupName FROM groups_table ORDER BY class_name, section_name, group_name');
    const [students] = await pool.query('SELECT id, sno, student_name AS studentName, father_name AS fatherName, father_mobile AS fatherMobile, mother_name AS motherName, mother_mobile AS motherMobile, guardian_name AS guardianName, guardian_mobile AS guardianMobile, email, city_of_residence AS cityOfResidence, class_name AS className, section_name AS sectionName, group_name AS groupName, group_id AS groupId, teacher_ids AS teacherIds, parent_name AS parentName, parent_mobile AS parentMobile FROM students');
    const [callLogs] = await pool.query('SELECT id, class_name AS className, section_name AS sectionName, student_name AS studentName, parent_name AS parentName, call_summary AS callSummary, teacher_username AS teacherUsername, teacher_name AS teacherName, created_at AS createdAt FROM call_logs ORDER BY created_at DESC');
    res.json({ users: users.map(row => ({ ...row, assignedGroups: parseJson(row.assignedGroups) })), groups, students: students.map(row => ({ ...row, teacherIds: parseJson(row.teacherIds) })), callLogs });
  } catch (error) { res.status(503).json({ error: error.message }); }
});

app.put('/api/snapshot', async (req, res) => {
  const { users = [], groups = [], students = [], callLogs = [] } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('DELETE FROM call_logs');
    await connection.query('DELETE FROM students');
    await connection.query('DELETE FROM groups_table');
    await connection.query('DELETE FROM users');
    for (const user of users) await connection.query('INSERT INTO users (id, full_name, username, password, role, assigned_groups) VALUES (?, ?, ?, ?, ?, ?)', [user.id, user.fullName, user.username, user.password, user.role, JSON.stringify(user.assignedGroups || [])]);
    for (const group of groups) await connection.query('INSERT INTO groups_table (id, class_name, section_name, group_name) VALUES (?, ?, ?, ?)', [group.id, group.className, group.sectionName, group.groupName]);
    for (const student of students) await connection.query('INSERT INTO students (id, sno, student_name, father_name, father_mobile, mother_name, mother_mobile, guardian_name, guardian_mobile, email, city_of_residence, class_name, section_name, group_name, group_id, teacher_ids, parent_name, parent_mobile) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [student.id, student.sno || '', student.studentName, student.fatherName || '', student.fatherMobile || '', student.motherName || '', student.motherMobile || '', student.guardianName || '', student.guardianMobile || '', student.email || '', student.cityOfResidence || '', student.className, student.sectionName, student.groupName, student.groupId, JSON.stringify(student.teacherIds || []), student.parentName || '', student.parentMobile || '']);
    for (const log of callLogs) await connection.query('INSERT INTO call_logs (id, class_name, section_name, student_name, parent_name, call_summary, teacher_username, teacher_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [log.id, log.className, log.sectionName, log.studentName, log.parentName || '', log.callSummary, log.teacherUsername, log.teacherName, new Date(log.createdAt)]);
    await connection.commit();
    res.json({ ok: true });
  } catch (error) { await connection.rollback(); res.status(400).json({ error: error.message }); }
  finally { connection.release(); }
});

app.listen(port, async () => {
  try { await initDatabase(); console.log(`CareCall running at http://localhost:${port}`); }
  catch (error) { console.error(`MySQL is unavailable: ${error.message}`); console.log(`CareCall is available at http://localhost:${port}, but database writes are disabled.`); }
});

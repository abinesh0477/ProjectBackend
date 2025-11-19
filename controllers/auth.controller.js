// auth.controller.js
import { pool } from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Updated query to include employee data
    const [rows] = await pool.query(`
      SELECT 
        u.id, u.username, u.email, u.password, u.role,
        e.emp_id, e.designation, e.join_date,
        d.dept_id, d.name as department_name
      FROM users u
      LEFT JOIN employees e ON u.id = e.user_id
      LEFT JOIN departments d ON e.department_id = d.dept_id
      WHERE u.email = ?
    `, [email]);

    if (!rows.length) {
      console.log("Incoming email:", email);
      console.log("Query result:", rows);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = rows[0];

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login success",
      token,
      user: {
        id: user.id,
        emp_id: user.emp_id, // Now includes emp_id
        email: user.email,
        username: user.username,
        role: user.role,
        designation: user.designation,
        department_name: user.department_name,
        join_date: user.join_date
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const register = async (req, res) => {
  try {
    const { username, email, password, role, designation, department_id } = req.body;

    // Check if email exists
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert into users table
      const [userResult] = await connection.query(
        `INSERT INTO users (username, email, password, role, is_active)
         VALUES (?, ?, ?, ?, 1)`,
        [username, email, hashedPassword, role || "EMPLOYEE"]
      );

      const userId = userResult.insertId;

      // If it's an employee, also insert into employees table
      if (role === "EMPLOYEE" || !role) {
        await connection.query(
          `INSERT INTO employees (user_id, designation, department_id, join_date)
           VALUES (?, ?, ?, CURDATE())`,
          [userId, designation || 'Employee', department_id || null]
        );
      }

      await connection.commit();
      return res.status(201).json({ message: "Registration successful!" });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await pool.execute(`
      SELECT 
        u.id, u.username, u.email, u.phone, u.role, u.created_at,
        e.emp_id, e.designation, e.join_date,
        d.dept_id, d.name as department_name
      FROM users u
      LEFT JOIN employees e ON u.id = e.user_id
      LEFT JOIN departments d ON e.department_id = d.dept_id
      WHERE u.id = ?
    `, [userId]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: users[0]
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
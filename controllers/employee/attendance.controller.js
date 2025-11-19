// controllers/employee/attendance.controller.js
import { pool } from "../../config/db.js";

export const attendanceController = {
  // 📅 Attendance Records
  getAttendance: async (req, res) => {
    try {
      const empId = req.user.emp_id;
      const { month, year } = req.query;
      const targetMonth = month || new Date().getMonth() + 1;
      const targetYear = year || new Date().getFullYear();

      const [records] = await pool.query(`
        SELECT attendance_id, date, check_in, check_out, status
        FROM attendance
        WHERE emp_id = ? 
          AND MONTH(date) = ? 
          AND YEAR(date) = ?
        ORDER BY date DESC
      `, [empId, targetMonth, targetYear]);

      const today = new Date().toISOString().split('T')[0];
      const [todayRecord] = await pool.query(`
        SELECT * FROM attendance 
        WHERE emp_id = ? AND date = ?
      `, [empId, today]);

      res.json({
        success: true,
        records,
        today: todayRecord[0] || null
      });
    } catch (error) {
      console.error("Attendance error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  // 🕒 Check-in
  checkIn: async (req, res) => {
    try {
      const empId = req.user.emp_id;
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();

      const [exists] = await pool.query(
        "SELECT * FROM attendance WHERE emp_id = ? AND date = ?",
        [empId, today]
      );

      if (exists.length > 0) {
        return res.status(400).json({ success: false, message: "Already checked in today" });
      }

      const checkInMinutes = now.getHours() * 60 + now.getMinutes();
      const lateThreshold = 9 * 60 + 30; // 9:30 AM
      const status = checkInMinutes > lateThreshold ? "LATE" : "PRESENT";

      const [result] = await pool.query(`
        INSERT INTO attendance (emp_id, date, check_in, status)
        VALUES (?, ?, ?, ?)
      `, [empId, today, now, status]);

      const [record] = await pool.query("SELECT * FROM attendance WHERE attendance_id = ?", [result.insertId]);

      res.status(201).json({
        success: true,
        message: "Checked in successfully",
        record: record[0]
      });
    } catch (error) {
      console.error("Check-in error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  // ⏰ Check-out
  checkOut: async (req, res) => {
    try {
      const empId = req.user.emp_id;
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();

      const [attendance] = await pool.query(`
        SELECT * FROM attendance 
        WHERE emp_id = ? AND date = ? AND check_out IS NULL
      `, [empId, today]);

      if (attendance.length === 0) {
        return res.status(400).json({ success: false, message: "No active check-in found today" });
      }

      const attendanceId = attendance[0].attendance_id;

      await pool.query(`
        UPDATE attendance 
        SET check_out = ? 
        WHERE attendance_id = ?
      `, [now, attendanceId]);

      const [record] = await pool.query("SELECT * FROM attendance WHERE attendance_id = ?", [attendanceId]);

      res.json({ success: true, message: "Checked out successfully", record: record[0] });
    } catch (error) {
      console.error("Check-out error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
};

export default attendanceController;
// controllers/employee/leaves.controller.js
import { pool } from "../../config/db.js";

export const leavesController = {
  // 🌿 Get Leaves
  getLeaves: async (req, res) => {
    try {
      const empId = req.user.emp_id;
      if (!empId) {
        return res.status(400).json({ success: false, message: "Employee ID missing in token" });
      }

      const [leaves] = await pool.query(`
        SELECT leave_id, start_date, end_date, type, status
        FROM leaves
        WHERE emp_id = ?
        ORDER BY start_date DESC
      `, [empId]);

      res.json({ success: true, leaves });
    } catch (error) {
      console.error("Get leaves error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  // ✍️ Apply Leave
  applyLeave: async (req, res) => {
    try {
      const empId = req.user.emp_id;
      const { start_date, end_date, type, reason } = req.body;

      console.log("📨 Leave request received from frontend:", req.body);
      console.log("👤 Employee ID:", empId);

      if (!empId) {
        return res.status(400).json({
          success: false,
          message: "Employee ID missing from token — please log in again."
        });
      }

      const [result] = await pool.query(`
        INSERT INTO leaves (emp_id, start_date, end_date, type, status)
        VALUES (?, ?, ?, ?, 'PENDING')
      `, [empId, start_date, end_date, type]);

      const [newLeave] = await pool.query(
        "SELECT * FROM leaves WHERE leave_id = ?",
        [result.insertId]
      );

      console.log("✅ Leave inserted successfully:", newLeave[0]);

      res.status(201).json({
        success: true,
        message: "Leave application submitted successfully",
        leave: newLeave[0]
      });
    } catch (error) {
      console.error("❌ Apply leave error:", error);
      res.status(500).json({
        success: false,
        message: "Server error"
      });
    }
  }
};

export default leavesController;
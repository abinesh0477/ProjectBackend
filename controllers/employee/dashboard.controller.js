// controllers/employee/dashboard.controller.js
import { pool } from "../../config/db.js";

export const dashboardController = {
  // 🧭 Dashboard Summary
  getDashboard: async (req, res) => {
    try {
      const empId = req.user.emp_id;

      // Attendance summary for current month
      const [attendanceSummary] = await pool.query(`
        SELECT 
          SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) AS present_days,
          SUM(CASE WHEN status = 'LATE' THEN 1 ELSE 0 END) AS late_days,
          SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) AS absent_days
        FROM attendance
        WHERE emp_id = ? 
          AND MONTH(date) = MONTH(CURDATE())
          AND YEAR(date) = YEAR(CURDATE())
      `, [empId]);

      // Leaves data
      const [leaveStats] = await pool.query(`
        SELECT 
          COUNT(*) AS total_leaves,
          SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) AS used_leaves
        FROM leaves
        WHERE emp_id = ?
      `, [empId]);

      // Active projects assigned
      const [projects] = await pool.query(`
        SELECT COUNT(*) AS active_projects 
        FROM project_assignment pa
        JOIN projects p ON pa.project_id = p.project_id
        WHERE pa.emp_id = ?
          AND (p.end_date IS NULL OR p.end_date >= CURDATE())
      `, [empId]);

      res.json({
        success: true,
        stats: {
          present_days: attendanceSummary[0]?.present_days || 0,
          late_days: attendanceSummary[0]?.late_days || 0,
          absent_days: attendanceSummary[0]?.absent_days || 0,
          total_leaves: leaveStats[0]?.total_leaves || 0,
          used_leaves: leaveStats[0]?.used_leaves || 0,
          active_projects: projects[0]?.active_projects || 0
        }
      });
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
};

export default dashboardController;
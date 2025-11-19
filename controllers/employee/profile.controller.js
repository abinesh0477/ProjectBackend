// controllers/employee/profile.controller.js
import { pool } from "../../config/db.js";

export const profileController = {
  // 👤 Get Profile
  getProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const [rows] = await pool.execute(
        `
        SELECT 
          u.id, u.username, u.email, u.phone, u.role, u.is_active, u.created_at,
          e.emp_id, e.designation, e.join_date, e.salary_id,
          d.name AS department_name
        FROM users u
        LEFT JOIN employees e ON u.id = e.user_id
        LEFT JOIN departments d ON e.department_id = d.dept_id
        WHERE u.id = ?
        `,
        [userId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: "Employee profile not found" });
      }

      res.json({ success: true, user: rows[0] });
    } catch (error) {
      console.error("Error fetching employee profile:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  // 📝 Update Profile
  updateProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const empId = req.user.emp_id;

      const { phone, designation } = req.body;

      // Update basic user info
      await pool.execute(`UPDATE users SET phone = ? WHERE id = ?`, [phone, userId]);

      // Update employee-specific info
      if (designation) {
        await pool.execute(`UPDATE employees SET designation = ? WHERE emp_id = ?`, [designation, empId]);
      }

      res.json({ success: true, message: "Profile updated successfully" });
    } catch (error) {
      console.error("Error updating employee profile:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
};

export default profileController;
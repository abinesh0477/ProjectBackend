// // controllers/employee.controller.js
// import { pool } from "../../config/db.js";

// export const employeeController = {
//   // 🧭 Dashboard Summary
//   getDashboard: async (req, res) => {
//     try {
//       const empId = req.user.emp_id;

//       // Attendance summary for current month
//       const [attendanceSummary] = await pool.query(`
//         SELECT 
//           SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) AS present_days,
//           SUM(CASE WHEN status = 'LATE' THEN 1 ELSE 0 END) AS late_days,
//           SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) AS absent_days
//         FROM attendance
//         WHERE emp_id = ? 
//           AND MONTH(date) = MONTH(CURDATE())
//           AND YEAR(date) = YEAR(CURDATE())
//       `, [empId]);

//       // Leaves data
//       const [leaveStats] = await pool.query(`
//         SELECT 
//           COUNT(*) AS total_leaves,
//           SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) AS used_leaves
//         FROM leaves
//         WHERE emp_id = ?
//       `, [empId]);

//       // Active projects assigned
//       const [projects] = await pool.query(`
//         SELECT COUNT(*) AS active_projects 
//         FROM project_assignment pa
//         JOIN projects p ON pa.project_id = p.project_id
//         WHERE pa.emp_id = ?
//           AND (p.end_date IS NULL OR p.end_date >= CURDATE())
//       `, [empId]);

//       res.json({
//         success: true,
//         stats: {
//           present_days: attendanceSummary[0]?.present_days || 0,
//           late_days: attendanceSummary[0]?.late_days || 0,
//           absent_days: attendanceSummary[0]?.absent_days || 0,
//           total_leaves: leaveStats[0]?.total_leaves || 0,
//           used_leaves: leaveStats[0]?.used_leaves || 0,
//           active_projects: projects[0]?.active_projects || 0
//         }
//       });
//     } catch (error) {
//       console.error("Dashboard error:", error);
//       res.status(500).json({ success: false, message: "Server error" });
//     }
//   },

//   // 📅 Attendance Records
//   getAttendance: async (req, res) => {
//     try {
//       const empId = req.user.emp_id;
//       const { month, year } = req.query;
//       const targetMonth = month || new Date().getMonth() + 1;
//       const targetYear = year || new Date().getFullYear();

//       const [records] = await pool.query(`
//         SELECT attendance_id, date, check_in, check_out, status
//         FROM attendance
//         WHERE emp_id = ? 
//           AND MONTH(date) = ? 
//           AND YEAR(date) = ?
//         ORDER BY date DESC
//       `, [empId, targetMonth, targetYear]);

//       const today = new Date().toISOString().split('T')[0];
//       const [todayRecord] = await pool.query(`
//         SELECT * FROM attendance 
//         WHERE emp_id = ? AND date = ?
//       `, [empId, today]);

//       res.json({
//         success: true,
//         records,
//         today: todayRecord[0] || null
//       });
//     } catch (error) {
//       console.error("Attendance error:", error);
//       res.status(500).json({ success: false, message: "Server error" });
//     }
//   },

//   // 🕒 Check-in
//   checkIn: async (req, res) => {
//     try {
//       const empId = req.user.emp_id;
//       const today = new Date().toISOString().split('T')[0];
//       const now = new Date();

//       const [exists] = await pool.query(
//         "SELECT * FROM attendance WHERE emp_id = ? AND date = ?",
//         [empId, today]
//       );

//       if (exists.length > 0) {
//         return res.status(400).json({ success: false, message: "Already checked in today" });
//       }

//       const checkInMinutes = now.getHours() * 60 + now.getMinutes();
//       const lateThreshold = 9 * 60 + 30; // 9:30 AM
//       const status = checkInMinutes > lateThreshold ? "LATE" : "PRESENT";

//       const [result] = await pool.query(`
//         INSERT INTO attendance (emp_id, date, check_in, status)
//         VALUES (?, ?, ?, ?)
//       `, [empId, today, now, status]);

//       const [record] = await pool.query("SELECT * FROM attendance WHERE attendance_id = ?", [result.insertId]);

//       res.status(201).json({
//         success: true,
//         message: "Checked in successfully",
//         record: record[0]
//       });
//     } catch (error) {
//       console.error("Check-in error:", error);
//       res.status(500).json({ success: false, message: "Server error" });
//     }
//   },

//   // ⏰ Check-out
//   checkOut: async (req, res) => {
//     try {
//       const empId = req.user.emp_id;
//       const today = new Date().toISOString().split('T')[0];
//       const now = new Date();

//       const [attendance] = await pool.query(`
//         SELECT * FROM attendance 
//         WHERE emp_id = ? AND date = ? AND check_out IS NULL
//       `, [empId, today]);

//       if (attendance.length === 0) {
//         return res.status(400).json({ success: false, message: "No active check-in found today" });
//       }

//       const attendanceId = attendance[0].attendance_id;

//       await pool.query(`
//         UPDATE attendance 
//         SET check_out = ? 
//         WHERE attendance_id = ?
//       `, [now, attendanceId]);

//       const [record] = await pool.query("SELECT * FROM attendance WHERE attendance_id = ?", [attendanceId]);

//       res.json({ success: true, message: "Checked out successfully", record: record[0] });
//     } catch (error) {
//       console.error("Check-out error:", error);
//       res.status(500).json({ success: false, message: "Server error" });
//     }
//   },

//   // 🌿 Get Leaves
//   getLeaves: async (req, res) => {
//     try {
//       const empId = req.user.emp_id;
//       if (!empId) {
//         return res.status(400).json({ success: false, message: "Employee ID missing in token" });
//       }

//       const [leaves] = await pool.query(`
//         SELECT leave_id, start_date, end_date, type, status
//         FROM leaves
//         WHERE emp_id = ?
//         ORDER BY start_date DESC
//       `, [empId]);

//       res.json({ success: true, leaves });
//     } catch (error) {
//       console.error("Get leaves error:", error);
//       res.status(500).json({ success: false, message: "Server error" });
//     }
//   },

//   // ✍️ Apply Leave
//   applyLeave: async (req, res) => {
//     try {
//       const empId = req.user.emp_id;
//       const { start_date, end_date, type, reason } = req.body;

//       console.log("📨 Leave request received from frontend:", req.body);
//       console.log("👤 Employee ID:", empId);

//       if (!empId) {
//         return res.status(400).json({
//           success: false,
//           message: "Employee ID missing from token — please log in again."
//         });
//       }

//       const [result] = await pool.query(`
//         INSERT INTO leaves (emp_id, start_date, end_date, type, status)
//         VALUES (?, ?, ?, ?, 'PENDING')
//       `, [empId, start_date, end_date, type]);

//       const [newLeave] = await pool.query(
//         "SELECT * FROM leaves WHERE leave_id = ?",
//         [result.insertId]
//       );

//       console.log("✅ Leave inserted successfully:", newLeave[0]);

//       res.status(201).json({
//         success: true,
//         message: "Leave application submitted successfully",
//         leave: newLeave[0]
//       });
//     } catch (error) {
//       console.error("❌ Apply leave error:", error);
//       res.status(500).json({
//         success: false,
//         message: "Server error"
//       });
//     }
//   },

// getProfile: async (req, res) => {
//     try {
//       const userId = req.user.id;
//       const [rows] = await pool.execute(
//         `
//         SELECT 
//           u.id, u.username, u.email, u.phone, u.role, u.is_active, u.created_at,
//           e.emp_id, e.designation, e.join_date, e.salary_id,
//           d.name AS department_name
//         FROM users u
//         LEFT JOIN employees e ON u.id = e.user_id
//         LEFT JOIN departments d ON e.department_id = d.dept_id
//         WHERE u.id = ?
//         `,
//         [userId]
//       );

//       if (rows.length === 0) {
//         return res.status(404).json({ success: false, message: "Employee profile not found" });
//       }

//       res.json({ success: true, user: rows[0] });
//     } catch (error) {
//       console.error("Error fetching employee profile:", error);
//       res.status(500).json({ success: false, message: "Server error" });
//     }
//   },

//   // PUT /employee/profile
//   updateProfile: async (req, res) => {
//     try {
//       const userId = req.user.id;
//       const empId = req.user.emp_id;

//       const { phone, designation } = req.body;

//       // Update basic user info
//       await pool.execute(`UPDATE users SET phone = ? WHERE id = ?`, [phone, userId]);

//       // Update employee-specific info
//       if (designation) {
//         await pool.execute(`UPDATE employees SET designation = ? WHERE emp_id = ?`, [designation, empId]);
//       }

//       res.json({ success: true, message: "Profile updated successfully" });
//     } catch (error) {
//       console.error("Error updating employee profile:", error);
//       res.status(500).json({ success: false, message: "Server error" });
//     }
//   },
// };

// export default employeeController;
// controllers/employee/project.controller.js
import { pool } from "../../config/db.js";

export const projectController = {
  
  // 📌 Get Projects Assigned to Employee
  getProjects: async (req, res) => {
    try {
      const { emp_id } = req.query;

      if (!emp_id) {
        return res.status(400).json({
          success: false,
          message: "Employee ID is required"
        });
      }

      const [rows] = await pool.query(`
        SELECT 
          pa.project_id,
          p.name,
          pa.assign_id
        FROM project_assignment pa
        JOIN projects p ON pa.project_id = p.project_id
        WHERE pa.emp_id = ?
      `, [emp_id]);

      // console.log('Query result rows:', rows); // Add this
   // console.log('Number of assignments found:', rows.length);
      res.json({ success: true, data: rows });
    } catch (err) {
      console.error("Error fetching projects:", err);
      res.status(500).json({
        success: false,
        message: "Failed to fetch projects",
        details: err.message
      });
    }
  },

  // ➕ Create Project Log
  createProjectLog: async (req, res) => {
    try {
      const {
        assign_id,
        log_date,
        start_time,
        end_time,
        total_hours,
        progress_status,
        task_description,
        emp_id
      } = req.body;

     // console.log("Received project log data:", req.body);

      if (!assign_id || !log_date || !start_time || !end_time || !progress_status || !emp_id) {
        return res.status(400).json({
          success: false,
          message: "Required: assign_id, log_date, start_time, end_time, progress_status, emp_id"
        });
      }

      const [result] = await pool.query(
        `INSERT INTO project_logs 
        (assign_id, log_date, start_time, end_time, total_hours, progress_status, task_description, emp_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          assign_id,
          log_date,
          start_time,
          end_time,
          total_hours || 0,
          progress_status,
          task_description || null,
          emp_id
        ]
      );

      res.json({
        success: true,
        message: "Project log created successfully",
        data: {
          log_id: result.insertId,
          assign_id,
          log_date,
          start_time,
          end_time,
          total_hours,
          progress_status,
          task_description,
          emp_id
        }
      });

    } catch (err) {
      console.error("Error creating project log:", err);

      if (err.code === "ER_NO_REFERENCED_ROW_2") {
        return res.status(400).json({
          success: false,
          message: "Invalid assignment ID or employee ID"
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to create project log",
        details: err.message
      });
    }
  },

  // 📅 Get All Project Logs (with optional date filter)
  getProjectLogs: async (req, res) => {
    try {
      const { emp_id, date } = req.query;

      if (!emp_id) {
        return res.status(400).json({
          success: false,
          message: "Employee ID is required"
        });
      }

      let query = `
        SELECT 
          pl.log_id,
          pl.assign_id,
          pl.log_date,
          pl.start_time,
          pl.end_time,
          pl.total_hours,
          pl.progress_status,
          pl.task_description,
          pl.emp_id
        FROM project_logs pl
        WHERE pl.emp_id = ?
      `;

      const queryParams = [emp_id];

      // optional date filter
      if (date) {
        query += ` AND DATE(CONVERT_TZ(pl.log_date, '+00:00', '+05:30')) = ?`;
        queryParams.push(date);
      }

      query += ` ORDER BY pl.log_date DESC, pl.start_time DESC`;

      const [rows] = await pool.query(query, queryParams);

      res.json({ success: true, data: rows });

    } catch (err) {
      console.error("Error fetching project logs:", err);
      res.status(500).json({
        success: false,
        message: "Failed to fetch project logs",
        details: err.message
      });
    }
  }

};

export default projectController;

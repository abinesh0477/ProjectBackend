// controllers/employee/requests.controller.js
import { pool } from "../../config/db.js";

export const requestsController = {
  // 📋 Get All Requests
  getAllRequests: async (req, res) => {
    try {
      const empId = req.user.emp_id;
      
      const [results] = await pool.query(`
        SELECT 
          ir.*
        FROM internal_requests ir
        WHERE ir.emp_id = ?
        ORDER BY ir.request_id DESC
      `, [empId]);
      
      res.json({ success: true, requests: results });
    } catch (err) {
      console.error('Error fetching requests:', err);
      res.status(500).json({ success: false, error: 'Failed to fetch requests', details: err.message });
    }
  },

  // ➕ Create New Request
  createRequest: async (req, res) => {
    try {
      const empId = req.user.emp_id;
      const { category, description } = req.body;

      console.log("createRequest called with body:", req.body);
      console.log("Employee ID:", empId);

      if (!category || !description) {
        return res.status(400).json({ 
          success: false,
          error: 'Missing required fields: category, description' 
        });
      }

      // Insert request
      const [result] = await pool.query(`
        INSERT INTO internal_requests (emp_id, category, description, status)
        VALUES (?, ?, ?, 'PENDING')
      `, [empId, category, description]);

      console.log("Request created successfully, ID:", result.insertId);

      res.status(201).json({
        success: true,
        message: 'Request created successfully',
        request_id: result.insertId
      });
    } catch (err) {
      console.error('Error creating request:', err);
      res.status(500).json({ 
        success: false,
        error: 'Failed to create request',
        details: err.message 
      });
    }
  },

  // 💬 Add Employee Feedback
  addEmployeeFeedback: async (req, res) => {
    try {
      const empId = req.user.emp_id;
      const { request_id, feedback_message, is_resolved } = req.body;

      console.log('addEmployeeFeedback called:', { request_id, empId });

      if (!request_id || !feedback_message) {
        return res.status(400).json({ 
          success: false,
          error: 'Missing required fields: request_id, feedback_message' 
        });
      }

      // Check if request belongs to this employee
      const [requestCheck] = await pool.query(
        'SELECT emp_id FROM internal_requests WHERE request_id = ?',
        [request_id]
      );

      if (!requestCheck.length) {
        return res.status(404).json({ success: false, error: 'Request not found' });
      }

      if (requestCheck[0].emp_id !== empId) {
        return res.status(403).json({ 
          success: false,
          error: 'Unauthorized: This request does not belong to you' 
        });
      }

      // Get current response
      const [current] = await pool.query(
        'SELECT response FROM internal_requests WHERE request_id = ?',
        [request_id]
      );

      // Append employee feedback to response
      const timestamp = new Date().toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short'
      });
      const currentResponse = current[0].response || '';
      const newResponse = currentResponse 
        ? `${currentResponse}\n\n[Employee Feedback - ${timestamp}]\n${feedback_message}`
        : `[Employee Feedback - ${timestamp}]\n${feedback_message}`;

      // Update response and status
      const newStatus = is_resolved ? 'RESOLVED' : 'IN_PROGRESS';

      await pool.query(`
        UPDATE internal_requests 
        SET response = ?, status = ?
        WHERE request_id = ?
      `, [newResponse, newStatus, request_id]);

      res.json({
        success: true,
        message: 'Feedback submitted successfully',
        status: newStatus
      });
    } catch (err) {
      console.error('Error in addEmployeeFeedback:', err);
      res.status(500).json({ 
        success: false,
        error: 'Failed to submit feedback',
        details: err.message 
      });
    }
  }
};

export default requestsController;
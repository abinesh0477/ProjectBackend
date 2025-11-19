// controllers/employee/payroll.controller.js
import { pool } from "../../config/db.js";
import PDFDocument from "pdfkit";

export const payrollController = {
  // ✅ Fetch logged-in employee payroll details (with month/year filter)
  getMyPayroll: async (req, res) => {
    try {
      const empId = req.user.emp_id;

      // ✅ Month/year filters
      const { month, year } = req.query;
      let query = `
        SELECT 
          e.designation, 
          e.join_date, 
          p.basic_salary, 
          p.bonus, 
          p.deduction, 
          p.total, 
          p.status,
          p.payroll_month
        FROM payroll p
        JOIN employees e ON p.emp_id = e.emp_id
        WHERE p.emp_id = ?`;
      const params = [empId];

      if (month && year) {
        query += " AND MONTH(p.payroll_month) = ? AND YEAR(p.payroll_month) = ?";
        params.push(month, year);
      }

      query += " ORDER BY p.payroll_month DESC";

      const [rows] = await pool.query(query, params);
      if (!rows.length)
        return res
          .status(404)
          .json({ success: false, message: "No payroll found for this employee" });

      res.json({ 
        success: true, 
        payroll: rows 
      });
    } catch (err) {
      console.error("Payroll fetch error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  // ✅ Generate and download payslip as PDF (with optional month/year)
  downloadPayslip: async (req, res) => {
    try {
      const empId = req.user.emp_id;

      // 1️⃣ Find employee
      const [empRows] = await pool.query(
        "SELECT emp_id, designation FROM employees WHERE emp_id = ?",
        [empId]
      );

      if (!empRows.length)
        return res.status(404).json({ success: false, message: "Employee not found" });

      const emp = empRows[0];

      // 2️⃣ Determine if a specific month/year is requested
      const { month, year } = req.query;
      let payrollQuery = `
        SELECT basic_salary, bonus, deduction, total, status, payroll_month
        FROM payroll
        WHERE emp_id = ?`;
      const params = [emp.emp_id];

      if (month && year) {
        payrollQuery += " AND MONTH(payroll_month) = ? AND YEAR(payroll_month) = ?";
        params.push(month, year);
      }

      payrollQuery += " ORDER BY payroll_month DESC LIMIT 1";

      const [rows] = await pool.query(payrollQuery, params);
      if (!rows.length)
        return res.status(404).json({ success: false, message: "Payroll record not found" });

      const p = rows[0];

      // 3️⃣ Generate PDF Payslip
      const doc = new PDFDocument({ margin: 50 });
      const filename = `payslip_${empId}_${Date.now()}.pdf`;

      res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
      res.setHeader("Content-Type", "application/pdf");

      doc.pipe(res);

      // Header
      doc.fontSize(20).text("Employee Payslip", { align: "center" });
      doc.moveDown();
      doc
        .fontSize(10)
        .text(`Generated on: ${new Date().toLocaleDateString()}`, {
          align: "right",
        });
      doc.moveDown(2);

      // Employee Info
      doc.fontSize(14).text("Employee Information", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Employee ID: ${empId}`);
      doc.text(`Designation: ${emp.designation}`);
      doc.moveDown();

      // Payroll Info
      doc.fontSize(14).text("Salary Details", { underline: true });
      doc.moveDown(0.5);
      doc.text(
        `Payroll Month: ${new Date(p.payroll_month).toLocaleDateString("en-IN", {
          month: "long",
          year: "numeric",
        })}`
      );
      doc.text(`Basic Salary: ₹${p.basic_salary}`);
      doc.text(`Bonus: ₹${p.bonus}`);
      doc.text(`Deduction: ₹${p.deduction}`);
      doc.text(`Net Salary: ₹${p.total}`);
      doc.text(`Status: ${p.status}`);
      doc.end();
    } catch (err) {
      console.error("Payslip download error:", err);
      res.status(500).json({ success: false, message: "Server error generating payslip" });
    }
  }
};

export default payrollController;
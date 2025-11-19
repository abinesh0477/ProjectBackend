// middleware/auth.js
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ success: false, message: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [users] = await pool.execute(`
      SELECT 
        u.id, u.username, u.email, u.phone, u.role, u.is_active,
        e.emp_id, e.designation, e.department_id,
        d.name as department_name
      FROM users u
      LEFT JOIN employees e ON u.id = e.user_id
      LEFT JOIN departments d ON e.department_id = d.dept_id
      WHERE u.id = ? AND u.is_active = 1
    `, [decoded.id]);

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid token or user inactive" });
    }

    req.user = users[0];
    next();

  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

export default authMiddleware;

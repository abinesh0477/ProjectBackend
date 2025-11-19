// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";

import authRoutes from "./routes/auth.routes.js";
import employeeRoutes from "./routes/employee.routes.js";
//import attendanceRoutes from "./routes/attendance.routes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(helmet());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/employee", employeeRoutes);
//app.use("/api/attendance", attendanceRoutes);

app.get("/", (req, res) => {
  res.send("✅ Backend running successfully!");
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  //console.log(`🚀 Server running on port ${PORT}`);
  //console.log("🔐 Auth: /api/auth");
  //console.log("👤 Employee: /api/employee");
  
});

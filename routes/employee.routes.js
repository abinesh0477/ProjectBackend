// // routes/employee.routes.js
// import { Router } from "express";
// import employeeController from "../controllers/employee/employee.controller.js";
// import authMiddleware from "../middleware/auth.js";

// const router = Router();

// // All endpoints are protected
// router.get("/dashboard", authMiddleware, employeeController.getDashboard);
// router.get("/attendance", authMiddleware, employeeController.getAttendance);
// router.post("/checkin", authMiddleware, employeeController.checkIn);
// router.post("/checkout", authMiddleware, employeeController.checkOut);
// router.get("/leaves", authMiddleware, employeeController.getLeaves);
// router.post("/leaves", authMiddleware, employeeController.applyLeave);
// router.get("/profile", authMiddleware,employeeController.getProfile);    
// router.put("/profile", authMiddleware,employeeController.updateProfile); 
 


// export default router;

// routes/employee.routes.js
import express from "express";
import authMiddleware from "../middleware/auth.js";
import dashboardController from "../controllers/employee/dashboard.controller.js";
import attendanceController from "../controllers/employee/attendance.controller.js";
import leavesController from "../controllers/employee/leaves.controller.js";
import profileController from "../controllers/employee/profile.controller.js";
import requestsController from "../controllers/employee/requests.controller.js";
import payrollController from "../controllers/employee/payroll.controller.js";
import projectController from "../controllers/employee/project.controller.js";



const router = express.Router();

// Dashboard routes
router.get("/dashboard", authMiddleware, dashboardController.getDashboard);

// Attendance routes
router.get("/attendance", authMiddleware, attendanceController.getAttendance);
router.post("/checkin", authMiddleware, attendanceController.checkIn);
router.post("/checkout", authMiddleware, attendanceController.checkOut);

// Leaves routes
router.get("/leaves", authMiddleware, leavesController.getLeaves);
router.post("/leaves", authMiddleware, leavesController.applyLeave);

// Profile routes
router.get("/profile", authMiddleware, profileController.getProfile);
router.put("/profile", authMiddleware, profileController.updateProfile);

// Requests routes
router.get("/requests", authMiddleware, requestsController.getAllRequests);
router.post("/requests", authMiddleware, requestsController.createRequest);
router.put("/requests/feedback", authMiddleware, requestsController.addEmployeeFeedback);

// Payroll routes
router.get("/payroll", authMiddleware, payrollController.getMyPayroll);
router.get("/payroll/payslip", authMiddleware, payrollController.downloadPayslip);

//project routes

router.get("/projects",  authMiddleware,projectController.getProjects);
router.post("/project-logs",  authMiddleware,projectController.createProjectLog);
router.get("/project-logs",  authMiddleware,projectController.getProjectLogs);

export default router;
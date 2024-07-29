const express = require("express");
const protect = require("../middleware/authMiddleware.js");
const Authorization = require("../middleware/Authorization.middleware.js");
const { updateTeacherProfileData, addProduct, getTodayCourse, getMyClasses, getTeacherProfileData, updateCourseDates } = require("../controllers/supplierController.js");

const supplierRoutes = express.Router();

// Apply protect and Authorization middleware to updateTeacherProfile route
supplierRoutes.put("/addCourse", protect, Authorization(["supplier"]), addProduct);

supplierRoutes.put("/updateTeacherProfile", protect, Authorization(["teacher"]), updateTeacherProfileData);
supplierRoutes.get("/getTeacherProfileData", protect, Authorization(["teacher"]), getTeacherProfileData);

supplierRoutes.route("/getTodayCourse").get(protect, Authorization(["teacher"]), getTodayCourse);
supplierRoutes.route("/getMyClasses").get(protect, Authorization(["teacher"]), getMyClasses);

supplierRoutes.route("/updateCourseDates").post(protect, Authorization(["admin"]), updateCourseDates);

module.exports = { supplierRoutes };

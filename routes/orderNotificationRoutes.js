// routes/notificationRoutes.js
const express = require("express");
const { getTeacherNotifications, sendCourseNotification, getMissingAttendanceDays, resetCourseMeeting } = require("../controllers/orderNotificationController.js");
const protect = require("../middleware/authMiddleware.js");

const orderNotificationsRoutes = express.Router();

// GET notifications for a user
orderNotificationsRoutes.route("/getTeacherNotifications").get(protect, getTeacherNotifications);
orderNotificationsRoutes.route("/sendCourseNotification").post(protect, sendCourseNotification);
orderNotificationsRoutes.route("/getMissingAttendanceDays").post(protect, getMissingAttendanceDays);
orderNotificationsRoutes.route("/resetCourseMeeting").post(protect, resetCourseMeeting);

module.exports = { orderNotificationsRoutes };

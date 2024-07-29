const express = require("express");
const {
  registerUser,
  authUser,
  getUsers,
  verifyOtp,
  resendOTP,
  updateProfileData,
  forgetPassword,
  ChangePassword,
  profilePicUpload,
  logoutUser,
  bank_Detail_create,
  getAllUsers,
  getAllDashboardCount,
  addReview,
  getUserView,
  getBankDetails,
  ForgetresendOTP,
  profilePicKey,
  getReview,
  updateProfileDataByAdmin,
  searchUsers,
  getBankDetailsAdmin,
  UserAdminStatus,
  UpdateMobileAdmin,
  getCoursesByTeacherId,
  getTeacherAndCourseByTeacher_IdAndType,
  addFavoriteProduct,
  removeFavoriteProduct,
  getFavoriteTeachers,
  getCoursesByUserId,
  updateCostomerProfileData,
  getStudentsPayment,
  getAllSuppliersInAdmin,
  getProductByCategory_id,
  searchProducts,
  addToCart,
} = require("../controllers/userControllers.js");
const { CreateCalendar, GetSpecialEntries, FindPriceByDateTime, GetNormalEntries } = require("../controllers/calendarControllers.js");
const { createHire, getHireListByUserId, updateHireStatus, getAllHireList, getHireByMe, HirePaymentUpdateStatus } = require("../controllers/hireControllers.js");
const protect = require("../middleware/authMiddleware.js");
const commonProtect = require("../middleware/comman_authMiddleware.js");
const Authorization = require("../middleware/Authorization.middleware.js");
const { addRating, getRatingsByTeacherId } = require("../controllers/ratingController.js");
const { addTeacherPaymentStatus, getTeacherPaymentStatuses, calculatePayment, getTeacherPaymentStatusById } = require("../controllers/teacherPaymentStatusController.js");

const userRoutes = express.Router();

/*------------- Student/Teacher Both apis --------------------- */
userRoutes.route("/register").post(registerUser);
userRoutes.route("/login").post(authUser);
userRoutes.route("/verifyOtp").post(verifyOtp);
userRoutes.route("/resendOTP").post(resendOTP);
userRoutes.route("/ForgetresendOTP").post(ForgetresendOTP);
userRoutes.route("/forgetPassword").put(forgetPassword);
userRoutes.route("/ChangePassword").put(protect, ChangePassword);
userRoutes.route("/logoutUser").get(protect, logoutUser);

/*------------- User/Admin Both apis --------------------- */

userRoutes.route("/updateCostomerProfileData").post(protect, Authorization(["user"]), updateCostomerProfileData);
userRoutes.route("/getProductByCategory_id").post(protect, Authorization(["user"]), getProductByCategory_id);
userRoutes.route("/searchProducts").post(protect, Authorization(["user"]), searchProducts);
userRoutes.route("/addFavoriteProduct").post(protect, Authorization(["user"]), addFavoriteProduct);
userRoutes.route("/removeFavoriteProduct").post(protect, Authorization(["user"]), removeFavoriteProduct);
userRoutes.route("/addToCart").post(protect, Authorization(["user"]), addToCart);

userRoutes.route("/getCoursesByUserId").get(protect, Authorization(["student"]), getCoursesByUserId);
userRoutes.route("/getAllUsers").get(protect, Authorization(["student", "admin"]), getAllUsers);
userRoutes.route("/getFavoriteTeachers").get(protect, Authorization(["student"]), getFavoriteTeachers);
userRoutes.route("/addRating").post(protect, Authorization(["student"]), addRating);
userRoutes.route("/getRatingsByTeacherId/:teacherId").get(protect, getRatingsByTeacherId);
userRoutes.route("/addReview").post(protect, Authorization(["student"]), addReview);

/*------------- Teacher/Admin Both apis --------------------- */
userRoutes.route("/getTeacherAndCourseByTeacher_IdAndType").post(protect, Authorization(["student", "teacher"]), getTeacherAndCourseByTeacher_IdAndType);
userRoutes.route("/addBankDetails").post(protect, Authorization(["teacher"]), bank_Detail_create);
userRoutes.route("/getBankDetails").get(protect, Authorization(["teacher"]), getBankDetails);
userRoutes.route("/getBankDetailsAdmin/:teacher_id").get(protect, Authorization(["teacher", "admin"]), getBankDetailsAdmin);
userRoutes.route("/calculatePayment").post(protect, Authorization(["teacher"]), calculatePayment);

/*------------- Admin apis --------------------- */
userRoutes.route("/getTeacherPaymentStatuses").get(protect, Authorization(["admin"]), getTeacherPaymentStatuses);
userRoutes.route("/getTeacherPaymentStatusById/:teacher_id").get(protect, Authorization(["admin"]), getTeacherPaymentStatusById);
userRoutes.route("/addTeacherPaymentStatus").post(protect, Authorization(["admin"]), addTeacherPaymentStatus);
userRoutes.route("/getStudentsPayment").get(protect, Authorization(["admin"]), getStudentsPayment);
userRoutes.route("/getAllDashboardCount").get(protect, Authorization(["admin"]), getAllDashboardCount);

// student protect route
/*------------- Comman Auth Routes --------------------- */
userRoutes.route("/getUserView/:_id/").get(commonProtect, getUserView);

/*------------- Auth Routes --------------------- */

userRoutes.route("/").get(protect, getUsers);

userRoutes.route("/updateUserProfile").put(protect, updateProfileData);
userRoutes.route("/searchUsers").post(protect, searchUsers);
userRoutes.route("/UpdateMobileAdmin").post(protect, UpdateMobileAdmin);
userRoutes.route("/profilePicUpload").put(protect, profilePicUpload);
userRoutes.route("/UserAdminStatus").post(protect, UserAdminStatus);

// userRoutes.route("/updateUserWatchTime").post(protect, updateUserWatchTime);
userRoutes.route("/getReview/:id/:limit").get(getReview);
userRoutes.route("/profilePicKey").post(protect, profilePicKey);

/*------------- Calendar Routes --------------------- */
userRoutes.route("/Createcalendar").post(protect, CreateCalendar);
userRoutes.route("/FindPriceByDateTime").post(FindPriceByDateTime);
userRoutes.route("/GetSpecialEntries").get(protect, GetSpecialEntries);
userRoutes.route("/GetNormalEntries").get(protect, GetNormalEntries);
/*------------- Hire Routes --------------------- */
userRoutes.route("/createHire").post(protect, createHire);
userRoutes.route("/updateHireStatus").post(protect, updateHireStatus);
userRoutes.route("/HirePaymentUpdateStatus").post(protect, HirePaymentUpdateStatus);
userRoutes.route("/getHireList").get(protect, getHireListByUserId);
userRoutes.route("/getHireByMe").get(protect, getHireByMe);

/*------------- Admin Routes --------------------- */

userRoutes.route("/getAllHireList").post(protect, getAllHireList);
userRoutes.route("/updateProfileDataByAdmin").post(protect, updateProfileDataByAdmin);
userRoutes.route("/getCoursesByTeacherId/:teacher_id").get(protect, getCoursesByTeacherId);

userRoutes.route("/getAllSuppliersInAdmin").get(protect, getAllSuppliersInAdmin);

module.exports = { userRoutes };

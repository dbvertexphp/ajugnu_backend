const express = require("express");
const protect = require("../middleware/authMiddleware.js");
const Authorization = require("../middleware/Authorization.middleware.js");
const { updateSupplierProfileData, addProduct, getSupplierProfileData, getProducts, getPincode } = require("../controllers/supplierController.js");

const supplierRoutes = express.Router();

// Apply protect and Authorization middleware to updateTeacherProfile route
supplierRoutes.post("/addProduct", protect, Authorization(["supplier", "admin"]), addProduct);

supplierRoutes.get("/getProducts", protect, Authorization(["supplier"]), getProducts);

supplierRoutes.get("/getPincode", protect, Authorization(["supplier"]), getPincode);

supplierRoutes.put("/updateSupplierProfileData", protect, Authorization(["supplier"]), updateSupplierProfileData);
supplierRoutes.get("/getSupplierProfileData", protect, Authorization(["supplier"]), getSupplierProfileData);

module.exports = { supplierRoutes };

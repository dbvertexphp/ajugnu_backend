const express = require("express");
const protect = require("../middleware/authMiddleware.js");
const Authorization = require("../middleware/Authorization.middleware.js");
const { updateSupplierProfileData, addProduct, getSupplierProfileData, getProducts, getPincode, editProduct, deleteProduct, getProductById, getOrdersBySupplierId, updateOrderItemStatus, getAllProducts, getProductsBySupplierId } = require("../controllers/supplierController.js");

const supplierRoutes = express.Router();

// Apply protect and Authorization middleware to updateTeacherProfile route
supplierRoutes.post("/addProduct", protect, Authorization(["supplier", "admin"]), addProduct);

supplierRoutes.post("/editProduct", protect, Authorization(["supplier", "admin"]), editProduct);

supplierRoutes.post("/deleteProduct", protect, Authorization(["supplier", "admin"]), deleteProduct);

supplierRoutes.get("/getProducts", protect, Authorization(["supplier"]), getProducts);

supplierRoutes.get("/getAllProducts", protect, getAllProducts);

supplierRoutes.post("/getProductsBySupplierId", protect, getProductsBySupplierId);

supplierRoutes.get("/getPincode", protect, Authorization(["supplier"]), getPincode);

supplierRoutes.get("/getProductById", protect, Authorization(["supplier", "admin"]), getProductById);

supplierRoutes.get("/getOrdersBySupplierId", protect, Authorization(["supplier", "admin"]), getOrdersBySupplierId);

supplierRoutes.put("/updateOrderItemStatus", protect, Authorization(["supplier"]), updateOrderItemStatus);

supplierRoutes.put("/updateSupplierProfileData", protect, Authorization(["supplier"]), updateSupplierProfileData);

supplierRoutes.get("/getSupplierProfileData", protect, Authorization(["supplier"]), getSupplierProfileData);

module.exports = { supplierRoutes };

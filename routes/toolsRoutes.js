const express = require("express");
const protect = require("../middleware/authMiddleware.js");
const Authorization = require("../middleware/Authorization.middleware.js");
const { addTools, getProducts, editProduct, deleteTools, getProductById, getOrdersBySupplierId, updateOrderItemStatus, getAllTools, getProductsBySupplierId } = require("../controllers/toolsController.js");

const toolsRoutes = express.Router();

// Apply protect and Authorization middleware to updateTeacherProfile route

toolsRoutes.post("/addTools", protect, Authorization(["admin"]), addTools);

toolsRoutes.post("/editProduct", protect, Authorization(["supplier", "admin"]), editProduct);

toolsRoutes.post("/deleteTools", protect, Authorization(["supplier", "admin"]), deleteTools);

toolsRoutes.get("/getProducts", protect, Authorization(["supplier"]), getProducts);

toolsRoutes.get("/getAllTools", protect, getAllTools);

toolsRoutes.post("/getProductsBySupplierId", protect, getProductsBySupplierId);

toolsRoutes.get("/getProductById", protect, Authorization(["supplier", "admin"]), getProductById);

toolsRoutes.get("/getOrdersBySupplierId", protect, Authorization(["supplier", "admin"]), getOrdersBySupplierId);

toolsRoutes.put("/updateOrderItemStatus", protect, Authorization(["supplier"]), updateOrderItemStatus);

module.exports = { toolsRoutes };

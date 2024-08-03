const express = require("express");
const protect = require("../middleware/authMiddleware.js");
const Authorization = require("../middleware/Authorization.middleware.js");
const { addFertilizer, getProducts, editProduct, deleteFertilizer, getFertilizerById, getOrdersBySupplierId, updateOrderItemStatus, getAllFertilizer, getProductsBySupplierId } = require("../controllers/fertilizerController.js");

const fertilizerRoutes = express.Router();

// Apply protect and Authorization middleware to updateTeacherProfile route
fertilizerRoutes.post("/addFertilizer", protect, Authorization(["admin"]), addFertilizer);

fertilizerRoutes.post("/editProduct", protect, Authorization(["supplier", "admin"]), editProduct);

fertilizerRoutes.post("/deleteFertilizer", protect, Authorization(["supplier", "admin"]), deleteFertilizer);

fertilizerRoutes.get("/getProducts", protect, Authorization(["supplier"]), getProducts);

fertilizerRoutes.get("/getAllFertilizer", protect, getAllFertilizer);

fertilizerRoutes.post("/getProductsBySupplierId", protect, getProductsBySupplierId);

fertilizerRoutes.get("/getFertilizerById", protect, Authorization(["supplier", "admin"]), getFertilizerById);

fertilizerRoutes.get("/getOrdersBySupplierId", protect, Authorization(["supplier", "admin"]), getOrdersBySupplierId);

fertilizerRoutes.put("/updateOrderItemStatus", protect, Authorization(["supplier"]), updateOrderItemStatus);

module.exports = { fertilizerRoutes };

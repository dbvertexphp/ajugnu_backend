const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  message: { type: String },
  title: { type: String },
  type: { type: String },
  totalamount: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
});

const OrderNotification = mongoose.model("OrderNotification", notificationSchema);

module.exports = OrderNotification;

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productSchema = new Schema(
  {
    english_name: {
      type: String,
      required: true,
    },
    local_name: {
      type: String,
    },
    other_name: {
      type: String,
    },
    product_image: {
      type: String,
    },
    category_id: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    product_type: {
      type: String,
      enum: ["indoor", "outdoor"],
      required: true,
    },
    product_size: {
      type: String,
      enum: ["small", "medium", "large"],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    supplier_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    pin_code: [Number],
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
module.exports = Product;

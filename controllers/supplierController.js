const asyncHandler = require("express-async-handler");
// const moment = require("moment-timezone");
const { User } = require("../models/userModel.js");
const dotenv = require("dotenv");
const ErrorHandler = require("../utils/errorHandler.js");
const Product = require("../models/productModel.js");
const upload = require("../middleware/uploadMiddleware.js");
const fs = require("fs");
const { addDays, isWeekend } = require("date-fns");
const moment = require("moment-business-days");
const TeacherPayment = require("../models/TeacherPaymentModel.js");

dotenv.config();

const updateSupplierProfileData = asyncHandler(async (req, res) => {
  req.uploadPath = "uploads/profiles";
  upload.fields([{ name: "profile_pic", maxCount: 1 }])(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    const { full_name, mobile, email, address, pin_code } = req.body;
    const supplier_id = req.headers.userID; // Assuming you have user authentication middleware

    // Get the profile picture path if uploaded
    const profile_pic = req.files.profile_pic ? `${req.uploadPath}/${req.files.profile_pic[0].filename}` : null;

    try {
      // Find the current user to get the old image paths
      const currentUser = await User.findById(supplier_id);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Build the update object with optional fields
      let updateFields = {
        datetime: moment().tz("Asia/Kolkata").format("YYYY-MMM-DD hh:mm:ss A"),
      };

      // Update optional fields if provided
      if (full_name) {
        updateFields.full_name = full_name;
      }
      if (mobile) {
        updateFields.mobile = mobile;
      }
      if (email) {
        updateFields.email = email;
      }
      if (address) {
        updateFields.address = address;
      }

      // Check if there is a new profile pic uploaded and delete the old one
      if (profile_pic && currentUser.profile_pic) {
        const oldProfilePicPath = currentUser.profile_pic;
        updateFields.profile_pic = profile_pic;

        // Delete the old profile picture
        deleteFile(oldProfilePicPath);
      } else if (profile_pic) {
        updateFields.profile_pic = profile_pic;
      }

      // Handle pin_code as an array using $addToSet to avoid duplicates
      let pinCodesArray = [];
      if (pin_code) {
        pinCodesArray = Array.isArray(pin_code) ? pin_code : [parseInt(pin_code, 10)];
        pinCodesArray = [...new Set(pinCodesArray)]; // Remove duplicates
      }

      // Update the user's profile fields
      const updatedUser = await User.findByIdAndUpdate(
        supplier_id,
        {
          $set: {
            full_name: updateFields.full_name,
            mobile: updateFields.mobile,
            email: updateFields.email,
            address: updateFields.address,
            profile_pic: updateFields.profile_pic,
            datetime: updateFields.datetime,
          },
          $addToSet: { pin_code: { $each: pinCodesArray } },
        },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return the updated user data
      return res.status(200).json({
        _id: updatedUser._id,
        full_name: updatedUser.full_name,
        mobile: updatedUser.mobile,
        email: updatedUser.email,
        address: updatedUser.address,
        pin_code: updatedUser.pin_code,
        profile_pic: updatedUser.profile_pic,
        status: true,
      });
    } catch (error) {
      console.error("Error updating user profile:", error.message);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });
});

const getSupplierProfileData = asyncHandler(async (req, res) => {
  const supplier_id = req.headers.userID; // Assuming you have user authentication middleware

  try {
    // Find the user by ID
    const user = await User.findById(supplier_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return the user's profile information
    return res.status(200).json({
      user: user,

      status: true,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Function to delete a file from the filesystem
function deleteFile(filePath) {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("Error deleting file:", err);
    } else {
      console.log(`Deleted file: ${filePath}`);
    }
  });
}

const addProduct = asyncHandler(async (req, res, next) => {
  req.uploadPath = "uploads/product";
  upload.single("product_image")(req, res, async (err) => {
    if (err) {
      return next(new ErrorHandler(err.message, 400));
    }
    console.log(req.body);
    const { english_name, local_name, other_name, category_id, price, quantity, product_type, product_size, description, pin_code } = req.body;
    const supplier_id = req.headers.userID; // Assuming user authentication middleware sets this header

    try {
      // Validate required fields
      if (!english_name || !price || !quantity || !product_type || !product_size || !description || !category_id || !supplier_id || !pin_code) {
        return res.status(400).json({
          message: "All fields (english_name, price, quantity, product_type, product_size, description) are required.",
          status: false,
        });
      }
      // Get the profile picture path if uploaded
      const product_image = req.file ? `${req.uploadPath}/${req.file.filename}` : null;

      // Handle pin_code as an array
      const pinCodesArray = pin_code ? (Array.isArray(pin_code) ? pin_code : [pin_code]) : [];

      // Fetch user data to validate pin codes
      const user = await User.findById(supplier_id);
      if (!user) {
        return res.status(404).json({ message: "User not found", status: false });
      }

      const userPinCodes = user.pin_code || [];

      // Check if provided pin codes exist in the user's pin_code array
      const invalidPinCodes = pinCodesArray.filter((pin) => !userPinCodes.includes(pin));
      if (invalidPinCodes.length > 0) {
        return res.status(400).json({ message: `Invalid pin codes: ${invalidPinCodes.join(", ")}`, status: false });
      }

      // Create new Product with parsed dates
      const newProduct = new Product({
        product_image,
        english_name,
        local_name,
        other_name,
        category_id,
        price,
        quantity,
        product_type,
        product_size,
        description,
        supplier_id,
        pin_code: pinCodesArray,
      });

      const savedProduct = await newProduct.save();

      res.status(201).json({
        _id: savedProduct._id,
        product_image: savedProduct.product_image,
        english_name: savedProduct.english_name,
        local_name: savedProduct.local_name,
        other_name: savedProduct.other_name,
        category_id: savedProduct.category_id,
        price: savedProduct.price,
        quantity: savedProduct.quantity,
        product_type: savedProduct.product_type,
        product_size: savedProduct.product_size,
        description: savedProduct.description,
        supplier_id: savedProduct.supplier_id,
        pin_code: savedProduct.pin_code,
        status: true,
      });
    } catch (error) {
      console.error("Error adding product:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
});

const getProducts = asyncHandler(async (req, res) => {
  const supplier_id = req.headers.userID; // Assuming user authentication middleware sets this header
  const page = parseInt(req.query.page) || 1; // Default to page 1 if not specified
  const limit = 10; // Number of products per page

  try {
    if (!supplier_id) {
      return res.status(400).json({
        message: "Supplier ID is required.",
        status: false,
      });
    }

    const skip = (page - 1) * limit;
    const totalProducts = await Product.countDocuments({ supplier_id });
    const products = await Product.find({ supplier_id }).skip(skip).limit(limit);

    res.status(200).json({
      products,
      page,
      totalPages: Math.ceil(totalProducts / limit),
      totalProducts,
      status: true,
    });
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const getPincode = asyncHandler(async (req, res) => {
  const supplier_id = req.headers.userID; // Assuming user authentication middleware sets this header
  try {
    if (!supplier_id) {
      return res.status(400).json({
        message: "Supplier ID is required.",
        status: false,
      });
    }
    const Pincodes = await User.findById({ _id: supplier_id });

    res.status(200).json({
      Pincodes: Pincodes.pin_code,
      status: true,
    });
  } catch (error) {
    console.error("Error fetching pincode:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = { updateSupplierProfileData, addProduct, getSupplierProfileData, getProducts, getPincode };

const asyncHandler = require("express-async-handler");
const Transaction = require("../models/transactionModel");
const Order = require("../models/orderModel"); // Ensure correct import path
const Product = require("../models/productModel");
const { User } = require("../models/userModel");
const { addNotification } = require("./orderNotificationController");
const { sendFCMNotification } = require("./notificationControllers");

const addTransaction = asyncHandler(async (req, res) => {
  const user_id = req.headers.userID;
  const { order_id, payment_id, payment_status, total_amount, payment_method, status, user_name } = req.body;

  if (!order_id || !total_amount || !payment_method || !status) {
    return res.status(400).json({ message: "Invalid input", status: false });
  }

  try {
    // Fetch the order details
    const order = await Order.findById(order_id).populate("items.product_id");
    if (!order) {
      return res.status(404).json({ message: "Order not found", status: false });
    }

    // Aggregate amount by supplier and product
    const items = order.items.map((item) => ({
      product_id: item.product_id._id,
      supplier_id: item.supplier_id,
      amount: item.quantity * item.product_id.price,
    }));

    // Create a single transaction document
    const newTransaction = new Transaction({
      user_id,
      order_id,
      payment_id: payment_id || null,
      payment_status: payment_status || "pending",
      total_amount,
      payment_method,
      status,
      items,
      user_name,
    });

    const savedTransaction = await newTransaction.save();

    // Send notifications and add notifications for each supplier
    for (const item of items) {
      const supplier = await User.findById(item.supplier_id);
      if (supplier.firebase_token || user.firebase_token == "dummy_token") {
        const registrationToken = supplier.firebase_token;
        const title = "Product Purchase";
        const body = `A new transaction of ${item.amount} has been made for your products.`;
        const notificationResult = await sendFCMNotification(registrationToken, title, body);
        if (notificationResult.success) {
          console.log("Notification sent successfully:", notificationResult.response);
        } else {
          console.error("Failed to send notification:", notificationResult.error);
        }
        await addNotification(user_id, order_id, body, total_amount, [item.supplier_id], title, payment_method);
      }
    }

    res.status(201).json({
      message: "Transactions added successfully",
      transaction: savedTransaction,
    });
  } catch (error) {
    console.error("Error adding transactions:", error.message);
    res.status(500).json({ message: "Internal Server Error", status: false });
  }
});

// Get all transactions with optional filtering, sorting, and pagination
// const getAllTransactions = asyncHandler(async (req, res) => {
//   const { page = 1, limit = 10, sortBy = "createdAt", order = "desc" } = req.query;

//   try {
//     // Fetch transactions with pagination
//     const transactions = await Transaction.find()
//       .sort({ [sortBy]: order === "desc" ? -1 : 1 })
//       .skip((page - 1) * limit)
//       .limit(parseInt(limit));
//       // .populate("user_id order_id items.product_id items.supplier_id");

//     // Count total number of transactions
//     const totalTransactions = await Transaction.countDocuments();

//     res.status(200).json({
//       message: "Transactions fetched successfully",
//       transactions,
//       totalPages: Math.ceil(totalTransactions / limit),
//       currentPage: parseInt(page),
//       totalTransactions,
//     });
//   } catch (error) {
//     console.error("Error fetching transactions:", error.message);
//     res.status(500).json({ message: "Internal Server Error", status: false });
//   }
// });

const getAllTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sortBy = "createdAt", order = "desc" } = req.query;

  try {
    // Fetch transactions with pagination and populate order details
    const transactions = await Transaction.find()
      .populate({
        path: "order_id", // Populating order details
        select: "order_id",
      })
      .sort({ [sortBy]: order === "desc" ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Count total number of transactions
    const totalTransactions = await Transaction.countDocuments();

    res.status(200).json({
      message: "Transactions fetched successfully",
      transactions,
      totalPages: Math.ceil(totalTransactions / limit),
      currentPage: parseInt(page),
      totalTransactions,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error.message);
    res.status(500).json({ message: "Internal Server Error", status: false });
  }
});

const getAllTransactionsByUser = asyncHandler(async (req, res) => {
  const { page = 1, search = "", Short = "", user_id } = req.body;
  const perPage = 10; // You can adjust this according to your requirements
  // Build the query based on search (if any)
  const query = {
    $or: [
      { "user_id.first_name": { $regex: search, $options: "i" } },
      { "user_id.last_name": { $regex: search, $options: "i" } },
      { "user_id.email": { $regex: search, $options: "i" } },
      { "teacher_id.name": { $regex: search, $options: "i" } },
      { "teacher_id.email": { $regex: search, $options: "i" } },
      {
        "teacher_id.first_name": {
          $regex: search,
          $options: "i",
        },
      },
      { "teacher_id.last_name": { $regex: search, $options: "i" } },
      { "course_id.title": { $regex: search, $options: "i" } },
    ],
  };

  // Sorting based on Short field
  let sortCriteria = {};
  if (Short === "amount") {
    sortCriteria = { amount: -1 }; // Sort by amount in descending order
  } else {
    sortCriteria = { _id: -1 }; // Default sorting
  }

  try {
    const transactions = await Transaction.find({ user_id: user_id })
      .populate({
        path: "user_id",
        select: "first_name last_name email", // Specify fields you want to populate
      })
      .populate({
        path: "teacher_id",
        select: "name email first_name last_name",
      })
      .populate({
        path: "course_id",
        select: "title category_id type",
        populate: {
          path: "category_id",
          select: "name",
        },
      })
      .sort(sortCriteria)
      .skip((page - 1) * perPage)
      .limit(perPage);

    const totalCount = await Transaction.countDocuments(query);
    const totalPages = Math.ceil(totalCount / perPage);

    const paginationDetails = {
      current_page: parseInt(page),
      data: transactions,
      first_page_url: `${baseURL}api/transactions?page=1`,
      from: (page - 1) * perPage + 1,
      last_page: totalPages,
      last_page_url: `${baseURL}api/transactions?page=${totalPages}`,
      links: [
        {
          url: page > 1 ? `${baseURL}api/transactions?page=${page - 1}` : null,
          label: "&laquo; Previous",
          active: false,
        },
        {
          url: `${baseURL}api/transactions?page=${page}`,
          label: page.toString(),
          active: true,
        },
        {
          url: page < totalPages ? `${baseURL}api/transactions?page=${page + 1}` : null,
          label: "Next &raquo;",
          active: false,
        },
      ],
      next_page_url: page < totalPages ? `${baseURL}api/transactions?page=${page + 1}` : null,
      path: `${baseURL}api/transactions`,
      per_page: perPage,
      prev_page_url: page > 1 ? `${baseURL}api/transactions?page=${page - 1}` : null,
      to: (page - 1) * perPage + transactions.length,
      total: totalCount,
    };

    res.json({
      Transactions: paginationDetails,
      page: page.toString(),
      total_rows: totalCount,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

const getAllTransactionsByTeacher = asyncHandler(async (req, res) => {
  const { page = 1, search = "", Short = "", user_id } = req.body;
  const perPage = 10; // You can adjust this according to your requirements
  // Build the query based on search (if any)
  const query = {
    $or: [
      { "user_id.first_name": { $regex: search, $options: "i" } },
      { "user_id.last_name": { $regex: search, $options: "i" } },
      { "user_id.email": { $regex: search, $options: "i" } },
      { "teacher_id.name": { $regex: search, $options: "i" } },
      { "teacher_id.email": { $regex: search, $options: "i" } },
      {
        "teacher_id.first_name": {
          $regex: search,
          $options: "i",
        },
      },
      { "teacher_id.last_name": { $regex: search, $options: "i" } },
      { "course_id.title": { $regex: search, $options: "i" } },
    ],
  };

  // Sorting based on Short field
  let sortCriteria = {};
  if (Short === "amount") {
    sortCriteria = { amount: -1 }; // Sort by amount in descending order
  } else {
    sortCriteria = { _id: -1 }; // Default sorting
  }

  try {
    const transactions = await Transaction.find({ teacher_id: user_id })
      .populate({
        path: "user_id",
        select: "first_name last_name email", // Specify fields you want to populate
      })
      .populate({
        path: "teacher_id",
        select: "name email first_name last_name",
      })
      .populate({
        path: "course_id",
        select: "title category_id type",
        populate: {
          path: "category_id",
          select: "name",
        },
      })
      .sort(sortCriteria)
      .skip((page - 1) * perPage)
      .limit(perPage);

    const totalCount = await Transaction.countDocuments(query);
    const totalPages = Math.ceil(totalCount / perPage);

    const paginationDetails = {
      current_page: parseInt(page),
      data: transactions,
      first_page_url: `${baseURL}api/transactions?page=1`,
      from: (page - 1) * perPage + 1,
      last_page: totalPages,
      last_page_url: `${baseURL}api/transactions?page=${totalPages}`,
      links: [
        {
          url: page > 1 ? `${baseURL}api/transactions?page=${page - 1}` : null,
          label: "&laquo; Previous",
          active: false,
        },
        {
          url: `${baseURL}api/transactions?page=${page}`,
          label: page.toString(),
          active: true,
        },
        {
          url: page < totalPages ? `${baseURL}api/transactions?page=${page + 1}` : null,
          label: "Next &raquo;",
          active: false,
        },
      ],
      next_page_url: page < totalPages ? `${baseURL}api/transactions?page=${page + 1}` : null,
      path: `${baseURL}api/transactions`,
      per_page: perPage,
      prev_page_url: page > 1 ? `${baseURL}api/transactions?page=${page - 1}` : null,
      to: (page - 1) * perPage + transactions.length,
      total: totalCount,
    };

    res.json({
      Transactions: paginationDetails,
      page: page.toString(),
      total_rows: totalCount,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// const getAllTransactionsInAdmin = asyncHandler(async (req, res) => {
//   const { page = 1, limit = 10, sortBy = "createdAt", order = "desc", search = "" } = req.query;
//   try {
//     // Build the search query
//     const searchQuery = search
//       ? {
//           $or: [
//             { user_name: { $regex: search, $options: "i" } },
//             { payment_id: { $regex: search, $options: "i" } },
//           ],
//         }
//       : {};

//     // Fetch transactions with pagination and search
//     const transactions = await Transaction.find(searchQuery)
//       .sort({ [sortBy]: order === "desc" ? -1 : 1 })
//       .skip((page - 1) * limit)
//       .limit(parseInt(limit))
//       .populate("user_id order_id items.product_id items.supplier_id");

//     // Count total number of transactions matching the search query
//     const totalTransactions = await Transaction.countDocuments(searchQuery);

//     res.status(200).json({
//       message: "Transactions fetched successfully",
//       transactions,
//       totalPages: Math.ceil(totalTransactions / limit),
//       currentPage: parseInt(page),
//       totalTransactions,
//     });
//   } catch (error) {
//     console.error("Error fetching transactions:", error.message);
//     res.status(500).json({ message: "Internal Server Error", status: false });
//   }
// });

//edit by Atest

// const getAllTransactionsInAdmin = asyncHandler(async (req, res) => {
//   const { page = 1, limit = 10, sortBy = "createdAt", order = "desc", search = "" } = req.query;

//   try {
//     const pipeline = [];

//     // Step 1: Lookup for populating fields
//     pipeline.push(
//       {
//         $lookup: {
//           from: "users",
//           localField: "user_id",
//           foreignField: "_id",
//           as: "userDetails",
//         },
//       },
//       {
//         $lookup: {
//           from: "orders",
//           localField: "order_id",
//           foreignField: "_id",
//           as: "orderDetails",
//         },
//       },
//       {
//         $lookup: {
//           from: "products",
//           localField: "items.product_id",
//           foreignField: "_id",
//           as: "productDetails",
//         },
//       },
//       {
//         $lookup: {
//           from: "users",
//           localField: "items.supplier_id",
//           foreignField: "_id",
//           as: "supplierDetails",
//         },
//       }
//     );

//     // Step 2: Unwind arrays for search purposes (if needed)
//     pipeline.push({ $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } }, { $unwind: { path: "$orderDetails", preserveNullAndEmptyArrays: true } });

//     // Step 3: Add search filters
//     if (search) {
//       pipeline.push({
//         $match: {
//           $or: [
//             { "userDetails.full_name": { $regex: search, $options: "i" } }, // Search in user name
//             { "orderDetails.order_id": { $regex: search, $options: "i" } }, // Exact search in order_id
//             { payment_id: { $regex: search, $options: "i" } }, // Search in payment_id
//           ],
//         },
//       });
//     }

//     // Step 4: Add sorting, pagination
//     pipeline.push({ $sort: { [sortBy]: order === "desc" ? -1 : 1 } }, { $skip: (page - 1) * limit }, { $limit: parseInt(limit) });

//     // Fetch transactions with aggregation pipeline
//     const transactions = await Transaction.aggregate(pipeline);

//     // Count total transactions (with the same pipeline excluding pagination and sorting)
//     const totalTransactions = await Transaction.aggregate([...pipeline.filter((stage) => !("$skip" in stage || "$limit" in stage || "$sort" in stage)), { $count: "total" }]);

//     res.status(200).json({
//       message: "Transactions fetched successfully",
//       transactions,
//       totalPages: Math.ceil((totalTransactions[0]?.total || 0) / limit),
//       currentPage: parseInt(page),
//       totalTransactions: totalTransactions[0]?.total || 0,
//     });
//   } catch (error) {
//     console.error("Error fetching transactions:", error.message);
//     res.status(500).json({ message: "Internal Server Error", status: false });
//   }
// });

const getAllTransactionsInAdmin = asyncHandler(async (req, res) => {
      const { page = 1, limit = 10, search = "" } = req.query;

      try {
        const pipeline = [
          // Lookup user details
          {
            $lookup: {
              from: "users",
              localField: "user_id",
              foreignField: "_id",
              as: "userDetails",
            },
          },
          { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },

          // Lookup order details
          {
            $lookup: {
              from: "orders",
              localField: "order_id",
              foreignField: "_id",
              as: "orderDetails",
            },
          },
          { $unwind: { path: "$orderDetails", preserveNullAndEmptyArrays: true } },

          // Lookup supplier details from items array
          {
            $lookup: {
              from: "users",
              localField: "items.supplier_id",
              foreignField: "_id",
              as: "supplierDetails",
            },
          },
          { $unwind: { path: "$supplierDetails", preserveNullAndEmptyArrays: true } },

          // Convert datetime string to actual Date type
          {
            $addFields: {
              datetimeConverted: { $toDate: "$datetime" },
            },
          },

          // Search functionality
          search
            ? {
                $match: {
                  $or: [
                    { "userDetails.full_name": { $regex: search, $options: "i" } },
                    { "orderDetails.order_id": { $regex: search, $options: "i" } },
                    { payment_id: { $regex: search, $options: "i" } },
                    { "supplierDetails.full_name": { $regex: search, $options: "i" } },
                  ],
                },
              }
            : null,

          // Sorting by converted datetime (most recent first)
          { $sort: { datetimeConverted: -1 } },

          // Pagination
          { $skip: (page - 1) * limit },
          { $limit: parseInt(limit) },

          // Project the required fields in a single object
          {
            $project: {
              _id: 1,
              user_name: { $ifNull: ["$userDetails.full_name", "N/A"] },
              order_id: { $ifNull: ["$orderDetails.order_id", "N/A"] },
              supplier_name: { $ifNull: ["$supplierDetails.full_name", "N/A"] },
              total_amount: 1,
              payment_status: 1,
              payment_method: 1,
              payment_id: 1,
              datetime: { $ifNull: ["$datetime", new Date(0)] }, // Original datetime field
            },
          },
        ].filter(Boolean);

        // Fetch transactions
        const transactions = await Transaction.aggregate(pipeline);

        // Count total transactions
        const totalTransactions = await Transaction.countDocuments(
          search
            ? {
                $or: [
                  { "userDetails.full_name": { $regex: search, $options: "i" } },
                  { "orderDetails.order_id": { $regex: search, $options: "i" } },
                  { payment_id: { $regex: search, $options: "i" } },
                  { "supplierDetails.full_name": { $regex: search, $options: "i" } },
                ],
              }
            : {}
        );

        res.status(200).json({
          message: "Transactions fetched successfully",
          transactions,
          totalPages: Math.ceil(totalTransactions / limit),
          currentPage: parseInt(page),
          totalTransactions,
        });
      } catch (error) {
        console.error("Error fetching transactions:", error.message);
        res.status(500).json({ message: "Internal Server Error", status: false });
      }
    });




// const getAllCodTransactionsInAdmin = asyncHandler(async (req, res) => {
//       const { page = 1, limit = 10, sortBy = "createdAt", order = "desc", search = "" } = req.query;

//       try {
//         const pipeline = [
//           { $match: { payment_method: "cod" } }, // Filter COD orders
//           { $unwind: "$items" }, // Unwind items array to filter status
//           { $match: { "items.status": "delivered" } }, // Filter delivered items

//           // Lookup for user details
//           {
//             $lookup: {
//               from: "users",
//               localField: "user_id",
//               foreignField: "_id",
//               as: "user",
//             },
//           },
//           {
//             $unwind: { path: "$user", preserveNullAndEmptyArrays: true },
//           },

//           // Search functionality
//           search
//             ? {
//                 $match: {
//                   $or: [
//                     { "user.full_name": { $regex: search, $options: "i" } }, // Search in user name
//                     { order_id: { $regex: search, $options: "i" } }, // Search in order_id
//                   ],
//                 },
//               }
//             : null,

//           // Sorting & Pagination
//           { $sort: { [sortBy]: order === "desc" ? -1 : 1 } },
//           { $skip: (page - 1) * limit },
//           { $limit: parseInt(limit) },

//           // Project required fields
//           {
//             $project: {
//               _id: 1,
//               order_id: 1,
//               payment_method: 1,
//               total_amount: 1,
//               item_status: "$items.status",
//               created_at: 1,
//               user_name: { $ifNull: ["$user.full_name", "N/A"] },
//             },
//           },
//         ].filter(Boolean); // Remove null values (if search is not applied)

//         // Execute aggregation
//         const transactions = await Order.aggregate(pipeline);

//         // Count total transactions (excluding pagination)
//         const totalTransactions = await Order.countDocuments({
//           payment_method: "cod",
//           "items.status": "delivered",
//         });

//         res.status(200).json({
//           message: "Transactions fetched successfully",
//           transactions,
//           totalPages: Math.ceil(totalTransactions / limit),
//           currentPage: parseInt(page),
//           totalTransactions,
//         });
//       } catch (error) {
//         console.error("Error fetching transactions:", error.message);
//         res.status(500).json({ message: "Internal Server Error", status: false });
//       }
//     });

const getAllCodTransactionsInAdmin = asyncHandler(async (req, res) => {
      const { page = 1, limit = 10, sortBy = "created_at", order = "desc", search = "" } = req.query;

      try {
          const pipeline = [
              { $match: { payment_method: "cod" } }, // Filter COD orders
              { $unwind: "$items" }, // Unwind items array to filter status
              { $match: { "items.status": "delivered" } }, // Filter delivered items

              // Lookup for user details
              {
                  $lookup: {
                      from: "users",
                      localField: "user_id",
                      foreignField: "_id",
                      as: "user",
                  },
              },
              { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

              // Lookup for supplier details using supplier_id from items
              {
                  $lookup: {
                      from: "users",
                      localField: "items.supplier_id",
                      foreignField: "_id",
                      as: "supplier",
                  },
              },
              { $unwind: { path: "$supplier", preserveNullAndEmptyArrays: true } },

              // Search functionality
              search
                  ? {
                      $match: {
                          $or: [
                              { "user.full_name": { $regex: search, $options: "i" } }, // Search in user name
                              { order_id: { $regex: search, $options: "i" } }, // Search in order_id
                              { "supplier.full_name": { $regex: search, $options: "i" } }, // Search in supplier name
                          ],
                      },
                  }
                  : null,

              // Sorting to show the most recent first
              { $sort: { created_at: -1 } }, // Changed to descending order

              // Pagination
              { $skip: (page - 1) * limit },
              { $limit: parseInt(limit) },

              // Project required fields
              {
                  $project: {
                      _id: 1,
                      order_id: 1,
                      payment_method: 1,
                      total_amount: 1,
                      item_status: "$items.status",
                      created_at: 1,
                      user_name: { $ifNull: ["$user.full_name", "N/A"] },
                      supplier_name: { $ifNull: ["$supplier.full_name", "N/A"] }, // Added Supplier Name
                  },
              },
          ].filter(Boolean); // Remove null values (if search is not applied)

          // Execute aggregation
          const transactions = await Order.aggregate(pipeline);

          // Count total transactions (excluding pagination)
          const totalTransactions = await Order.countDocuments({
              payment_method: "cod",
              "items.status": "delivered",
          });

          res.status(200).json({
              message: "Transactions fetched successfully",
              transactions,
              totalPages: Math.ceil(totalTransactions / limit),
              currentPage: parseInt(page),
              totalTransactions,
          });
      } catch (error) {
          console.error("Error fetching transactions:", error.message);
          res.status(500).json({ message: "Internal Server Error", status: false });
      }
  });




module.exports = {
  addTransaction,
  getAllTransactions,
  getAllTransactionsByUser,
  getAllTransactionsByTeacher,
  getAllTransactionsInAdmin,
  getAllCodTransactionsInAdmin
};

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/authMiddleware');
const { createOrder, generateReceipt, getAllOrders, updateOrderStatus } = require('../controllers/orderController');

// Ensure uploads directories exist
const paymentSlipsDir = path.join(__dirname, '..', 'uploads', 'payment-slips');
const receiptsDir = path.join(__dirname, '..', 'uploads', 'receipts');

if (!fs.existsSync(paymentSlipsDir)) {
  fs.mkdirSync(paymentSlipsDir, { recursive: true });
}

if (!fs.existsSync(receiptsDir)) {
  fs.mkdirSync(receiptsDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'payment-slips');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Import order controller - create this file next
const orderController = require('../controllers/orderController');

// Order routes
router.post('/', authenticate, upload.single('paymentSlip'), orderController.createOrder);
router.get('/receipt/:orderId', authenticate, orderController.generateReceipt);
router.get('/user', authenticate, orderController.getUserOrders);
router.get('/', authenticate, getAllOrders);
router.put('/:id/status', authenticate, updateOrderStatus);
router.get('/:id', authenticate, orderController.getOrderDetails);

module.exports = router; 
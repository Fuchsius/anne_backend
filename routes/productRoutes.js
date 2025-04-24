const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');
const { auth } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/products';
    // Create the directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'product-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Public routes
router.get('/', productsController.getAllProducts);
router.get('/search', productsController.searchProducts);
router.get('/:id', productsController.getProductById);
router.get('/category/:categoryId', productsController.getProductsByCategory);

// Protected routes requiring authentication
router.post('/:id/reviews', auth, productsController.createReview);
router.put('/reviews/:id', auth, productsController.updateReview);
router.delete('/reviews/:id', auth, productsController.deleteReview);

// Admin routes requiring admin privileges
router.post('/', auth, admin, productsController.createProduct);
router.put('/:id', auth, admin, productsController.updateProduct);
router.delete('/:id', auth, admin, productsController.deleteProduct);

// Image upload routes
router.post('/:id/images', auth, admin, upload.array('images', 10), productsController.uploadProductImages);
router.delete('/images/:id', auth, admin, productsController.deleteProductImage);

module.exports = router; 
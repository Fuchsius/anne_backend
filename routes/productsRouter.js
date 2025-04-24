const express = require("express");
const {upload, processImage} = require("../middleware/upload");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/authMiddleware");
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

const {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    addProductImage,
    deleteProductImage,
    createReview,
    updateReview,
    deleteReview,
    uploadProductImages,
} = require("../controllers/productsController");

// Configure multer specifically for product images
const productImageStorage = multer.diskStorage({
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

const productImageUpload = multer({ 
  storage: productImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Product routes
router.get("/", async (req, res) => {
  try {
    const { category } = req.query;
    
    const products = await prisma.product.findMany({
      where: category ? {
        categoryId: category
      } : {},
      include: {
        category: true,
        productImages: true
      }
    });
    
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get("/:id", getProductById);
router.post("/", createProduct);
router.put("/update/:id", updateProduct);
router.delete("/delete/:id", deleteProduct);
router.post("/search", searchProducts);

router.post("/image/:id", upload.single("image"), processImage, addProductImage);
router.delete("/image/:id", deleteProductImage);

router.post("/review/:id", createReview);
router.put("/review/:id", updateReview);
router.delete("/review/:id", deleteReview);

router.post("/:id/images", productImageUpload.array('images', 10), uploadProductImages);
router.delete("/images/:id", deleteProductImage);

module.exports = router;
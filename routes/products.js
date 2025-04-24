const express = require('express');
const productsController = require('../controllers/productsController');

const router = express.Router();

// Add this route to your products router
router.get('/category/:categoryId', productsController.getProductsByCategory);

module.exports = router; 
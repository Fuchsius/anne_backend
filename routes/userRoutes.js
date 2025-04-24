const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');

// User routes
router.get('/addresses', authenticate, userController.getUserAddresses);
router.post('/addresses', authenticate, userController.createUserAddress);

module.exports = router; 
const express = require('express');
const router  = express.Router();
const orderController = require('../controllers/order');
const { protect, isAdmin } = require('../middlewares/auth');

// Customer routes
router.get  ('/',    protect, orderController.get);
router.get  ('/:id', protect, orderController.get);
router.post ('/',    protect, orderController.create);

// Razorpay payment routes (must be before /:id)
// router.post ('/razorpay',        protect, orderController.razorpayCreate);
// router.post ('/razorpay/verify', protect, orderController.razorpayVerify);

// Admin routes
router.get   ('/admin/all',       protect, isAdmin, orderController.adminGetAll);
router.get   ('/admin/dashboard', protect, isAdmin, orderController.dashboard);
router.patch ('/:id/status',      protect, isAdmin, orderController.updateStatus);

module.exports = router;

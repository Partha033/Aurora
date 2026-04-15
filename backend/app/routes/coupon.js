const express = require('express');
const router  = express.Router();
const couponController = require('../controllers/coupon');
const { protect, isAdmin } = require('../middlewares/auth');

// Public/User
router.post('/apply', protect, couponController.apply);

// Admin only
router.post  ('/',      protect, isAdmin, couponController.create);
router.get   ('/',      protect, isAdmin, couponController.list);
router.put   ('/:id',   protect, isAdmin, couponController.update);
router.delete('/:id',   protect, isAdmin, couponController.delete);

module.exports = router;
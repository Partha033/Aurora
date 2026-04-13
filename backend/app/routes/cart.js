const express = require('express');
const router  = express.Router();
const cartController = require('../controllers/cart');
const { protect } = require('../middlewares/auth');

router.get   ('/',         protect, cartController.get);
router.post  ('/',         protect, cartController.addItem);
router.patch ('/:itemId',  protect, cartController.updateItem);
router.delete('/',         protect, cartController.clearCart);
router.delete('/:itemId',  protect, cartController.removeItem);

module.exports = router;

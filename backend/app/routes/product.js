const express = require('express');
const router  = express.Router();
const productController = require('../controllers/product');
const { protect, isAdmin } = require('../middlewares/auth');
const { upload } = require('../utils/cloudinary');

// Public routes — get lists and single product
router.get('/',    productController.get);
router.get('/:id', productController.get);

// Admin only routes
router.post  ('/',           protect, isAdmin, upload.array('images', 5), productController.create);
router.put   ('/:id',        protect, isAdmin, upload.array('images', 5), productController.update);
router.delete('/:id',        protect, isAdmin, productController.delete);
router.patch ('/:id/toggle', protect, isAdmin, productController.toggle);

module.exports = router;

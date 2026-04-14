const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/product', require('./product'));
router.use('/cart', require('./cart'));
router.use('/order', require('./order'));
router.use('/notification', require('./notification'));

module.exports = router;

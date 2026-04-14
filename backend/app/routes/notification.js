const express = require('express');
const router = express.Router();
const controller = require('../controllers/notification');
const auth = require('../middlewares/auth');

router.get('/', auth.protect, controller.get);
router.patch('/read-all', auth.protect, controller.markAllAsRead);
router.patch('/:id/read', auth.protect, controller.markAsRead);
router.delete('/:id', auth.protect, controller.delete);

module.exports = router;

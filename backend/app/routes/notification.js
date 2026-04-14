const express = require('express');
const router = express.Router();
const controller = require('../controllers/notification');
const auth = require('../middlewares/auth');

router.get('/', auth.verifyToken, controller.get);
router.patch('/read-all', auth.verifyToken, controller.markAllAsRead);
router.patch('/:id/read', auth.verifyToken, controller.markAsRead);
router.delete('/:id', auth.verifyToken, controller.delete);

module.exports = router;

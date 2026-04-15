const express = require('express');
const router  = express.Router();
const settingsController = require('../controllers/settings');
const { protect, isAdmin } = require('../middlewares/auth');

router.get ('/', settingsController.get);
router.put ('/', protect, isAdmin, settingsController.update);

module.exports = router;
const express = require('express');
const router  = express.Router();
const authController = require('../controllers/auth');
const { protect } = require('../middlewares/auth');
const { upload }  = require('../utils/cloudinary');

router.post('/login',   authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout',  authController.logout);
router.get( '/me',      protect, authController.getMe);
router.patch('/profile', protect, authController.updateProfile);
router.patch('/address', protect, authController.updateAddress);
router.patch('/avatar',  protect, upload.single('avatar'), authController.updateAvatar);

module.exports = router;

const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, changePassword, updateProfileImage, verifyEmail } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/login', login);
router.get('/me', auth, getMe);
router.put('/profile', auth, updateProfile);
router.put('/change-password', auth, changePassword);
router.put('/profile-image', auth, updateProfileImage);

module.exports = router;

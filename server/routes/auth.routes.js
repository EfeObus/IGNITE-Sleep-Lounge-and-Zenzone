const express = require('express');
const { login, getMe, logout, updatePassword, validateToken } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { validateStaffLogin } = require('../middleware/validators');

const router = express.Router();

// Public routes
router.post('/login', validateStaffLogin, login);

// Protected routes
router.use(protect); // All routes below this line require authentication
router.get('/me', getMe);
router.get('/validate', validateToken);
router.post('/logout', logout);
router.put('/updatepassword', updatePassword);

module.exports = router;
const express = require('express');
const { 
  registerStudent, 
  getStudent, 
  updateWaiver, 
  getAllStudents,
  searchStudents  // Add the search function
} = require('../controllers/student.controller');
const { protect, authorize } = require('../middleware/auth');
const { validateUserRegistration } = require('../middleware/validators');
const config = require('../config/config');

const router = express.Router();

// Public routes
router.post('/register', validateUserRegistration, registerStudent);

// Routes that may be public or protected
router.put('/student/:studentId/waiver', updateWaiver);  // 👈 Added 'student' prefix

// Protected routes
router.use(protect); // All routes below require authentication
router.get('/student/:studentId', authorize(config.roles.STAFF, config.roles.ADMIN), getStudent);  // 👈 Added 'student' prefix
router.get('/staff/students', authorize(config.roles.STAFF, config.roles.ADMIN), getAllStudents);

// Add the search route
router.get('/search', authorize(config.roles.STAFF, config.roles.ADMIN), searchStudents);

module.exports = router;

const express = require('express');
const adminController = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth');
const { validateStaffUser, validateSettings } = require('../middleware/validators');
const config = require('../config/config');

const router = express.Router();

// All routes are protected and admin-only
router.use(protect);
router.use(authorize(config.roles.ADMIN));

// Staff routes
router.route('/staff')
  .get(adminController.getAllStaff)
  .post(validateStaffUser, adminController.addStaff);

router.route('/staff/:id')
  .put(validateStaffUser, adminController.updateStaff)
  .delete(adminController.deleteStaff);

router.put('/staff/:id/status', adminController.updateStaffStatus);
router.put('/staff/:id/reset-password', adminController.resetStaffPassword);

// Student routes
router.route('/students')
  .get(adminController.getAllStudents);

router.route('/students/:id')
  .put(adminController.updateStudent)
  .delete(adminController.deleteStudent);

// Settings routes
router.route('/settings')
  .get(adminController.getAllSettings)
  .put(validateSettings, adminController.updateSettings);

// Log routes
router.get('/logs', adminController.getLogs);

// Admin statistics
router.get('/stats/campuses', adminController.getCampusStats);
router.get('/stats/overview', adminController.getOverviewStats);

module.exports = router;
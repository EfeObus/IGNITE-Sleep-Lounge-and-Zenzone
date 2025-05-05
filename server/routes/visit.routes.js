const express = require('express');
const { 
  checkInStudent, 
  checkOutStudent, 
  getActiveVisits, 
  getStudentVisitHistory,
  getUsageStats,
  getBedStatus,
  getStationStatus,
  getActivityFeed,
  getDailyStats
} = require('../controllers/visit.controller');
const { protect, authorize, checkServiceAndCampus } = require('../middleware/auth');
const { validateVisitCheckin, validateVisitCheckout } = require('../middleware/validators');
const config = require('../config/config');

const router = express.Router();

// All routes are protected
router.use(protect);

// Staff and admin routes
router.post('/checkin', 
  authorize(config.roles.STAFF, config.roles.ADMIN), 
  validateVisitCheckin, 
  checkInStudent
);

router.put('/checkout/:visitId', 
  authorize(config.roles.STAFF, config.roles.ADMIN), 
  validateVisitCheckout, 
  checkOutStudent
);

router.get('/active/:service/:campus', 
  authorize(config.roles.STAFF, config.roles.ADMIN),
  checkServiceAndCampus(true, true),
  getActiveVisits
);

router.get('/history/:studentId', 
  authorize(config.roles.STAFF, config.roles.ADMIN), 
  getStudentVisitHistory
);

// New routes for staff portal
router.get('/beds/:campus/:service',
  authorize(config.roles.STAFF, config.roles.ADMIN),
  getBedStatus
);

router.get('/stations/:campus',
  authorize(config.roles.STAFF, config.roles.ADMIN),
  getStationStatus
);

router.get('/activity',
  authorize(config.roles.STAFF, config.roles.ADMIN),
  getActivityFeed
);

router.get('/dailystats',
  authorize(config.roles.STAFF, config.roles.ADMIN),
  getDailyStats
);

// Admin only routes
router.get('/stats', 
  authorize(config.roles.ADMIN), 
  getUsageStats
);

module.exports = router;
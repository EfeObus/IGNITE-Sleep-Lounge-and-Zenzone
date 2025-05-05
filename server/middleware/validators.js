const { body, validationResult } = require('express-validator');
const ErrorResponse = require('../utils/errorResponse');
const config = require('../config/config');

// Process validation results
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse(errors.array().map(err => err.msg).join(', '), 400));
  }
  next();
};

// User Registration Validation
exports.validateUserRegistration = [
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('studentId')
    .notEmpty()
    .withMessage('Student ID is required')
    .matches(/^[a-zA-Z0-9]{1,10}$/)
    .withMessage('Student ID must contain only letters and numbers (max 10 characters)'),
  body('program')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Program cannot exceed 100 characters'),
  body('phone')
    .optional()
    .matches(/^[0-9+\-\s()]*$/)
    .withMessage('Please provide a valid phone number'),
  body('agreedToWaiver')
    .isBoolean()
    .withMessage('Waiver agreement is required')
    .custom(value => {
      if (!value) {
        throw new Error('You must agree to the waiver to register');
      }
      return true;
    }),
  validateRequest
];

// Staff Login Validation
exports.validateStaffLogin = [
  body('staffId')
    .notEmpty()
    .withMessage('Staff ID is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body('service')
    .optional()
    .isIn(config.services)
    .withMessage('Invalid service selected'),
  body('campus')
    .optional()
    .isIn(config.campuses)
    .withMessage('Invalid campus selected'),
  validateRequest
];

// Visit Check-in Validation
exports.validateVisitCheckin = [
  body('studentId')
    .notEmpty()
    .withMessage('Student ID is required')
    .matches(/^[a-zA-Z0-9]{1,10}$/)
    .withMessage('Student ID must contain only letters and numbers (max 10 characters)'),
  body('service')
    .notEmpty()
    .withMessage('Service is required')
    .isIn(config.services)
    .withMessage('Invalid service selected'),
  body('campus')
    .notEmpty()
    .withMessage('Campus is required')
    .isIn(config.campuses)
    .withMessage('Invalid campus selected'),
  body('bedNumber')
    .optional()
    .isNumeric()
    .withMessage('Bed number must be a number'),
  validateRequest
];

// Visit Check-out Validation
exports.validateVisitCheckout = [
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
  validateRequest
];

// Staff Creation/Update Validation
exports.validateStaffUser = [
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn([config.roles.ADMIN, config.roles.STAFF])
    .withMessage('Invalid role selected'),
  body('campus')
    .optional({ nullable: true })
    .custom(value => {
      if (value && !config.campuses.includes(value)) {
        throw new Error('Invalid campus selected');
      }
      return true;
    }),
  body('service')
    .optional({ nullable: true })
    .custom(value => {
      if (value && !config.services.includes(value)) {
        throw new Error('Invalid service selected');
      }
      return true;
    }),
  body('password')
    .if(body('_method').not().equals('PUT'))
    .notEmpty()
    .withMessage('Password is required for new staff')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  validateRequest
];

// Settings Update Validation
exports.validateSettings = [
  body('campus')
    .notEmpty()
    .withMessage('Campus is required')
    .isIn(config.campuses)
    .withMessage('Invalid campus selected'),
  body('service')
    .notEmpty()
    .withMessage('Service is required')
    .isIn(config.services)
    .withMessage('Invalid service selected'),
  body('timeLimit')
    .notEmpty()
    .withMessage('Time limit is required')
    .isInt({ min: 1, max: 120 })
    .withMessage('Time limit must be between 1 and 120 minutes'),
  body('bedCount')
    .if(body('service').equals('sleep-lounge'))
    .notEmpty()
    .withMessage('Bed count is required for Sleep Lounge')
    .isInt({ min: 1 })
    .withMessage('Bed count must be at least 1'),
  body('openTime')
    .notEmpty()
    .withMessage('Open time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Open time must be in HH:MM format'),
  body('closeTime')
    .notEmpty()
    .withMessage('Close time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Close time must be in HH:MM format'),
  validateRequest
];
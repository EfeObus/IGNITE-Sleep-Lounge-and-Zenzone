const jwt = require('jsonwebtoken');
const { User } = require('../models');
const ErrorResponse = require('../utils/errorResponse');
const { verifyToken } = require('../utils/jwtUtils');
const config = require('../config/config');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  // Check for token in cookies, headers or query
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    // Find user
    const user = await User.findByPk(decoded.id);

    if (!user || !user.active) {
      return next(new ErrorResponse('User not found or account disabled', 401));
    }

    // Add user to request
    req.user = user;
    next();
  } catch (err) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(`User role ${req.user.role} is not authorized to access this route`, 403)
      );
    }
    next();
  };
};

// Check if a user is assigned to a specific service and/or campus
exports.checkServiceAndCampus = (requireService = false, requireCampus = false) => {
  return (req, res, next) => {
    const { service, campus } = req.params;
    
    // Get service and campus from params, query, or body
    const serviceToCheck = service || req.query.service || (req.body && req.body.service);
    const campusToCheck = campus || req.query.campus || (req.body && req.body.campus);
    
    // Validate service if required
    if (requireService && serviceToCheck) {
      if (!config.services.includes(serviceToCheck)) {
        return next(new ErrorResponse(`Invalid service: ${serviceToCheck}`, 400));
      }
      
      // Check if user can access this service at this campus
      if (!req.user.canAccessService(serviceToCheck, campusToCheck)) {
        return next(new ErrorResponse(`Not authorized to access ${serviceToCheck} service at ${campusToCheck || 'this'} campus`, 403));
      }
    }
    
    // Validate campus if required
    if (requireCampus && campusToCheck) {
      if (!config.campuses.includes(campusToCheck)) {
        return next(new ErrorResponse(`Invalid campus: ${campusToCheck}`, 400));
      }
      
      // Check if user can access this campus
      if (!req.user.canAccessCampus(campusToCheck)) {
        return next(new ErrorResponse(`Not authorized to access ${campusToCheck} campus`, 403));
      }
    }
    
    // Check invalid combinations
    if (campusToCheck === 'north' && serviceToCheck === 'zen-zone') {
      return next(new ErrorResponse('Zen Zone service is not available at North campus', 400));
    }
    
    next();
  };
};
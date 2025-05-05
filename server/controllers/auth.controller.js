const { User, Log } = require('../models');
const ErrorResponse = require('../utils/errorResponse');
const { generateToken } = require('../utils/jwtUtils');
const config = require('../config/config');

// @desc    Login staff user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { staffId, password, service, campus } = req.body;

    // Check if user exists by staffId (not email)
    const user = await User.findOne({ where: { staffId } });

    if (!user) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if user is staff or admin
    if (user.role !== config.roles.STAFF && user.role !== config.roles.ADMIN) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if user is active
    if (!user.active) {
      return next(new ErrorResponse('Your account has been disabled. Please contact an administrator.', 401));
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check campus access permission
    if (!user.canAccessCampus(campus)) {
      return next(new ErrorResponse('You do not have permission to access this campus', 403));
    }
    
    // Check service access permission for this campus
    if (!user.canAccessService(service, campus)) {
      return next(new ErrorResponse(`You do not have permission to access ${service} at ${campus} campus`, 403));
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Create log entry
    await Log.create({
      userId: user.id,
      action: 'login',
      details: `Staff logged in at ${campus} campus for ${service} service`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Include campus and service in the token data
    sendTokenResponse(user, 200, res, { campus, service });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Log user out / clear cookie
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    // Create log entry
    await Log.create({
      userId: req.user.id,
      action: 'logout',
      details: 'User logged out',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(new ErrorResponse('Please provide current and new password', 400));
    }

    const user = await User.findByPk(req.user.id);

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return next(new ErrorResponse('Current password is incorrect', 401));
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Create log entry
    await Log.create({
      userId: user.id,
      action: 'password_update',
      details: 'User updated password',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @desc    Validate JWT token
// @route   GET /api/auth/validate
// @access  Private
exports.validateToken = async (req, res, next) => {
  try {
    // If this route is reached, the auth middleware has already validated the token
    // Just return success
    res.status(200).json({
      success: true,
      valid: true,
      data: {
        user: {
          id: req.user.id,
          role: req.user.role
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res, additionalData = {}) => {
  // Create token
  const token = generateToken({ id: user.id, ...additionalData });

  const options = {
    expires: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  // Remove password from output
  user.password = undefined;

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      data: user
    });
};
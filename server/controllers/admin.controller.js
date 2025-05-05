const { User, Visit, Setting, Log } = require('../models');
const ErrorResponse = require('../utils/errorResponse');
const { Op } = require('sequelize');
const config = require('../config/config');
const bcrypt = require('bcryptjs');

// STAFF MANAGEMENT

// @desc    Get all staff
// @route   GET /api/admin/staff
// @access  Private (Admin only)
exports.getAllStaff = async (req, res, next) => {
  try {
    const { search, campus, service, page = 1, limit = 20 } = req.query;
    
    let whereClause = { 
      role: {
        [Op.in]: [config.roles.ADMIN, config.roles.STAFF]
      }
    };
    
    // Apply search filter if provided
    if (search) {
      whereClause = {
        ...whereClause,
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ]
      };
    }
    
    // Apply campus and service filters
    if (campus) {
      whereClause.campus = campus;
    }
    
    if (service) {
      whereClause.service = service;
    }
    
    // Get paginated results
    const offset = (page - 1) * limit;
    
    const { count, rows: staff } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      offset,
      limit: parseInt(limit),
      order: [['lastName', 'ASC'], ['firstName', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      count,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      },
      data: staff
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add staff member
// @route   POST /api/admin/staff
// @access  Private (Admin only)
exports.addStaff = async (req, res, next) => {
  try {
    const { firstName, lastName, email, role, campus, service, password, staffId, campusAccess } = req.body;
    
    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return next(new ErrorResponse('Email already in use', 400));
    }
    
    // Check if staffId already exists
    if (staffId) {
      const existingStaffId = await User.findOne({ where: { staffId } });
      if (existingStaffId) {
        return next(new ErrorResponse('Staff ID already in use', 400));
      }
    }
    
    // Validate required fields
    if (!firstName || !lastName || !email || !staffId || !campusAccess) {
      return next(new ErrorResponse('Please provide all required fields', 400));
    }
    
    // Create the staff member
    const staff = await User.create({
      firstName,
      lastName,
      email,
      staffId,
      role: role || config.roles.STAFF,
      campus,
      service,
      campusAccess: campusAccess || 'north-only',
      password,
      active: true
    });
    
    // Create log entry
    await Log.create({
      userId: req.user.id,
      action: 'staff_created',
      details: `New staff member added: ${firstName} ${lastName} (${email}) - ID: ${staffId}, Campus Access: ${campusAccess}`,
      resourceId: staff.id,
      resourceType: 'User',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // Remove password from response
    const staffResponse = staff.toJSON();
    delete staffResponse.password;
    
    res.status(201).json({
      success: true,
      data: staffResponse
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update staff
// @route   PUT /api/admin/staff/:id
// @access  Private (Admin only)
exports.updateStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, role, campus, service, active } = req.body;
    
    // Find the staff member
    const staff = await User.findByPk(id);
    
    if (!staff) {
      return next(new ErrorResponse('Staff member not found', 404));
    }
    
    // Check if staff member is admin (can't update admin role)
    if (staff.role === config.roles.ADMIN && role !== config.roles.ADMIN) {
      return next(new ErrorResponse('Cannot change admin role', 400));
    }
    
    // Update fields
    staff.firstName = firstName || staff.firstName;
    staff.lastName = lastName || staff.lastName;
    staff.email = email || staff.email;
    staff.role = role || staff.role;
    staff.campus = campus || staff.campus;
    staff.service = service || staff.service;
    
    if (active !== undefined) {
      staff.active = active;
    }
    
    await staff.save();
    
    // Create log entry
    await Log.create({
      userId: req.user.id,
      action: 'staff_updated',
      details: `Staff member updated: ${staff.firstName} ${staff.lastName} (${staff.email})`,
      resourceId: staff.id,
      resourceType: 'User',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // Remove password from response
    const staffResponse = staff.toJSON();
    delete staffResponse.password;
    
    res.status(200).json({
      success: true,
      data: staffResponse
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete staff
// @route   DELETE /api/admin/staff/:id
// @access  Private (Admin only)
exports.deleteStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find the staff member
    const staff = await User.findByPk(id);
    
    if (!staff) {
      return next(new ErrorResponse('Staff member not found', 404));
    }
    
    // Check if staff member is admin (can't delete admin)
    if (staff.role === config.roles.ADMIN) {
      return next(new ErrorResponse('Cannot delete admin user', 400));
    }
    
    // Create log entry before deleting
    await Log.create({
      userId: req.user.id,
      action: 'staff_deleted',
      details: `Staff member deleted: ${staff.firstName} ${staff.lastName} (${staff.email})`,
      resourceId: staff.id,
      resourceType: 'User',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // Delete the staff member
    await staff.destroy();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Enable/disable staff
// @route   PUT /api/admin/staff/:id/status
// @access  Private (Admin only)
exports.updateStaffStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { active } = req.body;
    
    if (active === undefined) {
      return next(new ErrorResponse('Please provide active status', 400));
    }
    
    // Find the staff member
    const staff = await User.findByPk(id);
    
    if (!staff) {
      return next(new ErrorResponse('Staff member not found', 404));
    }
    
    // Check if staff member is admin (can't disable admin)
    if (staff.role === config.roles.ADMIN && !active) {
      return next(new ErrorResponse('Cannot disable admin user', 400));
    }
    
    // Update status
    staff.active = active;
    await staff.save();
    
    // Create log entry
    await Log.create({
      userId: req.user.id,
      action: active ? 'staff_enabled' : 'staff_disabled',
      details: `Staff member ${active ? 'enabled' : 'disabled'}: ${staff.firstName} ${staff.lastName} (${staff.email})`,
      resourceId: staff.id,
      resourceType: 'User',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(200).json({
      success: true,
      data: {
        id: staff.id,
        active: staff.active
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reset staff password
// @route   PUT /api/admin/staff/:id/reset-password
// @access  Private (Admin only)
exports.resetStaffPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    
    if (!newPassword) {
      return next(new ErrorResponse('Please provide a new password', 400));
    }
    
    // Find the staff member
    const staff = await User.findByPk(id);
    
    if (!staff) {
      return next(new ErrorResponse('Staff member not found', 404));
    }
    
    // Reset password
    staff.password = newPassword;
    await staff.save();
    
    // Create log entry
    await Log.create({
      userId: req.user.id,
      action: 'password_reset',
      details: `Password reset for staff member: ${staff.firstName} ${staff.lastName} (${staff.email})`,
      resourceId: staff.id,
      resourceType: 'User',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(200).json({
      success: true,
      data: {
        id: staff.id,
        message: 'Password reset successful'
      }
    });
  } catch (err) {
    next(err);
  }
};

// STUDENT MANAGEMENT (ADMIN ONLY)

// @desc    Get all students (admin)
// @route   GET /api/admin/students
// @access  Private (Admin only)
exports.getAllStudents = async (req, res, next) => {
  try {
    const { search, program, page = 1, limit = 20 } = req.query;
    
    let whereClause = { role: config.roles.STUDENT };
    
    // Apply search filter if provided
    if (search) {
      whereClause = {
        ...whereClause,
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { studentId: { [Op.iLike]: `%${search}%` } }
        ]
      };
    }
    
    // Apply program filter
    if (program) {
      whereClause.program = { [Op.iLike]: `%${program}%` };
    }
    
    // Get paginated results
    const offset = (page - 1) * limit;
    
    const { count, rows: students } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      offset,
      limit: parseInt(limit),
      order: [['lastName', 'ASC'], ['firstName', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      count,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      },
      data: students
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update student details (admin)
// @route   PUT /api/admin/students/:id
// @access  Private (Admin only)
exports.updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, studentId, program, phone, active } = req.body;
    
    // Find the student
    const student = await User.findOne({
      where: {
        id,
        role: config.roles.STUDENT
      }
    });
    
    if (!student) {
      return next(new ErrorResponse('Student not found', 404));
    }
    
    // Update fields
    if (firstName) student.firstName = firstName;
    if (lastName) student.lastName = lastName;
    if (email) student.email = email;
    if (studentId) student.studentId = studentId;
    if (program) student.program = program;
    if (phone !== undefined) student.phone = phone;
    if (active !== undefined) student.active = active;
    
    await student.save();
    
    // Create log entry
    await Log.create({
      userId: req.user.id,
      action: 'student_updated',
      details: `Student updated by admin: ${student.firstName} ${student.lastName} (${student.studentId})`,
      resourceId: student.id,
      resourceType: 'User',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(200).json({
      success: true,
      data: student
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete student (admin)
// @route   DELETE /api/admin/students/:id
// @access  Private (Admin only)
exports.deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find the student
    const student = await User.findOne({
      where: {
        id,
        role: config.roles.STUDENT
      }
    });
    
    if (!student) {
      return next(new ErrorResponse('Student not found', 404));
    }
    
    // Check if student has active visits
    const activeVisits = await Visit.count({
      where: {
        studentId: student.id,
        status: 'active'
      }
    });
    
    if (activeVisits > 0) {
      return next(new ErrorResponse('Cannot delete student with active visits', 400));
    }
    
    // Create log entry before deleting
    await Log.create({
      userId: req.user.id,
      action: 'student_deleted',
      details: `Student deleted by admin: ${student.firstName} ${student.lastName} (${student.studentId})`,
      resourceId: student.id,
      resourceType: 'User',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // Delete the student
    await student.destroy();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// SETTINGS MANAGEMENT

// @desc    Get all settings
// @route   GET /api/admin/settings
// @access  Private (Admin only)
exports.getAllSettings = async (req, res, next) => {
  try {
    const settings = await Setting.findAll({
      order: [['campus', 'ASC'], ['service', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      count: settings.length,
      data: settings
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update or create setting
// @route   PUT /api/admin/settings
// @access  Private (Admin only)
exports.updateSettings = async (req, res, next) => {
  try {
    const { campus, service, bedCount, timeLimit, openTime, closeTime } = req.body;
    
    // Find existing setting or create new one
    let setting = await Setting.findOne({
      where: {
        campus,
        service
      }
    });
    
    if (setting) {
      // Update existing setting
      setting.bedCount = bedCount !== undefined ? bedCount : setting.bedCount;
      setting.timeLimit = timeLimit !== undefined ? timeLimit : setting.timeLimit;
      setting.openTime = openTime || setting.openTime;
      setting.closeTime = closeTime || setting.closeTime;
      
      await setting.save();
    } else {
      // Create new setting
      setting = await Setting.create({
        campus,
        service,
        bedCount,
        timeLimit,
        openTime,
        closeTime
      });
    }
    
    // Create log entry
    await Log.create({
      userId: req.user.id,
      action: 'settings_updated',
      details: `Settings updated for ${service} at ${campus} campus`,
      resourceId: setting.id,
      resourceType: 'Setting',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(200).json({
      success: true,
      data: setting
    });
  } catch (err) {
    next(err);
  }
};

// LOGS MANAGEMENT

// @desc    Get system logs
// @route   GET /api/admin/logs
// @access  Private (Admin only)
exports.getLogs = async (req, res, next) => {
  try {
    const { action, userId, startDate, endDate, page = 1, limit = 50 } = req.query;
    
    let whereClause = {};
    
    // Apply filters
    if (action) {
      whereClause.action = action;
    }
    
    if (userId) {
      whereClause.userId = userId;
    }
    
    // Apply date filters
    if (startDate || endDate) {
      whereClause.createdAt = {};
      
      if (startDate) {
        whereClause.createdAt[Op.gte] = new Date(startDate);
      }
      
      if (endDate) {
        whereClause.createdAt[Op.lte] = new Date(endDate);
      }
    }
    
    // Get paginated results
    const offset = (page - 1) * limit;
    
    const { count, rows: logs } = await Log.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName', 'email', 'role']
        }
      ],
      offset,
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      count,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      },
      data: logs
    });
  } catch (err) {
    next(err);
  }
};

// ADMIN STATISTICS

// @desc    Get campus statistics
// @route   GET /api/admin/stats/campuses
// @access  Private (Admin only)
exports.getCampusStats = async (req, res, next) => {
  try {
    // Get current date range (today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get active staff count for each campus
    const northStaff = await User.findAll({
      where: {
        role: { [Op.in]: [config.roles.ADMIN, config.roles.STAFF] },
        active: true,
        [Op.or]: [
          { campus: 'north' },
          { campusAccess: { [Op.in]: ['north-only', 'both-campuses'] } }
        ]
      },
      attributes: ['id', 'firstName', 'lastName', 'staffId', 'role']
    });
    
    const lakeshoreStaff = await User.findAll({
      where: {
        role: { [Op.in]: [config.roles.ADMIN, config.roles.STAFF] },
        active: true,
        [Op.or]: [
          { campus: 'lakeshore' },
          { campusAccess: { [Op.in]: ['lakeshore-only', 'both-campuses'] } }
        ]
      },
      attributes: ['id', 'firstName', 'lastName', 'staffId', 'role']
    });
    
    // Get total visits for today by campus
    const northVisitsToday = await Visit.count({
      where: {
        campus: 'north',
        checkInTime: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    });
    
    const lakeshoreVisitsToday = await Visit.count({
      where: {
        campus: 'lakeshore',
        checkInTime: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    });
    
    // Get active visits count by campus
    const northActiveVisits = await Visit.count({
      where: {
        campus: 'north',
        status: 'active'
      }
    });
    
    const lakeshoreActiveVisits = await Visit.count({
      where: {
        campus: 'lakeshore',
        status: 'active'
      }
    });
    
    // Get settings for each campus
    const northSettings = await Setting.findOne({
      where: {
        campus: 'north',
        service: 'sleep-lounge'
      }
    });
    
    const lakeshoreSettings = await Setting.findOne({
      where: {
        campus: 'lakeshore',
        service: 'sleep-lounge'
      }
    });
    
    // Format response
    const campusStats = {
      north: {
        status: isOpen(northSettings?.openTime, northSettings?.closeTime) ? 'Open' : 'Closed',
        totalBeds: northSettings?.bedCount || 12,
        bedsAvailable: (northSettings?.bedCount || 12) - northActiveVisits,
        usageToday: northVisitsToday,
        staff: northStaff
      },
      lakeshore: {
        status: isOpen(lakeshoreSettings?.openTime, lakeshoreSettings?.closeTime) ? 'Open' : 'Closed',
        totalBeds: lakeshoreSettings?.bedCount || 12,
        bedsAvailable: (lakeshoreSettings?.bedCount || 12) - lakeshoreActiveVisits,
        usageToday: lakeshoreVisitsToday,
        staff: lakeshoreStaff
      }
    };
    
    res.status(200).json({
      success: true,
      data: campusStats
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get overview statistics for admin dashboard
// @route   GET /api/admin/stats/overview
// @access  Private (Admin only)
exports.getOverviewStats = async (req, res, next) => {
  try {
    // Get total registered students
    const totalStudents = await User.count({
      where: {
        role: config.roles.STUDENT
      }
    });
    
    // Get total staff members
    const totalStaff = await User.count({
      where: {
        role: { [Op.in]: [config.roles.ADMIN, config.roles.STAFF] }
      }
    });
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get total visits for today
    const totalVisitsToday = await Visit.count({
      where: {
        checkInTime: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    });
    
    // Check if there are any system issues
    const systemStatus = 'All Systems Operational';
    
    res.status(200).json({
      success: true,
      data: {
        systemStatus,
        totalRegistrations: totalStudents,
        totalStaff,
        totalUsageToday: totalVisitsToday
      }
    });
  } catch (err) {
    next(err);
  }
};

// Helper function to check if a service is currently open
function isOpen(openTime, closeTime) {
  if (!openTime || !closeTime) return true; // Default to open if no times set
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Parse times (format: "HH:MM")
  const [openHour, openMinute] = (openTime || "09:00").split(':').map(Number);
  const [closeHour, closeMinute] = (closeTime || "16:00").split(':').map(Number);
  
  // Convert to minutes for easy comparison
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  const openTimeInMinutes = openHour * 60 + openMinute;
  const closeTimeInMinutes = closeHour * 60 + closeMinute;
  
  return currentTimeInMinutes >= openTimeInMinutes && currentTimeInMinutes < closeTimeInMinutes;
}
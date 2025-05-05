const { Visit, User, Setting, Log } = require('../models');
const ErrorResponse = require('../utils/errorResponse');
const { Op, fn, col, where, literal } = require('sequelize');
const config = require('../config/config');

// @desc    Check in a student
// @route   POST /api/visits/checkin
// @access  Private (Staff only)
exports.checkInStudent = async (req, res, next) => {
  try {
    const { userId, studentId, service, campus, bedNumber, notes } = req.body;
    
    // Find the student - using userId if provided, otherwise fallback to studentId
    let whereClause = {
      role: config.roles.STUDENT
    };
    
    if (userId) {
      // If userId is provided (UUID format), use it as the primary search criteria
      whereClause.id = userId;
    } else if (studentId) {
      // If only studentId is provided, search by studentId
      whereClause.studentId = studentId;
    } else {
      return next(new ErrorResponse('Either userId or studentId must be provided', 400));
    }
    
    const student = await User.findOne({
      where: whereClause
    });
    
    if (!student) {
      return next(new ErrorResponse('Student not found', 404));
    }
    
    // Check if student has agreed to waiver
    if (!student.agreedToWaiver) {
      return next(new ErrorResponse('Student has not agreed to the waiver', 400));
    }
    
    // Check if student is already checked in to the same service
    const activeVisit = await Visit.findOne({
      where: {
        studentId: student.id,
        status: 'active',
        service, // Same service only
      }
    });

    if (activeVisit) {
      return next(new ErrorResponse('Student is already checked in to this service', 400));
    }
    
    // For Sleep Lounge: Check bed availability
    if (service === 'sleep-lounge') {
      if (!bedNumber) {
        return next(new ErrorResponse('Bed number is required for Sleep Lounge', 400));
      }
      
      // Get settings for this campus/service
      const settings = await Setting.findOne({
        where: { campus, service }
      });
      
      if (!settings) {
        return next(new ErrorResponse(`Settings not found for ${service} at ${campus} campus`, 404));
      }
      
      // Check if the bed number is valid
      if (bedNumber <= 0 || bedNumber > settings.bedCount) {
        return next(new ErrorResponse(`Invalid bed number. Must be between 1 and ${settings.bedCount}`, 400));
      }
      
      // Check if bed is already in use
      const occupiedBed = await Visit.findOne({
        where: {
          service,
          campus,
          bedNumber,
          status: 'active'
        }
      });
      
      if (occupiedBed) {
        return next(new ErrorResponse(`Bed ${bedNumber} is already occupied`, 400));
      }
    }
    
    // Create the visit
    const visit = await Visit.create({
      studentId: student.id,
      staffId: req.user.id,
      service,
      campus,
      bedNumber: service === 'sleep-lounge' ? bedNumber : null,
      notes,
      status: 'active'
    });
    
    // Create log entry
    await Log.create({
      userId: req.user.id,
      action: 'student_checkin',
      details: `Student ${student.studentId} checked in to ${service} at ${campus}`,
      resourceId: visit.id,
      resourceType: 'Visit',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(201).json({
      success: true,
      data: visit
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Check out a student
// @route   PUT /api/visits/checkout/:visitId
// @access  Private (Staff only)
exports.checkOutStudent = async (req, res, next) => {
  try {
    const { visitId } = req.params;
    const { notes } = req.body;
    
    // Find the visit
    const visit = await Visit.findByPk(visitId);
    
    if (!visit) {
      return next(new ErrorResponse('Visit not found', 404));
    }
    
    // Check if visit is already completed
    if (visit.status !== 'active') {
      return next(new ErrorResponse('Visit is already checked out', 400));
    }
    
    // Check if staff is authorized for this campus and service
    if (req.user.role !== config.roles.ADMIN) {
      const canAccessCampus = req.user.canAccessCampus(visit.campus);
      const canAccessService = req.user.canAccessService(visit.service, visit.campus);
      
      if (!canAccessCampus || !canAccessService) {
        return next(new ErrorResponse('Not authorized to checkout for this campus or service', 403));
      }
    }
    
    // Update the visit
    visit.checkOutTime = new Date();
    visit.status = 'completed';
    if (notes) {
      visit.notes = visit.notes ? `${visit.notes}\n${notes}` : notes;
    }
    await visit.save();
    
    // Create log entry
    await Log.create({
      userId: req.user.id,
      action: 'student_checkout',
      details: `Student checked out from ${visit.service} at ${visit.campus}`,
      resourceId: visit.id,
      resourceType: 'Visit',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    res.status(200).json({
      success: true,
      data: visit
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all active visits for a service and campus
// @route   GET /api/visits/active/:service/:campus
// @access  Private (Staff & Admin)
exports.getActiveVisits = async (req, res, next) => {
  try {
    const { service, campus } = req.params;
    
    // Check if service and campus are valid
    if (!config.services.includes(service)) {
      return next(new ErrorResponse(`Invalid service: ${service}`, 400));
    }
    
    if (!config.campuses.includes(campus)) {
      return next(new ErrorResponse(`Invalid campus: ${campus}`, 400));
    }
    
    // Get all active visits for this service and campus
    const visits = await Visit.findAll({
      where: {
        service,
        campus,
        status: 'active'
      },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'firstName', 'lastName', 'studentId', 'email', 'program', 'phone']
        }
      ],
      order: [['checkInTime', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      count: visits.length,
      data: visits
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get visit history for a student
// @route   GET /api/visits/history/:studentId
// @access  Private (Staff & Admin)
exports.getStudentVisitHistory = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Find the student
    const student = await User.findOne({
      where: {
        [Op.or]: [
          { id: studentId },
          { studentId }
        ],
        role: config.roles.STUDENT
      }
    });
    
    if (!student) {
      return next(new ErrorResponse('Student not found', 404));
    }
    
    // Get paginated visit history
    const offset = (page - 1) * limit;
    
    const { count, rows: visits } = await Visit.findAndCountAll({
      where: {
        studentId: student.id
      },
      include: [
        {
          model: User,
          as: 'staff',
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      order: [['checkInTime', 'DESC']],
      offset,
      limit: parseInt(limit)
    });
    
    res.status(200).json({
      success: true,
      count,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      },
      data: visits
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get usage statistics
// @route   GET /api/visits/stats
// @access  Private (Admin only)
exports.getUsageStats = async (req, res, next) => {
  try {
    const { startDate, endDate, campus, service } = req.query;
    
    let whereClause = {};
    
    // Apply date filters
    if (startDate && endDate) {
      whereClause.checkInTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereClause.checkInTime = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.checkInTime = {
        [Op.lte]: new Date(endDate)
      };
    }
    
    // Apply campus and service filters
    if (campus) {
      whereClause.campus = campus;
    }
    
    if (service) {
      whereClause.service = service;
    }
    
    // Get total visits
    const totalVisits = await Visit.count({ where: whereClause });
    
    // Get visits by campus
    const visitsByCampus = await Visit.findAll({
      attributes: [
        'campus',
        [fn('COUNT', col('id')), 'count']
      ],
      where: whereClause,
      group: ['campus']
    });
    
    // Get visits by service
    const visitsByService = await Visit.findAll({
      attributes: [
        'service',
        [fn('COUNT', col('id')), 'count']
      ],
      where: whereClause,
      group: ['service']
    });
    
    // Get visits by day
    const visitsByDay = await Visit.findAll({
      attributes: [
        [fn('date_trunc', 'day', col('checkInTime')), 'day'],
        [fn('COUNT', col('id')), 'count']
      ],
      where: whereClause,
      group: [fn('date_trunc', 'day', col('checkInTime'))],
      order: [[fn('date_trunc', 'day', col('checkInTime')), 'ASC']]
    });
    
    // Get average visit duration
    const avgDuration = await Visit.findAll({
      attributes: [
        [fn('AVG', fn('EXTRACT', literal('epoch FROM ("checkOutTime" - "checkInTime")')), 'avgDurationSeconds')]
      ],
      where: {
        ...whereClause,
        checkOutTime: { [Op.not]: null }
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        totalVisits,
        visitsByCampus,
        visitsByService,
        visitsByDay,
        avgDuration: avgDuration[0]?.getDataValue('avgDurationSeconds') || 0
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get bed status for Sleep Lounge
// @route   GET /api/visits/beds/:campus/:service
// @access  Private (Staff & Admin)
exports.getBedStatus = async (req, res, next) => {
  try {
    const { campus, service } = req.params;
    
    // Check if service and campus are valid
    if (service !== 'sleep-lounge') {
      return next(new ErrorResponse(`Invalid service: ${service}`, 400));
    }
    
    if (!config.campuses.includes(campus)) {
      return next(new ErrorResponse(`Invalid campus: ${campus}`, 400));
    }
    
    // Get settings for this campus/service
    const settings = await Setting.findOne({
      where: { campus, service }
    });
    
    if (!settings) {
      return next(new ErrorResponse(`Settings not found for ${service} at ${campus} campus`, 404));
    }
    
    // Get all active visits for this service and campus
    const activeVisitsCount = await Visit.count({
      where: {
        service,
        campus,
        status: 'active'
      }
    });
    
    const totalBeds = settings.bedCount || 12; // Default to 12 beds if not set
    const availableBeds = totalBeds - activeVisitsCount;
    
    res.status(200).json({
      success: true,
      data: {
        totalBeds,
        availableBeds,
        occupiedBeds: activeVisitsCount
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get zen zone station status
// @route   GET /api/visits/stations/:campus
// @access  Private (Staff & Admin)
exports.getStationStatus = async (req, res, next) => {
  try {
    const { campus } = req.params;
    
    // Check if campus is valid
    if (!config.campuses.includes(campus)) {
      return next(new ErrorResponse(`Invalid campus: ${campus}`, 400));
    }
    
    // Get settings for this campus/service
    const settings = await Setting.findOne({
      where: { campus, service: 'zen-zone' }
    });
    
    if (!settings) {
      return next(new ErrorResponse(`Settings not found for zen-zone at ${campus} campus`, 404));
    }
    
    // Get all active visits for zen-zone at this campus
    const activeVisitsCount = await Visit.count({
      where: {
        service: 'zen-zone',
        campus,
        status: 'active'
      }
    });
    
    const totalStations = settings.stationCount || 6; // Default to 6 stations if not set
    const availableStations = totalStations - activeVisitsCount;
    
    res.status(200).json({
      success: true,
      data: {
        totalStations,
        availableStations,
        occupiedStations: activeVisitsCount
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get recent activity feed for a service and campus
// @route   GET /api/visits/activity
// @access  Private (Staff & Admin)
exports.getActivityFeed = async (req, res, next) => {
  try {
    const { campus, service, limit = 10 } = req.query;
    
    // Validate inputs
    if (!campus || !service) {
      return next(new ErrorResponse('Campus and service are required', 400));
    }
    
    if (!config.campuses.includes(campus)) {
      return next(new ErrorResponse(`Invalid campus: ${campus}`, 400));
    }
    
    if (!config.services.includes(service)) {
      return next(new ErrorResponse(`Invalid service: ${service}`, 400));
    }
    
    // Get recent checkins and checkouts
    const visits = await Visit.findAll({
      where: {
        campus,
        service
      },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'firstName', 'lastName', 'studentId', 'email']
        }
      ],
      order: [
        ['checkInTime', 'DESC']
      ],
      limit: parseInt(limit)
    });
    
    // Format the activities
    const activities = visits.map(visit => {
      const isCheckout = visit.checkOutTime !== null;
      
      return {
        id: visit.id,
        type: isCheckout ? 'check-out' : 'check-in',
        student: visit.student,
        bedNumber: visit.bedNumber,
        timestamp: isCheckout ? visit.checkOutTime : visit.checkInTime,
        notes: visit.notes
      };
    });
    
    res.status(200).json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get daily statistics for a service and campus
// @route   GET /api/visits/dailystats
// @access  Private (Staff & Admin)
exports.getDailyStats = async (req, res, next) => {
  try {
    const { campus, service } = req.query;
    
    // Validate inputs
    if (!campus || !service) {
      return next(new ErrorResponse('Campus and service are required', 400));
    }
    
    // Set date range to today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get total visits for today
    const todaysVisits = await Visit.count({
      where: {
        campus,
        service,
        checkInTime: {
          [Op.gte]: today,
          [Op.lt]: tomorrow
        }
      }
    });
    
    // Get average duration of completed visits
    const avgDurationResult = await Visit.findAll({
      attributes: [
        [fn('AVG', fn('EXTRACT', literal('epoch FROM ("checkOutTime" - "checkInTime")'))), 'avgDurationSeconds']
      ],
      where: {
        campus,
        service,
        checkOutTime: { [Op.not]: null },
        status: 'completed'
      }
    });
    
    // Convert seconds to minutes
    const avgDurationSeconds = avgDurationResult[0]?.getDataValue('avgDurationSeconds') || 0;
    const avgDuration = Math.round(avgDurationSeconds / 60); // Convert to minutes
    
    res.status(200).json({
      success: true,
      data: {
        todaysVisits,
        avgDuration
      }
    });
  } catch (err) {
    next(err);
  }
};
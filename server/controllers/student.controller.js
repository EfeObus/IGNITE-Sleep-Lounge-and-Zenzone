const { User, Log, Visit } = require('../models');
const ErrorResponse = require('../utils/errorResponse');
const { Op } = require('sequelize');
const config = require('../config/config');

// @desc    Register a new student
// @route   POST /api/users/register
// @access  Public
exports.registerStudent = async (req, res, next) => {
  try {
    const { firstName, lastName, email, studentId, program, phone, agreedToWaiver } = req.body;

    // Build the OR conditions based on provided values
    const orConditions = [];
    if (email) orConditions.push({ email });
    if (studentId) orConditions.push({ studentId });
    if (phone && phone.trim() !== '') orConditions.push({ phone });

    // Check if student already exists
    const existingStudent = await User.findOne({
      where: {
        [Op.or]: orConditions
      }
    });

    if (existingStudent) {
      if (existingStudent.email === email) {
        return next(new ErrorResponse('Email address already in use', 400));
      }
      if (existingStudent.studentId === studentId) {
        return next(new ErrorResponse('Student ID already in use', 400));
      }
      if (phone && phone.trim() !== '' && existingStudent.phone === phone) {
        return next(new ErrorResponse('Phone number already in use', 400));
      }
      return next(new ErrorResponse('Student with this information already exists', 400));
    }

    // Create student
    const student = await User.create({
      firstName,
      lastName,
      email,
      studentId,
      program,
      phone: phone || null, // Store null if phone is empty or undefined
      role: config.roles.STUDENT,
      agreedToWaiver,
      waiverSignedDate: agreedToWaiver ? new Date() : null
    });

    // Create log
    await Log.create({
      action: 'student_registration',
      details: `New student registered: ${studentId}`,
      resourceId: student.id,
      resourceType: 'User',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      data: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        studentId: student.studentId,
        program: student.program
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get student by ID
// @route   GET /api/users/:studentId
// @access  Private (Staff and Admin)
exports.getStudent = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    // Find student by ID or student number
    const student = await User.findOne({
      where: {
        [Op.or]: [
          { id: studentId },
          { studentId }
        ],
        role: config.roles.STUDENT
      },
      attributes: { exclude: ['password'] }
    });

    if (!student) {
      return next(new ErrorResponse('Student not found', 404));
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update student waiver
// @route   PUT /api/users/:studentId/waiver
// @access  Public (for the student) or Private (for staff)
exports.updateWaiver = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const { agreedToWaiver } = req.body;

    if (!agreedToWaiver) {
      return next(new ErrorResponse('You must agree to the waiver', 400));
    }

    // Find student
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

    // Update waiver
    student.agreedToWaiver = true;
    student.waiverSignedDate = new Date();
    await student.save();

    // Create log
    await Log.create({
      userId: req.user ? req.user.id : null,
      action: 'waiver_update',
      details: `Waiver updated for student: ${student.studentId}`,
      resourceId: student.id,
      resourceType: 'User',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({
      success: true,
      data: {
        agreedToWaiver: student.agreedToWaiver,
        waiverSignedDate: student.waiverSignedDate
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all students for staff
// @route   GET /api/users/staff/students
// @access  Private (Staff and Admin)
exports.getAllStudents = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    let whereClause = { role: config.roles.STUDENT };
    
    // Apply search filter if provided
    if (search) {
      whereClause = {
        ...whereClause,
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { studentId: { [Op.iLike]: `%${search}%` } },
          { program: { [Op.iLike]: `%${search}%` } }
        ]
      };
    }
    
    // Get paginated results
    const offset = (page - 1) * limit;
    
    const { count, rows: students } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
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
      data: students
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Search for students
// @route   GET /api/users/search
// @access  Private (Staff and Admin)
exports.searchStudents = async (req, res, next) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }
    
    // Build search query
    const whereClause = {
      role: config.roles.STUDENT,
      [Op.or]: [
        { firstName: { [Op.iLike]: `%${q}%` } },
        { lastName: { [Op.iLike]: `%${q}%` } },
        { email: { [Op.iLike]: `%${q}%` } },
        { studentId: { [Op.iLike]: `%${q}%` } }
      ],
      // Make sure student is active
      active: true
    };
    
    // Find students matching the search query
    const students = await User.findAll({
      where: whereClause,
      attributes: ['id', 'firstName', 'lastName', 'email', 'studentId', 'program', 'campus', 'agreedToWaiver'],
      limit: 10,
      order: [['lastName', 'ASC'], ['firstName', 'ASC']]
    });
    
    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (err) {
    next(err);
  }
};
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/db');
const config = require('../config/config');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  staffId: {
    type: DataTypes.STRING,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  studentId: {
    type: DataTypes.STRING,
    unique: true,
    validate: {
      is: /^[a-zA-Z0-9]{1,10}$/  // Updated to allow alphanumeric up to 10 chars
    }
  },
  program: {
    type: DataTypes.STRING
  },
  phone: {
    type: DataTypes.STRING,
    unique: true
  },
  role: {
    type: DataTypes.ENUM(Object.values(config.roles)),
    allowNull: false,
    defaultValue: config.roles.STUDENT
  },
  campus: {
    type: DataTypes.ENUM(config.campuses),
    validate: {
      isIn: [config.campuses]
    }
  },
  campusAccess: {
    type: DataTypes.ENUM('north-only', 'lakeshore-only', 'both-campuses'),
    defaultValue: 'north-only',
    allowNull: false
  },
  service: {
    type: DataTypes.ENUM(config.services),
    validate: {
      isIn: [config.services]
    }
  },
  // New field for service access
  serviceAccess: {
    type: DataTypes.ENUM('sleep-lounge-only', 'zen-zone-only', 'both-services'),
    defaultValue: 'sleep-lounge-only',
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true
  },
  agreedToWaiver: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  waiverSignedDate: {
    type: DataTypes.DATE
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLogin: {
    type: DataTypes.DATE
  }
}, {
  hooks: {
    beforeCreate: async (user) => {
      // Hash password only if it exists (staff and admin)
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      // Hash password only if it was changed
      if (user.changed('password') && user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Method to check if password matches
User.prototype.matchPassword = async function(enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to check if staff can access a specific campus
User.prototype.canAccessCampus = function(requestedCampus) {
  if (this.role === config.roles.ADMIN) return true; // Admins can access all campuses
  
  if (this.campusAccess === 'both-campuses') return true;
  
  if (this.campusAccess === 'north-only' && requestedCampus === 'north') return true;
  
  if (this.campusAccess === 'lakeshore-only' && requestedCampus === 'lakeshore') return true;
  
  return false;
};

// Method to check if staff can access a specific service at a specific campus
User.prototype.canAccessService = function(requestedService, requestedCampus) {
  if (this.role === config.roles.ADMIN) return true; // Admins can access all services
  
  // Service access restrictions based on campus
  if (requestedCampus === 'north' && requestedService === 'zen-zone') {
    // North campus doesn't have Zen Zone
    return false;
  }
  
  // Check campus access first
  if (!this.canAccessCampus(requestedCampus)) {
    return false;
  }
  
  // Check service access
  if (this.serviceAccess === 'both-services') return true;
  if (this.serviceAccess === 'sleep-lounge-only' && requestedService === 'sleep-lounge') return true;
  if (this.serviceAccess === 'zen-zone-only' && requestedService === 'zen-zone') return true;
  
  return false;
};

module.exports = User;
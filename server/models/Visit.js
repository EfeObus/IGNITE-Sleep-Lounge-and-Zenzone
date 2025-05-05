const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const config = require('../config/config');

const Visit = sequelize.define('Visit', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  staffId: {
    type: DataTypes.UUID,
    allowNull: true, // Changed to allow null to fix constraint issue
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  service: {
    type: DataTypes.ENUM(config.services),
    allowNull: false,
    validate: {
      isIn: [config.services]
    }
  },
  campus: {
    type: DataTypes.ENUM(config.campuses),
    allowNull: false,
    validate: {
      isIn: [config.campuses]
    }
  },
  checkInTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  checkOutTime: {
    type: DataTypes.DATE
  },
  notes: {
    type: DataTypes.TEXT
  },
  bedNumber: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1
    }
  },
  stationId: {
    type: DataTypes.STRING
  },
  stationName: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'active'
  }
});

// Add associations in separate file

module.exports = Visit;
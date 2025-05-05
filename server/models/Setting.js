const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const config = require('../config/config');

const Setting = sequelize.define('Setting', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  campus: {
    type: DataTypes.ENUM(config.campuses),
    allowNull: false,
    validate: {
      isIn: [config.campuses]
    }
  },
  service: {
    type: DataTypes.ENUM(config.services),
    allowNull: false,
    validate: {
      isIn: [config.services]
    }
  },
  bedCount: {
    type: DataTypes.INTEGER,
    validate: {
      min: 0
    }
  },
  timeLimit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  openTime: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    }
  },
  closeTime: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    }
  }
});

module.exports = Setting;
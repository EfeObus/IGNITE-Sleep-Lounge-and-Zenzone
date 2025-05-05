const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Log = sequelize.define('Log', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  details: {
    type: DataTypes.TEXT
  },
  resourceId: {
    type: DataTypes.UUID
  },
  resourceType: {
    type: DataTypes.STRING
  },
  ipAddress: {
    type: DataTypes.STRING
  },
  userAgent: {
    type: DataTypes.STRING
  }
});

module.exports = Log;
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

module.exports = {
  port: process.env.PORT || 5020,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || '30d',
  services: ['sleep-lounge', 'zen-zone'],
  campuses: ['lakeshore', 'north', 'both-campuses'],
  roles: {
    ADMIN: 'admin',
    STAFF: 'staff',
    STUDENT: 'student'
  },
  defaultSettings: {
    sleepLounge: {
      timeLimit: 60, // minutes
      bedCount: {
        lakeshore: 12,
        north: 12,
        'both-campuses': 3
      },
      openTime: '9:00',
      closeTime: '16:00'
    },
    zenZone: {
      timeLimit: 1200, // minutes
      capacity: {
        lakeshore: 3000,
      },
      openTime: '9:00',
      closeTime: '16:00'
    }
  }
};
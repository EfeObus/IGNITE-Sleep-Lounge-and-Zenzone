const User = require('./User');
const Visit = require('./Visit');
const Setting = require('./Setting');
const Log = require('./Log');

// Define associations
User.hasMany(Visit, { 
  foreignKey: 'studentId',
  as: 'studentVisits'
});
Visit.belongsTo(User, { 
  foreignKey: 'studentId',
  as: 'student'
});

User.hasMany(Visit, { 
  foreignKey: 'staffId',
  as: 'staffVisits'
});
Visit.belongsTo(User, { 
  foreignKey: 'staffId',
  as: 'staff'
});

User.hasMany(Log, { 
  foreignKey: 'userId'
});
Log.belongsTo(User, { 
  foreignKey: 'userId'
});

// Export models
module.exports = {
  User,
  Visit,
  Setting,
  Log
};
// First, require our custom patch for path-to-regexp
require('./patch-path-to-regexp');

const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const errorHandler = require('./middleware/error');
const { sequelize, testConnection } = require('./config/db');
const { User } = require('./models');
const config = require('./config/config');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Cookie parser
app.use(cookieParser());

// Logging middleware in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Security
app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://ignitestudentlife.com' : true,
  credentials: true
}));

// Static folder
app.use(express.static(path.join(__dirname, '../')));

// Mount routers - with each in its own try-catch to identify problematic route file
try {
  console.log('Loading auth routes...');
  app.use('/api/auth', require('./routes/auth.routes'));
  console.log('Auth routes loaded successfully');
} catch (error) {
  console.error('Error loading auth routes:', error);
}

try {
  console.log('Loading user routes...');
  app.use('/api/users', require('./routes/student.routes'));
  console.log('User routes loaded successfully');
} catch (error) {
  console.error('Error loading user routes:', error);
}

try {
  console.log('Loading visit routes...');
  app.use('/api/visits', require('./routes/visit.routes'));
  console.log('Visit routes loaded successfully');
} catch (error) {
  console.error('Error loading visit routes:', error);
}

try {
  console.log('Loading admin routes...');
  app.use('/api/admin', require('./routes/admin.routes'));
  console.log('Admin routes loaded successfully');
} catch (error) {
  console.error('Error loading admin routes:', error);
}

// Handle SPA routing
app.get('*', (req, res, next) => {
  if (!req.url.startsWith('/api') && !req.url.includes('.')) {
    res.sendFile(path.resolve(__dirname, '../', 'Index.html'));
  } else {
    next();
  }
});

// Error handler
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 5020;

const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('Database connection failed. Please check your configuration.');
      process.exit(1);
    }
    
    // Sync database (don't use force:true in production)
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('Database synced');
    
    // Create defaults
    await createDefaultAdmin();
    await createDefaultSettings();
    
    // Start server
    app.listen(PORT, () => {
      console.log(
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
      );
    });
  } catch (err) {
    console.error('Server failed to start:', err);
    process.exit(1);
  }
};

// Create default admin user if not exists
const createDefaultAdmin = async () => {
  try {
    const adminExists = await User.findOne({
      where: { 
        role: config.roles.ADMIN,
        email: 'admin@ignitestudentlife.com'
      }
    });

    if (!adminExists) {
      console.log('Creating default admin account...');
      await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@ignitestudentlife.com',
        role: config.roles.ADMIN,
        password: 'Administrator1',
        active: true
      });
      console.log('Default admin account created!');
    }
  } catch (err) {
    console.error('Error creating default admin:', err);
  }
};

// Initialize settings for all campuses and services
const createDefaultSettings = async () => {
  try {
    const { Setting } = require('./models');
    
    for (const campus of config.campuses) {
      for (const service of config.services) {
        const settingExists = await Setting.findOne({
          where: { campus, service }
        });
        
        if (!settingExists) {
          const defaultValues = service === 'sleep-lounge' 
            ? config.defaultSettings.sleepLounge 
            : config.defaultSettings.zenZone;
          
          await Setting.create({
            campus,
            service,
            bedCount: service === 'sleep-lounge' ? defaultValues.bedCount[campus] : null,
            timeLimit: defaultValues.timeLimit,
            openTime: defaultValues.openTime,
            closeTime: defaultValues.closeTime
          });
          
          console.log(`Default settings created for ${service} at ${campus} campus`);
        }
      }
    }
  } catch (err) {
    console.error('Error creating default settings:', err);
  }
};

startServer();
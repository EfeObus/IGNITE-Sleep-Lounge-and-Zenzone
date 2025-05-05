const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

console.log('Starting database initialization...');

// Database connection parameters
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;

// Check if all required environment variables are set
if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
  console.error('Error: Missing required database environment variables in .env file');
  console.error('Please ensure DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME are set');
  process.exit(1);
}

// First, check if the database exists by connecting to the postgres database
const pgConnectionString = `postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT || 5432}/postgres`;

const checkDbExists = async () => {
  const sequelize = new Sequelize(pgConnectionString, {
    logging: false
  });

  try {
    await sequelize.authenticate();
    console.log('Connected to postgres database');

    // Check if our target database exists
    const [results] = await sequelize.query(
      `SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'`
    );

    if (results.length === 0) {
      console.log(`Database "${DB_NAME}" does not exist, creating...`);
      await sequelize.query(`CREATE DATABASE ${DB_NAME}`);
      console.log(`Database "${DB_NAME}" created successfully`);
    } else {
      console.log(`Database "${DB_NAME}" already exists`);
    }

    await sequelize.close();
    return true;
  } catch (error) {
    console.error('Unable to connect to postgres database:', error);
    return false;
  }
};

// Then, connect to our new database and initialize it
const initializeDb = async () => {
  const dbConnectionString = `postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT || 5432}/${DB_NAME}`;
  const sequelize = new Sequelize(dbConnectionString, {
    logging: false
  });

  try {
    await sequelize.authenticate();
    console.log(`Connected to "${DB_NAME}" database`);

    // Import all models
    const { User, Setting, Visit, Log } = require('../models');

    // Sync all models with the database
    console.log('Synchronizing database models...');
    await sequelize.sync({ alter: true });
    console.log('Database models synchronized successfully');

    await sequelize.close();
    return true;
  } catch (error) {
    console.error(`Unable to initialize "${DB_NAME}" database:`, error);
    return false;
  }
};

// Main execution function
const main = async () => {
  try {
    const dbExists = await checkDbExists();
    if (!dbExists) {
      console.error('Database initialization failed at database creation step');
      process.exit(1);
    }

    const dbInitialized = await initializeDb();
    if (!dbInitialized) {
      console.error('Database initialization failed at model synchronization step');
      process.exit(1);
    }

    console.log('Database initialization completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Unexpected error during database initialization:', error);
    process.exit(1);
  }
};

// Run the initialization process
main();
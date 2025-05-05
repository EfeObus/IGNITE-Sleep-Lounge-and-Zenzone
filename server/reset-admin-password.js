// Reset Admin Password Script
const { User } = require('./models');
const { sequelize } = require('./config/db');
const config = require('./config/config');

async function resetAdminPassword() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Find admin user or create if it doesn't exist
    const [adminUser, created] = await User.findOrCreate({
      where: { staffId: 'admin' },
      defaults: {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        role: config.roles.ADMIN,
        campus: null, // Setting to null to ensure it has access to all campuses
        campusAccess: 'both-campuses',
        active: true,
        // This is a pre-hashed version of 'admin123'
        password: '$2a$10$Ov7tyyPXWrk2m1zJT7pVYOwXzC0IJF/YR9p/wf4E9osjr0PCeJntW'
      }
    });

    if (created) {
      console.log('Admin user created with default password: admin123');
    } else {
      // Update existing admin user with corrected permissions
      adminUser.password = '$2a$10$Ov7tyyPXWrk2m1zJT7pVYOwXzC0IJF/YR9p/wf4E9osjr0PCeJntW';
      adminUser.role = config.roles.ADMIN; // Ensure role is admin
      adminUser.campus = null; // Set to null to ensure it has access to all campuses
      adminUser.campusAccess = 'both-campuses'; // Explicitly set to both campuses
      adminUser.active = true; // Ensure account is active
      
      await adminUser.save({ hooks: false }); // Skip password hashing hooks since we're providing a pre-hashed password
      console.log('Admin account has been reset with:');
      console.log('- Username: admin');
      console.log('- Password: admin123');
      console.log('- Role: admin');
      console.log('- Campus Access: both-campuses');
    }

    await sequelize.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting admin password:', error);
    process.exit(1);
  }
}

// Run the function
resetAdminPassword();
# IGNITE Sleep Lounge and Zen Zone

A modern full-stack web application for managing IGNITE's Sleep Lounge and Zen Zone services across all Humber College campuses.

## 🧘 Overview

The IGNITE Sleep Lounge and Zen Zone system enhances student wellness by providing a centralized platform to manage rest and relaxation services. This application supports:

- Student registration and waiver management
- Staff check-in/check-out workflows by campus and service type
- Admin-level control of staff and student records
- Real-time usage monitoring and reporting
- Full mobile-responsive design for accessibility across all devices

## 🚀 Features

### 🎓 For Students
- One-time registration for Sleep Lounge and Zen Zone access
- QR-code based check-in for fast entry
- Information on lounge rules, hours, and campus locations
- Submit questions using a contact form
- **All student data is securely stored and retrieved from PostgreSQL**

### 👨‍💼 For Staff
- Secure login with location and service selection
- Automatic redirection to the correct staff portal based on assigned service and campus
- Check students in and out with optional visit notes
- View currently active users in real-time
- Sleep Lounge: Bed management with countdown timers
- Zen Zone: Time tracking with visual alerts
- Search and retrieve student data by name, ID, email, or program
- Staff login/logout data and visit records are stored in **PostgreSQL**
- **No use of browser localStorage or sessionStorage for persistent data**

### 🛠️ For Administrators
- Onboard, update, and manage staff accounts with full role controls
- **View, edit, and delete all registered students**
- Full visibility into all student visit data across campuses and services
- View staff login/logout activity logs
- Update global and campus-specific settings (e.g., bed count, time limits)
- Access an interactive dashboard showing usage statistics and trends
- Generate downloadable usage reports (CSV, PDF)
- **All data (students, staff, visits, settings, logs) is stored and retrieved from PostgreSQL**

## 🧱 Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Authentication**: JWT (JSON Web Tokens)
- **Design**: Mobile-first responsive layout
- **Environment Configuration**: `.env` for secure credentials and settings

## 🛠️ Installation

### 📋 Prerequisites
- Node.js (v16+)
- PostgreSQL (v13+)
- npm or yarn

### ⚙️ Setup Instructions

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/sleep-lounge.git
cd sleep-lounge

# 2. Install dependencies
npm install

# 3. Create PostgreSQL database
createdb sleep_lounge

# 4. Configure environment variables
# Create a .env file in the root directory with the following variables:
# PORT=5020
# NODE_ENV=development
# DB_HOST=localhost
# DB_USER=your_username
# DB_PASSWORD=your_password
# DB_NAME=sleep_lounge
# DB_PORT=5432
# JWT_SECRET=your_secret_key
# JWT_EXPIRE=30d

# 5. Initialize the database
npm run db:init

# 6. Launch the development server
npm run dev
```

Then visit http://localhost:5020

## 🚀 Deployment

For detailed deployment instructions, please refer to the `deployment-instructions.md` file.

## 📁 Project Structure
See `file-structure.md` for detailed organization.

## 📡 API Endpoints

### 🔐 Authentication
- POST /api/auth/login – Staff login
- GET /api/auth/me – Current staff profile
- POST /api/auth/logout – Staff logout
- PUT /api/auth/updatepassword – Update password

### 👥 Student Management
- POST /api/users/register – Register student
- GET /api/users/:studentId – Get student data
- PUT /api/users/:studentId/waiver – Update waiver form
- GET /api/users/staff/students – Retrieve all students (for staff)

### 📘 Visit Management
- POST /api/visits/checkin – Student check-in
- PUT /api/visits/checkout/:visitId – Student check-out
- GET /api/visits/active/:service/:campus – View current visits
- GET /api/visits/history/:studentId – View visit history
- GET /api/visits/stats – Get usage stats
- GET /api/visits/beds/:campus/:service – Get bed status for Sleep Lounge
- GET /api/visits/stations/:campus – Get zen zone station status
- GET /api/visits/activity – Get recent activity feed
- GET /api/visits/dailystats – Get daily statistics

### 🧑‍💼 Admin

#### 📋 Staff Management
- GET /api/admin/staff – View all staff
- POST /api/admin/staff – Add staff
- PUT /api/admin/staff/:id – Edit staff
- DELETE /api/admin/staff/:id – Delete staff
- PUT /api/admin/staff/:id/status – Enable/disable staff
- PUT /api/admin/staff/:id/reset-password – Reset staff password

#### 👨‍🎓 Student Management (Admin-Only)
- GET /api/admin/students – View all registered students
- PUT /api/admin/students/:id – Edit student data
- DELETE /api/admin/students/:id – Delete student

#### ⚙️ System Configuration & Logs
- PUT /api/admin/settings – Update bed count, time limits, and other settings
- GET /api/admin/logs – View all system logs (student visits, staff activity)

## 🔁 Advanced Features

### ⏱️ Real-Time Bed and Time Management
- Monitor available beds per campus in Sleep Lounge
- Time tracking for Zen Zone users
- Countdown indicators with visual alerts for session limits
- Staff alerts when time expires

### 🔍 PostgreSQL Data Control
- All registration, staff onboarding, visit logging, and admin settings are stored in PostgreSQL
- All student, staff, and visit records are retrieved from PostgreSQL
- No browser localStorage or sessionStorage is used for permanent data
- Server-side validation and role-based access control is enforced

## 🧪 Default Admin Account
⚠️ Please change the credentials on first login.
- Username: Admin
- Password: Administrator1

## 📱 Compatibility
Fully compatible with:
- Smartphones
- Tablets
- Laptops and Desktops

## 🧭 Browser Support
- Google Chrome (latest 2 versions)
- Mozilla Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Microsoft Edge (latest 2 versions)

## 🤝 Contributing

```bash
# 1. Fork the repository
# 2. Create your feature branch
git checkout -b feature-name

# 3. Commit your changes
git commit -m "Add new feature"

# 4. Push to GitHub
git push origin feature-name

# 5. Submit a pull request
```

## 📜 License
This project is proprietary and confidential.
© 2025 IGNITE Student Life. All rights reserved.

## 📬 Contact
For support or questions, email info@ignitestudentlife.com

## 🔄 Last Updated
April 23, 2025
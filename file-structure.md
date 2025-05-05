# IGNITE Sleep Lounge and Zen Zone - File Structure

This document outlines the organization of the Sleep Lounge and Zen Zone project files.

## Frontend Structure

```
sleep-lounge/
├── assets/                      # Static images and media files
│   ├── Happy Painter.webp
│   ├── Ignite Badge.jpg
│   ├── Ignite_logo.png
│   ├── ignite_original.jpeg
│   ├── Our space.webp
│   ├── Pop up library.webp
│   ├── sleep_lounge.jpeg
│   └── Sleep.jpg
├── css/                         # CSS stylesheets
│   ├── admin.css                # Styles for the admin portal
│   ├── home.css                 # Styles for the home page
│   ├── staff-portal.css         # Styles for the staff portal
│   ├── style.css                # Global styles used across the application
│   └── zen-zone.css             # Styles for the zen zone page
├── js/                          # Frontend JavaScript files
│   ├── admin.js                 # Administrator portal functionality
│   ├── contact.js               # Contact form handling
│   ├── home.js                  # Home page interactions and animations
│   ├── register.js              # Student registration functionality
│   ├── script.js                # Shared JavaScript utilities
│   ├── sleep-lounge.js          # Sleep Lounge specific functionality
│   ├── staff-portal.js          # Staff portal interactions
│   └── zen-zone.js              # Zen Zone specific functionality
├── *.html                       # HTML Pages
│   ├── Index.html               # Homepage
│   ├── admin.html               # Admin portal
│   ├── contact.html             # Contact page
│   ├── register.html            # Student registration
│   ├── sleep-lounge.html        # Sleep Lounge information
│   ├── staff-login.html         # Staff login portal
│   ├── staff-portal.html        # Staff management portal
│   └── zen-zone.html            # Zen Zone information
```

## Backend Structure

```
sleep-lounge/
├── server/                      # Server-side code
│   ├── config/                  # Configuration files
│   │   ├── config.js            # Application configuration
│   │   ├── db.js                # Database connection setup
│   │   └── dbInit.js            # Database initialization
│   ├── controllers/             # Route controllers
│   │   ├── admin.controller.js  # Admin functionality
│   │   ├── auth.controller.js   # Authentication
│   │   ├── student.controller.js # Student management
│   │   └── visit.controller.js  # Visit tracking
│   ├── middleware/              # Express middleware
│   │   ├── auth.js              # Authentication middleware
│   │   ├── error.js             # Error handling middleware
│   │   └── validators.js        # Input validation middleware
│   ├── models/                  # Sequelize data models
│   │   ├── index.js             # Models export
│   │   ├── User.js              # User model (students and staff)
│   │   ├── Visit.js             # Visit tracking model
│   │   ├── Setting.js           # Application settings model
│   │   └── Log.js               # Activity logging model
│   ├── routes/                  # API route definitions
│   │   ├── admin.routes.js      # Admin routes
│   │   ├── auth.routes.js       # Authentication routes
│   │   ├── student.routes.js    # Student management routes
│   │   └── visit.routes.js      # Visit tracking routes
│   ├── utils/                   # Utility functions
│   │   ├── errorResponse.js     # Standard error responses
│   │   └── jwtUtils.js          # JWT token helpers
│   ├── server.js                # Express app entry point
│   ├── patch-path-to-regexp.js  # Patch for path-to-regexp module
│   └── reset-admin-password.js  # Admin password reset utility
├── .env                         # Environment variables
├── package.json                 # Node.js dependencies and scripts
├── deployment-instructions.md   # Deployment guide
├── file-structure.md            # This file structure document
└── README.md                    # Project documentation
```

## Database Schema

```
┌────────────────────┐       ┌────────────────────┐
│ Users               │       │ Visits             │
├────────────────────┤       ├────────────────────┤
│ id                  │       │ id                 │
│ firstName           │       │ studentId          │
│ lastName            │       │ staffId            │
│ email               │       │ service            │
│ studentId           │       │ campus             │
│ program             │       │ checkInTime        │
│ phone               │       │ checkOutTime       │
│ role                │       │ notes              │
│ campus              │       │ bedNumber          │
│ service             │       │ status             │
│ password            │       │ createdAt          │
│ agreedToWaiver      │       │ updatedAt          │
│ waiverSignedDate    │       └──────────┬─────────┘
│ active              │                  │
│ lastLogin           │                  │
│ createdAt           │                  │
│ updatedAt           │                  │
└──────────┬─────────┘                  │
           │                             │
           └─────────────────────────────┘
                        │
                        │
┌────────────────────┐  │  ┌────────────────────┐
│ Settings            │  │  │ Logs               │
├────────────────────┤  │  ├────────────────────┤
│ id                  │  │  │ id                 │
│ campus              │  │  │ userId             │
│ service             │  │  │ action             │
│ bedCount            │  │  │ details            │
│ stationCount        │  └──│ resourceId         │
│ timeLimit           │     │ resourceType       │
│ openTime            │     │ ipAddress          │
│ closeTime           │     │ userAgent          │
│ createdAt           │     │ createdAt          │
│ updatedAt           │     │ updatedAt          │
└────────────────────┘     └────────────────────┘
```

## API Structure

The API follows RESTful principles with the following structure:

- `/api/auth` - Authentication endpoints
- `/api/users` - Student management endpoints
- `/api/visits` - Visit tracking endpoints with the following features:
  - Student check-in/check-out
  - Bed/station status monitoring
  - Usage statistics
  - Activity tracking
- `/api/admin` - Administrative endpoints

## Deployment Structure

For production deployment information, please refer to the `deployment-instructions.md` file which contains detailed instructions for:

- Server setup
- Database configuration
- Environment configuration
- Security considerations
- Monitoring and maintenance
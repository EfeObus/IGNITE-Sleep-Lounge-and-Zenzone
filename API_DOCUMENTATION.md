# API Documentation

This document provides comprehensive documentation for the IGNITE Sleep Lounge and Zen Zone API endpoints.

## Base URL

All API endpoints are relative to the base URL:

- Development: `http://localhost:5020/api`
- Production: `https://your-production-domain.com/api`

## Authentication

Most endpoints require authentication using JWT (JSON Web Token) authentication.

Include the JWT token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Response Format

All API responses follow a consistent format:

```json
{
  "success": true|false,
  "data": { ... },  // Present only on successful responses
  "message": "Description of the result or error",
  "error": "Error code"  // Present only on error responses
}
```

## Rate Limiting

API requests are rate-limited to prevent abuse. Current limits:
- 100 requests per 15-minute window per IP address
- Authentication endpoints have stricter rate limits (20 requests per 15-minute window)

## API Endpoints

### Authentication

#### POST /api/auth/login
Staff login endpoint.

**Request:**
```json
{
  "email": "staff@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": "user_id",
      "firstName": "First",
      "lastName": "Last",
      "email": "staff@example.com",
      "role": "staff|admin",
      "campus": "north|lakeshore",
      "service": "sleep-lounge|zen-zone"
    }
  },
  "message": "Login successful"
}
```

#### GET /api/auth/me
Get current authenticated staff profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "firstName": "First",
    "lastName": "Last",
    "email": "staff@example.com",
    "role": "staff|admin",
    "campus": "north|lakeshore",
    "service": "sleep-lounge|zen-zone"
  },
  "message": "User data retrieved"
}
```

#### POST /api/auth/logout
Staff logout endpoint.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### PUT /api/auth/updatepassword
Update staff password.

**Request:**
```json
{
  "currentPassword": "current_password",
  "newPassword": "new_password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

### Student Management

#### POST /api/users/register
Register a new student.

**Request:**
```json
{
  "firstName": "Student",
  "lastName": "Name",
  "email": "student@humber.ca",
  "studentId": "N12345678",
  "program": "Computer Science",
  "waiverAgreed": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "firstName": "Student",
    "lastName": "Name",
    "email": "student@humber.ca",
    "studentId": "N12345678",
    "program": "Computer Science",
    "registrationDate": "2025-05-05T12:00:00Z"
  },
  "message": "Student registered successfully"
}
```

#### GET /api/users/:studentId
Get student data by student ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "firstName": "Student",
    "lastName": "Name", 
    "email": "student@humber.ca",
    "studentId": "N12345678",
    "program": "Computer Science",
    "waiverAgreed": true,
    "registrationDate": "2025-05-05T12:00:00Z"
  },
  "message": "Student data retrieved"
}
```

#### PUT /api/users/:studentId/waiver
Update student waiver agreement.

**Request:**
```json
{
  "waiverAgreed": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Waiver updated successfully"
}
```

#### GET /api/users/staff/students
Retrieve all students (for staff use).

**Query Parameters:**
- `q` (optional): Search query for name, email, or student ID
- `limit` (optional): Number of results to return (default: 20)
- `page` (optional): Page number for pagination (default: 1)

**Response:**
```json
{
  "success": true,
  "data": {
    "students": [
      {
        "id": "user_id",
        "firstName": "Student",
        "lastName": "Name",
        "email": "student@humber.ca",
        "studentId": "N12345678",
        "program": "Computer Science"
      }
    ],
    "pagination": {
      "totalCount": 100,
      "totalPages": 5,
      "currentPage": 1,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  },
  "message": "Students retrieved successfully"
}
```

### Visit Management

#### POST /api/visits/checkin
Check in a student to Sleep Lounge or Zen Zone.

**Request:**
```json
{
  "userId": "user_id",
  "studentId": "N12345678",
  "campus": "north|lakeshore",
  "service": "sleep-lounge|zen-zone",
  "bedNumber": 1,  // For sleep-lounge
  "stationId": "meditation-1"  // For zen-zone
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "visitId": "visit_id",
    "studentName": "Student Name",
    "checkinTime": "2025-05-05T14:30:00Z",
    "bedNumber": 1,  // For sleep-lounge
    "stationId": "meditation-1"  // For zen-zone
  },
  "message": "Student checked in successfully"
}
```

#### PUT /api/visits/checkout/:visitId
Check out a student.

**Response:**
```json
{
  "success": true,
  "data": {
    "visitId": "visit_id",
    "studentName": "Student Name",
    "checkinTime": "2025-05-05T14:30:00Z",
    "checkoutTime": "2025-05-05T15:30:00Z",
    "duration": 60  // Duration in minutes
  },
  "message": "Student checked out successfully"
}
```

#### GET /api/visits/active/:service/:campus
View current active visits for a specific service and campus.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "visit_id",
      "student": {
        "id": "user_id",
        "firstName": "Student",
        "lastName": "Name",
        "studentId": "N12345678"
      },
      "checkinTime": "2025-05-05T14:30:00Z",
      "bedNumber": 1,  // For sleep-lounge
      "stationId": "meditation-1",  // For zen-zone
      "timeRemaining": 30  // Minutes remaining in session
    }
  ],
  "message": "Active visits retrieved"
}
```

#### GET /api/visits/history/:studentId
View visit history for a specific student.

**Query Parameters:**
- `limit` (optional): Number of results to return (default: 20)
- `page` (optional): Page number for pagination (default: 1)

**Response:**
```json
{
  "success": true,
  "data": {
    "visits": [
      {
        "id": "visit_id",
        "service": "sleep-lounge|zen-zone",
        "campus": "north|lakeshore",
        "checkinTime": "2025-05-05T14:30:00Z",
        "checkoutTime": "2025-05-05T15:30:00Z",
        "duration": 60,  // Duration in minutes
        "bedNumber": 1,  // For sleep-lounge
        "stationId": "meditation-1"  // For zen-zone
      }
    ],
    "pagination": {
      "totalCount": 15,
      "totalPages": 1,
      "currentPage": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  },
  "message": "Visit history retrieved"
}
```

#### GET /api/visits/stats
Get usage statistics.

**Query Parameters:**
- `campus` (optional): Filter by campus (north|lakeshore)
- `service` (optional): Filter by service (sleep-lounge|zen-zone)
- `startDate` (optional): Start date for statistics (YYYY-MM-DD)
- `endDate` (optional): End date for statistics (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalVisits": 250,
    "uniqueStudents": 120,
    "avgDuration": 45.5,  // Average duration in minutes
    "popularHours": [
      { "hour": 12, "count": 45 },
      { "hour": 13, "count": 38 }
    ],
    "campusBreakdown": {
      "north": 125,
      "lakeshore": 125
    },
    "serviceBreakdown": {
      "sleep-lounge": 175,
      "zen-zone": 75
    }
  },
  "message": "Statistics retrieved"
}
```

#### GET /api/visits/beds/:campus/:service
Get bed status for Sleep Lounge.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBeds": 12,
    "availableBeds": 5,
    "beds": [
      {
        "bedNumber": 1,
        "status": "occupied|available",
        "student": {  // Only if occupied
          "id": "user_id",
          "firstName": "Student",
          "lastName": "Name",
          "studentId": "N12345678"
        },
        "checkinTime": "2025-05-05T14:30:00Z",  // Only if occupied
        "timeRemaining": 30  // Minutes remaining, only if occupied
      }
    ]
  },
  "message": "Bed status retrieved"
}
```

#### GET /api/visits/stations/:campus
Get zen zone station status.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalStations": 6,
    "availableStations": 3,
    "stations": [
      {
        "stationId": "meditation-1",
        "type": "meditation|relaxation|painting",
        "status": "occupied|available",
        "student": {  // Only if occupied
          "id": "user_id",
          "firstName": "Student",
          "lastName": "Name",
          "studentId": "N12345678"
        },
        "checkinTime": "2025-05-05T14:30:00Z",  // Only if occupied
        "timeRemaining": 30  // Minutes remaining, only if occupied
      }
    ]
  },
  "message": "Station status retrieved"
}
```

#### GET /api/visits/activity
Get recent activity feed.

**Query Parameters:**
- `campus` (optional): Filter by campus (north|lakeshore)
- `service` (optional): Filter by service (sleep-lounge|zen-zone)
- `limit` (optional): Number of activities to return (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "type": "check-in|check-out",
      "timestamp": "2025-05-05T15:30:00Z",
      "student": {
        "id": "user_id",
        "firstName": "Student",
        "lastName": "Name",
        "studentId": "N12345678"
      },
      "bedNumber": 1,  // For sleep-lounge
      "stationId": "meditation-1"  // For zen-zone
    }
  ],
  "message": "Activity feed retrieved"
}
```

#### GET /api/visits/dailystats
Get daily statistics.

**Query Parameters:**
- `campus` (required): Campus (north|lakeshore)
- `service` (required): Service (sleep-lounge|zen-zone)

**Response:**
```json
{
  "success": true,
  "data": {
    "todaysVisits": 25,
    "avgDuration": 45.5,  // Average duration in minutes today
    "busyHours": [
      { "hour": 12, "count": 8 },
      { "hour": 13, "count": 7 }
    ],
    "currentActiveVisits": 5
  },
  "message": "Daily statistics retrieved"
}
```

### Admin Endpoints

#### Staff Management

##### GET /api/admin/staff
View all staff.

**Response:**
```json
{
  "success": true,
  "data": {
    "staff": [
      {
        "id": "staff_id",
        "firstName": "Staff",
        "lastName": "Name",
        "email": "staff@example.com",
        "role": "staff|admin",
        "campus": "north|lakeshore",
        "service": "sleep-lounge|zen-zone",
        "status": "active|inactive",
        "lastLogin": "2025-05-04T12:00:00Z"
      }
    ]
  },
  "message": "Staff retrieved successfully"
}
```

##### POST /api/admin/staff
Add a new staff member.

**Request:**
```json
{
  "firstName": "New",
  "lastName": "Staff",
  "email": "newstaff@example.com",
  "password": "initial_password",
  "role": "staff|admin",
  "campus": "north|lakeshore",
  "service": "sleep-lounge|zen-zone"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "staff_id",
    "firstName": "New",
    "lastName": "Staff",
    "email": "newstaff@example.com",
    "role": "staff|admin",
    "campus": "north|lakeshore",
    "service": "sleep-lounge|zen-zone",
    "status": "active"
  },
  "message": "Staff added successfully"
}
```

##### PUT /api/admin/staff/:id
Edit staff information.

**Request:**
```json
{
  "firstName": "Updated",
  "lastName": "Staff",
  "email": "updatedstaff@example.com",
  "role": "staff|admin",
  "campus": "north|lakeshore",
  "service": "sleep-lounge|zen-zone"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "staff_id",
    "firstName": "Updated",
    "lastName": "Staff",
    "email": "updatedstaff@example.com",
    "role": "staff|admin",
    "campus": "north|lakeshore",
    "service": "sleep-lounge|zen-zone"
  },
  "message": "Staff updated successfully"
}
```

##### DELETE /api/admin/staff/:id
Delete a staff member.

**Response:**
```json
{
  "success": true,
  "message": "Staff deleted successfully"
}
```

##### PUT /api/admin/staff/:id/status
Enable or disable a staff member.

**Request:**
```json
{
  "status": "active|inactive"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Staff status updated successfully"
}
```

##### PUT /api/admin/staff/:id/reset-password
Reset a staff member's password.

**Response:**
```json
{
  "success": true,
  "data": {
    "tempPassword": "temporary_password"
  },
  "message": "Password reset successfully"
}
```

#### Student Management (Admin-Only)

##### GET /api/admin/students
View all registered students.

**Query Parameters:**
- `q` (optional): Search query for name, email, or student ID
- `limit` (optional): Number of results to return (default: 20)
- `page` (optional): Page number for pagination (default: 1)

**Response:**
```json
{
  "success": true,
  "data": {
    "students": [
      {
        "id": "user_id",
        "firstName": "Student",
        "lastName": "Name",
        "email": "student@humber.ca",
        "studentId": "N12345678",
        "program": "Computer Science",
        "waiverAgreed": true,
        "registrationDate": "2025-05-05T12:00:00Z",
        "visitCount": 5
      }
    ],
    "pagination": {
      "totalCount": 100,
      "totalPages": 5,
      "currentPage": 1,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  },
  "message": "Students retrieved successfully"
}
```

##### PUT /api/admin/students/:id
Edit student data.

**Request:**
```json
{
  "firstName": "Updated",
  "lastName": "Student",
  "email": "updated.student@humber.ca",
  "studentId": "N12345678",
  "program": "Updated Program",
  "waiverAgreed": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "firstName": "Updated",
    "lastName": "Student",
    "email": "updated.student@humber.ca",
    "studentId": "N12345678",
    "program": "Updated Program",
    "waiverAgreed": true
  },
  "message": "Student updated successfully"
}
```

##### DELETE /api/admin/students/:id
Delete a student.

**Response:**
```json
{
  "success": true,
  "message": "Student deleted successfully"
}
```

#### System Configuration & Logs

##### PUT /api/admin/settings
Update system settings.

**Request:**
```json
{
  "settings": [
    {
      "campus": "north",
      "service": "sleep-lounge",
      "bedCount": 12,
      "openTime": "09:00",
      "closeTime": "16:00",
      "timeLimit": 60
    },
    {
      "campus": "lakeshore",
      "service": "sleep-lounge",
      "bedCount": 12,
      "openTime": "09:00",
      "closeTime": "16:00",
      "timeLimit": 60
    },
    {
      "campus": "lakeshore",
      "service": "zen-zone",
      "stationCount": 6,
      "openTime": "09:00",
      "closeTime": "16:00",
      "timeLimit": 60
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Settings updated successfully"
}
```

##### GET /api/admin/logs
View system logs.

**Query Parameters:**
- `type` (optional): Log type (auth|student|visit|error)
- `startDate` (optional): Start date for logs (YYYY-MM-DD)
- `endDate` (optional): End date for logs (YYYY-MM-DD)
- `limit` (optional): Number of logs to return (default: 50)
- `page` (optional): Page number for pagination (default: 1)

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "log_id",
        "type": "auth|student|visit|error",
        "action": "login|logout|checkin|checkout|etc",
        "userId": "user_id",  // If applicable
        "details": "Details about the log entry",
        "timestamp": "2025-05-05T12:00:00Z",
        "ip": "192.168.1.1"  // IP address if applicable
      }
    ],
    "pagination": {
      "totalCount": 500,
      "totalPages": 10,
      "currentPage": 1,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  },
  "message": "Logs retrieved successfully"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters or request body |
| 401 | Unauthorized - Missing or invalid authentication |
| 403 | Forbidden - Not authorized to access this resource |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists or conflict with existing data |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error occurred |

## Websocket Events

For real-time updates, the system uses WebSocket connections. Connect to:

```
ws://localhost:5020/ws  // Development
wss://your-production-domain.com/ws  // Production
```

### Events

| Event | Description | Data |
|-------|-------------|------|
| `visit:checkin` | Student checked in | `{ visitId, studentName, bedNumber/stationId, service, campus }` |
| `visit:checkout` | Student checked out | `{ visitId, studentName, duration }` |
| `bed:status` | Bed status changed | `{ campus, bedNumber, status, availableBeds }` |
| `station:status` | Station status changed | `{ campus, stationId, status, availableStations }` |

## API Versioning

The current API version is v1. All endpoints should be prefixed with `/api/v1` for future compatibility.

## Support

For API support or to report issues, please contact:
- Email: tech-support@ignitestudentlife.com
- Internal ticket system: https://support.ignitestudentlife.com
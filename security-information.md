# IGNITE Sleep Lounge and Zen Zone - Security Information File (SIF)

## 1. Application Overview
- **Name:** IGNITE Sleep Lounge and Zen Zone
- **Purpose:** Wellness management system allowing Humber College students to check-in/out of rest and relaxation services.
- **Data handled:** Student/staff identifiers, check-in/out logs, waiver agreement status, bed/station usage.
- **Campus-specific:** Services available at North and Lakeshore campuses (Zen Zone at Lakeshore only).

---

## 2. User Roles & Permissions
| Role    | Description                        | Permissions                                               |
|---------|------------------------------------|------------------------------------------------------------|
| Student | Registers and uses services        | Register, agree to waiver, view own usage history         |
| Staff   | Manages day-to-day operations      | Login, check-in/out students, view service logs, limited to assigned campus/service |
| Admin   | System administrator               | Full access, staff onboarding, settings management, logs, access to both campuses and services |

---

## 3. Authentication & Authorization
- Token-based authentication via **JWT** with 30-day expiration.
- Passwords stored securely using **bcrypt hashing** with salt.
- Routes protected using `protect()` middleware that verifies token validity.
- Role-based access controlled via `authorize()` middleware.
- Service/campus scope enforced via `checkServiceAndCampus()` middleware.
- Admin accounts can be reset via dedicated script (`reset-admin-password.js`).

---

## 4. Data Security Practices
- Passwords are **never stored in plaintext** or returned in API responses.
- API responses exclude sensitive fields like `password`.
- Sequelize ORM used for database interactions to prevent SQL injection.
- Input validation using `express-validator` with custom validators for:
  - Email format
  - Student ID format (alphanumeric, max 10 characters)
  - Password complexity (minimum 6 characters)
  - Campus and service validation
- Logs created for all critical actions (login, logout, password changes, check-in/out).

---

## 5. Data Storage & Encryption
- **PostgreSQL** used as the primary database.
- Sensitive data (passwords) stored using strong bcrypt hashing.
- Visit records include timestamped entries with campus and service context.
- Server access restricted to authorized personnel only.
- JWT secrets stored in environment variables (.env file).

---

## 6. Logging & Audit Trail
- All staff/admin actions logged in `Logs` table with:
  - `userId` - Who performed the action
  - `action` - What was done (login, staff_created, password_reset, etc.)
  - `details` - Description of the action
  - `resourceId` - ID of the affected resource
  - `resourceType` - Type of resource affected
  - `ipAddress` - IP address of the request
  - `userAgent` - Browser/client information
- Viewable by admins via dashboard.
- Enables full traceability for compliance and internal review.

---

## 7. Consent & Waiver Management
- Students must explicitly agree to the waiver before service use.
- Waiver consent recorded in `agreedToWaiver` and timestamped (`waiverSignedDate`).
- Frontend validation ensures waiver acceptance before submission.
- Backend validation checks waiver acceptance status before allowing check-in.

---

## 8. Data Retention & Deletion
- Visit and log data retained for **12 months** (adjustable).
- Data deletion/export handled by admin functions.
- JWT tokens expire after 30 days (configurable via environment variables).
- Inactive accounts can be disabled rather than deleted to maintain audit history.

---

## 9. Known Vulnerabilities & Mitigation Plans
| Threat                | Mitigation Strategy                                           |
|-----------------------|--------------------------------------------------------------|
| Session Hijacking     | JWT with expiration + `protect()` middleware                 |
| XSS Attacks           | Helmet security headers + input validation                   |
| CSRF                  | CORS configuration + token-based authentication              |
| Brute Force Login     | Recommend: Add rate limiting via `express-rate-limit`        |
| Insecure Passwords    | Password validation rules + bcrypt hashing                   |
| Privilege Escalation  | Role-based middleware checks + service/campus access control |
| Campus Access Control | `canAccessCampus()` checks prevent unauthorized access       |

---

## 10. Legal & Compliance
- Aligned with **PIPEDA (Canada)** for handling student data.
- No external data sharing; operates within IGNITE's systems.
- Waiver system models consent in line with GDPR principles.
- Students retain the right to request data access or deletion.
- User data minimization principles applied (only collecting necessary data).

---

## 11. Web Security Configuration
- **Helmet.js** used to set secure HTTP headers.
- CORS configured to restrict access in production environment.
- Static file caching configured in Nginx with proper cache controls.
- HTTPS enforced in production with TLS/SSL configuration.

---

## 12. Additional Security Recommendations
- Implement rate limiting for authentication endpoints
- Add regular security scanning and penetration testing
- Implement automated security patch management
- Consider adding multi-factor authentication for admin accounts
- Implement regular security awareness training for staff

---

*This file should be reviewed quarterly by the development team and updated in case of any changes to architecture or compliance policy.*

*Last updated: April 23, 2025*
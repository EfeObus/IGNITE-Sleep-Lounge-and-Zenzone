# Testing Guidelines

This document outlines the testing approach for the IGNITE Sleep Lounge and Zen Zone application.

## Testing Philosophy

The Sleep Lounge and Zen Zone application follows a comprehensive testing strategy that includes automated tests at multiple levels as well as manual testing procedures. Our goal is to ensure high quality, reliability, and a positive user experience.

## Testing Levels

### Unit Testing

Unit tests verify the functionality of individual components in isolation.

- **Framework**: Jest
- **Location**: `tests/unit/`
- **Naming Convention**: `*.spec.js` or `*.test.js`
- **Coverage Goal**: 80% for critical business logic components

#### Running Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run unit tests with coverage
npm run test:unit:coverage

# Run specific test file
npm run test:unit -- controllers/auth.controller.test.js
```

### Integration Testing

Integration tests verify that different components work together correctly.

- **Framework**: Jest + Supertest
- **Location**: `tests/integration/`
- **Focus Areas**: 
  - API endpoints
  - Database operations
  - Authentication flows

#### Running Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific integration test file
npm run test:integration -- api/auth.test.js
```

### End-to-End Testing

E2E tests simulate real user interactions to verify complete workflows.

- **Framework**: Cypress
- **Location**: `tests/e2e/`
- **Key Workflows**:
  - Student registration
  - Staff login and bed management
  - Check-in/check-out processes
  - Admin dashboard operations

#### Running E2E Tests

```bash
# Run E2E tests in headless mode
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:open
```

## Test Data Management

### Test Database

A separate test database is used for automated tests to prevent pollution of development or production data.

- **Configuration**: Set up in `config/test.js`
- **Seeding**: Test data is seeded before tests run using the scripts in `tests/seeds/`
- **Cleanup**: The database is reset after each test suite is completed

### Test Fixtures

- **Location**: `tests/fixtures/`
- **Purpose**: Provide consistent test data across different test suites
- **Format**: JSON files representing database entities

## Mocking

- **External Services**: All external services are mocked during testing
- **Mock Implementation**: Stored in `tests/mocks/`
- **HTTP Requests**: Intercepted using `nock` or similar libraries
- **Date/Time**: Use a fixed point in time for consistent testing

## Test Environment Variables

Create a `.env.test` file with appropriate testing configurations:

```
NODE_ENV=test
DB_HOST=localhost
DB_USER=test_user
DB_PASSWORD=test_password
DB_NAME=sleep_lounge_test
JWT_SECRET=test_secret_key
```

## Manual Testing Guidelines

### Exploratory Testing

- Conduct exploratory testing before each release
- Focus on new features and high-risk areas
- Document any unexpected behavior

### Cross-Browser Testing

Test the application on the following browsers:
- Google Chrome (latest 2 versions)
- Mozilla Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Microsoft Edge (latest 2 versions)

### Responsive Design Testing

Test on the following device types:
- Desktop (1920×1080, 1366×768)
- Tablet (iPad, Surface)
- Mobile (iPhone, Android phones)

### Accessibility Testing

- Use tools like Lighthouse and axe for automated accessibility checks
- Conduct manual keyboard navigation testing
- Verify screen reader compatibility

## Performance Testing

### Load Testing

- **Tool**: JMeter or k6
- **Scenarios**: 
  - 50 concurrent users for normal operation
  - 100 concurrent users for peak times
- **Endpoints Focus**: 
  - Authentication
  - Student check-in/check-out
  - Real-time status updates

### Endurance Testing

Run the system under expected load for an extended period (8+ hours) to identify memory leaks or performance degradation.

## Security Testing

### Vulnerability Scanning

- Run dependency vulnerability scans using npm audit
- Conduct regular OWASP Top 10 checks
- Perform static code analysis with tools like SonarQube

### Penetration Testing

Conduct penetration testing before each major release focusing on:
- Authentication and authorization
- Data validation
- Session management
- API security

## CI/CD Integration

All automated tests are integrated into the CI/CD pipeline:
- Unit and integration tests run on every pull request
- E2E tests run before deployment to staging
- Performance tests run weekly against the staging environment

## Bug Reporting and Tracking

When reporting bugs, include the following information:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Environment details (browser, OS, screen size)
5. Screenshots or videos if applicable

All bugs are tracked in the project management system with appropriate severity levels:
- **Critical**: Blocking core functionality
- **High**: Major feature breakage
- **Medium**: Non-critical functionality issues
- **Low**: Minor issues, UI glitches

## Test Documentation

- **Test Plans**: Located in `docs/test-plans/`
- **Test Reports**: Generated automatically in CI/CD pipeline
- **Test Coverage Reports**: Available after running coverage commands

## Best Practices

1. Write tests before or along with feature code (TDD approach when possible)
2. Keep tests simple, focused, and independent
3. Use descriptive test names that explain the expected behavior
4. Avoid test interdependencies
5. Maintain test code with the same standards as application code
6. Don't test third-party code, focus on our implementation
7. Run the full test suite locally before pushing changes

## Recommended Testing Tools

- **Debugging**: Chrome DevTools, VS Code Debugger
- **API Testing**: Postman, Insomnia
- **Performance Analysis**: Lighthouse, WebPageTest
- **Security Scanning**: OWASP ZAP, npm audit
- **Visual Regression**: Percy or Applitools

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Cypress Documentation](https://docs.cypress.io/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [Web Accessibility Testing](https://www.w3.org/WAI/test-evaluate/)
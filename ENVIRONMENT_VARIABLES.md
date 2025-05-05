# Environment Variables

This document outlines all environment variables used by the IGNITE Sleep Lounge and Zen Zone application.

## Required Environment Variables

The following environment variables must be set for the application to function properly:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Application environment | `development`, `production`, `test` |
| `PORT` | Port the server will listen on | `5020` |
| `DB_HOST` | PostgreSQL database host | `localhost` |
| `DB_USER` | PostgreSQL database user | `sleep_lounge_user` |
| `DB_PASSWORD` | PostgreSQL database password | `your_strong_password` |
| `DB_NAME` | PostgreSQL database name | `sleep_lounge_db` |
| `DB_PORT` | PostgreSQL database port | `5432` |
| `JWT_SECRET` | Secret key for JWT token generation | `your_very_long_random_jwt_secret_key` |
| `JWT_EXPIRE` | JWT token expiration time | `7d` |

## Optional Environment Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `LOG_LEVEL` | Level of logging to capture | `info` | `debug`, `info`, `warn`, `error` |
| `CORS_ORIGIN` | Allowed CORS origins | `*` | `https://example.com` |
| `RATE_LIMIT_WINDOW` | Time window for rate limiting (ms) | `900000` (15 min) | `60000` |
| `RATE_LIMIT_MAX` | Max requests per window | `100` | `50` |
| `SESSION_COOKIE_SECRET` | Secret for cookie session | Same as JWT_SECRET | `your_session_cookie_secret` |

## Development-only Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DISABLE_RATE_LIMIT` | Disable API rate limiting | `true` |
| `MOCK_AUTH` | Skip authentication (dev only) | `true` |

## Setting Up Environment Variables

1. Create a `.env` file in the root directory of the project
2. Add the required environment variables to the file
3. Add any optional variables as needed

See the `.env.example` file for a template.

## Generating Secure Values

For secure values like `JWT_SECRET`, use the following command:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Environment Configuration in Deployment

In production environments, it's recommended to use environment-specific configuration management:

- For cloud hosting: Use the provider's environment variable configuration tools
- For containerized deployments: Use Docker secrets or Kubernetes ConfigMaps/Secrets
- For traditional hosting: Use a secure environment variable file that's not tracked in version control

## Important Security Notes

- Never commit `.env` files to version control
- Rotate secrets periodically, especially in production environments
- Use different secret values for development, staging, and production environments
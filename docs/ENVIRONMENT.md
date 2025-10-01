# Environment Configuration Template

Copy this file to `.env.local` and update the values for your environment.

```bash
# MCP Server Configuration
MCP_SERVER_URL=http://localhost:8000

# Database Configuration (if needed)
DATABASE_URL=your_database_url

# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Analytics and Monitoring
# NEXT_PUBLIC_GA_ID=your_google_analytics_id
# SENTRY_DSN=your_sentry_dsn

# Optional: Authentication (for future use)
# NEXTAUTH_SECRET=your_nextauth_secret
# NEXTAUTH_URL=http://localhost:3000
```

## Instructions

1. Copy this file to `.env.local` in the root directory
2. Update the values according to your environment
3. Never commit `.env.local` to version control
4. Use different values for development, staging, and production

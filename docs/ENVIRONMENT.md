# Environment Configuration Template

Copy this file to `.env.local` and update the values for your environment.

```bash
# MCP Server Configuration
MCP_SERVER_URL=http://localhost:8000

# Database Configuration
# For SQLite local development (recommended for development)
DATABASE_TYPE=sqlite
DATABASE_URL=sqlite:///local_dev.db

# For production databases (uncomment and configure as needed)
# DATABASE_TYPE=sqlalchemy
# DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# SQLAlchemy Pool Configuration (optional)
# POOL_SIZE=5
# POOL_MAX_OVERFLOW=10
# POOL_TIMEOUT=30
# POOL_RECYCLE=1800
# POOL_PRE_PING=true
# POOL_USE_LIFO=false
# POOL_LOG_EVENTS=true

# For Snowflake (uncomment and configure as needed)
# DATABASE_TYPE=snowflake
# SNOWFLAKE_ACCOUNT=your_account
# SNOWFLAKE_USER=your_user
# SNOWFLAKE_PASSWORD=your_password
# SNOWFLAKE_DATABASE=your_database
# SNOWFLAKE_SCHEMA=your_schema
# SNOWFLAKE_WAREHOUSE=your_warehouse

# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Analytics and Monitoring
# NEXT_PUBLIC_GA_ID=your_google_analytics_id
# SENTRY_DSN=your_sentry_dsn

# Authentication Configuration
JWT_SECRET=your_jwt_secret_key_here
DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_PASSWORD=admin1234
AUTO_AUTH=false

# Redis Configuration (for user and credential storage)
REDIS_URL=redis://localhost:6379

# Credential Encryption (REQUIRED for production)
# Generate a secure 256-bit key: openssl rand -base64 32
CREDENTIAL_ENCRYPTION_KEY=your_base64_encoded_encryption_key_here
# Development fallback (NOT secure for production)
CREDENTIAL_ENCRYPTION_SEED=development-seed-key
```

## Instructions

1. Copy this file to `.env.local` in the root directory
2. Update the values according to your environment
3. Never commit `.env.local` to version control
4. Use different values for development, staging, and production

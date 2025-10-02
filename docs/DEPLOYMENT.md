# Deployment Guide

## Overview

This guide covers different deployment options for the MCP Database Console application.

## Prerequisites

- **Node.js** 18.0.0 or higher
- **MCP-DB Connector** server running and accessible
- **Domain name** (for production deployments)

## Environment Setup

### Environment Variables

Create environment variables for your deployment:

```bash
# Production Environment
NODE_ENV=production
MCP_SERVER_URL=https://your-mcp-server.com
DATABASE_URL=your_production_database_url

# Optional
NEXT_PUBLIC_APP_URL=https://your-app.com
```

### MCP Server Configuration

Ensure your MCP-DB Connector server is:

- Running and accessible
- Properly configured for your database
- Has appropriate security measures
- Can handle production load

## Deployment Options

### 1. Vercel (Recommended)

Vercel is the easiest way to deploy Next.js applications.

#### Steps:

1. **Connect your repository**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository

2. **Configure environment variables**
   - Add environment variables in Vercel dashboard
   - Set `MCP_SERVER_URL` to your MCP server URL

3. **Deploy**
   - Vercel will automatically deploy on every push to main
   - Get your deployment URL

#### Vercel Configuration

Create `vercel.json`:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "env": {
    "MCP_SERVER_URL": "@mcp-server-url"
  }
}
```

### 2. Netlify

#### Steps:

1. **Build settings**
   - Build command: `npm run build`
   - Publish directory: `.next`

2. **Environment variables**
   - Add `MCP_SERVER_URL` in Netlify dashboard

3. **Deploy**
   - Connect your repository
   - Deploy automatically on push

### 3. Docker

#### Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### Build and Run

```bash
# Build the Docker image
docker build -t mcp-database-console .

# Run the container
docker run -p 3000:3000 \
  -e MCP_SERVER_URL=https://your-mcp-server.com \
  mcp-database-console
```

### 4. AWS EC2

#### Steps:

1. **Launch EC2 instance**
   - Choose Ubuntu 20.04 LTS
   - Configure security groups (port 3000)

2. **Install dependencies**

   ```bash
   sudo apt update
   sudo apt install nodejs npm nginx
   ```

3. **Deploy application**

   ```bash
   git clone https://github.com/your-username/mcp-for-database.git
   cd mcp-for-database
   npm install
   npm run build
   ```

4. **Configure PM2**

   ```bash
   npm install -g pm2
   pm2 start npm --name "mcp-console" -- start
   pm2 startup
   pm2 save
   ```

5. **Configure Nginx**

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### 5. Google Cloud Platform

#### Using Cloud Run

1. **Create Dockerfile** (see Docker section above)

2. **Build and push to Container Registry**

   ```bash
   gcloud builds submit --tag gcr.io/PROJECT-ID/mcp-database-console
   ```

3. **Deploy to Cloud Run**
   ```bash
   gcloud run deploy mcp-database-console \
     --image gcr.io/PROJECT-ID/mcp-database-console \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

## Production Considerations

### Security

- **HTTPS**: Always use HTTPS in production
- **Environment Variables**: Never commit sensitive data
- **CORS**: Configure CORS properly
- **Rate Limiting**: Implement rate limiting
- **Input Validation**: Validate all inputs

### Performance

- **CDN**: Use a CDN for static assets
- **Caching**: Implement proper caching strategies
- **Monitoring**: Set up monitoring and alerting
- **Load Balancing**: Use load balancers for high traffic

### Monitoring

- **Health Checks**: Implement health check endpoints
- **Logging**: Set up proper logging
- **Metrics**: Monitor key metrics
- **Alerts**: Set up alerts for critical issues

## Health Checks

Add a health check endpoint:

```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // Check MCP server connection
    const response = await fetch(process.env.MCP_SERVER_URL + '/health');

    if (!response.ok) {
      throw new Error('MCP server not healthy');
    }

    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json(
      {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 503 }
    );
  }
}
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **Runtime Errors**
   - Verify environment variables
   - Check MCP server connectivity
   - Review application logs

3. **Performance Issues**
   - Monitor resource usage
   - Check database connection pooling
   - Optimize queries

### Debug Commands

```bash
# Check application status
curl https://your-app.com/api/health

# Check MCP server connectivity
curl https://your-mcp-server.com/health

# View logs (if using PM2)
pm2 logs mcp-console
```

## Rollback Strategy

### Vercel

- Use Vercel's deployment history to rollback

### Docker

- Keep previous image versions
- Use blue-green deployment

### Manual Deployments

- Keep deployment scripts
- Maintain deployment history
- Test rollback procedures

## Backup Strategy

- **Code**: Git repository
- **Configuration**: Environment variables backup
- **Database**: Regular database backups
- **Logs**: Centralized logging system

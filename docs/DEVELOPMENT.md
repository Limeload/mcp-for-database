# Development Guide

## Getting Started

This guide will help you set up the development environment for the MCP Database Console.

## Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 8.0.0 or higher (or **pnpm**)
- **Git**
- **MCP-DB Connector** server running on `http://localhost:8000`

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/mcp-for-database.git
   cd mcp-for-database
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
mcp-for-database/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── components/        # React components
│   ├── db-console/        # Database console page
│   ├── types/             # TypeScript types
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── docs/                  # Documentation
├── examples/              # Example files
├── scripts/               # Utility scripts
├── .github/               # GitHub configuration
└── ...config files
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run type-check` - Run TypeScript type checking
- `npm run clean` - Clean build artifacts

## Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the coding standards
   - Add tests if applicable
   - Update documentation

3. **Test your changes**
   ```bash
   npm run type-check
   npm run lint
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## Coding Standards

### TypeScript
- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid `any` types when possible
- Use strict type checking

### React/Next.js
- Use functional components with hooks
- Follow Next.js best practices
- Implement proper error boundaries
- Use proper component naming conventions

### Styling
- Use TailwindCSS for styling
- Follow responsive design principles
- Maintain consistent spacing and colors
- Use semantic class names

### API Design
- Follow RESTful conventions
- Implement proper error handling
- Use appropriate HTTP status codes
- Validate input parameters

## Testing

### Running Tests
```bash
npm test
```

### Writing Tests
- Write tests for new features
- Test edge cases and error conditions
- Maintain good test coverage
- Use descriptive test names

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
# MCP Server Configuration
MCP_SERVER_URL=http://localhost:8000

# Database Configuration (if needed)
DATABASE_URL=your_database_url

# Development Configuration
NODE_ENV=development
```

## Debugging

### Common Issues

1. **MCP Server Connection**
   - Ensure MCP-DB Connector is running on port 8000
   - Check network connectivity
   - Verify server logs

2. **Build Errors**
   - Run `npm run type-check` to check TypeScript errors
   - Run `npm run lint` to check code quality
   - Clear build cache with `npm run clean`

3. **Runtime Errors**
   - Check browser console for errors
   - Check server logs
   - Verify environment variables

### Debug Tools

- **Browser DevTools**: For client-side debugging
- **Next.js DevTools**: Built-in development tools
- **TypeScript**: Compile-time error checking
- **ESLint**: Code quality checking

## Performance

### Optimization Tips

- Use React.memo for expensive components
- Implement proper loading states
- Optimize images and assets
- Use Next.js built-in optimizations

### Monitoring

- Monitor bundle size
- Check Core Web Vitals
- Use performance profiling tools
- Monitor API response times

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Setup

- Set production environment variables
- Configure MCP server URL
- Set up monitoring and logging
- Configure CDN if needed

## Troubleshooting

### Common Problems

1. **Port Already in Use**
   ```bash
   # Kill process using port 3000
   lsof -ti:3000 | xargs kill -9
   ```

2. **Dependencies Issues**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **TypeScript Errors**
   ```bash
   # Check TypeScript configuration
   npm run type-check
   ```

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for detailed contribution guidelines.

## Support

- **Issues**: Create a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check the docs folder for more information

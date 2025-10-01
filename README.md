# MCP Database Console

[![Hacktoberfest](https://img.shields.io/badge/Hacktoberfest-2025-orange?style=for-the-badge&logo=hacktoberfest)](https://hacktoberfest.com/)
[![Open Source](https://img.shields.io/badge/Open%20Source-Yes-green?style=for-the-badge&logo=github)](https://github.com/your-username/mcp-for-database)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Contributors Welcome](https://img.shields.io/badge/Contributors-Welcome-blue?style=for-the-badge)](CONTRIBUTING.md)

A Next.js application that provides a natural language interface for database queries through the MCP-DB Connector.

## 🎉 Hacktoberfest 2025

This repository is participating in **Hacktoberfest 2025**! We welcome contributions from developers of all skill levels. After **5 approved pull requests**, you'll be recognized as a project contributor!

### Quick Start for Contributors
1. **Fork** this repository
2. **Star** the repository (optional but appreciated!)
3. **Check** our [Contributing Guidelines](CONTRIBUTING.md)
4. **Look** for issues labeled `hacktoberfest` or `good first issue`
5. **Create** a pull request with your contribution
6. **Get recognized** as a contributor after 5 approved PRs!

[![Contributors](https://img.shields.io/github/contributors/your-username/mcp-for-database?style=for-the-badge)](CONTRIBUTORS.md)

## Features

- **Natural Language Queries**: Enter prompts in plain English to query your database
- **Multiple Database Targets**: Support for SQLAlchemy and Snowflake databases
- **Real-time Results**: View query results in a formatted table
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Modern UI**: Built with TailwindCSS for a clean, responsive interface

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- MCP-DB Connector server running on `http://localhost:8000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Database Console

Navigate to `/db-console` to access the database query interface:

1. **Enter a Prompt**: Describe what you want to query in natural language
   - Example: "Show me all users who registered in the last 30 days"
   - Example: "Find the top 10 products by sales"

2. **Select Database Target**: Choose between:
   - **SQLAlchemy**: For SQLAlchemy-based applications
   - **Snowflake**: For Snowflake data warehouse

3. **Execute Query**: Click "Execute Query" to run your prompt

4. **View Results**: Results are displayed in a formatted table with:
   - Generated SQL query (if available)
   - Query execution time
   - Data results in tabular format

### API Endpoints

#### POST `/api/db/[query]`

Execute a database query using natural language.

**Request Body:**
```json
{
  "prompt": "string",
  "target": "sqlalchemy" | "snowflake"
}
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "query": "SELECT ...",
  "executionTime": 150
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

## Project Structure

```
app/
├── api/
│   └── db/
│       └── [query]/
│           └── route.ts          # API route for database queries
├── components/
│   └── DbConsole.tsx            # Main database console component
├── db-console/
│   └── page.tsx                 # Database console page
├── types/
│   └── database.ts              # TypeScript types for database operations
├── globals.css                  # Global styles with TailwindCSS
├── layout.tsx                   # Root layout component
└── page.tsx                     # Home page
```

## Configuration

### MCP Server

The application expects the MCP-DB Connector server to be running on `http://localhost:8000`. Update the URL in `/app/api/db/[query]/route.ts` if your MCP server runs on a different port.

### TailwindCSS

The project uses TailwindCSS for styling. Configuration files:
- `tailwind.config.js` - TailwindCSS configuration
- `postcss.config.js` - PostCSS configuration
- `app/globals.css` - Global styles

## Development

### Building for Production

```bash
npm run build
npm start
```

### TypeScript

The project is fully typed with TypeScript. All API responses and component props are properly typed.

## Error Handling

The application includes comprehensive error handling:

- **Network Errors**: When the MCP server is unreachable
- **Validation Errors**: For missing or invalid request parameters
- **Server Errors**: When the MCP server returns an error
- **Client Errors**: For malformed requests

All errors are displayed to the user with clear, actionable messages.

## 🤝 Contributing

We welcome contributions from the community! This project is participating in Hacktoberfest 2025.

### For Contributors
- 📖 Read our [Contributing Guidelines](CONTRIBUTING.md)
- 📋 Check our [Code of Conduct](CODE_OF_CONDUCT.md)
- 🏆 See our [Contributors](CONTRIBUTORS.md) page
- 🎯 Look for issues labeled `hacktoberfest` or `good first issue`

### Quick Contribution Steps
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Recognition
After **5 approved pull requests**, you'll be:
- Added to our [Contributors](CONTRIBUTORS.md) list
- Recognized as a project contributor
- Eligible for Hacktoberfest completion

## License

This project is licensed under the MIT License - see the LICENSE file for details.
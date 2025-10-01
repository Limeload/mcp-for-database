# MCP Database Console

[![Hacktoberfest](https://img.shields.io/badge/Hacktoberfest-2025-orange?style=for-the-badge&logo=hacktoberfest)](https://hacktoberfest.com/)
[![Open Source](https://img.shields.io/badge/Open%20Source-Yes-green?style=for-the-badge&logo=github)](https://github.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Contributors Welcome](https://img.shields.io/badge/Contributors-Welcome-blue?style=for-the-badge)](CONTRIBUTING.md)

## 🚀 What is MCP Database Console?

**MCP Database Console** is a revolutionary web application that bridges the gap between natural language and database queries. Built with Next.js and powered by the MCP-DB Connector, it allows users to interact with databases using plain English instead of complex SQL syntax.

### 🎯 The Problem We Solve

- **SQL Complexity**: Writing SQL queries requires technical expertise and knowledge of database schemas
- **Accessibility**: Non-technical users struggle to extract insights from databases
- **Time Consumption**: Developers spend significant time writing and debugging SQL queries
- **Learning Curve**: New team members need time to understand database structures

### 💡 Our Solution

Transform natural language into powerful database queries through an intuitive web interface that:
- **Understands Context**: Interprets user intent from conversational prompts
- **Supports Multiple Databases**: Works with SQLAlchemy and Snowflake databases
- **Provides Real-time Results**: Shows query results instantly in formatted tables
- **Handles Errors Gracefully**: Offers helpful error messages and suggestions

### 🌟 Key Benefits

- **Democratize Data Access**: Enable non-technical users to query databases
- **Increase Productivity**: Reduce time spent on query writing and debugging
- **Improve Accuracy**: Minimize SQL syntax errors through natural language processing
- **Enhance Collaboration**: Allow team members to share insights without SQL knowledge

## 🎉 Hacktoberfest 2025

This repository is participating in **Hacktoberfest 2025**! We welcome contributions from developers of all skill levels. After **15 approved pull requests**, you'll be recognized as a project contributor!

### Quick Start for Contributors
1. **Fork** this repository
2. **Star** the repository (optional but appreciated!)
3. **Check** our [Contributing Guidelines](CONTRIBUTING.md)
4. **Look** for issues labeled `hacktoberfest` or `good first issue`
5. **Create** a pull request with your contribution
6. **Get recognized** as a contributor after 15 approved PRs!

[![Contributors](https://img.shields.io/github/contributors?style=for-the-badge)](CONTRIBUTORS.md)

## 🎯 MVP (Minimum Viable Product)

### Core Features ✅
- **Natural Language Query Interface**: Basic English-to-SQL conversion
- **Database Support**: SQLAlchemy and Snowflake connectors
- **Results Display**: Formatted table output with query execution time
- **Error Handling**: User-friendly error messages and validation
- **Responsive UI**: Clean, modern interface built with TailwindCSS

### Current Status: **MVP Complete** 🚀

## 🗺️ Roadmap

### Phase 1: Foundation (Q1 2025) ✅
- [x] Basic natural language query interface
- [x] SQLAlchemy and Snowflake database support
- [x] Error handling and validation
- [x] Responsive UI with TailwindCSS
- [x] Open-source setup and documentation

### Phase 2: Enhancement (Q2 2025) 🚧
- [ ] **Query History**: Save and replay previous queries
- [ ] **Query Templates**: Pre-built templates for common operations
- [ ] **Export Functionality**: CSV, JSON, Excel export options
- [ ] **Dark Mode**: Theme toggle for better user experience
- [ ] **Mobile Optimization**: Enhanced mobile responsiveness
- [ ] **Loading States**: Better UX with spinners and progress indicators

### Phase 3: Advanced Features (Q3 2025) 📋
- [ ] **Query Validation**: Client-side query validation and suggestions
- [ ] **Performance Metrics**: Detailed query performance analytics
- [ ] **Database Schema Explorer**: Visual schema browsing
- [ ] **Query Optimization**: Automatic query optimization suggestions
- [ ] **Multi-language Support**: Internationalization (i18n)
- [ ] **User Authentication**: User accounts and query sharing

### Phase 4: Enterprise (Q4 2025) 🎯
- [ ] **Team Collaboration**: Shared queries and team workspaces
- [ ] **Advanced Analytics**: Query usage analytics and insights
- [ ] **API Rate Limiting**: Enterprise-grade API management
- [ ] **Custom Connectors**: Plugin system for custom database connectors
- [ ] **Audit Logging**: Comprehensive audit trails
- [ ] **SSO Integration**: Single Sign-On support

## 🚀 Stretch Goals

### AI-Powered Features 🤖
- [ ] **Smart Query Suggestions**: AI-powered query recommendations
- [ ] **Natural Language Schema Understanding**: AI that understands database relationships
- [ ] **Query Explanation**: AI-generated explanations of complex queries
- [ ] **Predictive Analytics**: AI-powered data insights and trends

### Advanced Integrations 🔗
- [ ] **BI Tool Integration**: Connect with Tableau, Power BI, Looker
- [ ] **Data Pipeline Integration**: Connect with Apache Airflow, dbt
- [ ] **Cloud Platform Support**: AWS, GCP, Azure native integrations
- [ ] **Real-time Data Streaming**: Support for streaming data sources

### Developer Experience 👨‍💻
- [ ] **SDK Development**: JavaScript, Python, Go SDKs
- [ ] **CLI Tool**: Command-line interface for power users
- [ ] **VS Code Extension**: IDE integration for developers
- [ ] **API Documentation**: Interactive API documentation with Swagger

### Community & Ecosystem 🌍
- [ ] **Plugin Marketplace**: Community-contributed connectors
- [ ] **Query Library**: Community-shared query templates
- [ ] **Learning Resources**: Interactive tutorials and documentation
- [ ] **Conference Talks**: Present at major tech conferences

## 👥 Use Cases

### 🏢 Business Analysts
- **Quick Data Insights**: Get answers to business questions without waiting for developers
- **Ad-hoc Reporting**: Create reports on-demand using natural language
- **Data Exploration**: Discover patterns and trends in company data

### 👨‍💼 Product Managers
- **User Analytics**: Understand user behavior and product metrics
- **Feature Analysis**: Analyze feature adoption and performance
- **Competitive Intelligence**: Gather insights from market data

### 🎓 Data Scientists
- **Rapid Prototyping**: Quickly test hypotheses with natural language queries
- **Data Validation**: Verify data quality and consistency
- **Exploratory Analysis**: Initial data exploration before deep analysis

### 🏭 Operations Teams
- **System Monitoring**: Query system logs and performance metrics
- **Incident Analysis**: Investigate issues using natural language
- **Capacity Planning**: Analyze resource usage patterns

### 🎓 Students & Researchers
- **Learning SQL**: Understand database concepts through natural language
- **Research Data**: Query academic databases and research datasets
- **Project Analysis**: Analyze project data for academic research

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
After **15 approved pull requests**, you'll be:
- Added to our [Contributors](CONTRIBUTORS.md) list
- Recognized as a project contributor
- Eligible for Hacktoberfest completion

## License

This project is licensed under the MIT License - see the LICENSE file for details.
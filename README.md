# MCP Database Console

<div align="center">

[![Hacktoberfest](https://img.shields.io/badge/Hacktoberfest-2025-orange?style=for-the-badge&logo=hacktoberfest)](https://hacktoberfest.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Contributors Welcome](https://img.shields.io/badge/Contributors-Welcome-blue?style=for-the-badge)](CONTRIBUTING.md)

**A revolutionary web application that bridges the gap between natural language and database queries**

[🚀 Quick Start](#-quick-start) • [📖 Documentation](#-documentation) • [🤝 Contributing](#-contributing)

</div>

---

## 🚀 What is MCP Database Console?

**MCP Database Console** is a cutting-edge web application that transforms natural language into powerful database queries. Built with Next.js and powered by the MCP-DB Connector, it democratizes database access by allowing users to interact with databases using plain English instead of complex SQL syntax.

### 🎯 The Problem We Solve

- **SQL Complexity**: Writing SQL queries requires technical expertise and knowledge of database schemas
- **Accessibility**: Non-technical users struggle to extract insights from databases
- **Time Consumption**: Developers spend significant time writing and debugging SQL queries
- **Learning Curve**: New team members need time to understand database structures

### 💡 Our Solution

Transform natural language into powerful database queries through an intuitive web interface that:

- **Understands Context**: Interprets user intent from conversational prompts
- **Supports Multiple Databases**: Works with SQLAlchemy, Snowflake, and SQLite databases (backend implementation required)
- **Provides Real-time Results**: Shows query results instantly in formatted tables
- **Handles Errors Gracefully**: Offers helpful error messages and suggestions

### 🌟 Key Benefits

- **Democratize Data Access**: Enable non-technical users to query databases
- **Increase Productivity**: Reduce time spent on query writing and debugging
- **Improve Accuracy**: Minimize SQL syntax errors through natural language processing
- **Enhance Collaboration**: Allow team members to share insights without SQL knowledge

---

## 🎉 Hacktoberfest 2025

This repository is participating in **Hacktoberfest 2025**! We welcome contributions from developers of all skill levels. After **15 approved pull requests**, you'll be recognized as a project collaborator!

### Quick Start for Contributors


---

## Local development (mock MCP)

If you don't have a running MCP-DB Connector locally, the repository includes a small mock server to exercise the frontend during development.

- Start the mock MCP server (listens on port 8000 by default):

```powershell
npm run mock:mcp
```

- Start the Next.js dev server in a separate terminal:

```powershell
npm run dev
```

- Open the app and try the Test Connection button:

  - Visit http://localhost:3000/db-console
  - Choose a target (e.g. `snowflake` or `sqlite`) and click **Test Connection**

- You can also call the mock endpoints directly for quick checks:

```powershell
# POST to mock test-connection
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/test-connection -Body (@{ target = 'snowflake' } | ConvertTo-Json) -ContentType 'application/json'

# POST a mock query
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/query -Body (@{ sql = 'select 1' } | ConvertTo-Json) -ContentType 'application/json'
```

Notes:
- The mock server logs incoming requests to the terminal to help with debugging.
- If port 8000 is already in use, set `MOCK_MCP_PORT` before running the mock, and update `MCP_SERVER_URL` in `.env.local` if necessary.
1. **Fork** this repository
2. **Star** the repository (optional but appreciated!)
3. **Check** our [Contributing Guidelines](CONTRIBUTING.md)
4. **Look** for issues labeled `hacktoberfest` or `good first issue`
5. **Create** a pull request with your contribution
6. **Get recognized** as a collaborator after 15 approved PRs!

---

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

---

## 🎯 MVP (Minimum Viable Product)

### Core Features ✅

- **Natural Language Query Interface**: Basic English-to-SQL conversion
- **Database Support**: SQLAlchemy and Snowflake connectors
- **Results Display**: Formatted table output with query execution time
- **Error Handling**: User-friendly error messages and validation
- **Responsive UI**: Clean, modern interface built with TailwindCSS

### Current Status: **MVP Complete** 🚀

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **npm** or **pnpm**
- **MCP-DB Connector** server running on `http://localhost:8000`

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Limeload/mcp-for-database.git
   cd mcp-for-database
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### SQLite Local Development Setup

For local development with SQLite, follow these additional steps:

1. **Set up environment variables** for SQLite:

    ```bash
    # Create .env.local file
    DATABASE_TYPE=sqlite
    DATABASE_URL=sqlite:///local_dev.db
    ```

2. **Initialize the SQLite database** (requires Python and SQLAlchemy):

    ```bash
    # Install Python dependencies (if not already installed)
    pip install sqlalchemy

    # Initialize database
    python scripts/init_sqlite.py

    # Optional: Add sample data
    python scripts/seed_data.py
    ```

3. **Configure your MCP server** to use SQLite backend

    **⚠️ Important**: The MCP-DB Connector server must be updated to support SQLite queries. The frontend now accepts SQLite as a target, but the backend server needs corresponding SQLite support.

4. **Start both servers**:

    ```bash
    # Terminal 1: Start MCP server (with SQLite support)
    # Your MCP server command here

    # Terminal 2: Start Next.js development server
    npm run dev
    ```

**SQLite Benefits for Development:**
- No external database server required
- File-based storage (`local_dev.db`)
- Easy to reset and recreate
- Perfect for testing and development

**SQLite Limitations:**
- Single-writer concurrency (not suitable for high-traffic production)
- No built-in user authentication or permissions
- Limited data types compared to PostgreSQL/MySQL
- File-based (backup and replication require manual processes)

### Usage

#### Database Console

Navigate to `/db-console` to access the database query interface:

1. **Enter a Prompt**: Describe what you want to query in natural language
   - Example: "Show me all users who registered in the last 30 days"
   - Example: "Find the top 10 products by sales"

2. **Select Database Target**: Choose between:
    - **SQLAlchemy**: For SQLAlchemy-based applications
    - **Snowflake**: For Snowflake data warehouse
    - **SQLite**: For local development with SQLite database

3. **Execute Query**: Click "Execute Query" to run your prompt

4. **View Results**: Results are displayed in a formatted table with:
   - Generated SQL query (if available)
   - Query execution time
   - Data results in tabular format

---

## 📖 Documentation

- **[Contributing Guidelines](CONTRIBUTING.md)** - How to contribute to the project
- **[Code of Conduct](CODE_OF_CONDUCT.md)** - Community standards and behavior
- **[Security Policy](SECURITY.md)** - Security guidelines and vulnerability reporting
- **[Contributors](CONTRIBUTORS.md)** - List of project collaborators
- **[Roadmap](docs/ROADMAP.md)** - Detailed development roadmap and future plans
- **[API Documentation](docs/API.md)** - Complete API reference
- **[Development Guide](docs/DEVELOPMENT.md)** - Development setup and guidelines
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Deployment options and instructions

---

## 🔧 API Reference

### POST `/api/db/[query]`

Execute a database query using natural language.

**Request Body:**

```json
{
  "prompt": "string",
  "target": "sqlalchemy" | "snowflake" | "sqlite"
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

---

## ⚙️ Configuration

### MCP Server

The application expects the MCP-DB Connector server to be running on `http://localhost:8000`. Update the URL in `/app/api/db/[query]/route.ts` if your MCP server runs on a different port.

### Environment Variables

Create a `.env.local` file in the root directory:

```bash
# MCP Server Configuration
MCP_SERVER_URL=http://localhost:8000

# Database Configuration (if needed)
DATABASE_URL=your_database_url
```

### TailwindCSS

The project uses TailwindCSS for styling. Configuration files:

- `tailwind.config.js` - TailwindCSS configuration
- `postcss.config.js` - PostCSS configuration
- `app/globals.css` - Global styles

---

## 🧪 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Testing
npm test             # Run tests (when implemented)
```

### Building for Production

```bash
npm run build
npm start
```

### TypeScript

The project is fully typed with TypeScript. All API responses and component props are properly typed.

---

## 🛡️ Error Handling

The application includes comprehensive error handling:

- **Network Errors**: When the MCP server is unreachable
- **Validation Errors**: For missing or invalid request parameters
- **Server Errors**: When the MCP server returns an error
- **Client Errors**: For malformed requests

All errors are displayed to the user with clear, actionable messages.

---

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
- Recognized as a project collaborator
- Eligible for Hacktoberfest completion

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Next.js** team for the amazing framework
- **TailwindCSS** for the utility-first CSS framework
- **MCP-DB Connector** for the database integration
- **Hacktoberfest** community for inspiring open-source contributions

---

<div align="center">

**Made with ❤️ for the open-source community**

[⭐ Star this repo](https://github.com/Limeload/mcp-for-database) • [🐛 Report Bug](https://github.com/Limeload/mcp-for-database/issues) • [✨ Request Feature](https://github.com/Limeload/mcp-for-database/issues)

</div>

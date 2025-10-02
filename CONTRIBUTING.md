# Contributing to MCP Database Console

Thank you for your interest in contributing to the MCP Database Console! This project is participating in Hacktoberfest 2025, and we welcome contributions from developers of all skill levels.

---

## 📖 Table of Contents

- [Hacktoberfest 2025](#-hacktoberfest-2025)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Setting Up Your Development Environment](#setting-up-your-development-environment)
- [Types of Contributions](#-types-of-contributions)
- [Good First Issues](#-good-first-issues)
- [Step-by-Step Tutorials](#-step-by-step-tutorials)
  - [Tutorial 1: Your First Bug Fix](#tutorial-1-your-first-bug-fix)
  - [Tutorial 2: Adding a New Feature](#tutorial-2-adding-a-new-feature)
  - [Tutorial 3: Improving Documentation](#tutorial-3-improving-documentation)
  - [Tutorial 4: Refactoring Code](#tutorial-4-refactoring-code)
- [Common Contribution Patterns](#-common-contribution-patterns)
- [Troubleshooting](#-troubleshooting)
- [Video Tutorials](#-video-tutorials)
- [Making Changes](#-making-changes)
- [Code Review Process](#-code-review-process)
- [Advanced Contribution Guide](#-advanced-contribution-guide)
- [Contribution Workflow Cheatsheet](#-contribution-workflow-cheatsheet)
- [Code Standards](#-code-standards)
- [Testing](#-testing)
- [Documentation](#-documentation)
- [Pull Request Guidelines](#-pull-request-guidelines)
- [Contributor Recognition](#-contributor-recognition)
- [Community Guidelines](#-community-guidelines)
- [Getting Help](#-getting-help)
- [License](#-license)

---

## 🎉 Hacktoberfest 2025

This repository is participating in Hacktoberfest 2025! We're looking for contributors to help improve this natural language database query interface.

### How to Participate

1. **Fork** this repository
2. **Star** the repository (optional but appreciated!)
3. **Create** a pull request with your contribution
4. **Wait** for review and approval
5. **Get recognized** as a contributor after 15 approved PRs!

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0.0 or higher ([Download](https://nodejs.org/))
- **npm** 8.0.0+ or **pnpm** 8.0.0+ ([Install pnpm](https://pnpm.io/installation))
- **Git** ([Download](https://git-scm.com/downloads))
- **A GitHub account** ([Sign up](https://github.com/join))
- **Code Editor** - VS Code recommended ([Download](https://code.visualstudio.com/))

**Optional but Recommended:**
- **MCP-DB Connector server** running on `http://localhost:8000` (for testing full functionality)
- **GitHub CLI** for easier PR management ([Install](https://cli.github.com/))

### Setting Up Your Development Environment

#### Step 1: Fork the Repository

1. Visit [https://github.com/sammyifelse/mcp-for-database](https://github.com/sammyifelse/mcp-for-database)
2. Click the **"Fork"** button in the top-right corner
3. This creates your own copy of the repository

#### Step 2: Clone Your Fork

```bash
# Clone your forked repository
git clone https://github.com/YOUR_USERNAME/mcp-for-database.git

# Navigate into the project directory
cd mcp-for-database

# Add the original repository as "upstream" remote
git remote add upstream https://github.com/sammyifelse/mcp-for-database.git

# Verify remotes are set correctly
git remote -v
```

**Expected output:**
```
origin    https://github.com/YOUR_USERNAME/mcp-for-database.git (fetch)
origin    https://github.com/YOUR_USERNAME/mcp-for-database.git (push)
upstream  https://github.com/sammyifelse/mcp-for-database.git (fetch)
upstream  https://github.com/sammyifelse/mcp-for-database.git (push)
```

#### Step 3: Install Dependencies

```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install

# Or using yarn
yarn install
```

**Troubleshooting:** If you encounter permission errors:
```bash
# On Linux/Mac
sudo chown -R $USER ~/.npm

# On Windows (run as Administrator)
npm cache clean --force
```

#### Step 4: Start Development Server

```bash
# Start the Next.js development server
pnpm dev

# Or with npm
npm run dev
```

**Expected output:**
```
▲ Next.js 15.5.4
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in 2.3s
```

#### Step 5: Verify Setup

1. **Open** [http://localhost:3000](http://localhost:3000) in your browser
2. You should see the MCP Database Console home page
3. Click "Open Database Console" to verify the console loads
4. If you see any errors, check the [Troubleshooting](#-troubleshooting) section below

## 📋 Types of Contributions

We welcome various types of contributions:

### 🐛 Bug Fixes

- Fix existing bugs and issues
- Improve error handling
- Enhance user experience

### ✨ New Features

- Add new database connectors
- Implement additional query features
- Enhance the UI/UX
- Add new API endpoints

### 📚 Documentation

- Improve README files
- Add code comments
- Create tutorials or guides
- Update API documentation

### 🧪 Testing

- Add unit tests
- Improve test coverage
- Add integration tests
- Performance testing

### 🎨 UI/UX Improvements

- Enhance the visual design
- Improve accessibility
- Add responsive design features
- Create better user interactions

## 🏷️ Good First Issues

Look for issues labeled with:

- `good first issue` - Perfect for newcomers
- `hacktoberfest` - Hacktoberfest specific issues
- `help wanted` - Community help needed
- `documentation` - Documentation improvements

---

## 📚 Step-by-Step Tutorials

### Tutorial 1: Your First Bug Fix

Let's fix a hypothetical bug where the dark mode toggle doesn't persist across page refreshes.

**Step 1: Identify the Issue**
```bash
# Find the component file
find . -name "*Console*" -type f

# Output: ./app/components/DbConsole.tsx
```

**Step 2: Reproduce the Bug**
1. Start dev server: `pnpm dev`
2. Navigate to database console
3. Toggle dark mode
4. Refresh the page
5. Notice dark mode resets (bug confirmed!)

**Step 3: Create a Branch**
```bash
git checkout -b fix/dark-mode-persistence
```

**Step 4: Locate the Problem**

Open `app/components/DbConsole.tsx` and find the dark mode logic:

```typescript
// Current (buggy) implementation
useEffect(() => {
  const isDark = localStorage.getItem('darkMode') === 'true';
  setIsDarkMode(isDark);
}, []); // Bug: doesn't apply the class on load!
```

**Step 5: Fix the Bug**

```typescript
// Fixed implementation
useEffect(() => {
  const isDark = localStorage.getItem('darkMode') === 'true';
  setIsDarkMode(isDark);
  document.body.classList.toggle('dark-mode', isDark); // Add this line!
}, []);
```

**Step 6: Test the Fix**
1. Refresh the page
2. Toggle dark mode ON
3. Refresh again
4. Dark mode should persist ✅

**Step 7: Commit and Push**
```bash
git add app/components/DbConsole.tsx
git commit -m "fix: persist dark mode setting across page refreshes

- Added classList toggle in useEffect to apply dark mode on page load
- Fixes #XYZ"

git push origin fix/dark-mode-persistence
```

**Step 8: Create Pull Request**

Use the GitHub interface or CLI to create your PR!

---

### Tutorial 2: Adding a New Feature

Let's add a "Clear Results" button to reset the query interface.

**Step 1: Plan the Feature**

- Add a button next to the submit button
- Button should clear the prompt, results, and errors
- Button should be disabled when there's nothing to clear

**Step 2: Create Feature Branch**
```bash
git checkout main
git pull upstream main
git checkout -b feature/clear-results-button
```

**Step 3: Implement the Feature**

Edit `app/components/DbConsole.tsx`:

```typescript
// Add a clear function
const handleClear = () => {
  setPrompt('');
  setResult(null);
  setError(null);
};

// Add the button in the JSX (in the form section)
<button
  type="button"
  onClick={handleClear}
  disabled={!prompt && !result && !error}
  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
>
  🗑️ Clear
</button>
```

**Step 4: Add TypeScript Type Safety**

Ensure the function signature is correct:

```typescript
const handleClear = (): void => {
  setPrompt('');
  setResult(null);
  setError(null);
};
```

**Step 5: Test Thoroughly**

Test scenarios:
- ✅ Button is disabled initially
- ✅ Button becomes enabled after typing
- ✅ Clicking clears the prompt
- ✅ Button clears results after query
- ✅ Button clears error messages
- ✅ Button style changes on hover (when enabled)

**Step 6: Run All Checks**
```bash
pnpm type-check
pnpm lint
pnpm format
```

**Step 7: Commit with Good Message**
```bash
git add .
git commit -m "feat: add clear results button to database console

- Added clear button to reset form state
- Button is disabled when there's nothing to clear
- Clears prompt, results, and error messages
- Improves user experience for multiple queries"
```

**Step 8: Push and Create PR**
```bash
git push origin feature/clear-results-button
gh pr create --fill
```

---

### Tutorial 3: Improving Documentation

Let's add an example to the API documentation.

**Step 1: Identify Documentation Gap**

The API.md file might be missing practical examples.

**Step 2: Create Branch**
```bash
git checkout -b docs/add-api-examples
```

**Step 3: Add Comprehensive Examples**

Edit `docs/API.md`:

```markdown
## Examples

### Example 1: Basic Query

**Request:**
\`\`\`bash
curl -X POST http://localhost:3000/api/db/query \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Show me all users who registered in the last 30 days",
    "target": "sqlalchemy"
  }'
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": [
    {"id": 1, "name": "John Doe", "registered": "2025-09-15"},
    {"id": 2, "name": "Jane Smith", "registered": "2025-09-20"}
  ],
  "query": "SELECT * FROM users WHERE registered >= DATE_SUB(NOW(), INTERVAL 30 DAY)",
  "executionTime": 45
}
\`\`\`

### Example 2: Error Handling

**Request with missing field:**
\`\`\`bash
curl -X POST http://localhost:3000/api/db/query \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Show users"
  }'
\`\`\`

**Response:**
\`\`\`json
{
  "success": false,
  "error": "Missing required fields: prompt and target are required"
}
\`\`\`
```

**Step 4: Commit Documentation**
```bash
git add docs/API.md
git commit -m "docs: add practical API examples with curl commands

- Added example requests and responses
- Included error handling examples
- Improved clarity for API consumers"

git push origin docs/add-api-examples
```

---

### Tutorial 4: Refactoring Code

Let's extract table rendering logic into a reusable component.

**Step 1: Identify Code Duplication**

Notice the table rendering functions in `DbConsole.tsx` could be reused.

**Step 2: Create Branch**
```bash
git checkout -b refactor/extract-results-table
```

**Step 3: Create New Component**

Create `app/components/ResultsTable.tsx`:

```typescript
'use client';

interface ResultsTableProps {
  data: any[];
}

export default function ResultsTable({ data }: ResultsTableProps) {
  if (!data || data.length === 0) {
    return <p className="text-gray-500">No results to display</p>;
  }

  const headers = Object.keys(data[0]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {Object.values(row).map((value, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                >
                  {String(value)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Step 4: Update DbConsole**

```typescript
// Import the new component
import ResultsTable from './ResultsTable';

// Replace the table rendering with:
{result?.data && <ResultsTable data={result.data} />}
```

**Step 5: Test Refactored Code**

Ensure:
- ✅ Results display correctly
- ✅ Styling is maintained
- ✅ Dark mode works
- ✅ No TypeScript errors

**Step 6: Commit**
```bash
git add app/components/
git commit -m "refactor: extract table rendering to ResultsTable component

- Created reusable ResultsTable component
- Improved code organization and maintainability
- Reduced code duplication in DbConsole
- No functional changes to user experience"

git push origin refactor/extract-results-table
```

---

## 💡 Common Contribution Patterns

### Pattern 1: Adding a Database Connector

**File Structure:**
```
app/
  connectors/
    postgres.ts       # New connector
  types/
    database.ts       # Update types
```

**Steps:**
1. Add connector type to `database.ts`
2. Create connector implementation
3. Update API route to handle new type
4. Add tests for the connector
5. Document in README.md

### Pattern 2: Adding an Export Format

**Files to Modify:**
- `app/components/DbConsole.tsx` - Add export button
- `app/utils/export.ts` - Create export utilities
- `app/types/export.ts` - Define export types

**Implementation:**
```typescript
// app/utils/export.ts
export const exportToCSV = (data: any[]): string => {
  const headers = Object.keys(data[0]);
  const rows = data.map(row => Object.values(row));
  
  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
};

export const downloadFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
```

### Pattern 3: Adding UI Components

**Component Checklist:**
- [ ] Create component file in `app/components/`
- [ ] Add TypeScript interfaces for props
- [ ] Implement responsive design
- [ ] Add dark mode support
- [ ] Add accessibility attributes
- [ ] Create tests
- [ ] Document props with JSDoc

**Example Component Structure:**
```typescript
'use client';

import React from 'react';

interface ComponentNameProps {
  /** Description of prop */
  propName: string;
  /** Optional prop with default */
  optionalProp?: boolean;
}

/**
 * ComponentName - Brief description
 * 
 * @example
 * <ComponentName propName="value" />
 */
export default function ComponentName({ 
  propName, 
  optionalProp = false 
}: ComponentNameProps) {
  return (
    <div className="component-container">
      {/* Component JSX */}
    </div>
  );
}
```

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Issue 1: Port 3000 Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Find and kill the process using port 3000
# On Linux/Mac:
lsof -ti:3000 | xargs kill -9

# On Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use a different port:
PORT=3001 pnpm dev
```

#### Issue 2: Module Not Found Errors

**Error:**
```
Module not found: Can't resolve '@/app/components/Component'
```

**Solutions:**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Check TypeScript paths in tsconfig.json
# Ensure "@/*" points to "./*"
```

#### Issue 3: TypeScript Errors

**Error:**
```
Type 'string | undefined' is not assignable to type 'string'
```

**Solution:**
```typescript
// Bad
const value: string = props.optionalProp;

// Good - Use optional chaining and nullish coalescing
const value: string = props.optionalProp ?? 'default';

// Or type guard
if (props.optionalProp) {
  const value: string = props.optionalProp;
}
```

#### Issue 4: Dark Mode Not Working

**Checklist:**
- [ ] Check localStorage is accessible
- [ ] Verify `dark-mode` class is in globals.css
- [ ] Ensure body element has the class applied
- [ ] Clear browser cache and localStorage

**Debug:**
```typescript
// Add console logs to debug
useEffect(() => {
  const saved = localStorage.getItem('darkMode');
  console.log('Saved dark mode:', saved);
  console.log('Body classes:', document.body.classList);
}, []);
```

#### Issue 5: API Connection Issues

**Error:**
```
fetch failed: Connection refused to http://localhost:8000
```

**Solutions:**
1. Ensure MCP-DB Connector is running
2. Check the port number is correct
3. Verify firewall settings
4. Try using `127.0.0.1` instead of `localhost`

```bash
# Test API connectivity
curl http://localhost:8000/health

# Check if port is listening
netstat -an | grep 8000
```

#### Issue 6: Git Merge Conflicts

**When pulling upstream changes:**
```bash
# Update your local main
git checkout main
git pull upstream main

# Rebase your feature branch
git checkout feature/your-feature
git rebase main

# If conflicts occur:
# 1. Fix conflicts in the files
# 2. Stage the resolved files
git add <resolved-files>

# 3. Continue the rebase
git rebase --continue

# Or abort if needed
git rebase --abort
```

#### Issue 7: Linting Errors

**Auto-fix most issues:**
```bash
# Fix ESLint errors
pnpm lint:fix

# Format all files
pnpm format

# For specific files
pnpm prettier --write app/components/DbConsole.tsx
```

#### Issue 8: Build Failures

**Error:**
```
Error: Build failed with errors
```

**Solutions:**
```bash
# Clean build
pnpm clean

# Check for TypeScript errors
pnpm type-check

# Build again
pnpm build

# If still failing, check:
# 1. All imports are correct
# 2. No unused variables
# 3. All components are properly exported
```

### Getting More Help

If you're still stuck:

1. **Search existing issues:** [GitHub Issues](https://github.com/sammyifelse/mcp-for-database/issues)
2. **Create a new issue:** Use the bug report template
3. **Ask in discussions:** [GitHub Discussions](https://github.com/sammyifelse/mcp-for-database/discussions)
4. **Review documentation:** Check `docs/` folder

**When asking for help, include:**
- Your operating system and version
- Node.js and npm/pnpm version
- Exact error message
- Steps to reproduce
- What you've already tried

---

## 🎥 Video Tutorials

### Coming Soon!

We're creating video tutorials for:
- 🎬 Setting up your development environment
- 🎬 Making your first contribution
- 🎬 Understanding the codebase architecture
- 🎬 Advanced contribution patterns
- 🎬 Code review best practices

**Want to contribute a video tutorial?** Open an issue with the `video-tutorial` label!

---

## 📝 Making Changes

### 1. Create a Branch

Always create a new branch for your work:

```bash
# Make sure you're on the main branch
git checkout main

# Pull the latest changes from upstream
git pull upstream main

# Create a new branch with a descriptive name
git checkout -b feature/add-query-history
# or
git checkout -b fix/query-timeout-error
# or
git checkout -b docs/update-api-guide
```

**Branch Naming Convention:**
- `feature/` - for new features (e.g., `feature/export-to-csv`)
- `fix/` - for bug fixes (e.g., `fix/dark-mode-toggle`)
- `docs/` - for documentation (e.g., `docs/improve-readme`)
- `refactor/` - for code refactoring (e.g., `refactor/api-structure`)
- `test/` - for adding tests (e.g., `test/add-unit-tests`)
- `chore/` - for maintenance (e.g., `chore/update-dependencies`)

### 2. Make Your Changes

#### Code Quality Guidelines

- **Write clean, readable code** - Others should understand it easily
- **Follow existing code style** - Maintain consistency
- **Add comments for complex logic** - Explain the "why", not just the "what"
- **Test your changes thoroughly** - Test edge cases
- **Keep commits atomic** - One logical change per commit

#### Example: Adding a New Feature

Let's walk through adding a "Copy Query Results" feature:

**Step 2.1: Understand the codebase**
```bash
# Explore the component structure
ls -la app/components/

# Read the main console component
cat app/components/DbConsole.tsx
```

**Step 2.2: Make your changes**

Edit `app/components/DbConsole.tsx`:

```typescript
// Add a new function to copy results
const copyToClipboard = () => {
  if (!result?.data) return;
  
  const jsonData = JSON.stringify(result.data, null, 2);
  navigator.clipboard.writeText(jsonData);
  setError('Results copied to clipboard!');
  
  // Clear success message after 3 seconds
  setTimeout(() => setError(null), 3000);
};

// Add a copy button in the JSX
<button
  onClick={copyToClipboard}
  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
>
  📋 Copy Results
</button>
```

**Step 2.3: Test your changes**

1. Start the dev server: `pnpm dev`
2. Navigate to the database console
3. Execute a query
4. Click the "Copy Results" button
5. Paste into a text editor to verify

**Step 2.4: Run type checking and linting**
```bash
# Check for TypeScript errors
pnpm type-check

# Run linter
pnpm lint

# Fix linting issues automatically
pnpm lint:fix

# Format code
pnpm format
```

### 3. Commit Your Changes

#### Writing Good Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```bash
# Good commit messages
git commit -m "feat: add copy to clipboard functionality for query results"
git commit -m "fix: resolve dark mode toggle persistence issue"
git commit -m "docs: add troubleshooting section to contributing guide"
git commit -m "refactor: extract table rendering logic to separate component"
git commit -m "test: add unit tests for database query validation"
git commit -m "chore: update dependencies to latest versions"
```

**Commit Message Format:**
```
<type>: <short summary>

[optional body]

[optional footer]
```

**Types:**
- `feat:` - A new feature
- `fix:` - A bug fix
- `docs:` - Documentation only changes
- `style:` - Code style changes (formatting, semicolons, etc.)
- `refactor:` - Code change that neither fixes a bug nor adds a feature
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks, dependency updates
- `perf:` - Performance improvements
- `ci:` - CI/CD configuration changes

**Examples with body:**
```bash
git commit -m "feat: add export to CSV functionality

- Implemented CSV export for query results
- Added download button to results table
- Includes proper CSV escaping for special characters
- Fixes #42"
```

#### Committing Your Code

```bash
# Stage all changes
git add .

# Or stage specific files
git add app/components/DbConsole.tsx
git add docs/API.md

# Commit with a descriptive message
git commit -m "feat: add copy to clipboard feature"

# View your commit
git log --oneline -1
```

### 4. Push and Create PR

#### Pushing to Your Fork

```bash
# Push your branch to your fork
git push origin feature/add-query-history

# If this is the first push, set upstream tracking
git push -u origin feature/add-query-history
```

#### Creating a Pull Request

**Method 1: Using GitHub Web Interface**

1. Go to your fork on GitHub
2. Click the **"Compare & pull request"** button
3. Fill in the PR template (see below)
4. Click **"Create pull request"**

**Method 2: Using GitHub CLI**

```bash
# Install GitHub CLI first: https://cli.github.com/

# Create a PR from the command line
gh pr create --title "feat: add query history feature" --body "Implements query history storage and display"

# Create a PR with more options
gh pr create --title "fix: resolve timeout issue" --body "Fixes #123" --assignee @me --label bug
```

#### Pull Request Template

When creating a PR, use this template:

```markdown
## 📝 Description

Brief description of what this PR does and why.

## 🔗 Related Issue

Closes #123 (if applicable)

## 🎯 Type of Change

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🎨 Style update (formatting, naming, etc.)
- [ ] ♻️ Code refactoring
- [ ] ⚡ Performance improvement
- [ ] ✅ Test update

## 🧪 Testing

Describe how you tested your changes:

- [ ] Tests pass locally (`pnpm test`)
- [ ] Type checking passes (`pnpm type-check`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Manual testing completed
- [ ] New tests added (if applicable)

## 📸 Screenshots (if applicable)

Add screenshots or GIFs for UI changes

## 📋 Checklist

- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## 💭 Additional Notes

Any additional information or context
```

## 🔍 Code Review Process

1. **Automated Checks**: Your PR will run automated tests and linting
2. **Review**: Maintainers will review your code
3. **Feedback**: Address any requested changes
4. **Approval**: Once approved, your PR will be merged
5. **Recognition**: After 15 approved PRs, you'll be added to our contributors list!

### What Reviewers Look For

#### Code Quality
- ✅ Clean, readable code with meaningful variable names
- ✅ Proper error handling
- ✅ No console.logs left in production code
- ✅ DRY principle (Don't Repeat Yourself)
- ✅ Consistent code style

#### Functionality
- ✅ Code does what it's supposed to do
- ✅ Edge cases are handled
- ✅ No breaking changes (unless discussed)
- ✅ Works across different browsers/devices

#### Documentation
- ✅ Code comments for complex logic
- ✅ JSDoc for functions and components
- ✅ README updated if needed
- ✅ Commit messages are clear

#### Testing
- ✅ Tests pass
- ✅ New tests added for new features
- ✅ No reduction in test coverage

### Responding to Review Feedback

**Good Response Example:**
```markdown
Thanks for the feedback! I've made the following changes:

1. ✅ Renamed `handleClick` to `handleSubmitQuery` for clarity
2. ✅ Added error handling for null results
3. ✅ Updated the README with usage examples
4. ❓ Regarding the TypeScript type - could you clarify what you mean by "more specific"?

Let me know if there's anything else!
```

**How to Update Your PR:**
```bash
# Make the requested changes
git add .
git commit -m "refactor: address code review feedback"

# Push to the same branch
git push origin feature/your-feature

# The PR will automatically update!
```

### Being a Good Reviewer

If you're reviewing someone else's code:

✅ **Do:**
- Be kind and constructive
- Explain the "why" behind suggestions
- Praise good patterns and solutions
- Ask questions rather than make demands
- Test the changes locally

❌ **Don't:**
- Be dismissive or rude
- Nitpick on style (let linters handle that)
- Request changes without explanation
- Assume the contributor has the same knowledge level

**Good Review Comment:**
> "Great work on this feature! One suggestion: consider extracting the validation logic into a separate function for reusability. Something like:
> ```typescript
> const validateQuery = (prompt: string, target: string) => { ... }
> ```
> This would make it easier to test and reuse in other components."

**Poor Review Comment:**
> "This is wrong. Fix it."

---

## 📋 Advanced Contribution Guide

### Working with Multiple Issues

**Managing multiple branches:**
```bash
# List all branches
git branch -a

# Switch between branches
git checkout feature/add-export
git checkout fix/dark-mode

# View branch status
git status

# Keep branches updated with main
git checkout main
git pull upstream main
git checkout feature/add-export
git rebase main
```

### Handling Stale Branches

If your PR is outdated:

```bash
# Update your main branch
git checkout main
git pull upstream main

# Update your feature branch
git checkout feature/your-feature
git rebase main

# Resolve any conflicts, then force push
git push origin feature/your-feature --force-with-lease
```

**Note:** Use `--force-with-lease` instead of `--force` for safety.

### Squashing Commits

Before merging, you might be asked to squash commits:

```bash
# Interactive rebase for last 3 commits
git rebase -i HEAD~3

# In the editor, change 'pick' to 'squash' (or 's') for commits to squash
# Save and close the editor
# Edit the commit message
# Force push

git push origin feature/your-feature --force-with-lease
```

### Cherry-Picking Commits

To apply a specific commit from another branch:

```bash
# Find the commit hash
git log --oneline

# Cherry-pick it
git cherry-pick <commit-hash>

# If conflicts occur, resolve them
git add .
git cherry-pick --continue
```

### Working with Remotes

```bash
# Add upstream (original repo)
git remote add upstream https://github.com/sammyifelse/mcp-for-database.git

# View all remotes
git remote -v

# Fetch from upstream without merging
git fetch upstream

# Pull from upstream
git pull upstream main

# Push to your fork
git push origin feature/your-feature
```

### Creating Good Commit History

**Before:**
```bash
fix typo
fix another typo
actually fix the thing
forgot to add file
final fix
```

**After (squashed):**
```bash
feat: add query export functionality

- Implemented CSV export
- Added JSON export
- Created download utility functions
- Includes proper error handling
```

---

## 🎯 Contribution Workflow Cheatsheet

### Quick Reference

```bash
# Initial setup (do once)
git clone https://github.com/YOUR_USERNAME/mcp-for-database.git
cd mcp-for-database
git remote add upstream https://github.com/sammyifelse/mcp-for-database.git
pnpm install

# For each contribution
git checkout main                           # Switch to main
git pull upstream main                      # Update from upstream
git checkout -b feature/feature-name        # Create feature branch
# Make your changes...
git add .                                   # Stage changes
git commit -m "feat: description"           # Commit with message
pnpm type-check && pnpm lint               # Run checks
git push origin feature/feature-name        # Push to fork
# Create PR on GitHub

# After review feedback
# Make requested changes...
git add .
git commit -m "refactor: address review feedback"
git push origin feature/feature-name        # PR updates automatically

# Keep branch updated
git checkout main
git pull upstream main
git checkout feature/feature-name
git rebase main
git push origin feature/feature-name --force-with-lease
```

### Pre-Commit Checklist

Before committing, ask yourself:

- [ ] Does my code work? (tested manually)
- [ ] Are there any console.logs or debug code?
- [ ] Did I run `pnpm type-check`?
- [ ] Did I run `pnpm lint`?
- [ ] Are my commit messages clear and descriptive?
- [ ] Did I update documentation if needed?
- [ ] Are there any commented-out code blocks?
- [ ] Did I test edge cases?

### Pre-PR Checklist

Before creating a pull request:

- [ ] Branch is up to date with main
- [ ] All commits follow conventional commit format
- [ ] Tests pass locally
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Documentation is updated
- [ ] PR description is clear and complete
- [ ] Screenshots added for UI changes
- [ ] Related issue is linked

---

## 📏 Code Standards

### TypeScript

#### Type Definitions

**✅ Good:**
```typescript
// Explicit interface definitions
interface QueryResult {
  id: number;
  data: Record<string, any>[];
  executionTime: number;
}

// Proper type for function parameters
function processQuery(prompt: string, target: DatabaseTarget): Promise<QueryResult> {
  // Implementation
}

// Use union types appropriately
type Status = 'idle' | 'loading' | 'success' | 'error';
```

**❌ Bad:**
```typescript
// Avoid 'any' types
function processQuery(prompt: any, target: any): any {
  // Implementation
}

// Avoid implicit any
function handleData(data) {  // Missing type annotation
  // Implementation
}
```

#### Null Safety

**✅ Good:**
```typescript
// Optional chaining
const userName = user?.profile?.name ?? 'Anonymous';

// Type guards
if (result && result.data) {
  processData(result.data);
}

// Nullish coalescing
const timeout = config.timeout ?? 5000;
```

**❌ Bad:**
```typescript
// Unsafe access
const userName = user.profile.name;  // May throw error

// Using || instead of ??
const timeout = config.timeout || 5000;  // 0 would be falsy
```

### React/Next.js

#### Component Structure

**✅ Good:**
```typescript
'use client';

import React, { useState, useEffect } from 'react';

interface ButtonProps {
  /** The button text */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Primary button component
 * 
 * @example
 * <Button label="Submit" onClick={handleSubmit} />
 */
export default function Button({ 
  label, 
  onClick, 
  disabled = false,
  className = ''
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn-primary ${className}`}
      aria-label={label}
    >
      {label}
    </button>
  );
}
```

**❌ Bad:**
```typescript
// No types, no documentation
export default function Button(props) {
  return <button onClick={props.onClick}>{props.label}</button>;
}
```

#### Hooks Best Practices

**✅ Good:**
```typescript
// Properly typed hooks
const [isLoading, setIsLoading] = useState<boolean>(false);
const [data, setData] = useState<QueryResult[]>([]);

// Cleanup in useEffect
useEffect(() => {
  const timer = setTimeout(() => {
    setIsLoading(false);
  }, 3000);

  return () => clearTimeout(timer);  // Cleanup
}, []);

// Dependencies array is correct
useEffect(() => {
  fetchData(queryId);
}, [queryId]);  // Only re-run when queryId changes
```

**❌ Bad:**
```typescript
// Missing cleanup
useEffect(() => {
  setTimeout(() => setIsLoading(false), 3000);
  // No cleanup!
}, []);

// Missing dependencies
useEffect(() => {
  fetchData(queryId);
}, []);  // Should include queryId
```

### Styling with TailwindCSS

#### Consistent Patterns

**✅ Good:**
```typescript
// Group related classes
<div className="
  flex items-center justify-between
  px-4 py-2
  bg-white dark:bg-gray-800
  border border-gray-200 rounded-md
  hover:bg-gray-50 transition-colors
">
  {/* Content */}
</div>

// Extract repeated patterns
const buttonClasses = `
  px-4 py-2
  text-sm font-medium
  rounded-md shadow-sm
  focus:outline-none focus:ring-2 focus:ring-offset-2
`;

<button className={`${buttonClasses} bg-blue-600 text-white hover:bg-blue-700`}>
  Submit
</button>
```

**❌ Bad:**
```typescript
// Long, unorganized class strings
<div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">

// Inline styles instead of Tailwind
<div style={{ padding: '8px', backgroundColor: 'white' }}>
```

#### Responsive Design

**✅ Good:**
```typescript
<div className="
  grid grid-cols-1 gap-4
  sm:grid-cols-2
  md:grid-cols-3
  lg:grid-cols-4
  xl:grid-cols-5
">
  {/* Responsive grid */}
</div>
```

#### Dark Mode Support

**✅ Good:**
```typescript
// Always include dark mode variants
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  <p className="text-gray-600 dark:text-gray-400">Description</p>
</div>
```

### API Design

#### Request/Response Structure

**✅ Good:**
```typescript
// Clear, typed API responses
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    executionTime: number;
    timestamp: string;
  };
}

// Proper error handling
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    if (!body.prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }
    
    // Process request
    const result = await processQuery(body);
    
    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        executionTime: result.time,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
```

**❌ Bad:**
```typescript
// No error handling, inconsistent responses
export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await processQuery(body.prompt);
  return NextResponse.json(result);  // What if it fails?
}
```

### Code Organization

**✅ Good:**
```typescript
// Group related functionality
// app/utils/query.ts
export function validateQuery(query: string): boolean { }
export function sanitizeQuery(query: string): string { }
export function formatQuery(query: string): string { }

// Use barrel exports
// app/utils/index.ts
export * from './query';
export * from './export';
export * from './validation';

// Clear file structure
app/
  components/
    ui/
      Button.tsx
      Input.tsx
      Modal.tsx
    features/
      QueryForm.tsx
      ResultsTable.tsx
```

### Accessibility

**✅ Good:**
```typescript
// Proper ARIA attributes
<button
  aria-label="Submit query"
  aria-disabled={isLoading}
  role="button"
  onClick={handleSubmit}
>
  Submit
</button>

// Semantic HTML
<main>
  <article>
    <h1>Database Console</h1>
    <section>
      <h2>Query Results</h2>
      {/* Content */}
    </section>
  </article>
</main>

// Keyboard navigation
<div
  tabIndex={0}
  onKeyPress={(e) => e.key === 'Enter' && handleClick()}
  role="button"
>
  Click me
</div>
```

### Performance

**✅ Good:**
```typescript
// Memoize expensive computations
const processedData = useMemo(() => {
  return data.map(item => expensiveTransform(item));
}, [data]);

// Callback memoization
const handleClick = useCallback(() => {
  processData();
}, [processData]);

// Lazy loading
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>
});
```

### Error Handling

**✅ Good:**
```typescript
// Comprehensive error handling
try {
  const response = await fetchData();
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data;
} catch (error) {
  if (error instanceof TypeError) {
    console.error('Network error:', error);
    throw new Error('Network connection failed');
  } else if (error instanceof Error) {
    console.error('Error:', error.message);
    throw error;
  } else {
    console.error('Unknown error:', error);
    throw new Error('An unexpected error occurred');
  }
}
```

### Comments and Documentation

**✅ Good:**
```typescript
/**
 * Processes a database query and returns formatted results
 * 
 * @param query - The SQL query string to execute
 * @param options - Optional configuration for query execution
 * @returns Promise resolving to query results
 * @throws {QueryError} If the query syntax is invalid
 * @throws {ConnectionError} If database connection fails
 * 
 * @example
 * ```typescript
 * const results = await processQuery('SELECT * FROM users', { timeout: 5000 });
 * ```
 */
async function processQuery(
  query: string, 
  options?: QueryOptions
): Promise<QueryResult> {
  // Validate query syntax before execution
  validateQuerySyntax(query);
  
  // Execute with timeout protection
  return executeWithTimeout(query, options?.timeout ?? 30000);
}
```

**❌ Bad:**
```typescript
// Obvious or redundant comments
// This function adds two numbers
function add(a, b) {
  return a + b;  // return the sum
}

// Commented-out code
// const oldFunction = () => { ... }

// Misleading comments
// Calculate user age
function getUserName() {  // Actually gets name, not age!
  return user.name;
}
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run type checking
pnpm type-check

# Run linter
pnpm lint

# Run all checks before committing
pnpm type-check && pnpm lint && pnpm test
```

### Writing Tests

We value test coverage! Here's how to write effective tests:

#### Example: Testing a Component

Create a test file `app/components/__tests__/DbConsole.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DbConsole from '../DbConsole';

describe('DbConsole', () => {
  it('renders the database console interface', () => {
    render(<DbConsole />);
    expect(screen.getByText('Database Console')).toBeInTheDocument();
  });

  it('shows error when submitting empty prompt', async () => {
    render(<DbConsole />);
    const submitButton = screen.getByRole('button', { name: /submit/i });
    
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a prompt')).toBeInTheDocument();
    });
  });

  it('successfully submits a query', async () => {
    render(<DbConsole />);
    const input = screen.getByPlaceholderText(/enter your query/i);
    const submitButton = screen.getByRole('button', { name: /submit/i });
    
    fireEvent.change(input, { target: { value: 'Show all users' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Query executed successfully')).toBeInTheDocument();
    });
  });
});
```

#### Example: Testing an API Route

Create a test file `app/api/db/__tests__/route.test.ts`:

```typescript
import { POST } from '../[query]/route';
import { NextRequest } from 'next/server';

describe('Database Query API', () => {
  it('returns 400 for missing prompt', async () => {
    const request = new NextRequest('http://localhost:3000/api/db/query', {
      method: 'POST',
      body: JSON.stringify({ target: 'sqlalchemy' })
    });

    const response = await POST(request, { params: Promise.resolve({ query: 'query' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Missing required fields');
  });

  it('returns 400 for invalid target', async () => {
    const request = new NextRequest('http://localhost:3000/api/db/query', {
      method: 'POST',
      body: JSON.stringify({ prompt: 'test', target: 'invalid' })
    });

    const response = await POST(request, { params: Promise.resolve({ query: 'query' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid target');
  });
});
```

### Testing Best Practices

- ✅ Test edge cases and error conditions
- ✅ Write descriptive test names
- ✅ Keep tests simple and focused
- ✅ Mock external dependencies
- ✅ Test user interactions, not implementation details
- ❌ Don't test framework/library code
- ❌ Don't write tests that depend on external services

## 📖 Documentation

### Writing Good Documentation

Documentation is as important as code! Here's how to write effective documentation:

#### Code Comments

**When to Comment:**
- Complex algorithms or business logic
- Non-obvious solutions or workarounds
- Important decisions and trade-offs
- Performance considerations
- Security implications

**✅ Good Comments:**
```typescript
// Using debounce to prevent excessive API calls during typing
// Without this, we'd make 50+ requests for a 10-character search
const debouncedSearch = debounce(searchQuery, 300);

// HACK: Temporary fix for Safari date parsing bug
// TODO: Remove when Safari 17+ is minimum supported version
const date = new Date(dateString.replace(/-/g, '/'));

// Cache results for 5 minutes to reduce database load
// Average query takes 200ms, caching saves ~10k queries/day
const cachedResult = await cache.get(queryKey, { ttl: 300 });
```

**❌ Bad Comments:**
```typescript
// Set loading to true
setLoading(true);

// Loop through data
data.forEach(item => { ... });

// This is the user name
const userName = user.name;
```

#### JSDoc for Functions

**✅ Good:**
```typescript
/**
 * Exports query results to various formats
 * 
 * @param data - Array of query result objects
 * @param format - Export format ('csv', 'json', 'excel')
 * @param options - Optional export configuration
 * @param options.includeHeaders - Whether to include column headers (default: true)
 * @param options.filename - Custom filename without extension
 * @returns Promise resolving to download URL
 * @throws {ExportError} If format is unsupported or data is invalid
 * 
 * @example
 * ```typescript
 * // Export to CSV with custom filename
 * await exportData(results, 'csv', { filename: 'user-report' });
 * 
 * // Export to JSON without headers
 * await exportData(results, 'json', { includeHeaders: false });
 * ```
 */
export async function exportData(
  data: QueryResult[],
  format: ExportFormat,
  options?: ExportOptions
): Promise<string> {
  // Implementation
}
```

#### Component Documentation

**✅ Good:**
```typescript
/**
 * Database query console component
 * 
 * Provides an interface for executing database queries using natural language.
 * Supports SQLAlchemy and Snowflake databases with real-time results display.
 * 
 * @component
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <DbConsole />
 * 
 * // With custom initial target
 * <DbConsole defaultTarget="snowflake" />
 * ```
 * 
 * @remarks
 * Requires MCP-DB Connector to be running on http://localhost:8000
 * 
 * @see {@link https://docs.example.com/db-console | Documentation}
 */
export default function DbConsole({ defaultTarget = 'sqlalchemy' }: DbConsoleProps) {
  // Implementation
}
```

#### README Updates

When adding a feature, update the README:

```markdown
## Features

- ✅ Natural language query interface
- ✅ SQLAlchemy and Snowflake support
- ✅ Real-time query results
- ✅ Export to CSV, JSON, Excel  // <-- Add your new feature
- 🚧 Query history
```

#### API Documentation

Update `docs/API.md` when changing APIs:

```markdown
### New Endpoint: POST `/api/export`

Export query results to various formats.

**Request:**
\`\`\`json
{
  "data": [...],
  "format": "csv" | "json" | "excel",
  "options": {
    "includeHeaders": true,
    "filename": "export"
  }
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "downloadUrl": "https://..."
}
\`\`\`
```

#### Writing Guides and Tutorials

**Structure for tutorials:**
1. **Title** - Clear, descriptive
2. **Prerequisites** - What users need to know/have
3. **Learning Objectives** - What they'll accomplish
4. **Step-by-Step Instructions** - Clear, numbered steps
5. **Code Examples** - Working, tested code
6. **Troubleshooting** - Common issues and solutions
7. **Next Steps** - Where to go from here

**Example Tutorial Structure:**
```markdown
# How to Add a New Database Connector

## Prerequisites
- Familiarity with TypeScript
- Understanding of database connections
- MCP Database Console development environment set up

## What You'll Learn
- Create a database connector interface
- Implement connection logic
- Add type definitions
- Write tests for the connector

## Steps

### Step 1: Create Connector File
Create `app/connectors/postgresql.ts`...

[Rest of tutorial]
```

#### Changelog

When making significant changes, update the changelog:

```markdown
## [Unreleased]

### Added
- CSV export functionality for query results
- Dark mode toggle with persistence
- Query history sidebar

### Changed
- Improved error messages for failed queries
- Updated UI with better responsive design

### Fixed
- Dark mode not persisting across page refreshes
- Query timeout causing app crash

### Deprecated
- Old export API endpoint (use /api/v2/export instead)
```

## 🎯 Pull Request Guidelines

### Before Submitting

Run through this checklist before creating your PR:

- [ ] **Code Quality**
  - [ ] Code follows project style guidelines
  - [ ] No console.logs or debug code left in
  - [ ] Proper error handling implemented
  - [ ] No unnecessary comments or commented-out code
  
- [ ] **Testing**
  - [ ] All tests pass locally (`pnpm test`)
  - [ ] Type checking passes (`pnpm type-check`)
  - [ ] Linting passes (`pnpm lint`)
  - [ ] New tests added for new features
  - [ ] Manual testing completed
  
- [ ] **Documentation**
  - [ ] Code is properly commented
  - [ ] README updated (if applicable)
  - [ ] API documentation updated (if applicable)
  - [ ] JSDoc added for new functions
  
- [ ] **Git**
  - [ ] Branch is up to date with main
  - [ ] Commits follow conventional commit format
  - [ ] No merge conflicts
  - [ ] Commit history is clean

### PR Title Format

Use the same format as commit messages:

```
feat: add CSV export functionality
fix: resolve dark mode persistence issue
docs: update contributing guide with examples
refactor: extract table component for reusability
test: add unit tests for query validation
```

### PR Description Template

Use this comprehensive template when creating your PR:

```markdown
## 📝 Description

[Provide a clear and concise description of what this PR does]

### Problem
[What problem does this solve? Why is this change needed?]

### Solution
[How does this PR solve the problem? What approach did you take?]

### Alternative Approaches Considered
[Did you consider other solutions? Why did you choose this one?]

---

## 🔗 Related Issues

Closes #123
Related to #456

---

## 🎯 Type of Change

Select all that apply:

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update (changes to documentation only)
- [ ] 🎨 Style update (formatting, renaming, code structure)
- [ ] ♻️ Code refactoring (no functional changes)
- [ ] ⚡ Performance improvement
- [ ] ✅ Test update (adding or updating tests)
- [ ] 🔧 Build/config change (build scripts, dependencies, etc.)

---

## 🧪 Testing

### Test Coverage
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] All tests passing locally
- [ ] No reduction in test coverage

### Manual Testing Performed

Describe the manual testing you performed:

1. [Test scenario 1]
   - Steps: ...
   - Expected: ...
   - Actual: ...

2. [Test scenario 2]
   - Steps: ...
   - Expected: ...
   - Actual: ...

### Tested On

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobile (specify device/browser)

---

## 📸 Screenshots / Videos

### Before
[Add screenshots showing the state before your changes]

### After
[Add screenshots showing the state after your changes]

### Demo
[Optional: Add GIF or video demonstrating the feature]

---

## 🔍 Code Quality

### Self-Review Checklist
- [ ] I have performed a self-review of my code
- [ ] I have reviewed my code for security issues
- [ ] I have checked for potential performance issues
- [ ] I have ensured accessibility standards are met
- [ ] My code follows the DRY principle
- [ ] I have removed any unnecessary dependencies

### Code Changes Summary

**Files Changed:** X files
**Lines Added:** +XXX
**Lines Deleted:** -XXX

**Key Changes:**
- [File 1]: [What changed and why]
- [File 2]: [What changed and why]

---

## 📚 Documentation

- [ ] Code comments added/updated
- [ ] JSDoc added for new functions
- [ ] README.md updated
- [ ] API documentation updated
- [ ] CHANGELOG.md updated (if applicable)
- [ ] Migration guide added (for breaking changes)

---

## ⚠️ Breaking Changes

**Does this PR introduce breaking changes?**
- [ ] No
- [ ] Yes (explain below)

**If yes, describe the breaking changes and migration path:**
[Explain what breaks and how users should update their code]

---

## 🔗 Dependencies

### New Dependencies Added
- [ ] No new dependencies
- [ ] New dependencies added (list below)

**If new dependencies were added:**
- Dependency name: `package-name`
- Version: `x.x.x`
- Reason: [Why is this dependency needed?]
- Alternatives considered: [What alternatives did you consider?]
- License: [Confirm it's compatible with MIT]

### Dependency Updates
- [ ] Dependencies up to date
- [ ] Dependencies need updating (listed in package.json)

---

## 🚀 Deployment Notes

**Deployment Considerations:**
- [ ] No special deployment steps needed
- [ ] Environment variables need to be added
- [ ] Database migration required
- [ ] Configuration changes needed

**If special steps are needed:**
[Provide detailed deployment instructions]

---

## 📋 Checklist

### Code Standards
- [ ] My code follows the style guidelines of this project
- [ ] I have removed all console.logs and debug code
- [ ] I have handled errors appropriately
- [ ] I have added proper TypeScript types
- [ ] I have followed React/Next.js best practices

### Testing Standards
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] I have tested edge cases and error conditions
- [ ] I have tested on multiple browsers/devices

### Documentation Standards
- [ ] I have made corresponding changes to the documentation
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] My changes generate no new warnings
- [ ] I have updated the README (if needed)

### Git Standards
- [ ] My branch is up to date with the base branch
- [ ] My commit messages follow the conventional commits format
- [ ] I have squashed unnecessary commits
- [ ] I have resolved all merge conflicts

---

## 💭 Additional Notes

[Any additional information that reviewers should know]

### Questions for Reviewers
- [Question 1]
- [Question 2]

### Known Issues
- [Any known issues or limitations with this PR]

### Future Improvements
- [Ideas for future enhancements related to this PR]

---

## 👥 Reviewers

@mention-reviewers-here

**Requesting review from:**
- [ ] Code owner
- [ ] Specific team member (mention)
- [ ] Anyone available

---

**Thank you for your contribution! 🎉**
```

### Small/Quick PRs

For small changes (typos, minor fixes), you can use a shortened version:

```markdown
## Description
Fixed typo in README.md

## Type of Change
- [x] Documentation update

## Checklist
- [x] Self-review completed
- [x] No breaking changes
```

### PR Best Practices

**Do:**
- ✅ Keep PRs focused on a single feature/fix
- ✅ Write clear, descriptive titles and descriptions
- ✅ Link to related issues
- ✅ Add screenshots for UI changes
- ✅ Respond promptly to review feedback
- ✅ Keep PRs reasonably sized (< 500 lines when possible)
- ✅ Update your PR description if scope changes

**Don't:**
- ❌ Mix multiple unrelated changes in one PR
- ❌ Submit PRs with merge conflicts
- ❌ Submit failing tests
- ❌ Leave unresolved review comments
- ❌ Force-push after receiving reviews (unless requested)
- ❌ Submit PRs directly to main without review

### Draft PRs

Use draft PRs for work in progress:

```bash
# Create a draft PR with GitHub CLI
gh pr create --draft --title "WIP: Add export feature" --body "Early draft for feedback"
```

**When to use draft PRs:**
- You want early feedback on your approach
- The feature is partially complete
- You need help or collaboration
- You're blocked on something

**Converting draft to ready:**
1. Complete all functionality
2. Add tests and documentation
3. Run all checks
4. Click "Ready for review"

## 🏆 Contributor Recognition

After **15 approved pull requests**, you'll be:

- Added to our `CONTRIBUTORS.md` file
- Recognized as a project contributor
- Eligible for Hacktoberfest completion
- Invited to join our contributor community

## 🤝 Community Guidelines

- Be respectful and inclusive
- Help others learn and grow
- Provide constructive feedback
- Follow the [Code of Conduct](CODE_OF_CONDUCT.md)

## 🆘 Getting Help

### Where to Get Help

#### 1. Documentation
Start with our comprehensive documentation:
- **[README.md](README.md)** - Project overview and quick start
- **[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)** - Development guide
- **[docs/API.md](docs/API.md)** - API documentation
- **[docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md)** - Architecture overview
- **[docs/ROADMAP.md](docs/ROADMAP.md)** - Future plans

#### 2. GitHub Issues
Search existing issues before creating new ones:
- 🔍 **[Search Issues](https://github.com/sammyifelse/mcp-for-database/issues)** - Someone may have had the same problem
- 🐛 **[Report a Bug](https://github.com/sammyifelse/mcp-for-database/issues/new?template=bug_report.md)** - Found a bug? Let us know!
- 💡 **[Request a Feature](https://github.com/sammyifelse/mcp-for-database/issues/new?template=feature_request.md)** - Have an idea? Share it!
- ❓ **[Ask a Question](https://github.com/sammyifelse/mcp-for-database/issues/new?template=question.md)** - Need help? Ask away!

#### 3. GitHub Discussions
For broader conversations:
- 💬 **[Discussions](https://github.com/sammyifelse/mcp-for-database/discussions)** - Ask questions, share ideas
- 🎯 **[Q&A](https://github.com/sammyifelse/mcp-for-database/discussions/categories/q-a)** - Get help from the community
- 💡 **[Ideas](https://github.com/sammyifelse/mcp-for-database/discussions/categories/ideas)** - Share and discuss ideas
- 📣 **[Show and Tell](https://github.com/sammyifelse/mcp-for-database/discussions/categories/show-and-tell)** - Share what you built!

#### 4. Real-Time Chat
Join our community (if available):
- 💬 **Discord Server** - Chat with contributors
- 🐦 **Twitter/X** - Follow for updates
- 📧 **Email** - Contact maintainers directly

### Creating a Good Issue

When asking for help, include:

```markdown
## Environment
- OS: [e.g., Windows 11, macOS 14, Ubuntu 22.04]
- Node.js version: [e.g., 18.17.0]
- npm/pnpm version: [e.g., pnpm 8.15.7]
- Browser: [e.g., Chrome 120]

## Steps to Reproduce
1. Clone the repository
2. Run `pnpm install`
3. Start dev server
4. Navigate to /db-console
5. Click submit button
6. See error

## Expected Behavior
The query should be submitted and results displayed.

## Actual Behavior
Error message appears: "Connection refused"

## Error Messages
```
Error: connect ECONNREFUSED 127.0.0.1:8000
    at TCPConnectWrap.afterConnect
```

## What I've Tried
- Restarted the dev server
- Cleared node_modules and reinstalled
- Checked MCP server is running

## Additional Context
This started happening after updating dependencies.
```

### Response Time Expectations

- **Critical bugs**: We aim to respond within 24 hours
- **Feature requests**: Usually within 3-5 days
- **General questions**: Within 1-2 days
- **Pull request reviews**: Within 3-7 days

*Note: We're all volunteers, so response times may vary*

---

## 📚 Learning Resources

### Next.js & React
- **[Next.js Documentation](https://nextjs.org/docs)** - Official Next.js docs
- **[React Documentation](https://react.dev)** - Learn React fundamentals
- **[Next.js Examples](https://github.com/vercel/next.js/tree/canary/examples)** - Official examples

### TypeScript
- **[TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)** - Official TypeScript guide
- **[TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)** - Comprehensive TypeScript book
- **[Type Challenges](https://github.com/type-challenges/type-challenges)** - Practice TypeScript

### TailwindCSS
- **[Tailwind Documentation](https://tailwindcss.com/docs)** - Official Tailwind docs
- **[Tailwind UI](https://tailwindui.com/)** - Component examples
- **[Tailwind Play](https://play.tailwindcss.com/)** - Online playground

### Git & GitHub
- **[Git Handbook](https://guides.github.com/introduction/git-handbook/)** - Git basics
- **[GitHub Docs](https://docs.github.com)** - GitHub features and workflows
- **[Conventional Commits](https://www.conventionalcommits.org/)** - Commit message format

### Testing
- **[Jest Documentation](https://jestjs.io/docs/getting-started)** - Testing framework
- **[React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)** - React component testing
- **[Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)** - By Kent C. Dodds

### Open Source
- **[How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)** - GitHub guide
- **[First Timers Only](https://www.firsttimersonly.com/)** - Resources for first-time contributors
- **[Open Source Guides](https://opensource.guide/)** - Best practices for open source

---

## 🌟 Recognition and Rewards

### Contributor Levels

#### 🌱 Newcomer (1-4 PRs)
- Listed in CONTRIBUTORS.md
- Newcomer badge on Discord (if available)

#### 🌿 Regular Contributor (5-14 PRs)
- All Newcomer benefits
- Invited to contributor meetings
- Vote on feature priorities

#### 🌳 Core Contributor (15+ PRs)
- All previous benefits
- Recognized in README.md
- Eligible for Hacktoberfest completion
- Invited to private contributor channels
- Early access to new features
- Direct line to project maintainers

#### 🏆 Maintainer (By invitation)
- Trusted with merge rights
- Participate in project decisions
- Represent the project publicly
- Mentor new contributors

### Special Recognition

- **Top Monthly Contributor** - Featured in monthly updates
- **Quality Contributor** - For exceptional code quality and documentation
- **Community Champion** - For helping others in issues and discussions
- **Innovation Award** - For creative solutions and new ideas

### Hacktoberfest 2025 Specific

Complete **15 approved pull requests** to:
- ✅ Be recognized as a project contributor
- ✅ Get added to CONTRIBUTORS.md with your contribution highlights
- ✅ Qualify for Hacktoberfest completion
- ✅ Receive project-specific recognition badges

---

## 📄 License

By contributing to MCP Database Console, you agree that your contributions will be licensed under the [MIT License](LICENSE).

This means:
- ✅ Your code can be freely used, modified, and distributed
- ✅ You retain copyright to your contributions
- ✅ You grant the project rights to use your contributions
- ✅ You warrant that you have the right to submit the code

**Important:** Do not submit code that:
- ❌ Violates someone else's copyright
- ❌ Contains proprietary code from your employer (without permission)
- ❌ Includes code from other projects with incompatible licenses

---

## 🙏 Thank You

Thank you for taking the time to contribute to MCP Database Console! Your contributions, whether big or small, help make this project better for everyone.

### A Special Thanks To

- **All our contributors** - You make this project possible!
- **Hacktoberfest participants** - Thanks for choosing our project!
- **Issue reporters** - You help us improve!
- **Documentation writers** - Clear docs help everyone!
- **Code reviewers** - Your feedback makes code better!
- **Community supporters** - Answering questions and helping others!

### Stay Connected

- ⭐ **Star the repo** - Show your support!
- 👁️ **Watch the repo** - Stay updated on changes
- 🍴 **Fork the repo** - Start contributing!
- 💬 **Join discussions** - Be part of the community
- 📣 **Share the project** - Help us grow!

### Contributors Wall

See all our amazing contributors in [CONTRIBUTORS.md](CONTRIBUTORS.md)!

---

## 📊 Project Stats

![Contributors](https://img.shields.io/github/contributors/sammyifelse/mcp-for-database?style=for-the-badge)
![Issues](https://img.shields.io/github/issues/sammyifelse/mcp-for-database?style=for-the-badge)
![Pull Requests](https://img.shields.io/github/issues-pr/sammyifelse/mcp-for-database?style=for-the-badge)
![Stars](https://img.shields.io/github/stars/sammyifelse/mcp-for-database?style=for-the-badge)

---

<div align="center">

**Happy Contributing! 🎉**

Made with ❤️ by the MCP Database Console community

[⬆ Back to Top](#contributing-to-mcp-database-console)

</div>

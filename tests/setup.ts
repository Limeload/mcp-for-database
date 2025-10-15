// Jest setup file for MCP tools testing
import { jest, afterEach } from '@jest/globals';

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
} as unknown as jest.Mocked<typeof console>;

// Mock environment variables
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';

// Setup test timeout
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

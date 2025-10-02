import '@testing-library/jest-dom';

// Mock fetch globally
global.fetch = jest.fn();

// Mock UUID
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234')
}));

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

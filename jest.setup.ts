import '@testing-library/jest-dom'

// Mock fetch globally
global.fetch = jest.fn()

// Mock UUID
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}))

// Mock node-cron
jest.mock('node-cron', () => ({
  schedule: jest.fn(),
  destroy: jest.fn(),
}))

// Mock EventEmitter3
jest.mock('eventemitter3', () => {
  return class MockEventEmitter {
    on = jest.fn()
    emit = jest.fn()
    off = jest.fn()
    removeAllListeners = jest.fn()
  }
})

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks()
})

// Global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R
    }
  }
}

// Custom matcher for testing execution times
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      }
    }
  },
})

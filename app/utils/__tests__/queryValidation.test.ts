/**
 * Tests for Query Validation Utility
 * Run with: npm test (when Jest is configured)
 */

import {
  validateQuery,
  quickValidate,
  getExampleQueries,
  validateQueryParams,
  DEFAULT_VALIDATION_CONFIG
} from '../queryValidation';

describe('Query Validation', () => {
  describe('validateQuery', () => {
    test('should validate empty query', () => {
      const result = validateQuery('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('empty');
    });

    test('should validate query that is too short', () => {
      const result = validateQuery('abc');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.type === 'too_short')).toBe(true);
    });

    test('should validate query that is too long', () => {
      const longQuery = 'a'.repeat(600);
      const result = validateQuery(longQuery);
      expect(result.warnings.some(w => w.type === 'too_long')).toBe(true);
    });

    test('should detect invalid characters', () => {
      const result = validateQuery('show users | grep admin');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.type === 'invalid_chars')).toBe(true);
    });

    test('should detect SQL injection attempts', () => {
      const sqlInjectionQueries = [
        "'; DROP TABLE users; --",
        'SELECT * FROM users; DELETE FROM users',
        'user UNION SELECT password FROM admin',
        "admin'--",
        'users/* comment */'
      ];

      sqlInjectionQueries.forEach(query => {
        const result = validateQuery(query);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.type === 'sql_injection')).toBe(true);
      });
    });

    test('should warn about ambiguous queries', () => {
      const result = validateQuery('show users');
      expect(result.warnings.some(w => w.type === 'ambiguous')).toBe(true);
    });

    test('should warn about missing table reference', () => {
      const result = validateQuery('show me all the records');
      expect(result.warnings.some(w => w.type === 'unclear')).toBe(true);
    });

    test('should validate a well-formed query', () => {
      const result = validateQuery('Show me all users who registered in the last 30 days');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should provide suggestions for queries with dates', () => {
      const result = validateQuery('get users by date from the database');
      expect(result.suggestions.some(s => s.message.includes('date'))).toBe(true);
    });

    test('should provide suggestions for count queries', () => {
      const result = validateQuery('count all the records in the users table');
      expect(result.suggestions.some(s => s.message.includes('count'))).toBe(true);
    });

    test('should warn about complex queries', () => {
      const result = validateQuery(
        'show me all users who have orders with products that have nested joins and aggregate functions for calculating the total revenue per customer segment'
      );
      expect(result.warnings.some(w => w.type === 'performance')).toBe(true);
    });
  });

  describe('quickValidate', () => {
    test('should quickly validate empty query', () => {
      const result = quickValidate('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should quickly validate too short query', () => {
      const result = quickValidate('abc');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too short');
    });

    test('should quickly validate invalid characters', () => {
      const result = quickValidate('test | query');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('invalid');
    });

    test('should quickly detect SQL injection', () => {
      const result = quickValidate("'; DROP TABLE users; --");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('harmful');
    });

    test('should pass valid query quickly', () => {
      const result = quickValidate('show all users from database');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('validateQueryParams', () => {
    test('should validate missing prompt', () => {
      const result = validateQueryParams({ prompt: '', target: 'sqlalchemy' });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Prompt'))).toBe(true);
    });

    test('should validate invalid target', () => {
      const result = validateQueryParams({ prompt: 'test query', target: 'invalid' });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Target'))).toBe(true);
    });

    test('should validate correct params', () => {
      const result = validateQueryParams({
        prompt: 'show all users',
        target: 'sqlalchemy'
      });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate snowflake target', () => {
      const result = validateQueryParams({
        prompt: 'show all users',
        target: 'snowflake'
      });
      expect(result.isValid).toBe(true);
    });
  });

  describe('getExampleQueries', () => {
    test('should return array of example queries', () => {
      const examples = getExampleQueries();
      expect(Array.isArray(examples)).toBe(true);
      expect(examples.length).toBeGreaterThan(0);
    });

    test('should return valid example queries', () => {
      const examples = getExampleQueries();
      examples.forEach(example => {
        const result = validateQuery(example);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('ValidationConfig', () => {
    test('should use custom config', () => {
      const customConfig = {
        ...DEFAULT_VALIDATION_CONFIG,
        minLength: 10,
        maxLength: 100
      };

      const shortQuery = 'test';
      const result = validateQuery(shortQuery, customConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('10'))).toBe(true);
    });

    test('should respect custom character set', () => {
      const customConfig = {
        ...DEFAULT_VALIDATION_CONFIG,
        allowedSpecialChars: /^[a-zA-Z\s]+$/ // Only letters and spaces
      };

      const result = validateQuery('show users with id 123', customConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.type === 'invalid_chars')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle whitespace-only query', () => {
      const result = validateQuery('   \n\t   ');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].type).toBe('empty');
    });

    test('should handle query with line breaks', () => {
      const result = validateQuery('show users\nwho registered\nin last week');
      expect(result.isValid).toBe(true);
    });

    test('should handle special characters in valid queries', () => {
      const result = validateQuery('show users with email containing @ symbol');
      expect(result.isValid).toBe(true);
    });

    test('should handle queries with numbers', () => {
      const result = validateQuery('show top 10 users from 2024');
      expect(result.isValid).toBe(true);
    });

    test('should handle queries with parentheses', () => {
      const result = validateQuery('show users (active and verified) from database');
      expect(result.isValid).toBe(true);
    });
  });

  describe('Suggestion Quality', () => {
    test('should provide examples in suggestions', () => {
      const result = validateQuery('a');
      expect(result.suggestions.some(s => s.example !== undefined)).toBe(true);
    });

    test('should provide contextual suggestions', () => {
      const dateQuery = validateQuery('show data by date range');
      expect(dateQuery.suggestions.some(s => s.message.includes('date'))).toBe(true);

      const countQuery = validateQuery('count everything in the table');
      expect(countQuery.suggestions.some(s => s.message.includes('count'))).toBe(true);

      const sortQuery = validateQuery('show top results from database');
      expect(sortQuery.suggestions.some(s => s.message.includes('sort'))).toBe(true);
    });

    test('should limit suggestions to avoid overwhelming users', () => {
      const result = validateQuery('show data');
      // The UI should limit suggestions, even if more are generated
      expect(result.suggestions.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Performance', () => {
    test('should validate quickly for short queries', () => {
      const start = Date.now();
      validateQuery('show all users from database');
      const end = Date.now();
      expect(end - start).toBeLessThan(10); // Should take less than 10ms
    });

    test('should validate quickly for long queries', () => {
      const longQuery = 'show users '.repeat(50);
      const start = Date.now();
      validateQuery(longQuery);
      const end = Date.now();
      expect(end - start).toBeLessThan(20); // Should take less than 20ms
    });
  });
});

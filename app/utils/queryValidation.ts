/**
 * Query Validation Utility
 * Provides client-side validation for natural language queries
 * Includes syntax checking, parameter validation, and suggestion generation
 */

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
}

export interface ValidationError {
  type: 'empty' | 'too_short' | 'invalid_chars' | 'sql_injection' | 'missing_context';
  message: string;
  severity: 'error';
}

export interface ValidationWarning {
  type: 'too_long' | 'ambiguous' | 'performance' | 'unclear';
  message: string;
  severity: 'warning';
}

export interface ValidationSuggestion {
  type: 'improvement' | 'clarification' | 'optimization' | 'example';
  message: string;
  example?: string;
}

export interface ValidationConfig {
  minLength: number;
  maxLength: number;
  allowedSpecialChars: RegExp;
  requiresContext: boolean;
  performanceWarningThreshold: number;
}

// Default validation configuration
export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  minLength: 5,
  maxLength: 500,
  allowedSpecialChars: /^[a-zA-Z0-9\s.,;:?!'"()\-_+=@#$%&*[\]{}/<>]+$/,
  requiresContext: true,
  performanceWarningThreshold: 300
};

/**
 * Main validation function
 * Validates a natural language query against multiple rules
 */
export function validateQuery(
  query: string,
  config: ValidationConfig = DEFAULT_VALIDATION_CONFIG
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const suggestions: ValidationSuggestion[] = [];

  const trimmedQuery = query.trim();

  // Check for empty query
  if (!trimmedQuery) {
    errors.push({
      type: 'empty',
      message: 'Query cannot be empty',
      severity: 'error'
    });
    suggestions.push({
      type: 'example',
      message: 'Try starting with a simple query',
      example: 'Show me all users from last month'
    });
    return { isValid: false, errors, warnings, suggestions };
  }

  // Check minimum length
  if (trimmedQuery.length < config.minLength) {
    errors.push({
      type: 'too_short',
      message: `Query is too short. Minimum ${config.minLength} characters required.`,
      severity: 'error'
    });
    suggestions.push({
      type: 'improvement',
      message: 'Add more details to your query for better results',
      example: 'Instead of "users", try "Show me all users who registered last week"'
    });
  }

  // Check maximum length
  if (trimmedQuery.length > config.maxLength) {
    warnings.push({
      type: 'too_long',
      message: `Query is very long (${trimmedQuery.length} chars). Consider breaking it into smaller queries.`,
      severity: 'warning'
    });
    suggestions.push({
      type: 'optimization',
      message: 'Complex queries can be split into multiple simpler ones',
      example: 'Break into: 1) "Get user data" then 2) "Filter by date range"'
    });
  }

  // Check for invalid characters
  if (!config.allowedSpecialChars.test(trimmedQuery)) {
    errors.push({
      type: 'invalid_chars',
      message: 'Query contains invalid characters',
      severity: 'error'
    });
    suggestions.push({
      type: 'improvement',
      message: 'Use only letters, numbers, and common punctuation',
      example: 'Avoid special symbols like |, \\, ^, ~'
    });
  }

  // Check for potential SQL injection patterns
  const sqlInjectionPatterns = [
    /;\s*drop\s+table/i,
    /;\s*delete\s+from/i,
    /;\s*truncate\s+table/i,
    /union\s+select/i,
    /exec\s*\(/i,
    /execute\s*\(/i,
    /'.*--/,
    /'.*\/\*/
  ];

  for (const pattern of sqlInjectionPatterns) {
    if (pattern.test(trimmedQuery)) {
      errors.push({
        type: 'sql_injection',
        message: 'Query contains potentially harmful SQL patterns',
        severity: 'error'
      });
      break;
    }
  }

  // Check for ambiguous queries
  const ambiguousWords = ['get', 'find', 'show', 'list'];
  const hasAmbiguousStart = ambiguousWords.some(word =>
    trimmedQuery.toLowerCase().startsWith(word + ' ')
  );

  if (hasAmbiguousStart && trimmedQuery.split(' ').length < 5) {
    warnings.push({
      type: 'ambiguous',
      message: 'Query may be too vague. Add more specific details.',
      severity: 'warning'
    });
    suggestions.push({
      type: 'clarification',
      message: 'Specify what data, from which table, and any filters',
      example: 'Instead of "show users", try "show all users who registered in the last 30 days"'
    });
  }

  // Check for missing context (no table/entity reference)
  const hasTableReference = /\b(user|order|product|customer|table|record|row|data)\b/i.test(
    trimmedQuery
  );

  if (config.requiresContext && !hasTableReference) {
    warnings.push({
      type: 'unclear',
      message: 'Query lacks clear table or entity reference',
      severity: 'warning'
    });
    suggestions.push({
      type: 'clarification',
      message: 'Mention which table or data you want to query',
      example: 'Add "from users table" or "in orders database"'
    });
  }

  // Performance warnings for complex queries
  const complexityIndicators = ['join', 'union', 'aggregate', 'group by', 'nested', 'subquery'];
  const hasComplexity = complexityIndicators.some(indicator =>
    trimmedQuery.toLowerCase().includes(indicator)
  );

  if (hasComplexity && trimmedQuery.length > config.performanceWarningThreshold) {
    warnings.push({
      type: 'performance',
      message: 'Complex query detected. May take longer to execute.',
      severity: 'warning'
    });
    suggestions.push({
      type: 'optimization',
      message: 'Consider simplifying or adding indexes for better performance',
      example: 'Use specific column names instead of "all data"'
    });
  }

  // Add helpful suggestions based on query patterns
  addContextualSuggestions(trimmedQuery, suggestions);

  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    warnings,
    suggestions
  };
}

/**
 * Add contextual suggestions based on query patterns
 */
function addContextualSuggestions(
  query: string,
  suggestions: ValidationSuggestion[]
): void {
  const lowerQuery = query.toLowerCase();

  // Suggest date formats
  if (lowerQuery.includes('date') || lowerQuery.includes('time')) {
    suggestions.push({
      type: 'clarification',
      message: 'Use clear date references for better results',
      example: 'Try "last 7 days", "this month", "between 2024-01-01 and 2024-12-31"'
    });
  }

  // Suggest count/aggregate clarity
  if (lowerQuery.includes('count') || lowerQuery.includes('total') || lowerQuery.includes('sum')) {
    suggestions.push({
      type: 'clarification',
      message: 'Be specific about what to count or aggregate',
      example: 'Try "count of active users" or "total revenue by month"'
    });
  }

  // Suggest sorting
  if (lowerQuery.includes('top') || lowerQuery.includes('best') || lowerQuery.includes('highest')) {
    suggestions.push({
      type: 'improvement',
      message: 'Specify sorting criteria clearly',
      example: 'Add "ordered by revenue descending" or "sorted by date newest first"'
    });
  }

  // Suggest filtering
  if (
    lowerQuery.includes('where') ||
    lowerQuery.includes('with') ||
    lowerQuery.includes('having')
  ) {
    suggestions.push({
      type: 'improvement',
      message: 'Use natural language filters',
      example: 'Try "where status is active" or "with price greater than 100"'
    });
  }
}

/**
 * Quick validation check (for real-time feedback)
 * Returns only critical errors
 */
export function quickValidate(query: string): { isValid: boolean; error?: string } {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return { isValid: false, error: 'Query cannot be empty' };
  }

  if (trimmedQuery.length < DEFAULT_VALIDATION_CONFIG.minLength) {
    return {
      isValid: false,
      error: `Query too short (min ${DEFAULT_VALIDATION_CONFIG.minLength} characters)`
    };
  }

  if (!DEFAULT_VALIDATION_CONFIG.allowedSpecialChars.test(trimmedQuery)) {
    return { isValid: false, error: 'Contains invalid characters' };
  }

  // Check for SQL injection
  const sqlInjectionPatterns = [
    /;\s*drop\s+table/i,
    /;\s*delete\s+from/i,
    /union\s+select/i
  ];

  for (const pattern of sqlInjectionPatterns) {
    if (pattern.test(trimmedQuery)) {
      return { isValid: false, error: 'Potentially harmful SQL detected' };
    }
  }

  return { isValid: true };
}

/**
 * Get example queries for user guidance
 */
export function getExampleQueries(): string[] {
  return [
    'Show me all users who registered in the last 30 days',
    'Find customers with total orders greater than $1000',
    'List all products sorted by price descending',
    'Count active users by registration month',
    'Get top 10 best-selling products this year',
    'Show orders with status pending from last week',
    'Find users who have not logged in for 90 days',
    'Calculate average order value by customer segment'
  ];
}

/**
 * Validate query parameters
 */
export function validateQueryParams(params: {
  prompt: string;
  target: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!params.prompt || typeof params.prompt !== 'string') {
    errors.push('Prompt is required and must be a string');
  }

  if (!params.target || !['sqlalchemy', 'snowflake'].includes(params.target)) {
    errors.push('Target must be either "sqlalchemy" or "snowflake"');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

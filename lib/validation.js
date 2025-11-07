import { z } from 'zod';

/**
 * Validation schemas for API requests and user inputs
 */

// Connection configuration schema
export const connectionConfigSchema = z.object({
  host: z.string().url('Invalid host URL'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().optional(),
  database: z.string().optional(),
});

// Query filter schema
export const queryFilterSchema = z.object({
  database: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  minDuration: z.number().min(0).optional(),
  limit: z.number().int().min(1).max(10000).default(100),
  offset: z.number().int().min(0).default(0),
});

// Table identifier schema
export const tableIdentifierSchema = z.object({
  database: z.string().min(1, 'Database name is required')
    .regex(/^[a-zA-Z0-9_]+$/, 'Invalid database name'),
  table: z.string().min(1, 'Table name is required')
    .regex(/^[a-zA-Z0-9_]+$/, 'Invalid table name'),
});

// Database name schema
export const databaseNameSchema = z.string()
  .min(1, 'Database name is required')
  .regex(/^[a-zA-Z0-9_]+$/, 'Database name can only contain letters, numbers, and underscores');

// Query text schema
export const queryTextSchema = z.string()
  .min(1, 'Query text is required')
  .max(100000, 'Query text too long');

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(1000).default(50),
});

// Time range schema
export const timeRangeSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
}).refine((data) => new Date(data.start) < new Date(data.end), {
  message: 'Start time must be before end time',
});

/**
 * Validates and sanitizes user input
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {any} data - Data to validate
 * @returns {Object} - { success: boolean, data?: any, error?: string }
 */
export function validateInput(schema, data) {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { success: false, error: messages };
    }
    return { success: false, error: 'Validation failed' };
  }
}

/**
 * Safely escapes identifiers (database, table, column names) for ClickHouse
 * @param {string} identifier - Database/table/column name
 * @returns {string} - Escaped identifier
 */
export function escapeIdentifier(identifier) {
  // Remove any characters that aren't alphanumeric or underscore
  return identifier.replace(/[^a-zA-Z0-9_]/g, '');
}

/**
 * Validates and escapes a table identifier
 * @param {string} database - Database name
 * @param {string} table - Table name
 * @returns {Object} - { success: boolean, database?: string, table?: string, error?: string }
 */
export function validateTableIdentifier(database, table) {
  const result = validateInput(tableIdentifierSchema, { database, table });
  if (!result.success) {
    return result;
  }

  return {
    success: true,
    database: escapeIdentifier(result.data.database),
    table: escapeIdentifier(result.data.table),
  };
}

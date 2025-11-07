import {
  connectionConfigSchema,
  queryFilterSchema,
  tableIdentifierSchema,
  databaseNameSchema,
  validateInput,
  escapeIdentifier,
  validateTableIdentifier,
} from '../validation';

describe('Validation Library', () => {
  describe('connectionConfigSchema', () => {
    it('should validate a valid connection config', () => {
      const config = {
        host: 'http://localhost:8123',
        username: 'default',
        password: 'password',
        database: 'default',
      };

      const result = validateInput(connectionConfigSchema, config);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(config);
    });

    it('should reject invalid host URL', () => {
      const config = {
        host: 'not-a-url',
        username: 'default',
      };

      const result = validateInput(connectionConfigSchema, config);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid host URL');
    });

    it('should require username', () => {
      const config = {
        host: 'http://localhost:8123',
        username: '',
      };

      const result = validateInput(connectionConfigSchema, config);
      expect(result.success).toBe(false);
    });
  });

  describe('tableIdentifierSchema', () => {
    it('should validate valid table identifiers', () => {
      const data = {
        database: 'my_database',
        table: 'my_table_123',
      };

      const result = validateInput(tableIdentifierSchema, data);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
    });

    it('should reject invalid database names with special characters', () => {
      const data = {
        database: 'my-database!',
        table: 'my_table',
      };

      const result = validateInput(tableIdentifierSchema, data);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid database name');
    });

    it('should reject SQL injection attempts', () => {
      const data = {
        database: "test'; DROP TABLE users; --",
        table: 'my_table',
      };

      const result = validateInput(tableIdentifierSchema, data);
      expect(result.success).toBe(false);
    });
  });

  describe('escapeIdentifier', () => {
    it('should keep valid identifiers unchanged', () => {
      expect(escapeIdentifier('my_table')).toBe('my_table');
      expect(escapeIdentifier('table123')).toBe('table123');
    });

    it('should remove special characters', () => {
      expect(escapeIdentifier('my-table')).toBe('mytable');
      expect(escapeIdentifier('table!@#$%')).toBe('table');
    });

    it('should prevent SQL injection', () => {
      expect(escapeIdentifier("'; DROP TABLE users; --")).toBe('DROPTABLEusers');
      expect(escapeIdentifier('table; DELETE FROM')).toBe('tableDELETEFROM');
    });
  });

  describe('validateTableIdentifier', () => {
    it('should validate and escape valid identifiers', () => {
      const result = validateTableIdentifier('my_database', 'my_table');

      expect(result.success).toBe(true);
      expect(result.database).toBe('my_database');
      expect(result.table).toBe('my_table');
    });

    it('should reject and return error for invalid identifiers', () => {
      const result = validateTableIdentifier('invalid!db', 'my_table');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('queryFilterSchema', () => {
    it('should validate query filters with defaults', () => {
      const data = {
        database: 'default',
      };

      const result = validateInput(queryFilterSchema, data);
      expect(result.success).toBe(true);
      expect(result.data.limit).toBe(100);
      expect(result.data.offset).toBe(0);
    });

    it('should enforce maximum limit', () => {
      const data = {
        limit: 20000,
      };

      const result = validateInput(queryFilterSchema, data);
      expect(result.success).toBe(false);
    });

    it('should reject negative offset', () => {
      const data = {
        offset: -10,
      };

      const result = validateInput(queryFilterSchema, data);
      expect(result.success).toBe(false);
    });
  });
});

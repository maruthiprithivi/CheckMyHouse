import {
  formatBytes,
  formatNumber,
  formatDuration,
  formatPercent,
  formatRatio,
  formatDate,
  formatRelativeTime,
  truncateString,
  formatSQL,
} from '../formatters';

describe('Formatters Utility', () => {
  describe('formatBytes', () => {
    it('should format 0 bytes', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
    });

    it('should format bytes correctly', () => {
      expect(formatBytes(500)).toBe('500 Bytes');
    });

    it('should format KB correctly', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(2048)).toBe('2 KB');
    });

    it('should format MB correctly', () => {
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(5242880)).toBe('5 MB');
    });

    it('should format GB correctly', () => {
      expect(formatBytes(1073741824)).toBe('1 GB');
    });

    it('should handle null/undefined', () => {
      expect(formatBytes(null)).toBe('N/A');
      expect(formatBytes(undefined)).toBe('N/A');
    });

    it('should respect decimal places', () => {
      expect(formatBytes(1536, 2)).toBe('1.5 KB');
      expect(formatBytes(1536, 0)).toBe('2 KB');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with thousand separators', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1000000)).toBe('1,000,000');
    });

    it('should handle decimals', () => {
      expect(formatNumber(1234.567, 2)).toBe('1,234.57');
      expect(formatNumber(1234.567, 0)).toBe('1,235');
    });

    it('should handle null/undefined', () => {
      expect(formatNumber(null)).toBe('N/A');
      expect(formatNumber(undefined)).toBe('N/A');
    });

    it('should format zero', () => {
      expect(formatNumber(0)).toBe('0');
    });
  });

  describe('formatDuration', () => {
    it('should format microseconds', () => {
      expect(formatDuration(0.5)).toBe('500.00 μs');
      expect(formatDuration(0.001)).toBe('1.00 μs');
    });

    it('should format milliseconds', () => {
      expect(formatDuration(50)).toBe('50.00 ms');
      expect(formatDuration(999)).toBe('999.00 ms');
    });

    it('should format seconds', () => {
      expect(formatDuration(1000)).toBe('1.00 s');
      expect(formatDuration(5500)).toBe('5.50 s');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(65000)).toBe('1m 5s');
      expect(formatDuration(125000)).toBe('2m 5s');
    });

    it('should format hours and minutes', () => {
      expect(formatDuration(3665000)).toBe('1h 1m');
    });

    it('should handle null/undefined', () => {
      expect(formatDuration(null)).toBe('N/A');
      expect(formatDuration(undefined)).toBe('N/A');
    });
  });

  describe('formatPercent', () => {
    it('should format percentages', () => {
      expect(formatPercent(0.5)).toBe('50.00%');
      expect(formatPercent(0.75)).toBe('75.00%');
      expect(formatPercent(1)).toBe('100.00%');
    });

    it('should respect decimal places', () => {
      expect(formatPercent(0.12345, 2)).toBe('12.35%');
      expect(formatPercent(0.12345, 4)).toBe('12.3450%');
    });

    it('should handle null/undefined', () => {
      expect(formatPercent(null)).toBe('N/A');
      expect(formatPercent(undefined)).toBe('N/A');
    });
  });

  describe('formatRatio', () => {
    it('should format ratios', () => {
      expect(formatRatio(1.5)).toBe('1.50x');
      expect(formatRatio(2.0)).toBe('2.00x');
    });

    it('should handle null/undefined', () => {
      expect(formatRatio(null)).toBe('N/A');
      expect(formatRatio(undefined)).toBe('N/A');
    });
  });

  describe('formatDate', () => {
    it('should format dates', () => {
      const date = new Date('2024-01-15T10:30:45');
      const formatted = formatDate(date);
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2024');
    });

    it('should handle null/undefined', () => {
      expect(formatDate(null)).toBe('N/A');
      expect(formatDate(undefined)).toBe('N/A');
    });
  });

  describe('formatRelativeTime', () => {
    it('should format seconds ago', () => {
      const now = new Date();
      const date = new Date(now.getTime() - 30000);
      expect(formatRelativeTime(date)).toBe('30s ago');
    });

    it('should format minutes ago', () => {
      const now = new Date();
      const date = new Date(now.getTime() - 120000);
      expect(formatRelativeTime(date)).toBe('2m ago');
    });

    it('should format hours ago', () => {
      const now = new Date();
      const date = new Date(now.getTime() - 7200000);
      expect(formatRelativeTime(date)).toBe('2h ago');
    });

    it('should format days ago', () => {
      const now = new Date();
      const date = new Date(now.getTime() - 172800000);
      expect(formatRelativeTime(date)).toBe('2d ago');
    });

    it('should handle null/undefined', () => {
      expect(formatRelativeTime(null)).toBe('N/A');
      expect(formatRelativeTime(undefined)).toBe('N/A');
    });
  });

  describe('truncateString', () => {
    it('should not truncate short strings', () => {
      expect(truncateString('hello', 10)).toBe('hello');
    });

    it('should truncate long strings', () => {
      const longString = 'This is a very long string that needs to be truncated';
      const result = truncateString(longString, 20);
      expect(result).toBe('This is a very lo...');
      expect(result.length).toBe(20);
    });

    it('should handle empty strings', () => {
      expect(truncateString('')).toBe('');
      expect(truncateString(null)).toBe('');
    });

    it('should use default maxLength', () => {
      const longString = 'a'.repeat(100);
      const result = truncateString(longString);
      expect(result.length).toBe(50);
      expect(result.endsWith('...')).toBe(true);
    });
  });

  describe('formatSQL', () => {
    it('should format basic SQL queries', () => {
      const sql = 'SELECT * FROM users WHERE id = 1';
      const formatted = formatSQL(sql);
      expect(formatted).toContain('\nSELECT');
      expect(formatted).toContain('\nFROM');
      expect(formatted).toContain('\nWHERE');
    });

    it('should handle multiple spaces', () => {
      const sql = 'SELECT   *   FROM   users';
      const formatted = formatSQL(sql);
      expect(formatted).not.toContain('  ');
    });

    it('should handle empty/null strings', () => {
      expect(formatSQL('')).toBe('');
      expect(formatSQL(null)).toBe('');
    });

    it('should format complex queries', () => {
      const sql = 'SELECT id, name FROM users JOIN orders ON users.id = orders.user_id WHERE status = active GROUP BY name ORDER BY created_at LIMIT 10';
      const formatted = formatSQL(sql);
      expect(formatted).toContain('\nSELECT');
      expect(formatted).toContain('\nFROM');
      expect(formatted).toContain('\nJOIN');
      expect(formatted).toContain('\nWHERE');
      expect(formatted).toContain('\nGROUP BY');
      expect(formatted).toContain('\nORDER BY');
      expect(formatted).toContain('\nLIMIT');
    });
  });
});

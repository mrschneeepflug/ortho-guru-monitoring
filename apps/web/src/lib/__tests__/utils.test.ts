import { describe, it, expect } from 'vitest';
import { cn, formatDate, formatDateTime, formatRelativeTime } from '../utils';

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('should merge tailwind classes (last wins)', () => {
    const result = cn('p-4', 'p-2');
    expect(result).toBe('p-2');
  });

  it('should handle empty inputs', () => {
    expect(cn()).toBe('');
  });

  it('should handle undefined and null', () => {
    expect(cn('base', undefined, null)).toBe('base');
  });
});

describe('formatDate', () => {
  it('should format a date string', () => {
    const result = formatDate('2025-01-15T12:00:00Z');
    expect(result).toMatch(/Jan 15, 2025/);
  });

  it('should format a Date object', () => {
    const result = formatDate(new Date('2025-06-01'));
    expect(result).toMatch(/Jun 1, 2025|May 31, 2025/);
  });
});

describe('formatDateTime', () => {
  it('should include time in the output', () => {
    const result = formatDateTime('2025-01-15T14:30:00Z');
    expect(result).toMatch(/Jan 15, 2025/);
    // Should contain a time component
    expect(result).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/);
  });
});

describe('formatRelativeTime', () => {
  it('should return relative time string with suffix', () => {
    const recent = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5 min ago
    const result = formatRelativeTime(recent);
    expect(result).toContain('ago');
  });

  it('should handle Date objects', () => {
    const recent = new Date(Date.now() - 60 * 1000);
    const result = formatRelativeTime(recent);
    expect(result).toContain('ago');
  });
});

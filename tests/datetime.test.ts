/** @vitest-environment node */
import { describe, it, expect } from 'vitest';
import {
  toIsoUtcString,
  normalizeIso8601,
  assertIso8601WithTimezone,
  ensureIso8601WithTimezone,
} from '@/lib/datetime';

describe('datetime utilities', () => {
  describe('toIsoUtcString', () => {
    it('converts Date to ISO-8601 UTC string ending with Z', () => {
      const date = new Date('2025-12-04T10:00:00Z');
      const result = toIsoUtcString(date);
      expect(result).toBe(date.toISOString());
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/);
      expect(result.endsWith('Z')).toBe(true);
    });

    it('always ends with Z regardless of input date', () => {
      const date = new Date();
      const result = toIsoUtcString(date);
      expect(result.endsWith('Z')).toBe(true);
    });
  });

  describe('normalizeIso8601', () => {
    it('returns string with timezone as-is (Z)', () => {
      const input = '2025-12-04T10:00:00Z';
      const result = normalizeIso8601(input);
      expect(result).toBe(input);
    });

    it('returns string with timezone offset as-is (+00:00)', () => {
      const input = '2025-12-04T10:00:00+00:00';
      const result = normalizeIso8601(input);
      expect(result).toBe(input);
    });

    it('returns string with timezone offset as-is (-06:00)', () => {
      const input = '2025-12-04T10:00:00-06:00';
      const result = normalizeIso8601(input);
      expect(result).toBe(input);
    });

    it('appends Z to string without timezone', () => {
      const input = '2025-12-04T10:00:00';
      const result = normalizeIso8601(input);
      expect(result).toBe('2025-12-04T10:00:00Z');
    });

    it('appends Z to string with milliseconds but no timezone', () => {
      const input = '2025-12-04T10:00:00.123';
      const result = normalizeIso8601(input);
      expect(result).toBe('2025-12-04T10:00:00.123Z');
    });

    it('handles compact timezone offset (+0200)', () => {
      const input = '2025-12-04T10:00:00+0200';
      const result = normalizeIso8601(input);
      expect(result).toBe(input);
    });

    it('handles lowercase z', () => {
      const input = '2025-12-04T10:00:00z';
      const result = normalizeIso8601(input);
      expect(result).toBe(input);
    });

    it('trims whitespace', () => {
      const input = '  2025-12-04T10:00:00Z  ';
      const result = normalizeIso8601(input);
      expect(result).toBe('2025-12-04T10:00:00Z');
    });

    it('throws error for invalid format', () => {
      expect(() => normalizeIso8601('invalid')).toThrow(/Invalid ISO-8601 format/);
      expect(() => normalizeIso8601('2025-12-04')).toThrow(/Invalid ISO-8601 format/);
      expect(() => normalizeIso8601('10:00:00')).toThrow(/Invalid ISO-8601 format/);
    });

    it('throws error for non-string input', () => {
      expect(() => normalizeIso8601(null as any)).toThrow(/expected ISO-8601 string/);
      expect(() => normalizeIso8601(123 as any)).toThrow(/expected ISO-8601 string/);
      expect(() => normalizeIso8601(undefined as any)).toThrow(/expected ISO-8601 string/);
    });
  });

  describe('assertIso8601WithTimezone', () => {
    it('does not throw for valid ISO-8601 with Z', () => {
      expect(() => assertIso8601WithTimezone('2025-12-04T10:00:00Z')).not.toThrow();
    });

    it('does not throw for valid ISO-8601 with offset (+00:00)', () => {
      expect(() => assertIso8601WithTimezone('2025-12-04T10:00:00+00:00')).not.toThrow();
    });

    it('does not throw for valid ISO-8601 with offset (-06:00)', () => {
      expect(() => assertIso8601WithTimezone('2025-12-04T10:00:00-06:00')).not.toThrow();
    });

    it('does not throw for valid ISO-8601 with milliseconds and timezone', () => {
      expect(() => assertIso8601WithTimezone('2025-12-04T10:00:00.123Z')).not.toThrow();
    });

    it('does not throw for compact timezone offset', () => {
      expect(() => assertIso8601WithTimezone('2025-12-04T10:00:00+0200')).not.toThrow();
    });

    it('throws error for string without timezone', () => {
      expect(() => assertIso8601WithTimezone('2025-12-04T10:00:00')).toThrow(/missing timezone/);
    });

    it('throws error for invalid format', () => {
      expect(() => assertIso8601WithTimezone('invalid')).toThrow(/Invalid ISO-8601 format/);
      expect(() => assertIso8601WithTimezone('2025-12-04')).toThrow(/Invalid ISO-8601 format/);
    });

    it('throws error for non-string input', () => {
      expect(() => assertIso8601WithTimezone(null as any)).toThrow(/expected ISO-8601 string with timezone/);
      expect(() => assertIso8601WithTimezone(123 as any)).toThrow(/expected ISO-8601 string with timezone/);
    });
  });

  describe('ensureIso8601WithTimezone', () => {
    it('returns string with timezone as-is', () => {
      const input = '2025-12-04T10:00:00Z';
      const result = ensureIso8601WithTimezone(input);
      expect(result).toBe(input);
    });

    it('normalizes and validates string without timezone', () => {
      const input = '2025-12-04T10:00:00';
      const result = ensureIso8601WithTimezone(input);
      expect(result).toBe('2025-12-04T10:00:00Z');
    });

    it('normalizes and validates string with offset', () => {
      const input = '2025-12-04T10:00:00+02:00';
      const result = ensureIso8601WithTimezone(input);
      expect(result).toBe(input);
    });

    it('throws error for invalid format', () => {
      expect(() => ensureIso8601WithTimezone('invalid')).toThrow();
      expect(() => ensureIso8601WithTimezone('2025-12-04')).toThrow();
    });
  });
});


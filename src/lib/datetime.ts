/**
 * Date/time utilities for ISO-8601 string formatting and validation.
 *
 * Central Data API expects date/time values as ISO-8601 strings with timezone,
 * not GraphQL DateTime variables.
 */

/**
 * Converts a Date object to ISO-8601 UTC string (always ends with 'Z').
 */
export function toIsoUtcString(date: Date): string {
  return date.toISOString();
}

/**
 * Normalizes an ISO-8601 string to include timezone information.
 *
 * - If input already has timezone (Z or offset like +02:00, -06:00), returns as-is.
 * - If input lacks timezone (e.g., YYYY-MM-DDTHH:mm:ss), appends 'Z' (UTC).
 *
 * @param input - ISO-8601 string, potentially without timezone
 * @returns ISO-8601 string with timezone
 * @throws Error if input is not a valid ISO-8601 format
 */
export function normalizeIso8601(input: string): string {
  if (!input || typeof input !== 'string') {
    throw new Error(`Invalid input: expected ISO-8601 string, got ${typeof input}`);
  }

  const trimmed = input.trim();

  // Basic ISO-8601 pattern check
  const isoPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?/;
  if (!isoPattern.test(trimmed)) {
    throw new Error(`Invalid ISO-8601 format: ${trimmed}`);
  }

  // Check if already has timezone
  // Matches: Z, +HH:mm, +HHmm, -HH:mm, -HHmm
  const hasTimezone = /[Zz]$|[\+\-]\d{2}:?\d{2}$/.test(trimmed);

  if (hasTimezone) {
    return trimmed;
  }

  // No timezone - append 'Z' (UTC)
  return trimmed + 'Z';
}

/**
 * Asserts that an input string is a valid ISO-8601 string with timezone.
 *
 * Valid formats:
 * - 2025-12-04T10:00:00Z
 * - 2025-12-04T10:00:00+00:00
 * - 2025-12-04T10:00:00-06:00
 *
 * @param input - String to validate
 * @throws Error with descriptive message if invalid
 */
export function assertIso8601WithTimezone(input: string): void {
  if (!input || typeof input !== 'string') {
    throw new Error(`Invalid input: expected ISO-8601 string with timezone, got ${typeof input}`);
  }

  const trimmed = input.trim();

  // Must match ISO-8601 pattern with timezone
  const isoWithTzPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?([Zz]|[\+\-]\d{2}:?\d{2})$/;

  if (!isoWithTzPattern.test(trimmed)) {
    // Check if it's missing timezone
    const isoWithoutTzPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/;
    if (isoWithoutTzPattern.test(trimmed)) {
      throw new Error(
        `ISO-8601 string missing timezone: "${trimmed}". ` +
        `Expected format: YYYY-MM-DDTHH:mm:ssZ or YYYY-MM-DDTHH:mm:ss+HH:mm`
      );
    }
    throw new Error(`Invalid ISO-8601 format with timezone: "${trimmed}"`);
  }
}

/**
 * Normalizes and validates an ISO-8601 string, ensuring it has a timezone.
 *
 * Combines normalizeIso8601 and assertIso8601WithTimezone for convenience.
 *
 * @param input - ISO-8601 string, potentially without timezone
 * @returns Normalized ISO-8601 string with timezone
 * @throws Error if input is invalid or cannot be normalized
 */
export function ensureIso8601WithTimezone(input: string): string {
  const normalized = normalizeIso8601(input);
  assertIso8601WithTimezone(normalized);
  return normalized;
}


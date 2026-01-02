/** @vitest-environment node */
import { describe, it, expect } from 'vitest';
import { safeJson } from '@/lib/http';

describe('safeJson', () => {
  it('parses valid JSON correctly', async () => {
    const res = new Response(JSON.stringify({ test: 'data' }), { status: 200 });
    const data = await safeJson(res, 'test');
    expect(data).toEqual({ test: 'data' });
  });

  it('throws EMPTY_BODY on empty response', async () => {
    const res = new Response('', { status: 200 });
    await expect(safeJson(res, 'test')).rejects.toThrow('EMPTY_BODY');
  });

  it('throws HTTP_<status> on non-OK response', async () => {
    const res = new Response('Error', { status: 500 });
    await expect(safeJson(res, 'test')).rejects.toThrow('HTTP_500');
  });

  it('throws JSON_PARSE_FAILED on invalid JSON', async () => {
    const res = new Response('invalid json{', { status: 200 });
    await expect(safeJson(res, 'test')).rejects.toThrow('JSON_PARSE_FAILED');
  });
});


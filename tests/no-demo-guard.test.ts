/** @vitest-environment node */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('No demo strings guard', () => {
  it('teams route does not contain demo strings', () => {
    const content = readFileSync(join(process.cwd(), 'src/app/api/teams/route.ts'), 'utf-8');
    expect(content).not.toMatch(/source.*["']Demo["']/i);
    expect(content).not.toMatch(/demo-data\.json/i);
    expect(content).not.toMatch(/Demo list/i);
  });

  it('ScoutingEngine does not contain demo strings', () => {
    const content = readFileSync(join(process.cwd(), 'src/components/ScoutingEngine.tsx'), 'utf-8');
    expect(content).not.toMatch(/source.*["']Demo["']/i);
    expect(content).not.toMatch(/demo-data\.json/i);
    expect(content).not.toMatch(/Demo list/i);
  });
});


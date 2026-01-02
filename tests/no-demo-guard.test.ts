/** @vitest-environment node */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Demo fallback guard', () => {
  it('teams route does not auto-fallback to demo (returns error)', () => {
    const content = readFileSync(join(process.cwd(), 'src/app/api/teams/route.ts'), 'utf-8');
    // Teams route should NOT fetch demo-data.json - it returns error instead
    expect(content).not.toMatch(/demo-data\.json/i);
  });

  it('ScoutingEngine implements demo fallback correctly', () => {
    const content = readFileSync(join(process.cwd(), 'src/components/ScoutingEngine.tsx'), 'utf-8');
    // ScoutingEngine should fetch demo-data.json as fallback
    expect(content).toMatch(/demo-data\.json/i);
    expect(content).toMatch(/Demo Mode/i);
  });
});


#!/usr/bin/env node
/**
 * Direct File Download API probe - calls GRID API directly (no app proxy).
 *
 * This script hits the File Download API endpoint directly to verify entitlement
 * and check if files are available for a specific series ID.
 *
 * Environment variables:
 * - SERIES_ID (required): Series ID to probe
 * - GRID_API_KEY (required): GRID API key
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

const SERIES_ID = process.env.SERIES_ID;
const GRID_API_KEY = process.env.GRID_API_KEY;
const GRID_FILE_DOWNLOAD_BASE = "https://api.grid.gg/file-download";

if (!SERIES_ID) {
  console.error('❌ ERROR: SERIES_ID must be provided');
  console.error('   Usage: SERIES_ID="..." npm run probe:file-download:direct');
  process.exit(1);
}

if (!GRID_API_KEY || GRID_API_KEY === "YOUR_GRID_API_KEY") {
  console.error('❌ ERROR: GRID_API_KEY must be set in environment');
  process.exit(1);
}

async function main(): Promise<void> {
  console.log('🔍 Direct File Download Probe\n');
  console.log(`Series ID: ${SERIES_ID}`);
  console.log(`Endpoint: ${GRID_FILE_DOWNLOAD_BASE}/list/${SERIES_ID}\n`);

  try {
    const url = `${GRID_FILE_DOWNLOAD_BASE}/list/${SERIES_ID}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': GRID_API_KEY,
      },
    });

    const httpStatus = response.status;
    console.log(`HTTP Status: ${httpStatus}`);

    if (response.status === 200) {
      let files: any[] = [];
      try {
        const data = await response.json();
        files = Array.isArray(data) ? data : [];
      } catch (err) {
        console.error('⚠️  Warning: Response is not valid JSON');
      }

      console.log(`Files count: ${files.length}`);

      if (files.length > 0) {
        console.log('\nFirst 3 files:');
        files.slice(0, 3).forEach((file, idx) => {
          console.log(`  ${idx + 1}. id: ${file.id || 'N/A'}`);
          console.log(`     type: ${file.type || file.fileName || 'N/A'}`);
          if (file.fileName) {
            console.log(`     fileName: ${file.fileName}`);
          }
        });
      } else {
        console.log('\n⚠️  No files found (empty array)');
        console.log('   This means the series exists in Central Data but has no associated file downloads.');
      }

      // Milestone F: Exit 0 only if HTTP 200 and files.length > 0; otherwise exit 1
      if (files.length > 0) {
        console.log('\n✅ Success: Files found');
        process.exit(0);
      } else {
        console.log('\n❌ No files available');
        process.exit(1);
      }
    } else if (response.status === 403) {
      console.error('\n❌ HTTP 403: FORBIDDEN');
      console.error('   This indicates an entitlement/scope issue.');
      console.error('   Your API key does not have access to file downloads for this series.');
      process.exit(2);
    } else if (response.status === 401) {
      console.error('\n❌ HTTP 401: UNAUTHORIZED');
      console.error('   Authentication failed. Check your GRID_API_KEY.');
      process.exit(3);
    } else {
      const errorText = await response.text().catch(() => '');
      console.error(`\n❌ HTTP ${response.status}: ${response.statusText}`);
      if (errorText) {
        const truncated = errorText.length > 200 ? errorText.substring(0, 200) + '...' : errorText;
        console.error(`   Response: ${truncated}`);
      }
      process.exit(4);
    }
  } catch (err: any) {
    console.error('\n❌ FATAL ERROR:', err.message);
    if (err.stack) {
      console.error(err.stack);
    }
    process.exit(4);
  }
}

main();


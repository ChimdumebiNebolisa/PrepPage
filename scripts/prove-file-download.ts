#!/usr/bin/env node
/**
 * Proves that File Download exists for at least one seriesId.
 *
 * This script calls the File Download list endpoint for a given seriesId
 * and verifies that at least 1 file is returned. If the first seriesId
 * has no files, it automatically tries the next 3 seriesIds from a sample list.
 *
 * Environment variables:
 * - BASE_URL (default: http://localhost:3000) - API base URL
 * - SERIES_ID (required): Series ID to check
 * - SAMPLE_SERIES_IDS (optional): Comma-separated list of alternative series IDs to try
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SERIES_ID = process.env.SERIES_ID;
const SAMPLE_SERIES_IDS = process.env.SAMPLE_SERIES_IDS
  ? process.env.SAMPLE_SERIES_IDS.split(',').map(id => id.trim())
  : [];

interface FileDownloadResponse {
  success: boolean;
  files?: Array<{
    id: string;
    status: string;
    description?: string;
    fileName: string;
    fullURL?: string;
  }>;
  code?: string;
  error?: string;
}

async function fetchFileDownloadList(seriesId: string): Promise<FileDownloadResponse> {
  const url = `${BASE_URL}/api/grid/file-download/list?seriesId=${encodeURIComponent(seriesId)}`;
  
  try {
    const response = await fetch(url);
    const text = await response.text();
    let data: FileDownloadResponse;
    
    try {
      data = JSON.parse(text) as FileDownloadResponse;
    } catch {
      throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
    }
    
    return data;
  } catch (err: any) {
    throw new Error(`Fetch failed: ${err.message}`);
  }
}

async function checkSeriesForFiles(seriesId: string): Promise<{ success: boolean; files: any[]; error?: string }> {
  console.log(`Checking seriesId: ${seriesId}`);
  
  try {
    const data = await fetchFileDownloadList(seriesId);
    
    if (!data.success) {
      return {
        success: false,
        files: [],
        error: data.error || data.code || 'Unknown error',
      };
    }
    
    const files = data.files || [];
    
    return {
      success: true,
      files,
    };
  } catch (err: any) {
    return {
      success: false,
      files: [],
      error: err.message,
    };
  }
}

async function main(): Promise<void> {
  console.log('🔍 Proving File Download exists for seriesId(s)...\n');
  
  if (!SERIES_ID) {
    console.error('❌ ERROR: SERIES_ID must be provided');
    console.error('   Usage: SERIES_ID="..." npm run prove:file-download');
    console.error('   Or: SERIES_ID="..." SAMPLE_SERIES_IDS="id1,id2,id3" npm run prove:file-download');
    process.exit(1);
  }
  
  const seriesIdsToTry = [SERIES_ID, ...SAMPLE_SERIES_IDS.slice(0, 3)];
  console.log(`Will check ${seriesIdsToTry.length} seriesId(s): ${seriesIdsToTry.join(', ')}\n`);
  
  for (let i = 0; i < seriesIdsToTry.length; i++) {
    const seriesId = seriesIdsToTry[i];
    const result = await checkSeriesForFiles(seriesId);
    
    if (result.success && result.files.length > 0) {
      console.log(`✅ SUCCESS: Found ${result.files.length} file(s) for seriesId ${seriesId}\n`);
      console.log('Files:');
      result.files.forEach((file, idx) => {
        console.log(`  ${idx + 1}. id: ${file.id}`);
        console.log(`     fileName: ${file.fileName}`);
        console.log(`     status: ${file.status}`);
        if (file.description) {
          console.log(`     description: ${file.description}`);
        }
        if (file.fullURL) {
          console.log(`     fullURL: ${file.fullURL.substring(0, 80)}...`);
        }
        console.log('');
      });
      console.log('✅ File Download proof completed successfully!\n');
      return;
    } else {
      if (result.error) {
        console.log(`   ⚠️  Error: ${result.error}`);
      } else {
        console.log(`   ⚠️  No files found (${result.files.length} files)`);
      }
      
      if (i < seriesIdsToTry.length - 1) {
        console.log(`   Trying next seriesId...\n`);
      }
    }
  }
  
  // All seriesIds failed
  console.log('\n❌ CONCLUSION:');
  console.log('   Central Data series exist, but no File Download files are available');
  console.log('   for these series IDs under current access/scope.');
  console.log('\n   Checked seriesIds:');
  seriesIdsToTry.forEach(id => console.log(`     - ${id}`));
  console.log('\n   This may be expected if:');
  console.log('   - The series are scheduled but files are not yet available');
  console.log('   - Your API key does not have access to file downloads for these series');
  console.log('   - The series are too old or too new (files may be pending)');
  console.log('');
  process.exit(1);
}

main().catch((err) => {
  console.error('\n❌ FATAL ERROR:', err.message);
  if (err.stack) {
    console.error(err.stack);
  }
  process.exit(1);
});


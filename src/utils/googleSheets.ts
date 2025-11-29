/**
 * Fetches data from a Google Sheet using the CSV export URL
 * 
 * @param sheetId - The Google Sheet ID (from the URL)
 * @param gid - Optional sheet GID (defaults to 0 for first sheet)
 * @returns Promise with CSV text
 */
export async function fetchGoogleSheet(sheetId: string, gid: string = '0'): Promise<string> {
  // Try multiple URL formats
  const urls = [
    `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`,
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`,
    `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&id=${sheetId}&gid=${gid}`
  ];
  
  let lastError: Error | null = null;
  
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        const text = await response.text();
        // Check if we got HTML instead of CSV (common when sheet is not public)
        if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
          throw new Error('Sheet appears to be private or not accessible. Please ensure the sheet is set to "Anyone with the link can view"');
        }
        return text;
      }
      
      // If 400 or 403, try next URL format
      if (response.status === 400 || response.status === 403) {
        lastError = new Error(`Sheet access denied (${response.status}). Please ensure the sheet is public: Share > Change to "Anyone with the link" > Viewer`);
        continue;
      }
      
      if (!response.ok) {
        lastError = new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        continue;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      continue;
    }
  }
  
  // If all URLs failed, throw the last error with helpful message
  if (lastError) {
    const helpfulMessage = lastError.message.includes('private') 
      ? lastError.message
      : `Unable to access Google Sheet. Please verify:
1. The sheet is set to "Anyone with the link can view" (Share button > Change access)
2. The Sheet ID is correct: ${sheetId}
3. The sheet exists and is accessible
      
Original error: ${lastError.message}`;
    
    throw new Error(helpfulMessage);
  }
  
  throw new Error('Failed to fetch Google Sheet: Unknown error');
}

/**
 * Parses CSV text into rows
 */
export function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  const lines = csvText.split('\n');
  
  for (const line of lines) {
    if (line.trim() === '') continue;
    
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    row.push(current.trim());
    rows.push(row);
  }
  
  return rows;
}


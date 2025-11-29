import { ProjectType } from '../types/quote';

/**
 * Maps project types to Google Sheet tab GIDs
 * To find the GID for a tab:
 * 1. Open your Google Sheet
 * 2. Click on the tab you want
 * 3. Look at the URL - it will have #gid=XXXXXXX
 * 4. The number after gid= is the GID for that tab
 * 
 * Default GIDs (you'll need to update these with your actual tab GIDs):
 * - 0 = First tab (default)
 * - Each additional tab has a unique GID
 */
export const PROJECT_TYPE_SHEET_TABS: Record<ProjectType, string> = {
  'web-dev': '2025961483',      // Web Development tab
  'brand': '1204006534',        // Brand tab
  'campaign': '215428366'       // Campaign tab
};

/**
 * Gets the sheet GID for a project type
 */
export function getSheetGidForProjectType(projectType: ProjectType | null): string {
  if (!projectType) {
    return '0'; // Default to first tab
  }
  return PROJECT_TYPE_SHEET_TABS[projectType] || '0';
}

/**
 * Gets the sheet tab name for a project type (for display)
 */
export function getSheetTabNameForProjectType(projectType: ProjectType): string {
  const names: Record<ProjectType, string> = {
    'web-dev': 'Web Development',
    'brand': 'Brand',
    'campaign': 'Campaign'
  };
  return names[projectType] || projectType;
}


import Papa from 'papaparse';

export interface PriceRange {
  min: number;
  max: number | null; // null means unlimited (e.g., "7+")
  price: number;
}

export interface OptionWithPrice {
  label: string;
  price?: number; // Optional price for this specific option
}

export interface PricingItem {
  phase: string;
  item: string;
  unitCost: number;
  ranges?: PriceRange[]; // For items with range-based pricing
  essential: number;
  refresh: number;
  transformation: number;
  description?: string; // Description text displayed above the input
  questionType?: 'binary' | 'select' | 'number' | 'range' | 'text'; // Override question type
  options?: string; // Comma-separated options for select questions (e.g., "Option 1, Option 2, Option 3" or "Option 1:£100, Option 2:£200")
  optionPrices?: OptionWithPrice[]; // Parsed options with prices (if prices are specified)
  min?: number; // Minimum value for number/range questions
  max?: number; // Maximum value for number/range questions
  required?: boolean; // Whether question is required
  validation?: string; // Additional validation rules (e.g., "integer", "positive", "email")
  sharedVariable?: string; // Shared variable name (e.g., "components") or reference (e.g., "{components}")
}

export interface PricingConfig {
  items: PricingItem[];
  sheetId?: string;
  lastUpdated?: Date;
}

/**
 * Parses a pricing configuration CSV/Google Sheet
 * Expected format:
 * Phase,Item,Unit Cost (£),Essential,Refresh,Transformation,Ranges (optional),Tooltip (optional)
 * 
 * Ranges format: "1-3:500, 4-6:600, 7+:700"
 * Tooltip: Information text that appears in hover tooltips for select questions
 */
export async function parsePricingConfig(
  source: string | { sheetId: string; gid?: string }
): Promise<PricingConfig> {
  let csvText: string;
  let sheetId: string | undefined;

  if (typeof source === 'string') {
    // Local file or URL
    if (source.startsWith('http')) {
      const response = await fetch(source);
      csvText = await response.text();
    } else {
      const response = await fetch(source);
      csvText = await response.text();
    }
  } else {
    // Google Sheet
    const { fetchGoogleSheet } = await import('./googleSheets');
    sheetId = source.sheetId;
    csvText = await fetchGoogleSheet(source.sheetId, source.gid || '0');
  }

  return new Promise((resolve, reject) => {
    Papa.parse<any>(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const items: PricingItem[] = results.data
            .filter((row: any) => row.Phase && row.Item) // Filter out empty rows
            .map((row: any) => {
              const ranges = parseRanges(row.Ranges || '');
              
              // Parse question type
              const questionTypeStr = (row['Question Type'] || row['Type'] || '').trim().toLowerCase();
              const questionType = ['binary', 'select', 'number', 'range', 'text'].includes(questionTypeStr)
                ? questionTypeStr as PricingItem['questionType']
                : undefined;
              
              // Parse options (comma-separated, optionally with prices like "Option 1:£100, Option 2:£200")
              const optionsStr = row.Options || row['Option Labels'] || '';
              let options: string[] | undefined;
              let optionPrices: OptionWithPrice[] | undefined;
              
              if (optionsStr.trim()) {
                const optionParts = optionsStr
                  .split(',')
                  .map((opt: string) => opt.trim())
                  .filter((opt: string) => opt);
                
                // Check if any option has a price (contains :£ or :$ or just : followed by a number)
                const hasPrices = optionParts.some((opt: string) =>
                  /:\s*[£$]?\d+(?:\.\d+)?/.test(opt)
                );
                
                if (hasPrices) {
                  // Parse options with prices
                  const parsedOptionPrices: OptionWithPrice[] = optionParts.map((opt: string) => {
                    // Match pattern like "Option 1:£100" or "Option 1: 100" or "Option 1:100"
                    const match = opt.match(/^(.+?):\s*[£$]?(\d+(?:\.\d+)?)$/);
                    if (match) {
                      return {
                        label: match[1].trim(),
                        price: parseFloat(match[2])
                      };
                    } else {
                      // No price found, just label
                      return {
                        label: opt,
                        price: undefined
                      };
                    }
                  });

                  optionPrices = parsedOptionPrices;

                  // Also store as simple string array for backward compatibility
                  options = parsedOptionPrices.map((opt: OptionWithPrice) => opt.label);
                } else {
                  // No prices, just labels
                  options = optionParts;
                }
              }
              
              // Parse min/max
              const min = row.Min ? parseFloat(String(row.Min)) : undefined;
              const max = row.Max ? parseFloat(String(row.Max)) : undefined;
              
              // Parse required
              const requiredStr = (row.Required || row['Is Required'] || '').toString().toLowerCase();
              const required = requiredStr === 'true' || requiredStr === '1' || requiredStr === 'yes' || requiredStr === 'y';
              
              // Parse shared variable (can be a variable name like "components" or a reference like "{components}")
              const sharedVarStr = (row['Shared Variable'] || row['SharedVariable'] || '').trim();
              const sharedVariable = sharedVarStr ? sharedVarStr : undefined;
              
              return {
                phase: row.Phase.trim(),
                item: row.Item.trim(),
                unitCost: parseFloat(row['Unit Cost (£)']?.replace(/[£,]/g, '') || '0'),
                ranges: ranges.length > 0 ? ranges : undefined,
                essential: parseFloat(row.Essential || '0'),
                refresh: parseFloat(row.Refresh || '0'),
                transformation: parseFloat(row.Transformation || '0'),
                description: row.Description?.trim() || row['Description Text']?.trim() || row['Info Text']?.trim() || undefined,
                questionType,
                options: options && options.length > 0 ? options.join(', ') : undefined,
                optionPrices: optionPrices && optionPrices.length > 0 ? optionPrices : undefined,
                min: isNaN(min!) ? undefined : min,
                max: isNaN(max!) ? undefined : max,
                required: required || undefined,
                validation: row.Validation?.trim() || undefined,
                sharedVariable
              };
            });

          resolve({
            items,
            sheetId,
            lastUpdated: new Date()
          });
        } catch (error) {
          reject(error);
        }
      },
      error: (error: Error) => {
        reject(error);
      }
    });
  });
}

/**
 * Parses range string like "1-3:500, 4-6:600, 7+:700"
 * Returns array of PriceRange objects
 */
function parseRanges(rangeString: string): PriceRange[] {
  if (!rangeString || rangeString.trim() === '') {
    return [];
  }

  const ranges: PriceRange[] = [];
  const parts = rangeString.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    // Match patterns like: "1-3:500", "4-6:600", "7+:700", "6+:200", "1:500"
    // Allow for optional spaces around the colon
    
    // First try pattern with + at the end: "6+:200" (must check this first)
    let match = trimmed.match(/^(\d+)\+\s*:\s*(\d+(?:\.\d+)?)$/);
    if (match) {
      const min = parseInt(match[1], 10);
      const price = parseFloat(match[2]);
      ranges.push({ min, max: null, price });
      continue;
    }
    
    // Then try standard range pattern: "1-3:500" or "1:500"
    match = trimmed.match(/^(\d+)(?:-(\d+))?\s*:\s*(\d+(?:\.\d+)?)$/);
    if (match) {
      const min = parseInt(match[1], 10);
      const maxStr = match[2];
      const price = parseFloat(match[3]);

      let max: number | null = null;
      if (maxStr) {
        max = parseInt(maxStr, 10);
      } else {
        max = min; // Single number (e.g., "1:500" means exactly 1)
      }

      ranges.push({ min, max, price });
    } else {
      console.warn(`Could not parse range: "${trimmed}"`);
    }
  }

  // Sort by min value
  ranges.sort((a, b) => a.min - b.min);

  return ranges;
}

/**
 * Gets the price per unit for a quantity based on ranges
 * Returns the price per unit (not total)
 */
export function getUnitPriceForQuantity(
  item: PricingItem,
  quantity: number
): number {
  // If item has ranges, use range-based pricing
  if (item.ranges && item.ranges.length > 0) {
    for (const range of item.ranges) {
      if (quantity >= range.min) {
        if (range.max === null || quantity <= range.max) {
          return range.price;
        }
      }
    }
    
    // If quantity exceeds all ranges, use the highest range price
    const highestRange = item.ranges[item.ranges.length - 1];
    return highestRange.price;
  }

  // Standard unit pricing
  return item.unitCost;
}

/**
 * Gets the total price for a quantity based on ranges
 * If no ranges, returns unitCost * quantity
 */
export function calculateItemPrice(
  item: PricingItem,
  quantity: number
): number {
  const unitPrice = getUnitPriceForQuantity(item, quantity);
  return unitPrice * quantity;
}

/**
 * Finds a pricing item by phase and item name
 */
export function findPricingItem(
  config: PricingConfig,
  phase: string,
  itemName: string
): PricingItem | undefined {
  // Normalize strings for comparison
  const normalizePhase = phase.toLowerCase().trim();
  const normalizeItem = itemName.toLowerCase().trim();
  
  // First try exact match
  let found = config.items.find(
    item => 
      item.phase.toLowerCase().trim() === normalizePhase &&
      item.item.toLowerCase().trim() === normalizeItem
  );
  
  // If not found, try partial matching (item name contains or is contained)
  if (!found) {
    found = config.items.find(
      item => 
        item.phase.toLowerCase().trim() === normalizePhase &&
        (item.item.toLowerCase().trim().includes(normalizeItem) ||
         normalizeItem.includes(item.item.toLowerCase().trim()))
    );
  }
  
  // If still not found, try fuzzy matching (remove special chars, extra spaces)
  if (!found) {
    const normalizeItemFuzzy = normalizeItem.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
    found = config.items.find(
      item => {
        const itemFuzzy = item.item.toLowerCase().trim()
          .replace(/[^\w\s]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        return item.phase.toLowerCase().trim() === normalizePhase &&
          (itemFuzzy === normalizeItemFuzzy ||
           itemFuzzy.includes(normalizeItemFuzzy) ||
           normalizeItemFuzzy.includes(itemFuzzy));
      }
    );
  }
  
  return found;
}

// Global config storage
let globalPricingConfig: PricingConfig | null = null;
let configUpdateListeners: Array<() => void> = [];

/**
 * Sets the global pricing config
 */
export function setGlobalPricingConfig(config: PricingConfig) {
  globalPricingConfig = config;
  // Notify all listeners that config has updated
  configUpdateListeners.forEach(listener => listener());
}

/**
 * Gets the global pricing config
 */
export function getPricingConfig(): PricingConfig | null {
  return globalPricingConfig;
}

/**
 * Subscribe to config updates (for React components)
 */
export function onPricingConfigUpdate(callback: () => void): () => void {
  configUpdateListeners.push(callback);
  // Return unsubscribe function
  return () => {
    configUpdateListeners = configUpdateListeners.filter(cb => cb !== callback);
  };
}


/**
 * Utility functions for API routes
 */

/**
 * Extracts a string value from req.query, handling both string and string[] cases
 */
export function getQueryParam(
  query: Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  const value = query[key];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

/**
 * Extracts a required string value from req.query, throws if missing
 */
export function getRequiredQueryParam(
  query: Record<string, string | string[] | undefined>,
  key: string
): string {
  const value = getQueryParam(query, key);
  if (!value) {
    throw new Error(`Missing required query parameter: ${key}`);
  }
  return value;
}



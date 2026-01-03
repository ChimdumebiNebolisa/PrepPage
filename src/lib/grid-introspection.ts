/**
 * Shared introspection logic for GRID GraphQL schema.
 * Used by both the introspection API route and the scout query.
 */

import { safeJson } from "@/lib/http";

const GRID_GRAPHQL_ENDPOINT = "https://api-op.grid.gg/central-data/graphql";

export type IntrospectionShape = "objectFields" | "inputFields" | "enumValues";

// In-memory cache for introspection results
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Clears the introspection cache. Useful for testing.
 */
export function clearIntrospectionCache(): void {
  cache.clear();
}

function getCacheKey(name: string, shape: IntrospectionShape): string {
  return `${name}:${shape}`;
}

function getCached(name: string, shape: IntrospectionShape): any | null {
  const key = getCacheKey(name, shape);
  const entry = cache.get(key);
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

function setCached(name: string, shape: IntrospectionShape, data: any): void {
  const key = getCacheKey(name, shape);
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Introspects a single GraphQL type by making a single __type query.
 * This respects the good-faith introspection restriction that only allows
 * ONE __type (or __schema) per request.
 *
 * Results are cached for 10 minutes to avoid hitting introspection limits.
 */
export async function introspectType(
  name: string,
  shape: IntrospectionShape,
  apiKey: string
): Promise<any> {
  // Check cache first
  const cached = getCached(name, shape);
  if (cached) {
    return cached;
  }

  let query: string;

  if (shape === "objectFields") {
    query = `
      query Introspect${name} {
        __type(name: "${name}") {
          name
          fields {
            name
            type {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                }
              }
            }
          }
        }
      }
    `;
  } else if (shape === "inputFields") {
    query = `
      query Introspect${name} {
        __type(name: "${name}") {
          name
          inputFields {
            name
            type {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                }
              }
            }
          }
        }
      }
    `;
  } else {
    // enumValues
    query = `
      query Introspect${name} {
        __type(name: "${name}") {
          name
          enumValues {
            name
          }
        }
      }
    `;
  }

  const response = await fetch(GRID_GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({ query }),
  });

  const data = await safeJson(response, `introspect_${name}`);

  if (data.errors) {
    const errorMessage = data.errors.map((e: any) => e.message).join(", ");
    throw new Error(`GraphQL error for ${name}: ${errorMessage}`);
  }

  const typeData = data.data?.__type;
  if (!typeData) {
    throw new Error(`Type ${name} not found in schema`);
  }

  // Cache the result
  setCached(name, shape, typeData);

  return typeData;
}

/**
 * Introspects Series, SeriesFilter, and SeriesOrderBy types.
 * Returns the raw introspection data.
 */
export async function introspectSeriesTypes(apiKey: string): Promise<{
  seriesType: any;
  seriesFilter: any;
  seriesOrderBy: any;
}> {
  const [seriesType, seriesFilter, seriesOrderBy] = await Promise.all([
    introspectType("Series", "objectFields", apiKey),
    introspectType("SeriesFilter", "inputFields", apiKey),
    introspectType("SeriesOrderBy", "enumValues", apiKey),
  ]);

  return { seriesType, seriesFilter, seriesOrderBy };
}

/**
 * Extracts field names needed for the scout query from introspection results.
 */
export interface SchemaFields {
  // Series fields
  seriesStartDateField: string;
  seriesEndDateField: string;

  // SeriesFilter input fields
  filterTeamsField: string;
  filterGameField: string;
  filterStartDateField: string;

  // SeriesOrderBy enum values
  orderByStartDate: string;
}

/**
 * Extracts schema fields from introspection results with fallback values.
 */
export function extractSchemaFields(
  seriesType: any,
  seriesFilter: any,
  seriesOrderBy: any
): SchemaFields {
  return {
    // Find startDate and endDate fields in Series
    seriesStartDateField: findFieldName(seriesType?.fields || [], ['startDate', 'start', 'date']) || 'startDate',
    seriesEndDateField: findFieldName(seriesType?.fields || [], ['endDate', 'end', 'date']) || 'endDate',

    // Find filter fields in SeriesFilter
    filterTeamsField: findFieldName(seriesFilter?.inputFields || [], ['teams', 'team']) || 'teams',
    filterGameField: findFieldName(seriesFilter?.inputFields || [], ['game', 'gameId']) || 'game',
    filterStartDateField: findFieldName(seriesFilter?.inputFields || [], ['startDate', 'start', 'date']) || 'startDate',

    // Find orderBy enum value
    orderByStartDate: findEnumValue(seriesOrderBy?.enumValues || [], ['START_DATE', 'START_DATE_DESC', 'START_DATE_ASC', 'startDate']) || 'START_DATE',
  };
}

function findFieldName(
  fields: Array<{ name: string }>,
  candidates: string[]
): string | null {
  if (!fields || fields.length === 0) return null;
  for (const candidate of candidates) {
    const found = fields.find(f =>
      f.name.toLowerCase() === candidate.toLowerCase()
    );
    if (found) return found.name;
  }
  return null;
}

function findEnumValue(
  enumValues: string[],
  candidates: string[]
): string | null {
  if (!enumValues || enumValues.length === 0) return null;
  for (const candidate of candidates) {
    const found = enumValues.find(v =>
      v.toUpperCase() === candidate.toUpperCase()
    );
    if (found) return found;
  }
  return null;
}

/**
 * Gets schema fields with fallback to default field names.
 * Use this in the scout query to ensure it always has valid field names.
 */
export function getDefaultSchemaFields(): SchemaFields {
  return {
    seriesStartDateField: 'startDate',
    seriesEndDateField: 'endDate',
    filterTeamsField: 'teams',
    filterGameField: 'game',
    filterStartDateField: 'startDate',
    orderByStartDate: 'START_DATE',
  };
}


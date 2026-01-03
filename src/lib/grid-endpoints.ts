/**
 * Centralized GRID API endpoint configuration.
 *
 * Provides functions to get the correct endpoint URLs based on environment configuration,
 * allowing switching between Open Access (api-op.grid.gg) and Full Access (api.grid.gg) tiers.
 */

export type SeriesStateTier = "open" | "full";

/**
 * Gets the Series State GraphQL endpoint URL based on GRID_SERIES_STATE_TIER environment variable.
 *
 * - "open" (default): Uses api-op.grid.gg (Open Access)
 * - "full": Uses api.grid.gg (Full Access)
 *
 * @returns The Series State GraphQL endpoint URL
 */
export function getSeriesStateGraphqlUrl(): string {
  const tier = (process.env.GRID_SERIES_STATE_TIER || "open") as SeriesStateTier;

  if (tier === "full") {
    return "https://api.grid.gg/live-data-feed/series-state/graphql";
  }

  // Default to "open"
  return "https://api-op.grid.gg/live-data-feed/series-state/graphql";
}

/**
 * Gets the Series State tier value from environment.
 *
 * @returns "open" or "full"
 */
export function getSeriesStateTier(): SeriesStateTier {
  return (process.env.GRID_SERIES_STATE_TIER || "open") as SeriesStateTier;
}

/**
 * Gets the Series State endpoint host (for logging/telemetry).
 *
 * @returns "api-op.grid.gg" or "api.grid.gg"
 */
export function getSeriesStateUrlHost(): string {
  const tier = getSeriesStateTier();
  return tier === "full" ? "api.grid.gg" : "api-op.grid.gg";
}


/**
 * Centralized GRID API endpoint configuration.
 *
 * Milestone D: Series State endpoint mode toggle with explicit 401/403/404 logging.
 */

export type SeriesStateMode = "auto" | "op" | "commercial";
export type SeriesStateTier = "open" | "full"; // Legacy, kept for backward compatibility

/**
 * Milestone D: Gets the Series State GraphQL endpoint URL(s) based on SERIES_STATE_MODE.
 *
 * - "op": Uses https://api-op.grid.gg/live-data-feed/series-state/graphql (hackathon doc)
 * - "commercial": Uses SERIES_STATE_COMMERCIAL_URL (must be set)
 * - "auto" (default): Returns op URL first, commercial URL if SERIES_STATE_COMMERCIAL_URL is set
 *
 * @returns Array of URLs to try (in order)
 */
export function getSeriesStateGraphqlUrls(): string[] {
  const mode = (process.env.SERIES_STATE_MODE || "auto") as SeriesStateMode;
  const commercialUrl = process.env.SERIES_STATE_COMMERCIAL_URL;

  if (mode === "op") {
    return ["https://api-op.grid.gg/live-data-feed/series-state/graphql"];
  }

  if (mode === "commercial") {
    if (!commercialUrl) {
      throw new Error("SERIES_STATE_MODE=commercial requires SERIES_STATE_COMMERCIAL_URL to be set");
    }
    return [commercialUrl];
  }

  // "auto" mode: try op first, then commercial if set
  const urls = ["https://api-op.grid.gg/live-data-feed/series-state/graphql"];
  if (commercialUrl) {
    urls.push(commercialUrl);
  }
  return urls;
}

/**
 * Gets the primary Series State GraphQL endpoint URL (for backward compatibility).
 * In auto mode, returns the op URL.
 *
 * @returns The primary Series State GraphQL endpoint URL
 */
export function getSeriesStateGraphqlUrl(): string {
  return getSeriesStateGraphqlUrls()[0];
}

/**
 * Gets the Series State mode value from environment.
 *
 * @returns "auto", "op", or "commercial"
 */
export function getSeriesStateMode(): SeriesStateMode {
  return (process.env.SERIES_STATE_MODE || "auto") as SeriesStateMode;
}

/**
 * Gets the Series State tier value from environment (legacy, for backward compatibility).
 *
 * @returns "open" or "full"
 */
export function getSeriesStateTier(): SeriesStateTier {
  // Legacy support: map GRID_SERIES_STATE_TIER to mode if SERIES_STATE_MODE not set
  if (!process.env.SERIES_STATE_MODE && process.env.GRID_SERIES_STATE_TIER) {
    return (process.env.GRID_SERIES_STATE_TIER || "open") as SeriesStateTier;
  }
  return "open";
}

/**
 * Gets the Series State endpoint host (for logging/telemetry).
 *
 * @returns "api-op.grid.gg", "api.grid.gg", or custom host
 */
export function getSeriesStateUrlHost(): string {
  const url = getSeriesStateGraphqlUrl();
  try {
    const urlObj = new URL(url);
    return urlObj.host;
  } catch {
    return "unknown";
  }
}


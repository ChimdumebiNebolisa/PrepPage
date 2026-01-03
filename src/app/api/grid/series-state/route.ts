import { NextRequest, NextResponse } from "next/server";
import { safeJson } from "@/lib/http";

// Open Access Series State GraphQL endpoint (Live Data Feed)
const GRID_SERIES_STATE_GRAPHQL_ENDPOINT = "https://api-op.grid.gg/live-data-feed/series-state/graphql";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const seriesId = searchParams.get("seriesId");

    if (!seriesId) {
      return NextResponse.json(
        { success: false, code: "SERIES_ID_REQUIRED", error: "seriesId query parameter is required" },
        { status: 400 }
      );
    }

    const GRID_API_KEY = process.env.GRID_API_KEY;

    if (!GRID_API_KEY || GRID_API_KEY === "YOUR_GRID_API_KEY") {
      return NextResponse.json(
        { success: false, code: "MISSING_API_KEY" },
        { status: 503 }
      );
    }

    // GraphQL query for series state
    const query = `
      query GetSeriesState($seriesId: ID!) {
        seriesState(seriesId: $seriesId) {
          seriesId
          state
          timestamp
        }
      }
    `;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(GRID_SERIES_STATE_GRAPHQL_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": GRID_API_KEY,
        },
        body: JSON.stringify({
          query,
          variables: { seriesId },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await safeJson(response, "series_state_query");

      // Check for GraphQL errors
      if (data.errors) {
        const errorMessages = data.errors.map((e: any) => e.message).join(", ");
        console.error("Series State GraphQL Error:", errorMessages);
        // GraphQL errors might indicate no state, bad query, or auth issues
        // Check if it's a "not found" type error
        if (errorMessages.toLowerCase().includes("not found") || 
            errorMessages.toLowerCase().includes("does not exist")) {
          return NextResponse.json({
            success: false,
            code: "NO_STATE",
            error: errorMessages,
          });
        }
        // Otherwise, treat as a query/field error
        return NextResponse.json(
          { success: false, code: "GRAPHQL_ERROR", error: errorMessages },
          { status: 502 }
        );
      }

      // Check HTTP status for auth/scope errors
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.error(`Series State Auth Error (HTTP ${response.status}): Unauthorized or forbidden`);
          return NextResponse.json(
            { 
              success: false, 
              code: response.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
              error: `HTTP ${response.status}: Authentication or authorization failed`,
            },
            { status: response.status }
          );
        }
        if (response.status === 404) {
          console.error("Series State Endpoint Error (HTTP 404): Endpoint not found");
          return NextResponse.json(
            { success: false, code: "ENDPOINT_NOT_FOUND", error: "Series state endpoint not found" },
            { status: 404 }
          );
        }
        // Other HTTP errors
        const errorText = await response.text().catch(() => "");
        throw new Error(`HTTP_${response.status}: ${errorText.substring(0, 100)}`);
      }

      const state = data.data?.seriesState;

      // If no state data returned, treat as NO_STATE
      if (!state) {
        return NextResponse.json({
          success: false,
          code: "NO_STATE",
        });
      }

      return NextResponse.json({
        success: true,
        state,
      });
    } catch (err: any) {
      clearTimeout(timeoutId);

      if (err.name === "AbortError" || err.message === "AbortError") {
        console.error("Series State Timeout Error: Request timeout");
        return NextResponse.json(
          { success: false, code: "TIMEOUT", error: "Request timeout" },
          { status: 504 }
        );
      }

      // Handle HTTP errors from safeJson
      if (err.message?.includes("HTTP_")) {
        const statusMatch = err.message.match(/HTTP_(\d+)/);
        const status = statusMatch ? parseInt(statusMatch[1], 10) : 502;
        if (status === 404) {
          return NextResponse.json({
            success: false,
            code: "NO_STATE",
          });
        }
        if (status === 401 || status === 403) {
          return NextResponse.json(
            { 
              success: false, 
              code: status === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
              error: err.message,
            },
            { status }
          );
        }
        throw err;
      }

      throw err;
    }
  } catch (error: any) {
    console.error("Series State API Error:", error.message);
    // If 404 or no state, return NO_STATE (not an error)
    if (error.message?.includes("HTTP_404") || error.message?.includes("NO_STATE")) {
      return NextResponse.json({
        success: false,
        code: "NO_STATE",
      });
    }
    return NextResponse.json(
      { success: false, code: "GRID_FETCH_FAILED", error: error.message },
      { status: 502 }
    );
  }
}

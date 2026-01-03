import { NextRequest, NextResponse } from "next/server";
import { safeJson } from "@/lib/http";

// Series State API base URL - typically same as Central Data but verify in docs
const GRID_SERIES_STATE_BASE = "https://api.grid.gg/series-state";

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

    // Series State API endpoint - adjust URL pattern based on actual API docs
    // Common patterns: /series-state/{seriesId} or /series-state?seriesId={seriesId}
    const response = await fetch(`${GRID_SERIES_STATE_BASE}/${seriesId}`, {
      method: "GET",
      headers: {
        "x-api-key": GRID_API_KEY,
        "Content-Type": "application/json",
      },
    });

    // If 404, series has no state (not an error)
    if (response.status === 404) {
      return NextResponse.json({
        success: false,
        code: "NO_STATE",
      });
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`HTTP_${response.status}: ${errorText.substring(0, 100)}`);
    }

    const state = await safeJson(response, "series_state");

    return NextResponse.json({
      success: true,
      state,
    });
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

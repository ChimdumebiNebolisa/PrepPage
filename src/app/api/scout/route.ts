import { NextRequest, NextResponse } from "next/server";
import { ScoutResponse } from "@/lib/types";

// GRID API configuration
const GRID_API_KEY = process.env.GRID_API_KEY;
const GRID_BASE_URL = "https://api.grid.gg/query"; // Conceptual base URL

export async function POST(req: NextRequest) {
  try {
    const { teamName, game } = await req.json();

    if (!teamName) {
      return NextResponse.json(
        { success: false, error: "team_not_found" },
        { status: 400 }
      );
    }

    if (!GRID_API_KEY || GRID_API_KEY === "YOUR_GRID_API_KEY") {
      return NextResponse.json(
        { success: false, code: "MISSING_API_KEY" },
        { status: 503 }
      );
    }

    // Simulate GRID API call with timeout protection
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      // Mocking GRID response for the hackathon MVP
      // In a real implementation, the fetch below would be active.
      /*
      const response = await fetch(GRID_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': GRID_API_KEY,
        },
        body: JSON.stringify({ query: teamName, game }),
        signal: controller.signal
      });
      if (!response.ok) throw new Error("GRID_FETCH_FAILED");
      const data = await response.json();
      */

      // For MVP, we simulate a small delay.
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, 1500);
        controller.signal.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new Error('AbortError'));
        });
      });

      clearTimeout(timeoutId);

      // Return honest error: scouting is not implemented yet
      return NextResponse.json({
        success: false,
        code: "SCOUT_NOT_IMPLEMENTED",
      }, { status: 503 });

    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError' || err.message === 'AbortError') {
        return NextResponse.json({ success: false, code: "GRID_FETCH_FAILED" }, { status: 504 });
      }
      return NextResponse.json({ success: false, code: "GRID_FETCH_FAILED" }, { status: 502 });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "internal_server_error" },
      { status: 500 }
    );
  }
}

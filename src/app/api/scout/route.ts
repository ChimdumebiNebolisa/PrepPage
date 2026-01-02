import { NextRequest, NextResponse } from "next/server";
import { ScoutResponse } from "@/lib/types";

// GRID API configuration
const GRID_API_KEY = process.env.GRID_API_KEY || process.env.NEXT_PUBLIC_GRID_API_KEY;
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

    // Simulate GRID API call with timeout protection
    // In a real implementation, this would fetch from GRID using the API key
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      // Mocking GRID response for the hackathon MVP
      // If a real key was provided and valid, we'd use it here
      if (!GRID_API_KEY || GRID_API_KEY === "YOUR_GRID_API_KEY") {
        throw new Error("Missing API Key or using placeholder");
      }

      // Conceptual GRID fetch
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
      const data = await response.json();
      */
      
      // For MVP, we simulate a small delay then throw an error to trigger the demo fallback.
      // In a real implementation with a GRID key, the fetch above would be active.
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      throw new Error("GRID API is not connected. Switching to Demo Mode.");

    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        return NextResponse.json({ success: false, error: "timeout" }, { status: 504 });
      }
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "internal_server_error" },
      { status: 500 }
    );
  }
}

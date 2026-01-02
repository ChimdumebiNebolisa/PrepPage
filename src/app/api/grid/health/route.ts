import { NextResponse } from "next/server";
import { safeJson } from "@/lib/http";

const GRID_GRAPHQL_ENDPOINT = "https://api-op.grid.gg/central-data/graphql";

export async function GET() {
  const GRID_API_KEY = process.env.GRID_API_KEY;

  // Check if API key is missing
  if (!GRID_API_KEY || GRID_API_KEY === "YOUR_GRID_API_KEY") {
    return NextResponse.json(
      { success: false, code: "MISSING_API_KEY" },
      { status: 503 }
    );
  }

  // GraphQL query to search for teams containing "Cloud9"
  const query = `
    query TeamSearch {
      teams(filter: { name: { contains: "Cloud9" } }, first: 5) {
        edges {
          node {
            id
            name
          }
        }
      }
    }
  `;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(GRID_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": GRID_API_KEY,
      },
      body: JSON.stringify({ query }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    let data;
    try {
      data = await safeJson(response, "health_check");
    } catch (err: any) {
      return NextResponse.json(
        {
          success: false,
          code: "GRID_FETCH_FAILED",
          error: err.message?.substring(0, 200) || "Unknown error",
        },
        { status: 502 }
      );
    }

    // Check for GraphQL errors
    if (data.errors) {
      return NextResponse.json(
        {
          success: false,
          code: "GRID_FETCH_FAILED",
          error: data.errors.map((e: any) => e.message).join(", "),
        },
        { status: 502 }
      );
    }

    // Extract teams from response
    const teams =
      data.data?.teams?.edges?.map((edge: any) => ({
        id: edge.node.id,
        name: edge.node.name,
      })) || [];

    return NextResponse.json(
      {
        success: true,
        source: "GRID",
        teams,
      },
      { status: 200 }
    );
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err.name === "AbortError" || err.message === "AbortError") {
      return NextResponse.json(
        {
          success: false,
          code: "GRID_FETCH_FAILED",
          error: "Request timeout",
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        code: "GRID_FETCH_FAILED",
        error: err.message || "Unknown error",
      },
      { status: 502 }
    );
  }
}


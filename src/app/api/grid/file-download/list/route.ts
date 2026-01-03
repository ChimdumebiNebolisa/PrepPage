import { NextRequest, NextResponse } from "next/server";
import { safeJson } from "@/lib/http";

const GRID_FILE_DOWNLOAD_BASE = "https://api.grid.gg/file-download";

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

    const response = await fetch(`${GRID_FILE_DOWNLOAD_BASE}/list/${seriesId}`, {
      method: "GET",
      headers: {
        "x-api-key": GRID_API_KEY,
      },
    });

    const data = await safeJson(response, "file_download_list");

    if (!Array.isArray(data)) {
      // If not an array, might be empty or error format
      return NextResponse.json({
        success: true,
        files: [],
      });
    }

    // Map to expected format
    const files = data.map((file: any) => ({
      id: file.id,
      status: file.status,
      description: file.description,
      fileName: file.fileName,
      fullURL: file.fullURL,
    }));

    return NextResponse.json({
      success: true,
      files,
    });
  } catch (error: any) {
    console.error("File Download List API Error:", error.message);
    // If 404 or no files, return empty files array (not an error)
    if (error.message?.includes("HTTP_404") || error.message?.includes("EMPTY_BODY")) {
      return NextResponse.json({
        success: true,
        files: [],
      });
    }
    return NextResponse.json(
      { success: false, code: "GRID_FETCH_FAILED", error: error.message },
      { status: 502 }
    );
  }
}

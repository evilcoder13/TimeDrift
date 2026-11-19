import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  try {
    const { file } = await params;
    // Security check: prohibit path traversal
    if (file.includes("..") || file.includes("/") || file.includes("\\")) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const filePath = path.resolve(process.cwd(), "storage/scenes", file);
    if (!fs.existsSync(filePath)) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const data = fs.readFileSync(filePath, "utf-8");
    return new NextResponse(data, {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  } catch {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

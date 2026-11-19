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

    const filePath = path.resolve(process.cwd(), "storage/audio", file);
    if (!fs.existsSync(filePath)) {
      // Check seed/audio fallback
      const seedPath = path.resolve(process.cwd(), "seed/audio", file);
      if (fs.existsSync(seedPath)) {
        const data = fs.readFileSync(seedPath);
        return new NextResponse(data, {
          headers: {
            "Content-Type": "audio/ogg",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
      return new NextResponse("Not Found", { status: 404 });
    }

    const data = fs.readFileSync(filePath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": "audio/ogg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

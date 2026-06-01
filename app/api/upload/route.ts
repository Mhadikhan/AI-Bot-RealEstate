import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const folder = formData.get("folder") === "logos" ? "logos" : "properties";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No image file provided." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Only JPG, PNG, WEBP, and GIF images are allowed." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Image must be 5MB or smaller." }, { status: 400 });
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExtension = ["jpg", "jpeg", "png", "webp", "gif"].includes(extension) ? extension : "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExtension}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", folder);

  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  return NextResponse.json({ url: `/uploads/${folder}/${filename}` });
}

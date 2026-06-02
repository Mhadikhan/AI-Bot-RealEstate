import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import {
  IMAGE_UPLOAD_LABEL,
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_VIDEO_UPLOAD_BYTES,
  VIDEO_UPLOAD_LABEL
} from "../../../lib/media-upload-limits";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/3gpp", "video/quicktime", "video/webm"]);

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const folderParam = String(formData.get("folder") || "properties");
  const folder =
    folderParam === "logos" ? "logos" : folderParam === "whatsapp" ? "whatsapp" : "properties";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const isImage = IMAGE_TYPES.has(file.type);
  const isVideo = VIDEO_TYPES.has(file.type) || file.type.startsWith("video/");

  if (!isImage && !isVideo) {
    return NextResponse.json(
      { error: "Allowed: JPG, PNG, WEBP, GIF images or MP4/3GP/WebM videos." },
      { status: 400 }
    );
  }

  const maxSize = isVideo ? MAX_VIDEO_UPLOAD_BYTES : MAX_IMAGE_UPLOAD_BYTES;
  const maxLabel = isVideo ? VIDEO_UPLOAD_LABEL : IMAGE_UPLOAD_LABEL;

  if (file.size > maxSize) {
    return NextResponse.json(
      { error: `${isVideo ? "Video" : "Image"} must be ${maxLabel} or smaller.` },
      { status: 400 }
    );
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || (isVideo ? "mp4" : "jpg");
  const safeImageExt = ["jpg", "jpeg", "png", "webp", "gif"];
  const safeVideoExt = ["mp4", "3gp", "webm", "mov"];
  const safeExtension = isVideo
    ? safeVideoExt.includes(extension)
      ? extension === "mov"
        ? "mp4"
        : extension
      : "mp4"
    : safeImageExt.includes(extension)
      ? extension
      : "jpg";

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExtension}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", folder);

  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  return NextResponse.json({
    url: `/uploads/${folder}/${filename}`,
    mimeType: file.type,
    kind: isVideo ? "VIDEO" : "IMAGE",
    size: file.size
  });
}

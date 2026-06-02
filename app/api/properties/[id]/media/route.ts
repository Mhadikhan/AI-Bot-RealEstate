import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../../lib/prisma";
import { createStorageProvider } from "../../../../../lib/storage/storage-provider";
import type { PropertyMediaType } from "@prisma/client";

const ALLOWED: Record<PropertyMediaType, string[]> = {
  IMAGE: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  VIDEO: ["video/mp4"],
  BROCHURE: ["application/pdf"],
  FLOOR_PLAN: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
  DOCUMENT: ["application/pdf"]
};

const MAX_BYTES = Number(process.env.WHATSAPP_MEDIA_MAX_BYTES || 100 * 1024 * 1024);

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const media = await prisma.propertyMedia.findMany({
    where: { propertyId: id },
    orderBy: [{ type: "asc" }, { displayOrder: "asc" }]
  });
  return NextResponse.json({ media });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  const form = await request.formData();
  const file = form.get("file");
  const type = String(form.get("type") || "IMAGE") as PropertyMediaType;
  const isPrimary = form.get("isPrimary") === "true";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  const allowed = ALLOWED[type] || ALLOWED.IMAGE;
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: `Invalid file type for ${type}` }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storage = createStorageProvider();
  const uploaded = await storage.upload({
    buffer,
    fileName: file.name,
    mimeType: file.type,
    folder: "uploads/properties"
  });

  if (isPrimary && type === "IMAGE") {
    await prisma.propertyMedia.updateMany({
      where: { propertyId: id, type: "IMAGE" },
      data: { isPrimary: false }
    });
  }

  const count = await prisma.propertyMedia.count({ where: { propertyId: id, type } });
  const media = await prisma.propertyMedia.create({
    data: {
      propertyId: id,
      type,
      fileName: file.name,
      mimeType: file.type,
      storageUrl: uploaded.url,
      isPrimary: isPrimary && type === "IMAGE",
      displayOrder: count
    }
  });

  if (isPrimary && type === "IMAGE") {
    await prisma.property.update({ where: { id }, data: { featuredImage: uploaded.url } });
  }

  return NextResponse.json({ media }, { status: 201 });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const mediaId = searchParams.get("mediaId");
  if (!mediaId) return NextResponse.json({ error: "mediaId required" }, { status: 400 });

  await prisma.propertyMedia.deleteMany({ where: { id: mediaId, propertyId: id } });
  return NextResponse.json({ ok: true });
}

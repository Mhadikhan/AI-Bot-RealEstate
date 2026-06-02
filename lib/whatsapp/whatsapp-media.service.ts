import { prisma } from "../prisma";
import { sendWhatsAppMediaMessage, sendWhatsAppTextMessage } from "./whatsapp-message.service";
import type { SendMessageResult } from "./whatsapp.types";
import { normalizePhone } from "./whatsapp.types";

const MAX_GALLERY_PROPERTIES = 5;

function formatPropertyCaption(property: {
  title: string;
  bedrooms: string;
  bathrooms: number;
  sizeSqFt: number;
  area: string;
  city: string;
  price: number;
  currency: string;
  availability: string;
}) {
  const currencySymbol = property.currency === "PKR" ? "Rs " : `${property.currency} `;
  return [
    property.title,
    "",
    `${property.bedrooms} Bedrooms · ${property.bathrooms} Bathrooms`,
    `${property.sizeSqFt.toLocaleString()} sq ft`,
    `${property.area}, ${property.city}`,
    `Price: ${currencySymbol}${property.price.toLocaleString()}`,
    `Status: ${property.availability}`,
    "",
    "Reply:",
    "1 — More pictures",
    "2 — Video tour",
    "3 — Brochure",
    "4 — Floor plan",
    "5 — Book a viewing",
    "6 — Speak with an agent"
  ].join("\n");
}

async function resolveMediaUrl(propertyId: string, type: "IMAGE" | "VIDEO" | "BROCHURE" | "FLOOR_PLAN") {
  const media = await prisma.propertyMedia.findFirst({
    where: { propertyId, type },
    orderBy: type === "IMAGE" ? [{ isPrimary: "desc" }, { displayOrder: "asc" }] : { displayOrder: "asc" }
  });
  if (media) return media;
  if (type === "IMAGE") {
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (property?.featuredImage) {
      return {
        storageUrl: property.featuredImage,
        mimeType: "image/jpeg",
        fileName: "cover.jpg"
      };
    }
  }
  return null;
}

export async function sendPropertyCoverImage(
  phone: string,
  propertyId: string
): Promise<SendMessageResult | null> {
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property || property.status !== "ACTIVE") return null;

  const media = await resolveMediaUrl(propertyId, "IMAGE");
  if (!media) return null;

  return sendWhatsAppMediaMessage({
    phone: normalizePhone(phone),
    messageType: "IMAGE",
    text: formatPropertyCaption(property),
    mediaUrl: media.storageUrl,
    mimeType: media.mimeType,
    fileName: media.fileName
  });
}

export async function sendPropertyGallery(phone: string, propertyId: string, limit = 5) {
  const images = await prisma.propertyMedia.findMany({
    where: { propertyId, type: "IMAGE" },
    orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }],
    take: limit
  });

  const results: SendMessageResult[] = [];
  for (const image of images) {
    results.push(
      await sendWhatsAppMediaMessage({
        phone: normalizePhone(phone),
        messageType: "IMAGE",
        text: image.fileName,
        mediaUrl: image.storageUrl,
        mimeType: image.mimeType,
        fileName: image.fileName
      })
    );
  }
  return results;
}

export async function sendPropertyVideo(phone: string, propertyId: string) {
  const media = await resolveMediaUrl(propertyId, "VIDEO");
  if (!media) return null;
  return sendWhatsAppMediaMessage({
    phone: normalizePhone(phone),
    messageType: "VIDEO",
    text: "Property video tour",
    mediaUrl: media.storageUrl,
    mimeType: media.mimeType,
    fileName: media.fileName
  });
}

export async function sendPropertyBrochure(phone: string, propertyId: string) {
  const media = await resolveMediaUrl(propertyId, "BROCHURE");
  if (!media) return null;
  return sendWhatsAppMediaMessage({
    phone: normalizePhone(phone),
    messageType: "TEXT",
    text: "Property brochure",
    mediaUrl: media.storageUrl,
    mimeType: media.mimeType || "application/pdf",
    fileName: media.fileName
  });
}

export async function sendFloorPlan(phone: string, propertyId: string) {
  const media = await resolveMediaUrl(propertyId, "FLOOR_PLAN");
  if (!media) return null;
  const isPdf = media.mimeType === "application/pdf";
  return sendWhatsAppMediaMessage({
    phone: normalizePhone(phone),
    messageType: isPdf ? "TEXT" : "IMAGE",
    text: "Floor plan",
    mediaUrl: media.storageUrl,
    mimeType: media.mimeType,
    fileName: media.fileName
  });
}

export async function sendMatchingPropertyCovers(phone: string, propertyIds: string[]) {
  const ids = propertyIds.slice(0, MAX_GALLERY_PROPERTIES);
  const results: SendMessageResult[] = [];
  for (const id of ids) {
    const result = await sendPropertyCoverImage(phone, id);
    if (result) results.push(result);
  }
  if (results.length === 0) {
    return sendWhatsAppTextMessage(
      phone,
      "No matching active listings with images right now. Reply with your budget and area and we will search again."
    );
  }
  return results;
}

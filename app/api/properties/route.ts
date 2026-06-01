import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";

const createPropertySchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  area: z.string().min(2),
  city: z.string().min(2).default("Karachi"),
  propertyType: z.string().min(2),
  listingPurpose: z.enum(["SALE", "RENT"]),
  category: z.enum(["READY", "OFF_PLAN"]),
  bedrooms: z.string().min(1),
  bathrooms: z.number().int().positive(),
  sizeSqFt: z.number().int().positive(),
  price: z.number().int().positive(),
  featuredImage: z.string().optional(),
  featured: z.boolean().optional()
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const area = url.searchParams.get("area") || undefined;
  const listingPurpose = url.searchParams.get("listingPurpose") as "SALE" | "RENT" | null;

  const properties = await prisma.property.findMany({
    where: {
      status: "ACTIVE",
      area,
      listingPurpose: listingPurpose || undefined
    },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }]
  });

  return NextResponse.json(properties);
}

export async function POST(request: Request) {
  const parsed = createPropertySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const baseSlug = slugify(data.title);
  let slug = baseSlug;
  let suffix = 1;

  while (await prisma.property.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const property = await prisma.property.create({
    data: {
      ref: `PC-${Date.now()}`,
      slug,
      title: data.title,
      description: data.description || `${data.title} listing added from the admin panel.`,
      area: data.area,
      city: data.city,
      propertyType: data.propertyType,
      listingPurpose: data.listingPurpose,
      category: data.category,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      sizeSqFt: data.sizeSqFt,
      price: data.price,
      currency: "PKR",
      featuredImage: data.featuredImage?.trim() ? data.featuredImage.trim() : null,
      featured: data.featured ?? false,
      status: "ACTIVE"
    }
  });

  return NextResponse.json(property, { status: 201 });
}

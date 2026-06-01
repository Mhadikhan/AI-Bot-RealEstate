import { Property, ListingPurpose, PropertyStatus } from "@prisma/client";

export type MatchInput = {
  listingPurpose?: ListingPurpose;
  preferredArea?: string;
  propertyType?: string;
  bedrooms?: string;
  budgetMax?: number;
  category?: string;
};

export function matchProperties(properties: Property[], input: MatchInput) {
  return properties
    .filter((property) => property.status === PropertyStatus.ACTIVE)
    .map((property) => {
      let score = 0;
      if (!input.listingPurpose || property.listingPurpose === input.listingPurpose) score += 20;
      if (!input.preferredArea || input.preferredArea === "Open to recommendations" || property.area === input.preferredArea) score += 25;
      if (!input.propertyType || property.propertyType === input.propertyType) score += 15;
      if (!input.bedrooms || property.bedrooms === input.bedrooms) score += 15;
      if (!input.budgetMax || property.price <= input.budgetMax) score += 15;
      if (!input.category || property.category === input.category) score += 10;
      return { ...property, matchScore: score };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);
}

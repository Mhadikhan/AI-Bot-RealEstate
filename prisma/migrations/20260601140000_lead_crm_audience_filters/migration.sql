-- AlterTable
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "propertyCategoryPreference" "PropertyCategory";

-- AlterTable
ALTER TABLE "Broadcast" ADD COLUMN IF NOT EXISTS "audienceFilters" JSONB;

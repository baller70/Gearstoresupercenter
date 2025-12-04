/*
  Multi-Tenant Business Migration

  This migration:
  1. Creates the Business and BusinessCredential tables
  2. Creates a default business for existing data
  3. Adds businessId columns to all relevant tables
  4. Updates existing records to use the default business
  5. Makes businessId required where needed
*/

-- AlterEnum: Add new user roles
ALTER TYPE "UserRole" ADD VALUE 'BUSINESS_ADMIN';
ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';

-- CreateTable: Business
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#FF6B00',
    "secondaryColor" TEXT NOT NULL DEFAULT '#1A1A2E',
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'US',
    "website" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "taxEnabled" BOOLEAN NOT NULL DEFAULT true,
    "customDomain" TEXT,
    "subdomain" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable: BusinessCredential
CREATE TABLE "BusinessCredential" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "stripePublishableKey" TEXT,
    "stripeSecretKey" TEXT,
    "stripeWebhookSecret" TEXT,
    "stripeAccountId" TEXT,
    "resendApiKey" TEXT,
    "emailFromName" TEXT,
    "emailFromAddress" TEXT,
    "printifyApiKey" TEXT,
    "printifyShopId" TEXT,
    "printifyWebhookSecret" TEXT,
    "awsAccessKeyId" TEXT,
    "awsSecretAccessKey" TEXT,
    "awsBucketName" TEXT,
    "awsRegion" TEXT NOT NULL DEFAULT 'us-east-1',
    "webhookSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessCredential_pkey" PRIMARY KEY ("id")
);

-- Create Business indexes
CREATE UNIQUE INDEX "Business_slug_key" ON "Business"("slug");
CREATE UNIQUE INDEX "Business_customDomain_key" ON "Business"("customDomain");
CREATE UNIQUE INDEX "Business_subdomain_key" ON "Business"("subdomain");
CREATE INDEX "Business_slug_idx" ON "Business"("slug");
CREATE INDEX "Business_active_idx" ON "Business"("active");
CREATE UNIQUE INDEX "BusinessCredential_businessId_key" ON "BusinessCredential"("businessId");

-- Add BusinessCredential foreign key
ALTER TABLE "BusinessCredential" ADD CONSTRAINT "BusinessCredential_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert default business for existing data (The Basketball Factory Inc)
INSERT INTO "Business" ("id", "name", "slug", "email", "description", "primaryColor", "secondaryColor", "active", "verified", "updatedAt")
VALUES (
    'default-basketball-factory',
    'The Basketball Factory Inc',
    'basketball-factory',
    'admin@basketballfactory.com',
    'Premium basketball apparel and merchandise',
    '#FF6B00',
    '#1A1A2E',
    true,
    true,
    CURRENT_TIMESTAMP
);

-- Step 1: Add businessId columns as NULLABLE first
ALTER TABLE "User" ADD COLUMN "businessId" TEXT;
ALTER TABLE "Product" ADD COLUMN "businessId" TEXT;
ALTER TABLE "Design" ADD COLUMN "businessId" TEXT;
ALTER TABLE "Order" ADD COLUMN "businessId" TEXT;
ALTER TABLE "DiscountCode" ADD COLUMN "businessId" TEXT;
ALTER TABLE "GiftCard" ADD COLUMN "businessId" TEXT;
ALTER TABLE "BulkOrder" ADD COLUMN "businessId" TEXT;
ALTER TABLE "EmailCampaign" ADD COLUMN "businessId" TEXT;
ALTER TABLE "ShippingOption" ADD COLUMN "businessId" TEXT;

-- Step 2: Update existing records to use the default business
UPDATE "Product" SET "businessId" = 'default-basketball-factory' WHERE "businessId" IS NULL;
UPDATE "Design" SET "businessId" = 'default-basketball-factory' WHERE "businessId" IS NULL;
UPDATE "Order" SET "businessId" = 'default-basketball-factory' WHERE "businessId" IS NULL;
UPDATE "DiscountCode" SET "businessId" = 'default-basketball-factory' WHERE "businessId" IS NULL;
UPDATE "GiftCard" SET "businessId" = 'default-basketball-factory' WHERE "businessId" IS NULL;
UPDATE "BulkOrder" SET "businessId" = 'default-basketball-factory' WHERE "businessId" IS NULL;
UPDATE "EmailCampaign" SET "businessId" = 'default-basketball-factory' WHERE "businessId" IS NULL;
UPDATE "ShippingOption" SET "businessId" = 'default-basketball-factory' WHERE "businessId" IS NULL;

-- Step 3: Make businessId NOT NULL for required tables
ALTER TABLE "Product" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "Design" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "DiscountCode" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "GiftCard" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "BulkOrder" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "EmailCampaign" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "ShippingOption" ALTER COLUMN "businessId" SET NOT NULL;

-- Step 4: Drop old unique constraints that need to be business-scoped
DROP INDEX IF EXISTS "DiscountCode_code_key";
DROP INDEX IF EXISTS "GiftCard_code_key";

-- Step 5: Create indexes
CREATE INDEX "User_businessId_idx" ON "User"("businessId");
CREATE INDEX "Product_businessId_idx" ON "Product"("businessId");
CREATE INDEX "Design_businessId_idx" ON "Design"("businessId");
CREATE INDEX "Order_businessId_idx" ON "Order"("businessId");
CREATE INDEX "DiscountCode_businessId_idx" ON "DiscountCode"("businessId");
CREATE INDEX "GiftCard_businessId_idx" ON "GiftCard"("businessId");
CREATE INDEX "BulkOrder_businessId_idx" ON "BulkOrder"("businessId");
CREATE INDEX "EmailCampaign_businessId_idx" ON "EmailCampaign"("businessId");
CREATE INDEX "ShippingOption_businessId_idx" ON "ShippingOption"("businessId");

-- Step 6: Create business-scoped unique constraints
CREATE UNIQUE INDEX "DiscountCode_businessId_code_key" ON "DiscountCode"("businessId", "code");
CREATE UNIQUE INDEX "GiftCard_businessId_code_key" ON "GiftCard"("businessId", "code");

-- Step 7: Add foreign key constraints
ALTER TABLE "User" ADD CONSTRAINT "User_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Design" ADD CONSTRAINT "Design_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DiscountCode" ADD CONSTRAINT "DiscountCode_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GiftCard" ADD CONSTRAINT "GiftCard_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BulkOrder" ADD CONSTRAINT "BulkOrder_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EmailCampaign" ADD CONSTRAINT "EmailCampaign_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ShippingOption" ADD CONSTRAINT "ShippingOption_businessId_fkey"
    FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

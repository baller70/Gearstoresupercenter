-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrderStatus" ADD VALUE 'PENDING_PAYMENT';
ALTER TYPE "OrderStatus" ADD VALUE 'PAID';
ALTER TYPE "OrderStatus" ADD VALUE 'PAYMENT_FAILED';
ALTER TYPE "OrderStatus" ADD VALUE 'REFUNDED';
ALTER TYPE "OrderStatus" ADD VALUE 'FULFILLMENT_ERROR';
ALTER TYPE "OrderStatus" ADD VALUE 'ON_HOLD';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "carrier" TEXT,
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "printifyOrderId" TEXT,
ADD COLUMN     "shippedAt" TIMESTAMP(3),
ADD COLUMN     "stripePaymentIntentId" TEXT,
ADD COLUMN     "stripeSessionId" TEXT,
ADD COLUMN     "trackingNumber" TEXT,
ALTER COLUMN "shippingEmail" DROP NOT NULL,
ALTER COLUMN "shippingAddress" DROP NOT NULL,
ALTER COLUMN "shippingCity" DROP NOT NULL,
ALTER COLUMN "shippingState" DROP NOT NULL,
ALTER COLUMN "shippingZip" DROP NOT NULL,
ALTER COLUMN "billingName" DROP NOT NULL,
ALTER COLUMN "billingAddress" DROP NOT NULL,
ALTER COLUMN "billingCity" DROP NOT NULL,
ALTER COLUMN "billingState" DROP NOT NULL,
ALTER COLUMN "billingZip" DROP NOT NULL;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "customization" JSONB;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "printifyBlueprintId" INTEGER,
ADD COLUMN     "printifyProductId" TEXT,
ADD COLUMN     "printifyVariantId" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "abandonedCartEmailSentAt" TIMESTAMP(3),
ADD COLUMN     "lastLoginAt" TIMESTAMP(3);

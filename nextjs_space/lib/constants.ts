/**
 * Application Constants
 */

// Default business ID for the platform
// This is used when a user doesn't belong to a specific business
export const DEFAULT_BUSINESS_ID = 'default-basketball-factory';

// Store name for branding
export const STORE_NAME = 'Basketball Factory';

// Site URL (can be overridden by env)
export const SITE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

// Product categories
export const CATEGORIES = {
  PERFORMANCE_APPAREL: 'Performance Apparel',
  CASUAL_WEAR: 'Casual Wear',
  ACCESSORIES: 'Accessories',
  POD_PRODUCTS: 'Print-on-Demand Products',
} as const;

// Order statuses
export const ORDER_STATUSES = {
  PENDING: 'Pending',
  PENDING_PAYMENT: 'Pending Payment',
  PAID: 'Paid',
  PAYMENT_FAILED: 'Payment Failed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
  FULFILLMENT_ERROR: 'Fulfillment Error',
  ON_HOLD: 'On Hold',
} as const;

// Loyalty points multiplier (points per dollar)
export const LOYALTY_POINTS_PER_DOLLAR = 10;


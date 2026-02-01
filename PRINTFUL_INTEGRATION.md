# Printful Integration Guide

## Overview
Full Printful integration for automatic product sync, order fulfillment, and real-time status updates.

## Features Implemented

### 1. Product Catalog Sync
- Automatically fetch Printful product catalog
- Sync products with all variants (sizes/colors)
- Calculate pricing with configurable profit margins
- Store Printful product IDs for order fulfillment

### 2. Variant & Pricing Management
- Sync all available sizes and colors
- Calculate costs: Base cost + Profit margin = Retail price
- Store variant metadata for quick lookups
- Support for custom profit margins per product

### 3. Order Fulfillment
- Automatically send orders to Printful when placed
- Map customer orders to Printful variants
- Include custom designs/logos in orders
- Confirm orders for production

### 4. Webhook Integration
- Real-time order status updates
- Tracking number updates when shipped
- Handle order failures and returns
- Automatic database updates

## Setup Instructions

### Step 1: Get Printful API Key
1. Go to https://www.printful.com/dashboard/developer/keys
2. Create a new API key
3. Already added to `.env`: `PRINTFUL_API_KEY=PeWUYPKvomy0S0OtaLJfbuR3iGjHYKrc3pMvytsE`

### Step 2: Configure Webhook
1. Go to https://www.printful.com/dashboard/settings/webhooks
2. Add webhook URL: `https://yourdomain.com/api/printful/webhook`
3. Select events to receive:
   - `package_shipped` - When order ships
   - `package_returned` - When package is returned
   - `order_failed` - When order fails
   - `order_updated` - When order status changes
4. Copy the webhook secret
5. Add to `.env`: `PRINTFUL_WEBHOOK_SECRET=your_webhook_secret`

### Step 3: Sync Products

**API Endpoint:** `POST /api/printful/sync`

**Request Body:**
```json
{
  "businessId": "your_business_id",
  "productTypes": ["jersey", "tshirt", "hoodie", "shorts"],
  "profitMarginPercent": 100
}
```

**Example:**
```bash
curl -X POST https://yourdomain.com/api/printful/sync \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "clxxx",
    "profitMarginPercent": 150
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Synced 24 products from Printful",
  "products": [
    {
      "id": "product_id",
      "name": "Recycled unisex basketball jersey - Black",
      "color": "Black",
      "sizes": ["S", "M", "L", "XL", "2XL"],
      "price": 45.99,
      "printfulProductId": 586
    }
  ]
}
```

### Step 4: Order Fulfillment

**API Endpoint:** `POST /api/printful/order`

**Request Body:**
```json
{
  "orderId": "your_order_id"
}
```

**What Happens:**
1. Fetches order from database
2. Maps products to Printful variants
3. Includes custom designs/logos
4. Submits order to Printful
5. Confirms order for production
6. Updates order status to "PROCESSING"

**Example:**
```bash
curl -X POST https://yourdomain.com/api/printful/order \
  -H "Content-Type: application/json" \
  -d '{"orderId": "order_123"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Order submitted to Printful for fulfillment",
  "printfulOrderId": 12345678,
  "status": "pending"
}
```

### Step 5: Check Order Status

**API Endpoint:** `GET /api/printful/order?orderId=order_123`

**Response:**
```json
{
  "printfulOrder": {
    "id": 12345678,
    "status": "fulfilled",
    "created": 1234567890,
    "updated": 1234567890
  },
  "shipments": [
    {
      "carrier": "USPS",
      "service": "First Class",
      "tracking_number": "9400111899562843817537",
      "tracking_url": "https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899562843817537",
      "created": 1234567890
    }
  ]
}
```

## Available Products

```typescript
BASKETBALL_PRODUCTS = {
  jersey: { id: 586, name: 'Recycled unisex basketball jersey' },
  tshirt: { id: 71, name: 'Unisex Staple T-Shirt' },
  hoodie: { id: 380, name: 'Unisex Premium Hoodie' },
  sweatshirt: { id: 372, name: 'Unisex Crew Neck Sweatshirt' },
  shorts: { id: 588, name: 'Recycled unisex basketball shorts' },
  tankTop: { id: 308, name: 'Unisex Tank Top' },
}
```

## Workflow

### Product Creation Flow
1. Admin syncs products from Printful → `POST /api/printful/sync`
2. Products created in database with all variants
3. Pricing calculated: `retail = cost × (1 + profitMargin/100)`
4. Products appear on storefront

### Order Flow
1. Customer places order on website
2. Order saved to database with status "PENDING"
3. Admin/system triggers fulfillment → `POST /api/printful/order`
4. Order sent to Printful with customer details
5. Printful confirms and starts production
6. Order status updated to "PROCESSING"

### Shipping Flow
1. Printful ships order
2. Webhook received → `POST /api/printful/webhook`
3. Order status updated to "SHIPPED"
4. Tracking number saved
5. Customer notified (implement email notification)

## Database Schema

Products store Printful data in `metadata` field:
```json
{
  "printfulProductId": 586,
  "printfulVariants": [
    {
      "id": 12345,
      "size": "M",
      "color": "Black",
      "colorCode": "#000000",
      "cost": 19.95,
      "retail": 39.90,
      "inStock": true
    }
  ],
  "profitMargin": 100,
  "baseCost": 19.95,
  "profit": 19.95
}
```

Orders track Printful fulfillment:
- `printifyOrderId` - Printful order ID
- `trackingNumber` - Shipping tracking number
- `carrier` - Shipping carrier (USPS, UPS, etc.)
- `shippedAt` - When order was shipped
- `status` - Order status (PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED)

## Testing

### Test Product Sync
```bash
curl -X POST http://localhost:3000/api/printful/sync \
  -H "Content-Type: application/json" \
  -d '{"businessId": "your_business_id", "productTypes": ["tshirt"]}'
```

### Test Order Creation
```bash
curl -X POST http://localhost:3000/api/printful/order \
  -H "Content-Type: application/json" \
  -d '{"orderId": "test_order_id"}'
```

### Test Webhook (Local)
```bash
curl -X POST http://localhost:3000/api/printful/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "package_shipped",
    "data": {
      "order": {"id": 12345},
      "shipment": {
        "carrier": "USPS",
        "tracking_number": "9400111899562843817537",
        "tracking_url": "https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899562843817537"
      }
    }
  }'
```

## Pricing Example

**Base Cost from Printful:** $19.95  
**Profit Margin:** 100%  
**Retail Price:** $19.95 × 2 = $39.90  
**Your Profit:** $19.90 per sale

**Custom Margin (150%):**  
**Retail Price:** $19.95 × 2.5 = $49.88  
**Your Profit:** $29.93 per sale

## Important Notes

1. **Webhook Secret:** Required for production. Get from Printful dashboard.
2. **Order Confirmation:** Orders are automatically confirmed. To create draft orders, modify the code.
3. **Design Files:** Must be publicly accessible URLs for Printful to download.
4. **Variant Mapping:** System automatically maps size/color to correct Printful variant.
5. **Costs:** Printful charges your account when orders are confirmed.

## Next Steps

1. ✅ Add `PRINTFUL_WEBHOOK_SECRET` to production environment
2. ✅ Configure webhook URL in Printful dashboard
3. ✅ Run product sync for your business
4. ✅ Test order flow with a sample order
5. ⬜ Implement customer email notifications for shipping updates
6. ⬜ Add admin dashboard for viewing Printful order status
7. ⬜ Implement automatic order submission on checkout completion

## Support

- Printful API Docs: https://developers.printful.com/
- Webhook Events: https://developers.printful.com/docs/#section/Webhooks
- Product Catalog: https://www.printful.com/custom-products


# Jetprint Integration Guide
### Complete Setup for Basketball Factory & Rise as One AAU Store

## Overview
This guide walks through the complete integration process between your custom basketball e-commerce store and Jetprint for print-on-demand fulfillment.

## ✅ Phase 1: API Connection (COMPLETED)

### What Was Done
- **WooCommerce OAuth Authentication**: Implemented proper OAuth 1.0a flow
- **API Credentials Generated**: Consumer Key and Secret available
- **API Endpoints Active**: Modern and legacy WooCommerce API paths working
- **OAuth Fixed**: Resolved 404 and 400 errors, credentials now POST correctly to Jetprint

### Connection Status
✅ **SUCCESSFUL** - Jetprint can now connect to: `https://basketballgearstore.abacusai.app`

### API Credentials Location
Navigate to: Admin Dashboard → WooCommerce API → Copy credentials to Jetprint

---

## 📦 Phase 2: Product Sync

### Current Products Available (29 total)
Your store has the following product categories ready for Jetprint sync:

**Performance Apparel:**
- Elite Reversible Jersey ($24.99)
- AAU Custom Sublimated Jersey ($34.99)
- Pro Mesh Shorts ($18.99)
- Step-Back Performance Shorts ($22.99)
- Reversible Practice Shorts ($16.99)
- Long Sleeve Performance Shooting Shirt ($19.99)
- 4-Way Stretch Shootaround Shirt ($29.99)
- Hooded Competitor Shooting Shirt ($24.99)

**Casual Wear:**
- AAU Team Pullover Hoodie ($32.99)
- Basketball Culture Zip Hoodie ($34.99)

### How Jetprint Will Pull Products

1. **Automatic Sync**:
   - Jetprint uses WooCommerce REST API to fetch products
   - Endpoint: `/wp-json/wc/v3/products`
   - All 29 products are accessible with API credentials

2. **Product Information Included**:
   - Product name, SKU, price
   - Category and description
   - Images and variants
   - Stock status

3. **Verification**:
   ```bash
   # Test product sync (Jetprint does this automatically)
   curl -u "YOUR_CONSUMER_KEY:YOUR_CONSUMER_SECRET" \
     https://basketballgearstore.abacusai.app/wp-json/wc/v3/products
   ```

---

## 🎨 Phase 3: Design Integration

### Current Design Status
✅ **1 Approved Design**: "RA1 v5" logo
- Logo URL: `7762/designs/1761601127148-RA1-v5.png`
- Status: Approved and ready for production
- Generated mockups for all product types

### Connecting Designs to Products

#### Option A: Jetprint Design Studio (Recommended)
1. Log into Jetprint dashboard
2. Go to **Designs** section
3. Upload or select your "RA1 v5" logo
4. Configure placement on each product type
5. Save design templates

#### Option B: Pre-configured Mockups (Already Done!)
Your store has pre-generated mockups with logos positioned correctly:
- Basketball T-Shirts
- Basketball Jerseys
- Basketball Shorts
- Sweatshirts
- Hoodies

**Mockup Locations**:
```
/public/generated-mockups/
├── basketball-tshirt-*.png
├── basketball-jersey-*.png
├── basketball-shorts-*.png
├── basketball-sweatshirt-*.png
└── basketball-hoodie-*.png
```

### Design Positioning System
Your store includes an **AI-powered logo positioning system**:
- Navigate to: Admin → AI Design System → Manage All Designs
- View and adjust logo positions
- Regenerate mockups with new positions
- Export positioning data for Jetprint

---

## 🔔 Phase 4: Webhook Configuration

### Setting Up Automatic Order Fulfillment

#### Step 1: Get Jetprint Webhook URL
1. Log into Jetprint dashboard
2. Navigate to **Settings** → **Integrations**
3. Find your unique webhook URL (format: `https://api.jetprint.com/webhooks/YOUR_ID`)
4. Copy this URL

#### Step 2: Configure Webhook in Your Store
1. Go to: `https://basketballgearstore.abacusai.app/admin/woocommerce/webhooks`
2. Click **"Create New Webhook"**
3. Fill in the form:
   - **Name**: "Jetprint Order Fulfillment"
   - **Event Topic**: "Order Created"
   - **Delivery URL**: [Paste your Jetprint webhook URL]
4. Click **"Create Webhook"**

#### Step 3: Test the Webhook
1. Click the **"Test"** button next to your webhook
2. Jetprint will receive a test order notification
3. Verify in Jetprint dashboard that the test order appears

### Webhook Payload Format
When a customer places an order, Jetprint will receive:
```json
{
  "event": "order.created",
  "timestamp": "2025-10-28T...",
  "store": "basketballgearstore.abacusai.app",
  "order": {
    "id": "order_123",
    "number": "ORD-12345678",
    "status": "pending",
    "total": "89.99",
    "currency": "USD",
    "customer": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "items": [
      {
        "id": "item_1",
        "name": "Custom Basketball Jersey",
        "quantity": 2,
        "price": "34.99",
        "sku": "JERSEY-001",
        "design": {
          "logoUrl": "https://i.pinimg.com/736x/9b/b3/46/9bb346ae3653d58b92257e96828f8d92.jpg",
          "position": "center"
        }
      }
    ],
    "shipping": {
      "name": "John Doe",
      "address": "123 Main St",
      "city": "Los Angeles",
      "state": "CA",
      "zip": "90001",
      "country": "US"
    }
  }
}
```

---

## 🧪 Phase 5: Test Order Flow

### Creating a Test Order

#### Step 1: Place Test Order on Your Store
1. Visit: `https://basketballgearstore.abacusai.app`
2. Add products to cart (e.g., AAU Custom Sublimated Jersey)
3. Go to checkout
4. Fill in test shipping information:
   ```
   Name: Test Customer
   Email: test@example.com
   Address: 123 Test Street
   City: Test City
   State: CA
   Zip: 90210
   ```
5. Complete the order

#### Step 2: Verify Webhook Delivery
1. Check Jetprint dashboard for new order
2. Verify all order details are correct:
   - Customer information
   - Product details
   - Shipping address
   - Design/logo information

#### Step 3: Track Order Fulfillment
1. Jetprint processes the order
2. Prints and ships the product
3. Updates order status via API
4. Customer receives tracking information

---

## 📊 Complete Integration Checklist

### ✅ Completed Tasks
- [x] WooCommerce API compatibility layer
- [x] OAuth authentication endpoints
- [x] API credentials generated
- [x] Products available via API (29 products)
- [x] Design upload and approval system
- [x] Logo positioning with AI analysis
- [x] Mockup generation system
- [x] Webhook management interface
- [x] Automatic webhook triggers on order creation

### 🔄 In Progress
- [ ] Jetprint webhook URL configuration
- [ ] First test order through Jetprint
- [ ] Order status sync back to store

### 📋 Next Steps

#### Immediate Actions:
1. **Configure Jetprint Webhook** (5 minutes)
   - Get webhook URL from Jetprint
   - Add it to your store's webhook management
   - Test the connection

2. **Place Test Order** (10 minutes)
   - Create a test order on your store
   - Verify Jetprint receives it
   - Confirm order details are accurate

3. **Design Mapping** (15 minutes)
   - Link your "RA1 v5" design to products in Jetprint
   - Configure logo placement for each product type
   - Save design templates

#### Optional Enhancements:
- **Inventory Sync**: Set up two-way inventory synchronization
- **Order Status Updates**: Configure Jetprint to update order status in your store
- **Multiple Designs**: Upload additional logos for different products/teams
- **Bulk Orders**: Test bulk order functionality for team purchases

---

## 🛠️ Technical Details

### API Endpoints Available
```
Modern Format:
- Products: GET /wp-json/wc/v3/products
- Orders: GET /wp-json/wc/v3/orders
- Orders: POST /wp-json/wc/v3/orders
- Webhooks: GET /wp-json/wc/v3/webhooks

Legacy Format (for compatibility):
- Products: GET /wc-api/v3/products
- Orders: GET /wc-api/v3/orders
```

### Authentication Methods Supported
1. **OAuth 1.0a** (for initial connection)
2. **Basic Auth over HTTPS** (for ongoing API calls)
3. **Consumer Key/Secret** (in HTTP headers)

### Admin Access
- **URL**: `https://basketballgearstore.abacusai.app/admin`
- **Email**: `john@doe.com`
- **Password**: `johndoe123`

### Key Pages
- **WooCommerce API**: `/admin/woocommerce`
- **Webhook Management**: `/admin/woocommerce/webhooks`
- **Design Management**: `/admin/designs`
- **Product Inventory**: `/admin/inventory`

---

## 🆘 Troubleshooting

### Jetprint Can't Connect
**Problem**: "404 Not Found" or "401 Unauthorized"
**Solution**: 
- Verify API credentials are correct
- Check store URL is exactly: `https://basketballgearstore.abacusai.app`
- Ensure no trailing slash in URL

### Orders Not Appearing in Jetprint
**Problem**: Orders placed but Jetprint doesn't receive them
**Solution**:
- Check webhook is configured and status is "active"
- Test webhook using the "Test" button
- Verify Jetprint webhook URL is correct
- Check webhook logs for errors

### Design/Logo Issues
**Problem**: Logo not appearing correctly on products
**Solution**:
- Re-upload logo in Jetprint Design Studio
- Adjust logo position settings
- Regenerate mockups in your store
- Verify logo URL is accessible

### Product Sync Issues
**Problem**: Products not showing in Jetprint
**Solution**:
- Verify API credentials have "read" permission
- Re-sync products in Jetprint dashboard
- Check products are marked as "In Stock"
- Ensure product images are loading

---

## 📞 Support Resources

### Your Store Support
- **Admin Dashboard**: https://basketballgearstore.abacusai.app/admin
- **API Documentation**: Available in WooCommerce API page

### Jetprint Support
- **Help Center**: https://jetprintapp.com/help
- **Integration Guide**: https://jetprintapp.com/integrations/woocommerce
- **Support Email**: support@jetprint.com

---

## 🎯 Success Metrics

### Integration Complete When:
- ✅ Jetprint successfully connects to your store
- ✅ All 29 products visible in Jetprint dashboard
- ✅ Test order processed and shipped by Jetprint
- ✅ Webhooks delivering order notifications in real-time
- ✅ Designs correctly applied to products
- ✅ Order statuses syncing between systems

---

## 📝 Notes

### Design System Features
Your store includes advanced features that enhance Jetprint integration:

1. **AI Logo Analysis**: Automatically determines best logo placement
2. **Multiple Mockup Views**: Front, back, and side views for all products
3. **Position Adjustment**: Manual override of logo positions when needed
4. **Regeneration System**: Batch regenerate all product mockups
5. **Performance Tracking**: Monitor which designs perform best

### Future Enhancements
Consider these features for enhanced integration:
- **Automated Design Sync**: Push new designs automatically to Jetprint
- **Inventory Alerts**: Get notified when Jetprint stock is low
- **Custom Product Templates**: Create unique product combinations
- **Team Bulk Orders**: Special pricing for team purchases
- **Multiple Fulfillment Centers**: Route orders to optimal Jetprint facility

---

**Last Updated**: October 28, 2025
**Integration Version**: 1.0
**Store URL**: https://basketballgearstore.abacusai.app
**Status**: Ready for Production

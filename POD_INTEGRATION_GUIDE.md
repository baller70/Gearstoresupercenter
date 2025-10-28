# Print-on-Demand Integration Guide

## Overview
Your basketball e-commerce platform now supports multiple POD (Print-on-Demand) providers through WooCommerce API compatibility.

## Supported POD Providers

### 1. **Jetprint** 
   - **Admin Page**: `/admin/jetprint`
   - **Sync Button Location**: Top-right corner of the page (next to "API Settings" and "Create POD Product")
   - **Color Theme**: Blue
   - **Status**: ✅ Ready to use

### 2. **InterestPrint** (NEW)
   - **Admin Page**: `/admin/interestprint`
   - **Sync Button Location**: Top-right corner of the page (next to "API Settings" and "Create POD Product")
   - **Color Theme**: Purple
   - **Status**: ✅ Ready to use

## How to Access POD Management

### From Admin Dashboard
1. Login with admin credentials (john@doe.com / johndoe123)
2. Navigate to `/admin`
3. You'll see two prominent cards at the top:
   - **Jetprint Products** (Blue card)
   - **InterestPrint Products** (Purple card)
4. Click on either card to manage that POD provider

### Direct URLs
- Jetprint: `https://basketballgearstore.abacusai.app/admin/jetprint`
- InterestPrint: `https://basketballgearstore.abacusai.app/admin/interestprint`

## Using the Sync Button

### What the Sync Button Does
The **"Sync Products"** button on each POD page allows you to:
- Fetch the latest products from your POD provider
- Update product information (prices, availability, etc.)
- Add new products that were created on the POD platform
- Track when the last sync occurred

### How to Sync Products

1. **Navigate to the POD page** (Jetprint or InterestPrint)
2. **Click the "Sync Products" button** in the top-right corner
3. **Wait for sync to complete** - The button will show "Syncing..." with a spinning icon
4. **Review the results** - A success toast notification will appear
5. **Check the timestamp** - A green banner shows when the last sync occurred

### Sync Process
```
┌─────────────────────────┐
│   Click Sync Button     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Fetch from POD API     │
│  (Jetprint/InterestPrint)│
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Compare with Local DB  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Update Products       │
│   - Add new products    │
│   - Update existing     │
│   - Mark unavailable    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Show Success Message   │
│  + Last Sync Timestamp  │
└─────────────────────────┘
```

## Connecting POD Providers to Your Store

### Step 1: Get WooCommerce API Credentials
1. Go to `/admin/woocommerce`
2. Click "Generate Credentials" if you haven't already
3. Copy the following:
   - **Store URL**: Your website address
   - **Consumer Key**: API key
   - **Consumer Secret**: API secret key

### Step 2: Connect Jetprint
1. Go to [Jetprint's integration page](https://www.jetprint.com/)
2. Select "WooCommerce" as your platform
3. Paste your Store URL, Consumer Key, and Consumer Secret
4. Complete the OAuth authorization when prompted
5. Your Jetprint account is now connected!

### Step 3: Connect InterestPrint
1. Go to [InterestPrint's WooCommerce integration](https://www.interestprint.com/woo/index)
2. Select "WooCommerce" as your platform
3. Paste your Store URL, Consumer Key, and Consumer Secret
4. Complete the OAuth authorization when prompted
5. Your InterestPrint account is now connected!

## Managing Products

### POD Products (Print-on-Demand)
Products connected to Jetprint or InterestPrint will:
- Have a **designId** linked to them
- Show up in the POD provider's management page
- Display the associated design (logo/artwork)
- Be automatically fulfilled by the POD provider when ordered

### Regular Products
Products NOT connected to POD providers:
- No designId
- Show up in the "Regular Products" section
- Need manual fulfillment

## Features Available

### On Each POD Page
- **Product Statistics**
  - Total POD products
  - Regular products count
  - Total products
  
- **Last Sync Information**
  - Green banner showing last sync timestamp
  - Easy to see when you last updated from POD provider

- **Product List Table**
  - Product image and name
  - Associated design (with thumbnail)
  - Category
  - Price
  - Stock status
  - Quick actions (View, Edit)

- **Action Buttons**
  - **Sync Products**: Refresh from POD provider
  - **API Settings**: Manage WooCommerce credentials
  - **Create POD Product**: Upload new design

### Design Management Integration
Both POD providers use the same design system:
1. Upload a logo/design at `/admin/designs/new`
2. System automatically generates products for all categories
3. Products are immediately available for POD fulfillment
4. Use sync button to update product information

## API Endpoints

### Jetprint Sync
```
POST /api/admin/jetprint/sync
Authorization: Admin session required
```

### InterestPrint Sync
```
POST /api/admin/interestprint/sync
Authorization: Admin session required
```

## Best Practices

1. **Regular Syncing**
   - Sync products at least once daily
   - Sync after making changes in POD provider dashboard
   - Sync before major sales or promotions

2. **Design Management**
   - Upload high-quality designs (PNG with transparent background)
   - Use the AI positioning system for optimal placement
   - Review mockups before publishing

3. **Order Flow**
   - Orders are automatically sent to POD providers via WooCommerce API
   - No manual intervention needed
   - Track orders in both your admin panel and POD dashboard

4. **Multiple POD Providers**
   - You can use both Jetprint and InterestPrint simultaneously
   - Products from both providers appear in your catalog
   - Customers don't know which provider fulfills their order

## Troubleshooting

### Sync Button Not Working
- Check your internet connection
- Verify admin session is active (re-login if needed)
- Check browser console for errors

### Products Not Appearing
- Wait a few minutes after sync
- Refresh the page
- Check if products have `designId` in database

### OAuth Connection Issues
- Re-generate API credentials at `/admin/woocommerce`
- Make sure to use the latest credentials
- Contact POD provider support if issues persist

## Support

- **WooCommerce API Settings**: `/admin/woocommerce`
- **Jetprint Management**: `/admin/jetprint`
- **InterestPrint Management**: `/admin/interestprint`
- **Design Upload**: `/admin/designs/new`
- **Admin Dashboard**: `/admin`

## Quick Reference

| Task | Location | URL |
|------|----------|-----|
| Sync Jetprint Products | Jetprint Page | `/admin/jetprint` |
| Sync InterestPrint Products | InterestPrint Page | `/admin/interestprint` |
| Get API Credentials | WooCommerce Page | `/admin/woocommerce` |
| Upload New Design | Design Upload | `/admin/designs/new` |
| View All POD Providers | Admin Dashboard | `/admin` |

---

**Your platform is now ready to handle multiple POD providers with seamless synchronization! 🚀**

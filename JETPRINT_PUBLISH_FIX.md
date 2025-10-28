
# Jetprint Product Publishing Fix

## Problem Identified

When attempting to publish products from Jetprint, users encountered a "push failed" error. The root cause was:

**Missing WooCommerce API Endpoints**: Jetprint's "publish" action sends a PUT/PATCH request to update the product status, but our WooCommerce API only supported GET and POST methods for the `/wp-json/wc/v3/products` endpoint.

### Error Symptoms
1. **UI Error**: "push failed" notification in Jetprint dashboard
2. **Console Error**: `Cannot read properties of undefined (reading 'status')`
3. **Network**: HTTP requests reached our server but failed because the endpoint didn't exist

## Solution Implemented

### 1. Created Individual Product Endpoint
**File**: `app/wp-json/wc/v3/products/[id]/route.ts`

Added full CRUD support for individual products:
- **GET** `/wp-json/wc/v3/products/[id]` - Fetch single product
- **PUT** `/wp-json/wc/v3/products/[id]` - Update product
- **PATCH** `/wp-json/wc/v3/products/[id]` - Partial update (same as PUT)
- **DELETE** `/wp-json/wc/v3/products/[id]` - Delete product

### 2. Key Features of Product Update Endpoint

```typescript
// Handles Jetprint "publish" action
if (status !== undefined) {
  updateData.inStock = status === 'publish';
  if (status === 'publish' && existingProduct.stock === 0) {
    updateData.stock = 100; // Auto-set stock for published products
  }
}
```

The update endpoint:
- ✅ Updates product name, description, SKU, prices
- ✅ Handles status changes (draft → publish)
- ✅ Manages images and categories
- ✅ Stores POD metadata
- ✅ Auto-sets stock when publishing

### 3. Added Bulk Update Handlers
**File**: `app/wp-json/wc/v3/products/route.ts`

Added PUT and PATCH methods that return proper error messages directing users to use the individual product endpoint.

## How Jetprint Publishing Works Now

1. **User clicks "Publish" in Jetprint**
2. **Jetprint sends**: `PUT /wp-json/wc/v3/products/{id}` with `{ status: "publish", ... }`
3. **Our API**:
   - Authenticates the request
   - Finds the product by ID
   - Updates the product status
   - Sets stock to 100 if publishing
   - Returns updated product in WooCommerce format
4. **Jetprint receives**: Complete product object and marks it as published

## Testing the Fix

### Test Product Update
```bash
curl -X PUT https://basketballgearstore.abacusai.app/wp-json/wc/v3/products/PRODUCT_ID \
  -H "Authorization: Basic $(echo -n 'KEY:SECRET' | base64)" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "publish",
    "name": "Updated Product Name",
    "regular_price": "39.99"
  }'
```

### Expected Response
```json
{
  "id": "PRODUCT_ID",
  "name": "Updated Product Name",
  "status": "publish",
  "price": "39.99",
  "stock_status": "instock",
  ...
}
```

## Files Modified

1. **`app/wp-json/wc/v3/products/route.ts`**
   - Added PUT and PATCH methods for bulk endpoint

2. **`app/wp-json/wc/v3/products/[id]/route.ts`** (NEW)
   - Created complete individual product endpoint
   - Implements GET, PUT, PATCH, DELETE methods
   - Handles product updates including status changes

## Next Steps for Users

1. ✅ **Try publishing from Jetprint again** - The endpoint now exists
2. ✅ **Products will auto-publish** - Status changes are saved correctly
3. ✅ **Stock is managed** - Products get stock=100 when published
4. ✅ **All metadata preserved** - POD provider info, variants, etc.

## Debugging

If issues persist:
1. Check `/admin/debug` page for request logs
2. Look for PUT requests to `/wp-json/wc/v3/products/[id]`
3. Verify authentication headers are correct
4. Check that product IDs match between Jetprint and our database

---
**Status**: ✅ Fixed - Ready for testing
**Date**: October 28, 2025
**Build**: Successful

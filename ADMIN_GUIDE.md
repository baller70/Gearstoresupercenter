
# Admin Design Management System - User Guide

## 🔐 Admin Login Credentials

To access the admin features, sign in with these credentials:

**Email:** `john@doe.com`  
**Password:** `johndoe123`

## 📋 Overview

The Design Management System allows admins to:
- Upload basketball team logos
- Automatically generate product mockups (T-shirts, Jerseys, Hoodies)
- Generate products in multiple brand colors
- Manage designs and view product performance
- Track revenue and sales for each design

## 🚀 Getting Started

### Step 1: Sign In as Admin

1. Navigate to the website
2. Click **"Sign In"** in the top navigation
3. Enter the admin credentials:
   - Email: `john@doe.com`
   - Password: `johndoe123`
4. Click **"Sign In"**

### Step 2: Access Design Management

Once logged in as admin:
1. Click on your profile icon in the top right
2. Select **"Admin Dashboard"** from the dropdown
3. Look for the **"AI Design System"** section
4. Click **"Manage Designs"** or navigate to `/admin/designs`

### Step 3: Upload a New Design

1. On the Design Management page, click **"Upload New Design"**
2. Fill in the design details:
   - **Design Name**: Enter a descriptive name (e.g., "Rise as One Logo 2024")
   - **Brand**: Select either:
     - Rise as One AAU (Colors: Black, White, Red, Grey)
     - The Basketball Factory Inc (Colors: White, Black, Navy, Gold)
   - **Design File**: Click to upload or drag & drop your logo file
     - Supported formats: PNG, JPG, SVG
     - Transparent PNG recommended for best results

3. Click **"Upload & Generate Products"**

### Step 4: Review Generated Products

After upload, the system will:
- ✅ Store your logo securely in the cloud
- ✅ Generate mockups for 3 garment types (T-shirt, Jersey, Hoodie)
- ✅ Create variants in all brand colors (4 colors × 3 types = 12 products)
- ✅ Automatically add products to the store
- ✅ Save design metadata and position settings

The process typically takes 30-60 seconds depending on the design complexity.

## 📊 Design Management Dashboard

### Viewing All Designs

The main design management page (`/admin/designs`) shows:
- **Design thumbnail** - Preview of the uploaded logo
- **Design name** - The name you provided
- **Upload date** - When the design was created
- **Status badge** - APPROVED, PENDING, or REJECTED
- **Colors** - Visual display of brand colors used
- **Products count** - Number of products generated
- **Revenue metrics** - Total revenue and units sold

### Design Actions

For each design, you can:
- **Edit Position** - Adjust logo placement and size
- **Regenerate Products** - Create new mockups with updated settings
- **Approve/Reject** - Change design status
- **Delete** - Remove design and all associated products

## 🎨 Logo Position Customization

### Adjusting Logo Placement

1. Click on a design card
2. Select **"Adjust Position"**
3. Use the controls to modify:
   - **X Position** (0-100): Horizontal placement (50 = center)
   - **Y Position** (0-100): Vertical placement (35 = chest area)
   - **Scale** (0.5-2.0): Logo size (1.0 = default)

4. Preview changes in real-time
5. Click **"Save & Regenerate"** to update all products

### Best Practices for Logo Placement

- **T-Shirts & Jerseys**: Center chest (X: 50, Y: 30-35)
- **Hoodies**: Higher chest placement (X: 50, Y: 25-30)
- **Scale**: Start with 1.0, adjust based on logo complexity
- **Colors**: Ensure good contrast with background colors

## 🛍️ Product Integration

### Automatic Product Creation

When you upload a design, the system automatically:

1. **Creates Base Products**:
   - Professional T-Shirt ($39.99)
   - Basketball Jersey ($54.99)
   - Premium Hoodie ($64.99)

2. **Generates Color Variants**:
   - Each product is created in all brand colors
   - Images show the actual mockup with your logo

3. **Sets Product Details**:
   - SEO-friendly descriptions
   - Available sizes (XS to XXL)
   - Category placement
   - Featured/not featured status

### Viewing Generated Products

To see products created from a design:
1. Go to **Admin Dashboard** → **Products**
2. Filter by design name
3. Or click the product count badge on the design card

## 🔧 Troubleshooting

### "Unauthorized" Error

**Issue**: Getting "Unauthorized" when trying to upload a design

**Solution**:
1. Make sure you're signed in
2. Verify you're using the admin account (`john@doe.com`)
3. Check that your session hasn't expired
4. Try signing out and signing back in
5. Clear browser cache and cookies if the issue persists

### Upload Fails

**Issue**: Design upload fails or hangs

**Solution**:
1. Check file format (must be PNG, JPG, or SVG)
2. Ensure file size is under 10MB
3. Use transparent PNG for best results
4. Verify internet connection is stable
5. Check browser console for specific error messages

### No Products Generated

**Issue**: Upload succeeds but no products appear

**Solution**:
1. Check the server logs for errors
2. Verify AWS S3 connection is working
3. Ensure database is properly connected
4. Wait 1-2 minutes for processing to complete
5. Refresh the page to see updated products

### Logo Not Visible on Products

**Issue**: Products created but logo doesn't appear

**Solution**:
1. Check if the logo file is valid and not corrupted
2. Try uploading a different format (PNG recommended)
3. Adjust logo position and scale
4. Regenerate products with new settings
5. Verify the logo has proper contrast with background colors

## 📱 Mobile Access

The admin dashboard is fully responsive and works on:
- Desktop computers
- Tablets (iPad, Android tablets)
- Mobile phones (iOS, Android)

For best experience, use a desktop browser with screen width > 1024px.

## 🔒 Security Notes

- **Never share admin credentials** with customers
- Admin access is required for design uploads
- All uploads are authenticated and validated
- Files are securely stored in AWS S3
- Database backups are performed automatically

## 📈 Performance Monitoring

Track design performance through the dashboard:

- **Revenue**: Total sales from all products using this design
- **Units Sold**: Number of items sold
- **Conversion Rate**: View to purchase ratio
- **Popular Colors**: Which color variants sell best

Use this data to:
- Identify successful designs
- Optimize product pricing
- Plan future design uploads
- Make data-driven business decisions

## 🆘 Support

If you encounter issues not covered in this guide:

1. Check the browser console for error messages
2. Review server logs for API errors
3. Verify environment variables are set correctly
4. Ensure database migrations are up to date
5. Contact technical support with error details

## 🔄 System Architecture

The design system consists of:

- **Frontend**: Next.js React components
- **Backend**: API routes with authentication
- **Storage**: AWS S3 for images and designs
- **Database**: PostgreSQL (Prisma ORM)
- **Authentication**: NextAuth with credentials provider
- **Image Processing**: Canvas-based mockup generator

---

**Last Updated**: October 2024  
**Version**: 1.0.0

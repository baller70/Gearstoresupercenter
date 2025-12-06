'use client';

import { ProductColorOverlayProps } from '../types';

/**
 * ProductColorOverlay Component
 * 
 * Renders a product mockup with color tint applied using CSS masking.
 * The mockup image must have a transparent background for proper color application.
 * 
 * Technique:
 * 1. A colored div is masked using the mockup image shape
 * 2. The original mockup is overlaid with multiply blend mode for texture
 * 
 * @example
 * <ProductColorOverlay
 *   mockupUrl="/mockups/basketball_hoodie_mockup.png"
 *   productName="Hoodie"
 *   color="#FF0000"
 * />
 */
export function ProductColorOverlay({
  mockupUrl,
  productName,
  color,
  className = '',
}: ProductColorOverlayProps) {
  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Color tint layer - uses the mockup as a mask */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: color,
          maskImage: `url(${mockupUrl})`,
          WebkitMaskImage: `url(${mockupUrl})`,
          maskSize: 'contain',
          WebkitMaskSize: 'contain',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskPosition: 'center',
        }}
      />
      {/* Product mockup overlay - provides texture and shadows */}
      <img
        src={mockupUrl}
        alt={productName}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        style={{
          mixBlendMode: 'multiply',
          opacity: 0.9,
        }}
      />
    </div>
  );
}

export default ProductColorOverlay;


'use client';

import { ProductColorOverlayProps } from '../types';

/**
 * ProductColorOverlay Component
 * 
 * Renders a product mockup with color tint applied using CSS masking.
 * Works with SVG and PNG mockups that have transparent backgrounds.
 * 
 * Technique:
 * 1. A colored div is masked using the mockup image shape
 * 2. The original mockup is overlaid with multiply blend mode for texture
 * 3. Background remains transparent/white regardless of garment color
 * 
 * @example
 * <ProductColorOverlay
 *   mockupUrl="/mockups/hoodie_mockup_front.svg"
 *   productName="Hoodie"
 *   color="#FF0000"
 * />
 */
export function ProductColorOverlay({
  mockupUrl,
  productName,
  color,
  className = '',
}: ProductColorOverlayProps) {
  return (
    <div className={`relative w-full h-full bg-transparent ${className}`}>
      {/* Color tint layer - uses the mockup as a mask */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: color,
          maskImage: `url(${mockupUrl})`,
          WebkitMaskImage: `url(${mockupUrl})`,
          maskSize: 'contain',
          WebkitMaskSize: 'contain',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskPosition: 'center',
        }}
      />
      {/* Product mockup overlay - provides texture and shadows */}
      <img
        src={mockupUrl}
        alt={productName}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        style={{
          mixBlendMode: 'multiply',
          opacity: 0.85,
        }}
      />
    </div>
  );
}

export default ProductColorOverlay;

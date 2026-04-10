'use client';

import { ProductColorOverlayProps } from '../types';

/**
 * ProductColorOverlay Component
 *
 * Renders a product mockup with color tint applied using CSS masking.
 * Uses a comprehensive mask for complete solid color coverage.
 *
 * Technique:
 * 1. A colored div is masked using a comprehensive SVG mask file
 * 2. The original mockup is overlaid with multiply blend mode for texture
 * 3. Enhanced mask ensures 100% solid coverage with no white gaps
 *
 * @example
 * <ProductColorOverlay
 *   mockupUrl="/mockups/basketball_hoodie_mockup.png"
 *   productName="Hoodie"
 *   color="#FF0000"
 *   maskUrl="/mockups/basketball_hoodie_mask.svg"
 * />
 */
export function ProductColorOverlay({
  mockupUrl,
  productName,
  color,
  className = '',
  maskUrl,
}: ProductColorOverlayProps) {
  // Use dedicated mask file if available, otherwise fall back to mockup itself
  const effectiveMaskUrl = maskUrl || mockupUrl;

  return (
    <div className={`relative w-full h-full bg-transparent ${className}`}>
      {/* Color tint layer - uses enhanced mask for complete coverage */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: color,
          maskImage: `url(${effectiveMaskUrl})`,
          WebkitMaskImage: `url(${effectiveMaskUrl})`,
          maskSize: 'contain',
          WebkitMaskSize: 'contain',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskPosition: 'center',
          maskComposite: 'intersect',
          WebkitMaskComposite: 'source-in',
        }}
      />
      {/* Product mockup overlay - provides texture and shadows */}
      <img
        src={mockupUrl}
        alt={productName}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        style={{
          mixBlendMode: 'multiply',
          opacity: 0.7,
        }}
      />
    </div>
  );
}



export default ProductColorOverlay;

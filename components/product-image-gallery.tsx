
"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ProductImageGalleryProps {
  images: string[]
  productName: string
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0)

  // Use all images if available, otherwise use empty array
  const allImages = images?.length > 0 ? images : []
  
  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % allImages.length)
  }

  const previousImage = () => {
    setSelectedImage((prev) => (prev - 1 + allImages.length) % allImages.length)
  }

  if (allImages.length === 0) {
    return (
      <div className="relative aspect-[4/5] bg-muted">
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No images available
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main Image Display */}
      <div className="relative aspect-[4/5] bg-muted rounded-lg overflow-hidden group">
        <Image
          src={allImages[selectedImage] || allImages[0]}
          alt={`${productName} - Image ${selectedImage + 1}`}
          fill
          className="object-contain"
          priority={selectedImage === 0}
        />
        
        {allImages.length > 1 && (
          <>
            {/* Navigation Arrows */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={previousImage}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={nextImage}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>

            {/* Image Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {allImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    selectedImage === index 
                      ? "bg-primary w-8" 
                      : "bg-white/60 hover:bg-white/80"
                  )}
                  aria-label={`View image ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {allImages.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {allImages.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={cn(
                "relative aspect-square bg-muted rounded-md overflow-hidden border-2 transition-all",
                selectedImage === index
                  ? "border-primary shadow-md"
                  : "border-transparent hover:border-gray-300"
              )}
            >
              <Image
                src={image || allImages[0]}
                alt={`${productName} thumbnail ${index + 1}`}
                fill
                className="object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

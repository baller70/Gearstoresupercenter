
import { prisma } from "@/lib/db"
import { Category } from "@prisma/client"

export async function getAllProducts() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return products ?? []
  } catch (error) {
    console.error('Error fetching all products:', error)
    return []
  }
}

export async function getFeaturedProducts() {
  try {
    const products = await prisma.product.findMany({
      where: { featured: true },
      orderBy: { createdAt: 'desc' },
      take: 6
    })
    return products ?? []
  } catch (error) {
    console.error('Error fetching featured products:', error)
    return []
  }
}

export async function getProductsByCategory(category: Category, limit?: number) {
  try {
    const products = await prisma.product.findMany({
      where: { category },
      orderBy: { createdAt: 'desc' },
      ...(limit && { take: limit })
    })
    return products ?? []
  } catch (error) {
    console.error('Error fetching products by category:', error)
    return []
  }
}

export async function getProductById(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id }
    })
    return product ?? null
  } catch (error) {
    console.error('Error fetching product by ID:', error)
    return null
  }
}

export async function searchProducts(query: string) {
  try {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    })
    return products ?? []
  } catch (error) {
    console.error('Error searching products:', error)
    return []
  }
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(price ?? 0)
}

export function getCategoryDisplayName(category: Category): string {
  const categoryNames = {
    PERFORMANCE_APPAREL: 'Performance Apparel',
    CASUAL_WEAR: 'Casual Wear',
    ACCESSORIES: 'Accessories'
  }
  return categoryNames[category] ?? category
}


import { PrismaClient, Category, FitType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const performanceApparelProducts = [
  {
    name: "Elite Reversible Jersey",
    description: "Premium double-mesh reversible basketball jersey perfect for practices and games. Features moisture-wicking technology, reinforced stitching, and team-ready design. Ideal for youth AAU players.",
    price: 24.99,
    category: "PERFORMANCE_APPAREL",
    imageUrl: "https://cdn.abacus.ai/images/4b92b36c-740e-42d3-b3cb-5be6dbc6bd3b.png",
    sizes: ["YXS", "YS", "YM", "YL", "YXL"],
    colors: ["Royal Blue", "Gold", "Black", "White"],
    featured: true
  },
  {
    name: "AAU Custom Sublimated Jersey",
    description: "High-quality sublimated basketball jersey with custom team designs. Durable, lightweight, and perfect for tournament play. Features anti-microbial treatment and color-secure technology.",
    price: 34.99,
    category: "PERFORMANCE_APPAREL",
    imageUrl: "https://cdn.abacus.ai/images/fa90fc76-74e5-4593-a31a-7e541b8aacdd.png",
    sizes: ["YXS", "YS", "YM", "YL", "YXL"],
    colors: ["Navy", "Red", "Royal Blue", "Black"],
    featured: true
  },
  {
    name: "Pro Mesh Shorts",
    description: "Lightweight mesh basketball shorts with moisture-wicking liner. Features deep pockets, reinforced seams, and comfortable waistband. Perfect for practice and games.",
    price: 18.99,
    category: "PERFORMANCE_APPAREL",
    imageUrl: "https://cdn.abacus.ai/images/9615965f-155d-4063-8eff-e50673330892.png",
    sizes: ["YXS", "YS", "YM", "YL", "YXL"],
    colors: ["Navy", "Royal Blue", "Black", "Red"]
  },
  {
    name: "Step-Back Performance Shorts",
    description: "Premium basketball shorts designed for elite performance. Features 4-way stretch fabric, moisture management, and ergonomic fit for maximum mobility on the court.",
    price: 22.99,
    category: "PERFORMANCE_APPAREL",
    imageUrl: "https://m.media-amazon.com/images/I/71SaYW3CpOL._UY350_.jpg",
    sizes: ["YXS", "YS", "YM", "YL", "YXL"],
    colors: ["Black", "Navy", "Royal Blue", "Red"]
  },
  {
    name: "Reversible Practice Shorts",
    description: "Versatile reversible basketball shorts perfect for scrimmages and practice. Features contrasting colors on each side, elastic waistband, and durable construction.",
    price: 16.99,
    category: "PERFORMANCE_APPAREL",
    imageUrl: "https://cdn.abacus.ai/images/a9ffe5e4-7507-483e-a827-5440023d5d21.png",
    sizes: ["YXS", "YS", "YM", "YL", "YXL"],
    colors: ["Royal Blue/White", "Navy/Gold", "Black/Red"]
  },
  {
    name: "Long Sleeve Performance Shooting Shirt",
    description: "Professional shooting shirt with long sleeves for pre-game warm-up and practice. Features moisture-wicking fabric, compression fit, and team-ready styling.",
    price: 19.99,
    category: "PERFORMANCE_APPAREL",
    imageUrl: "https://cdn.abacus.ai/images/875a1a9e-9575-4ba0-8b8b-72fd8a52d5ad.png",
    sizes: ["YXS", "YS", "YM", "YL", "YXL"],
    colors: ["Black", "Royal Blue", "Navy", "White"]
  },
  {
    name: "4-Way Stretch Shootaround Shirt",
    description: "Premium shooting shirt with 4-way stretch technology for maximum mobility. Features anti-microbial treatment, UV protection, and professional team styling.",
    price: 29.99,
    category: "PERFORMANCE_APPAREL",
    imageUrl: "https://cdn.abacus.ai/images/809c45bd-41a3-447c-a23c-cc3f253cc5bb.png",
    sizes: ["YXS", "YS", "YM", "YL", "YXL"],
    colors: ["Navy", "White", "Black", "Royal Blue"]
  },
  {
    name: "Hooded Competitor Shooting Shirt",
    description: "Stylish hooded shooting shirt perfect for warm-up and casual wear. Features moisture-wicking fabric, adjustable hood, and comfortable athletic fit.",
    price: 24.99,
    category: "PERFORMANCE_APPAREL",
    imageUrl: "https://cdn.abacus.ai/images/b2bd123c-77d4-46ed-8c3e-629a43a8700c.png",
    sizes: ["YXS", "YS", "YM", "YL", "YXL"],
    colors: ["Black", "Gold", "Navy", "Royal Blue"]
  }
]

const casualWearProducts = [
  {
    name: "AAU Team Pullover Hoodie",
    description: "Comfortable pullover hoodie perfect for team events and casual wear. Features soft fleece lining, kangaroo pocket, and embroidered team logos. Great for showing team pride.",
    price: 32.99,
    category: "CASUAL_WEAR",
    imageUrl: "https://cdn.abacus.ai/images/b2931b9b-dc6d-4f09-9b1a-d8e851d4583a.png",
    sizes: ["YXS", "YS", "YM", "YL", "YXL"],
    colors: ["Royal Blue", "Red", "Navy", "Black"],
    featured: true
  },
  {
    name: "Basketball Culture Zip Hoodie",
    description: "Premium zip-up hoodie celebrating basketball culture. Features quality construction, full-zip closure, and modern basketball graphics. Perfect for everyday wear.",
    price: 34.99,
    category: "CASUAL_WEAR",
    imageUrl: "https://cdn.abacus.ai/images/1b01aebc-a9c7-4632-a256-2f7293162a0a.png",
    sizes: ["YXS", "YS", "YM", "YL", "YXL"],
    colors: ["Black", "Navy", "Royal Blue", "Red"]
  },
  {
    name: "Tournament Event Hoodie",
    description: "Commemorative hoodie for basketball tournaments and special events. Features event-specific designs, comfortable fit, and durable construction for lasting memories.",
    price: 29.99,
    category: "CASUAL_WEAR",
    imageUrl: "https://cdn.abacus.ai/images/4dd4e714-e360-4076-8a8d-4da4d2b36a0f.png",
    sizes: ["YXS", "YS", "YM", "YL", "YXL"],
    colors: ["Red", "Gold", "Navy", "Black"]
  },
  {
    name: "Graphic Performance T-Shirt",
    description: "Eye-catching basketball t-shirt with bold graphics and performance features. Made with moisture-wicking fabric for comfort during activities and casual wear.",
    price: 14.99,
    category: "CASUAL_WEAR",
    imageUrl: "https://cdn.abacus.ai/images/597181b2-89d7-4f3a-9fa1-37ff9b42a45a.png",
    sizes: ["YXS", "YS", "YM", "YL", "YXL"],
    colors: ["Royal Blue", "Black", "Red", "White"]
  },
  {
    name: "Custom Team Cotton T-Shirt",
    description: "Classic cotton t-shirt perfect for team customization. Features soft, breathable cotton blend and space for team names, logos, or player names. Great for team unity.",
    price: 9.99,
    category: "CASUAL_WEAR",
    imageUrl: "https://cdn.abacus.ai/images/f1833551-1459-40d2-915f-5078f5a58fc5.png",
    sizes: ["YXS", "YS", "YM", "YL", "YXL"],
    colors: ["Navy", "White", "Black", "Royal Blue"]
  },
  {
    name: "Basketball Camp Arch T-Shirt",
    description: "Classic basketball camp t-shirt with arched text design. Perfect for camps, clinics, and everyday wear. Features comfortable fit and durable screen printing.",
    price: 12.99,
    category: "CASUAL_WEAR",
    imageUrl: "https://cdn.abacus.ai/images/233ecb06-bd82-4bfa-9359-4c56fc799aa8.png",
    sizes: ["YXS", "YS", "YM", "YL", "YXL"],
    colors: ["Black", "Royal Blue", "Navy", "Red"]
  },
  {
    name: "Retro Basketball T-Shirt",
    description: "Vintage-inspired basketball t-shirt with retro graphics and throwback styling. Features classic design elements and comfortable cotton blend fabric.",
    price: 16.99,
    category: "CASUAL_WEAR",
    imageUrl: "https://cdn.abacus.ai/images/bad51334-4640-4e61-a68f-7a2c7b7354ae.png",
    sizes: ["YXS", "YS", "YM", "YL", "YXL"],
    colors: ["Red", "Gold", "Black", "White"]
  },
  {
    name: "Moisture-Wicking Training T-Shirt",
    description: "Performance training t-shirt with advanced moisture-wicking technology. Perfect for workouts, practice, and active lifestyle. Features anti-odor treatment.",
    price: 13.99,
    category: "CASUAL_WEAR",
    imageUrl: "https://cdn.abacus.ai/images/e9f5e894-99d8-4241-9f1e-e3ed45edd9f1.png",
    sizes: ["YXS", "YS", "YM", "YL", "YXL"],
    colors: ["Black", "Navy", "Royal Blue", "Red"]
  }
]

const accessoryProducts = [
  {
    name: "NBA Style Snapback Cap",
    description: "Premium snapback cap with professional NBA-style construction. Features embroidered logos, structured crown, and adjustable snap closure. Perfect for team representation.",
    price: 24.99,
    category: "ACCESSORIES",
    imageUrl: "https://u-mercari-images.mercdn.net/photos/m63677743662_1.jpg",
    sizes: ["One Size"],
    colors: ["Black", "Navy", "Royal Blue", "Red"],
    featured: true
  },
  {
    name: "Tournament Adjustable Cap",
    description: "Comfortable adjustable cap perfect for tournaments and team events. Features moisture-wicking sweatband, breathable construction, and custom embroidery options.",
    price: 21.99,
    category: "ACCESSORIES",
    imageUrl: "https://local-hoops.com/cdn/shop/files/11_300x300.png",
    sizes: ["One Size"],
    colors: ["Navy", "Black", "Royal Blue", "Red"]
  },
  {
    name: "Performance Basketball Backpack",
    description: "Large capacity backpack designed for basketball players. Features separate shoe compartment, water bottle holder, laptop sleeve, and durable construction. Perfect for practice and travel.",
    price: 39.99,
    category: "ACCESSORIES",
    imageUrl: "https://www.nike.sa/dw/image/v2/BDVB_PRD/on/demandware.static/-/Sites-akeneo-master-catalog/default/dw8295ba53/nk/0aa/c/2/4/6/d/0aac246d_3363_4046_9f98_6f0b6440388b.jpg",
    sizes: ["One Size"],
    colors: ["Black", "Navy", "Red", "Royal Blue"]
  },
  {
    name: "Team Custom Duffle Bag",
    description: "Spacious duffle bag perfect for team travel and equipment storage. Features multiple compartments, reinforced handles, shoulder strap, and customizable team logos.",
    price: 44.99,
    category: "ACCESSORIES",
    imageUrl: "https://yeti-webmedia.imgix.net/asset/ae4b650e-d771-46cb-a0ff-82eef8d9ff8f/W/site_studio_Crossroads_Duffel_40L_Red_Bull_3qter_115_B_2400x2400.png",
    sizes: ["One Size"],
    colors: ["Black", "Navy", "Red", "Royal Blue"]
  },
  {
    name: "Basketball Gear Backpack with Ball Net",
    description: "Specialized basketball backpack with external ball net holder. Features multiple pockets, padded straps, and durable construction. Perfect for players who need to carry everything.",
    price: 34.99,
    category: "ACCESSORIES",
    imageUrl: "https://www.bsnsports.com/_next/image/?url=https%3A%2F%2Fassets.bsnsports.com%2Fproducts%2FImages%2Fdm3975-405_x.jpg&w=3840&q=75",
    sizes: ["One Size"],
    colors: ["Black", "Navy", "Royal Blue", "Red"]
  },
  {
    name: "Team Drawstring Bag",
    description: "Lightweight drawstring bag perfect for gym and practice sessions. Features water-resistant material, reinforced corners, and space for team customization. Great for team giveaways.",
    price: 12.99,
    category: "ACCESSORIES",
    imageUrl: "https://www.shutterstock.com/image-photo/classic-blue-drawstring-pack-template-600nw-1579974367.jpg",
    sizes: ["One Size"],
    colors: ["Royal Blue", "Black", "Navy", "Red"]
  },
  {
    name: "Multi-Color Training Wristbands 6-Pack",
    description: "Set of 6 colorful athletic wristbands perfect for team identification and sweat absorption. Features soft, absorbent material and variety of basketball team colors.",
    price: 12.99,
    category: "ACCESSORIES",
    imageUrl: "https://i5.walmartimages.com/seo/Kids-Wristbands-24PCS-Colorful-Sweat-Band-Athletic-Sports-Wrist-Bands-Bands-Absorbing-Basketball-Football-Tennis_c569857c-bdeb-4f67-abe2-ea9b3f0dacea.c62736c1e2bf73568695919d21848679.jpeg",
    sizes: ["One Size"],
    colors: ["Mixed Colors", "Team Colors"]
  },
  {
    name: "Performance Wristband Pair",
    description: "Premium performance wristbands designed for serious athletes. Features advanced moisture absorption, comfortable fit, and professional styling. Sold as a pair.",
    price: 8.99,
    category: "ACCESSORIES",
    imageUrl: "https://m.media-amazon.com/images/I/7154yk3ELIL.jpg",
    sizes: ["One Size"],
    colors: ["Black", "White", "Navy", "Red"]
  }
]

async function main() {
  console.log('🏀 Starting basketball e-commerce database seed...')
  
  // Create default admin user (required for testing)
  const hashedPassword = await bcrypt.hash('johndoe123', 12)
  const adminUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      firstName: 'John',
      lastName: 'Doe',
      password: hashedPassword,
      role: 'ADMIN'
    }
  })
  console.log(`✅ Created admin user: ${adminUser.email}`)

  // Clear existing products first
  await prisma.product.deleteMany({})
  console.log('🗑️ Cleared existing products')

  // Seed Performance Apparel products
  console.log('🏃‍♂️ Seeding Performance Apparel products...')
  for (const product of performanceApparelProducts) {
    await prisma.product.create({
      data: {
        ...product,
        category: Category.PERFORMANCE_APPAREL
      }
    })
  }

  // Seed Casual Wear products  
  console.log('👕 Seeding Casual Wear products...')
  for (const product of casualWearProducts) {
    await prisma.product.create({
      data: {
        ...product,
        category: Category.CASUAL_WEAR
      }
    })
  }

  // Seed Accessories products
  console.log('🎒 Seeding Accessories products...')
  for (const product of accessoryProducts) {
    await prisma.product.create({
      data: {
        ...product,
        category: Category.ACCESSORIES
      }
    })
  }

  // Seed Phase 6: Size Guides
  console.log('📏 Seeding Size Guides...')
  await prisma.sizeGuide.deleteMany({})
  
  const sizeGuides = [
    // Performance Apparel - Regular Fit
    { category: Category.PERFORMANCE_APPAREL, sizeName: 'XS', chest: '32-34"', waist: '26-28"', length: '27"', fitType: FitType.REGULAR },
    { category: Category.PERFORMANCE_APPAREL, sizeName: 'S', chest: '34-36"', waist: '28-30"', length: '28"', fitType: FitType.REGULAR },
    { category: Category.PERFORMANCE_APPAREL, sizeName: 'M', chest: '38-40"', waist: '31-33"', length: '29"', fitType: FitType.REGULAR },
    { category: Category.PERFORMANCE_APPAREL, sizeName: 'L', chest: '42-44"', waist: '34-36"', length: '30"', fitType: FitType.REGULAR },
    { category: Category.PERFORMANCE_APPAREL, sizeName: 'XL', chest: '46-48"', waist: '38-40"', length: '31"', fitType: FitType.REGULAR },
    { category: Category.PERFORMANCE_APPAREL, sizeName: '2XL', chest: '50-52"', waist: '42-44"', length: '32"', fitType: FitType.REGULAR },
    
    // Casual Wear - Regular Fit
    { category: Category.CASUAL_WEAR, sizeName: 'XS', chest: '32-34"', waist: '26-28"', length: '27"', fitType: FitType.REGULAR },
    { category: Category.CASUAL_WEAR, sizeName: 'S', chest: '34-36"', waist: '28-30"', length: '28"', fitType: FitType.REGULAR },
    { category: Category.CASUAL_WEAR, sizeName: 'M', chest: '38-40"', waist: '31-33"', length: '29"', fitType: FitType.REGULAR },
    { category: Category.CASUAL_WEAR, sizeName: 'L', chest: '42-44"', waist: '34-36"', length: '30"', fitType: FitType.REGULAR },
    { category: Category.CASUAL_WEAR, sizeName: 'XL', chest: '46-48"', waist: '38-40"', length: '31"', fitType: FitType.REGULAR },
    { category: Category.CASUAL_WEAR, sizeName: '2XL', chest: '50-52"', waist: '42-44"', length: '32"', fitType: FitType.REGULAR },
  ]

  for (const guide of sizeGuides) {
    await prisma.sizeGuide.create({ data: guide })
  }

  // Seed Shipping Options
  console.log('🚚 Seeding Shipping Options...')
  await prisma.shippingOption.deleteMany({})
  
  const shippingOptions = [
    {
      name: 'Standard Shipping',
      description: 'Economical ground shipping',
      basePrice: 5.99,
      estimatedDays: '5-7 business days',
      active: true,
      priority: 1,
    },
    {
      name: 'Express Shipping',
      description: 'Faster delivery for urgent orders',
      basePrice: 12.99,
      estimatedDays: '2-3 business days',
      active: true,
      priority: 2,
    },
    {
      name: 'Next Day Air',
      description: 'Overnight delivery',
      basePrice: 24.99,
      estimatedDays: '1 business day',
      active: true,
      priority: 3,
    },
  ]

  for (const option of shippingOptions) {
    await prisma.shippingOption.create({ data: option })
  }

  // Seed Tax Rates
  console.log('💰 Seeding Tax Rates...')
  await prisma.taxRate.deleteMany({})
  
  const taxRates = [
    {
      state: 'CA',
      county: null,
      city: null,
      zipCode: null,
      rate: 0.0725,
      type: 'STATE',
      active: true,
      effectiveFrom: new Date('2024-01-01'),
      effectiveTo: null,
    },
    {
      state: 'NY',
      county: null,
      city: null,
      zipCode: null,
      rate: 0.04,
      type: 'STATE',
      active: true,
      effectiveFrom: new Date('2024-01-01'),
      effectiveTo: null,
    },
    {
      state: 'TX',
      county: null,
      city: null,
      zipCode: null,
      rate: 0.0625,
      type: 'STATE',
      active: true,
      effectiveFrom: new Date('2024-01-01'),
      effectiveTo: null,
    },
    {
      state: 'FL',
      county: null,
      city: null,
      zipCode: null,
      rate: 0.06,
      type: 'STATE',
      active: true,
      effectiveFrom: new Date('2024-01-01'),
      effectiveTo: null,
    },
  ]

  for (const rate of taxRates) {
    await prisma.taxRate.create({ data: rate })
  }

  console.log('🎉 Database seeded successfully!')
  console.log(`📊 Total products created: ${performanceApparelProducts.length + casualWearProducts.length + accessoryProducts.length}`)
  console.log(`📏 Size guides: ${sizeGuides.length}`)
  console.log(`🚚 Shipping options: ${shippingOptions.length}`)
  console.log(`💰 Tax rates: ${taxRates.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


import { PrismaClient, Category, FitType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const performanceApparelProducts = [
  {
    name: "Elite Reversible Jersey",
    description: "Premium double-mesh reversible basketball jersey perfect for practices and games. Features moisture-wicking technology, reinforced stitching, and team-ready design. Ideal for youth AAU players.",
    price: 24.99,
    category: "PERFORMANCE_APPAREL",
    imageUrl: "https://cdn.abacus.ai/images/d1107149-cee4-4099-9a5d-4f98e071ea89.png",
    images: [
      "https://cdn.abacus.ai/images/d1107149-cee4-4099-9a5d-4f98e071ea89.png",
      "https://cdn.abacus.ai/images/c27a13ae-efdb-434f-a35c-c67bfb6eb3b8.png",
      "https://cdn.abacus.ai/images/17bd63cf-eb60-4322-b2a4-425d92f52b45.png",
      "https://cdn.abacus.ai/images/b5b3d83f-b12a-4bd6-af0b-d62cc58107ab.png"
    ],
    sizes: ["YXS", "YS", "YM", "YL", "YXL", "S", "M", "L", "XL", "XXL"],
    colors: ["Royal Blue", "Gold", "Black", "White"],
    featured: true
  },
  {
    name: "AAU Custom Sublimated Jersey",
    description: "High-quality sublimated basketball jersey with custom team designs. Durable, lightweight, and perfect for tournament play. Features anti-microbial treatment and color-secure technology.",
    price: 34.99,
    category: "PERFORMANCE_APPAREL",
    imageUrl: "https://cdn.abacus.ai/images/fa90fc76-74e5-4593-a31a-7e541b8aacdd.png",
    sizes: ["YXS", "YS", "YM", "YL", "YXL", "S", "M", "L", "XL", "XXL"],
    colors: ["Navy", "Red", "Royal Blue", "Black"],
    featured: true
  },
  {
    name: "Pro Mesh Shorts",
    description: "Lightweight mesh basketball shorts with moisture-wicking liner. Features deep pockets, reinforced seams, and comfortable waistband. Perfect for practice and games.",
    price: 18.99,
    category: "PERFORMANCE_APPAREL",
    imageUrl: "https://cdn.abacus.ai/images/c379f271-6294-4b02-bb58-1343f9c8ba7a.png",
    images: [
      "https://cdn.abacus.ai/images/c379f271-6294-4b02-bb58-1343f9c8ba7a.png",
      "https://cdn.abacus.ai/images/e44988a5-296a-459b-a83b-117194bfdd6e.png",
      "https://cdn.abacus.ai/images/85767312-1ff7-4843-9ebf-f5cc5a13eac3.png"
    ],
    sizes: ["YXS", "YS", "YM", "YL", "YXL", "S", "M", "L", "XL", "XXL"],
    colors: ["Navy", "Royal Blue", "Black", "Red"]
  },
  {
    name: "Step-Back Performance Shorts",
    description: "Premium basketball shorts designed for elite performance. Features 4-way stretch fabric, moisture management, and ergonomic fit for maximum mobility on the court.",
    price: 22.99,
    category: "PERFORMANCE_APPAREL",
    imageUrl: "https://m.media-amazon.com/images/I/71SaYW3CpOL._UY350_.jpg",
    sizes: ["YXS", "YS", "YM", "YL", "YXL", "S", "M", "L", "XL", "XXL"],
    colors: ["Black", "Navy", "Royal Blue", "Red"]
  },
  {
    name: "Reversible Practice Shorts",
    description: "Versatile reversible basketball shorts perfect for scrimmages and practice. Features contrasting colors on each side, elastic waistband, and durable construction.",
    price: 16.99,
    category: "PERFORMANCE_APPAREL",
    imageUrl: "https://cdn.abacus.ai/images/a9ffe5e4-7507-483e-a827-5440023d5d21.png",
    sizes: ["YXS", "YS", "YM", "YL", "YXL", "S", "M", "L", "XL", "XXL"],
    colors: ["Royal Blue/White", "Navy/Gold", "Black/Red"]
  },
  {
    name: "Long Sleeve Performance Shooting Shirt",
    description: "Professional shooting shirt with long sleeves for pre-game warm-up and practice. Features moisture-wicking fabric, compression fit, and team-ready styling.",
    price: 19.99,
    category: "PERFORMANCE_APPAREL",
    imageUrl: "https://cdn.abacus.ai/images/875a1a9e-9575-4ba0-8b8b-72fd8a52d5ad.png",
    sizes: ["YXS", "YS", "YM", "YL", "YXL", "S", "M", "L", "XL", "XXL"],
    colors: ["Black", "Royal Blue", "Navy", "White"]
  },
  {
    name: "4-Way Stretch Shootaround Shirt",
    description: "Premium shooting shirt with 4-way stretch technology for maximum mobility. Features anti-microbial treatment, UV protection, and professional team styling.",
    price: 29.99,
    category: "PERFORMANCE_APPAREL",
    imageUrl: "https://cdn.abacus.ai/images/809c45bd-41a3-447c-a23c-cc3f253cc5bb.png",
    sizes: ["YXS", "YS", "YM", "YL", "YXL", "S", "M", "L", "XL", "XXL"],
    colors: ["Navy", "White", "Black", "Royal Blue"]
  },
  {
    name: "Hooded Competitor Shooting Shirt",
    description: "Stylish hooded shooting shirt perfect for warm-up and casual wear. Features moisture-wicking fabric, adjustable hood, and comfortable athletic fit.",
    price: 24.99,
    category: "PERFORMANCE_APPAREL",
    imageUrl: "https://cdn.abacus.ai/images/b2bd123c-77d4-46ed-8c3e-629a43a8700c.png",
    sizes: ["YXS", "YS", "YM", "YL", "YXL", "S", "M", "L", "XL", "XXL"],
    colors: ["Black", "Gold", "Navy", "Royal Blue"]
  }
]

const casualWearProducts = [
  {
    name: "AAU Team Pullover Hoodie",
    description: "Comfortable pullover hoodie perfect for team events and casual wear. Features soft fleece lining, kangaroo pocket, and embroidered team logos. Great for showing team pride.",
    price: 32.99,
    category: "CASUAL_WEAR",
    imageUrl: "https://cdn.abacus.ai/images/a844263c-18b2-431a-922c-f88e3994d573.png",
    images: [
      "https://cdn.abacus.ai/images/a844263c-18b2-431a-922c-f88e3994d573.png",
      "https://cdn.abacus.ai/images/279a05c9-3c24-4d39-816a-40afd12b07e5.png",
      "https://cdn.abacus.ai/images/f3973b1c-f702-452d-aab6-75394e4a2500.png",
      "https://cdn.abacus.ai/images/5533e1a6-7cd7-401c-b471-d8a205c5c547.png"
    ],
    sizes: ["YXS", "YS", "YM", "YL", "YXL", "S", "M", "L", "XL", "XXL"],
    colors: ["Royal Blue", "Red", "Navy", "Black"],
    featured: true
  },
  {
    name: "Basketball Culture Zip Hoodie",
    description: "Premium zip-up hoodie celebrating basketball culture. Features quality construction, full-zip closure, and modern basketball graphics. Perfect for everyday wear.",
    price: 34.99,
    category: "CASUAL_WEAR",
    imageUrl: "https://cdn.abacus.ai/images/1b01aebc-a9c7-4632-a256-2f7293162a0a.png",
    sizes: ["YXS", "YS", "YM", "YL", "YXL", "S", "M", "L", "XL", "XXL"],
    colors: ["Black", "Navy", "Royal Blue", "Red"]
  },
  {
    name: "Tournament Event Hoodie",
    description: "Commemorative hoodie for basketball tournaments and special events. Features event-specific designs, comfortable fit, and durable construction for lasting memories.",
    price: 29.99,
    category: "CASUAL_WEAR",
    imageUrl: "https://cdn.abacus.ai/images/4dd4e714-e360-4076-8a8d-4da4d2b36a0f.png",
    sizes: ["YXS", "YS", "YM", "YL", "YXL", "S", "M", "L", "XL", "XXL"],
    colors: ["Red", "Gold", "Navy", "Black"]
  },
  {
    name: "Graphic Performance T-Shirt",
    description: "Eye-catching basketball t-shirt with bold graphics and performance features. Made with moisture-wicking fabric for comfort during activities and casual wear.",
    price: 14.99,
    category: "CASUAL_WEAR",
    imageUrl: "https://cdn.abacus.ai/images/597181b2-89d7-4f3a-9fa1-37ff9b42a45a.png",
    sizes: ["YXS", "YS", "YM", "YL", "YXL", "S", "M", "L", "XL", "XXL"],
    colors: ["Royal Blue", "Black", "Red", "White"]
  },
  {
    name: "Custom Team Cotton T-Shirt",
    description: "Classic cotton t-shirt perfect for team customization. Features soft, breathable cotton blend and space for team names, logos, or player names. Great for team unity.",
    price: 9.99,
    category: "CASUAL_WEAR",
    imageUrl: "https://cdn.abacus.ai/images/f1833551-1459-40d2-915f-5078f5a58fc5.png",
    sizes: ["YXS", "YS", "YM", "YL", "YXL", "S", "M", "L", "XL", "XXL"],
    colors: ["Navy", "White", "Black", "Royal Blue"]
  },
  {
    name: "Basketball Camp Arch T-Shirt",
    description: "Classic basketball camp t-shirt with arched text design. Perfect for camps, clinics, and everyday wear. Features comfortable fit and durable screen printing.",
    price: 12.99,
    category: "CASUAL_WEAR",
    imageUrl: "https://cdn.abacus.ai/images/233ecb06-bd82-4bfa-9359-4c56fc799aa8.png",
    sizes: ["YXS", "YS", "YM", "YL", "YXL", "S", "M", "L", "XL", "XXL"],
    colors: ["Black", "Royal Blue", "Navy", "Red"]
  },
  {
    name: "Retro Basketball T-Shirt",
    description: "Vintage-inspired basketball t-shirt with retro graphics and throwback styling. Features classic design elements and comfortable cotton blend fabric.",
    price: 16.99,
    category: "CASUAL_WEAR",
    imageUrl: "https://cdn.abacus.ai/images/bad51334-4640-4e61-a68f-7a2c7b7354ae.png",
    sizes: ["YXS", "YS", "YM", "YL", "YXL", "S", "M", "L", "XL", "XXL"],
    colors: ["Red", "Gold", "Black", "White"]
  },
  {
    name: "Moisture-Wicking Training T-Shirt",
    description: "Performance training t-shirt with advanced moisture-wicking technology. Perfect for workouts, practice, and active lifestyle. Features anti-odor treatment.",
    price: 13.99,
    category: "CASUAL_WEAR",
    imageUrl: "https://cdn.abacus.ai/images/083f4419-c795-414c-9328-afb6a8f13869.png",
    images: [
      "https://cdn.abacus.ai/images/083f4419-c795-414c-9328-afb6a8f13869.png",
      "https://cdn.abacus.ai/images/93082bab-a194-4c1f-b0f5-2c6203aecdde.png",
      "https://cdn.abacus.ai/images/78e45d45-a097-4133-9124-c3526908519b.png",
      "https://cdn.abacus.ai/images/b7e121c8-4ba3-4cde-939e-2d7a0da60c87.png"
    ],
    sizes: ["YXS", "YS", "YM", "YL", "YXL", "S", "M", "L", "XL", "XXL"],
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
    imageUrl: "https://cdn.abacus.ai/images/fa1a7f96-e44c-4398-8ed4-22ed6c994145.png",
    images: [
      "https://cdn.abacus.ai/images/fa1a7f96-e44c-4398-8ed4-22ed6c994145.png",
      "https://cdn.abacus.ai/images/e7ae13bc-8630-4b9e-a24a-2e3c44442bdf.png",
      "https://cdn.abacus.ai/images/1268e742-496d-414d-9cc3-1ede1e088bcc.png",
      "https://cdn.abacus.ai/images/dd695ae5-67b1-4e22-9324-9d188a074973.png"
    ],
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
  },
  {
    name: "Elite Basketball Crew Socks",
    description: "Performance crew socks designed for basketball players. Features cushioned sole, arch support, moisture-wicking fabric, and reinforced heel and toe. Available in team colors.",
    price: 14.99,
    category: "ACCESSORIES",
    imageUrl: "https://cdn.abacus.ai/images/9aa12fca-cbdd-4063-9675-9ca9289eb969.png",
    images: [
      "https://cdn.abacus.ai/images/9aa12fca-cbdd-4063-9675-9ca9289eb969.png",
      "https://cdn.abacus.ai/images/79144949-6585-4cdf-8b87-9ba6be6a6641.png",
      "https://cdn.abacus.ai/images/f1d2de65-29b8-42ea-94e9-2275b763a7eb.png",
      "https://cdn.abacus.ai/images/870ec10c-f87c-4aac-b3e5-08edd915691f.png"
    ],
    sizes: ["Youth S", "Youth M", "Youth L"],
    colors: ["Black", "White", "Navy", "Red"]
  },
  {
    name: "Basketball Training Sweatpants",
    description: "Comfortable sweatpants perfect for training and warm-ups. Features tapered fit, zippered pockets, elastic cuffs, and moisture-wicking fleece material.",
    price: 34.99,
    category: "CASUAL_WEAR",
    imageUrl: "https://cdn.abacus.ai/images/42cef945-c4d0-4c62-848d-30ceb8520061.png",
    images: [
      "https://cdn.abacus.ai/images/42cef945-c4d0-4c62-848d-30ceb8520061.png",
      "https://cdn.abacus.ai/images/1599afc0-2245-4373-967b-67fd15d9a86f.png",
      "https://cdn.abacus.ai/images/c5b5f75d-6257-40c6-9027-5c0020912eee.png",
      "https://cdn.abacus.ai/images/d2203319-73dc-4201-9f09-48c5ca056d7e.png"
    ],
    sizes: ["YXS", "YS", "YM", "YL", "YXL", "S", "M", "L", "XL", "XXL"],
    colors: ["Black", "Navy", "Royal Blue", "Gray"]
  },
  {
    name: "Compression Shooting Sleeve",
    description: "Premium compression arm sleeve for basketball players. Provides muscle support, improves circulation, and helps prevent injuries. Features UV protection and moisture-wicking fabric.",
    price: 16.99,
    category: "ACCESSORIES",
    imageUrl: "https://cdn.abacus.ai/images/9c8c3fa5-d6b0-403d-bf20-2c90c9b152bc.png",
    images: [
      "https://cdn.abacus.ai/images/9c8c3fa5-d6b0-403d-bf20-2c90c9b152bc.png",
      "https://cdn.abacus.ai/images/6df7f699-fabe-48c2-8b8c-408398469b16.png",
      "https://cdn.abacus.ai/images/4bd96afd-4bdb-48a5-8698-634b5d6dffa9.png",
      "https://cdn.abacus.ai/images/0b67d621-0c3d-45c7-ad5f-0a73cae3ed77.png"
    ],
    sizes: ["Youth", "Adult S/M", "Adult L/XL"],
    colors: ["Black", "White", "Navy", "Red"]
  },
  {
    name: "Moisture-Wicking Basketball Headband",
    description: "Performance headband designed to keep sweat out of your eyes during intense play. Features elastic stretch fit, absorbent material, and team-ready styling.",
    price: 9.99,
    category: "ACCESSORIES",
    imageUrl: "https://cdn.abacus.ai/images/0e881bdd-f76c-4962-a37c-12c49727d042.png",
    images: [
      "https://cdn.abacus.ai/images/0e881bdd-f76c-4962-a37c-12c49727d042.png",
      "https://cdn.abacus.ai/images/0723d0d7-7d64-4d65-a483-6afe3654bc9d.png",
      "https://cdn.abacus.ai/images/04c9cb01-111a-457c-aa0a-a4ebacca6667.png",
      "https://cdn.abacus.ai/images/49aaa857-4dee-4081-b357-87dbd75ba80f.png"
    ],
    sizes: ["One Size"],
    colors: ["Black", "White", "Navy", "Red", "Royal Blue"]
  },
  {
    name: "Pro Basketball High-Top Sneakers",
    description: "High-performance basketball sneakers designed for elite players. Features superior ankle support, responsive cushioning, excellent traction, and durable construction for competitive play.",
    price: 89.99,
    category: "ACCESSORIES",
    imageUrl: "https://cdn.abacus.ai/images/177f6d49-8db3-476e-927d-24aa6b82380a.png",
    images: [
      "https://cdn.abacus.ai/images/177f6d49-8db3-476e-927d-24aa6b82380a.png",
      "https://cdn.abacus.ai/images/c23b01e2-da04-47b4-a5d7-51b44e875572.png",
      "https://cdn.abacus.ai/images/583e9484-e889-4cc0-8fa2-2e70308cdc0f.png",
      "https://cdn.abacus.ai/images/c2ba83e6-d3c7-4c45-bc6a-cb5a2fd3c1e7.png"
    ],
    sizes: ["Youth 3", "Youth 4", "Youth 5", "Youth 6", "Youth 7"],
    colors: ["Black/Red", "White/Black", "Navy/White", "Red/White"],
    featured: true
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

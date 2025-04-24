// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");
  
  try {
    // Create roles first
    console.log("Creating/updating roles...");
    const roles = [
      { id: 1, name: 'User', description: 'Regular user' },
      { id: 3, name: 'Admin', description: 'Administrator' }
    ];

  for (const role of roles) {
    await prisma.role.upsert({
        where: { id: role.id },
        update: {
          name: role.name,
          description: role.description
        },
        create: role,
      });
      console.log(`Upserted role: ${role.name}`);
    }
    
    // Create admin user (only if it doesn't exist)
    console.log("Creating admin user if it doesn't exist...");
    const adminEmail = 'admin@example.com';
    
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      
      await prisma.user.create({
        data: {
          firstName: 'Admin',
          lastName: 'User',
          email: adminEmail,
          password: hashedPassword,
          role: 3, // Admin role
          status: 'active'
        }
      });
      
      console.log('Admin user created');
    } else {
      console.log('Admin user already exists');
    }

    // Seed categories with slug field included
    console.log("Creating/updating product categories...");
    const categories = [
      { name: 'Skincare', description: 'Products for skin health and beauty', slug: 'skincare' },
      { name: 'Makeup', description: 'Cosmetic products for enhancing appearance', slug: 'makeup' },
      { name: 'Hair Care', description: 'Products for hair health and styling', slug: 'hair-care' },
      { name: 'Fragrance', description: 'Fragrances and perfumes', slug: 'fragrance' },
      { name: 'Bath & Body', description: 'Products for bathing and body care', slug: 'bath-body' }
    ];

    // Create/update categories and store them in a map
    const categoryMap = {};
    for (const category of categories) {
      const existingCategory = await prisma.category.upsert({
        where: { slug: category.slug },
        update: {
          name: category.name,
          description: category.description
        },
        create: {
          name: category.name,
          description: category.description,
          slug: category.slug
        }
      });
      categoryMap[category.slug] = existingCategory;
      console.log(`${existingCategory.id ? 'Updated' : 'Created'} category: ${category.name}`);
    }

    // Now create products using the categoryMap
    console.log("Creating/updating products...");
    const products = [
      {
        name: 'Hydrating Face Cream',
        description: 'A rich, moisturizing cream for all skin types',
        price: 24.99,
        stockCount: 50,
        categoryId: categoryMap['skincare'].id,
        brand: 'NaturaSkin',
        images: [
          'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=500',
          'https://images.unsplash.com/photo-1631730958008-3dbb2af5e3c3?q=80&w=500'
        ]
      },
      {
        name: 'Vitamin C Serum',
        description: 'Brightening serum with antioxidant protection',
        price: 29.99,
        stockCount: 40,
        categoryId: categoryMap['skincare'].id,
        brand: 'GlowBoost',
        images: [
          'https://images.unsplash.com/photo-1621844660891-cf53319def22?q=80&w=500',
          'https://images.unsplash.com/photo-1601049541247-adedfd6c0be9?q=80&w=500'
        ]
      },
      {
        name: 'Matte Foundation',
        description: 'Long-lasting foundation with full coverage',
        price: 32.99,
        stockCount: 30,
        categoryId: categoryMap['makeup'].id,
        brand: 'MakeupPro',
        images: [
          'https://images.unsplash.com/photo-1620916297397-a4a5402a3c6c?q=80&w=500',
          'https://images.unsplash.com/photo-1631730958066-b1885aedc218?q=80&w=500'
        ]
      },
      {
        name: 'Volumizing Mascara',
        description: 'Add volume and length to your lashes',
        price: 18.99,
        stockCount: 60,
        categoryId: categoryMap['makeup'].id,
        brand: 'LashLuxe',
        images: [
          'https://images.unsplash.com/photo-1631306807757-d9544c7c49d6?q=80&w=500',
          'https://images.unsplash.com/photo-1643185450385-d93bc4ee312d?q=80&w=500'
        ]
      },
      {
        name: 'Repairing Shampoo',
        description: 'Repairs damaged hair and prevents split ends',
        price: 19.99,
        stockCount: 45,
        categoryId: categoryMap['hair-care'].id,
        brand: 'HairRevive',
        images: [
          'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?q=80&w=500',
          'https://images.unsplash.com/photo-1626121496373-8ddf77925c02?q=80&w=500'
        ]
      },
      {
        name: 'Hair Growth Oil',
        description: 'Stimulates scalp for healthy hair growth',
        price: 34.99,
        stockCount: 25,
        categoryId: categoryMap['hair-care'].id,
        brand: 'GrowthEssence',
        images: [
          'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?q=80&w=500',
          'https://images.unsplash.com/photo-1620916566731-5bee1a2ecff0?q=80&w=500'
        ]
      },
      {
        name: 'Citrus Fresh Perfume',
        description: 'Energizing citrus scent with notes of bergamot',
        price: 59.99,
        stockCount: 20,
        categoryId: categoryMap['fragrance'].id,
        brand: 'CitrusBloom',
        images: [
          'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=500',
          'https://images.unsplash.com/photo-1633249285575-49bd15e5b66a?q=80&w=500'
        ]
      },
      {
        name: 'Rose & Jasmine Body Wash',
        description: 'Luxurious floral body wash with moisturizing ingredients',
        price: 22.99,
        stockCount: 35,
        categoryId: categoryMap['bath-body'].id,
        brand: 'FloralLuxe',
        images: [
          'https://images.unsplash.com/photo-1643185539104-3622eb1f0ff6?q=80&w=500',
          'https://images.unsplash.com/photo-1517999586990-2126f2b0c97d?q=80&w=500'
        ]
      },
      {
        name: 'Exfoliating Body Scrub',
        description: 'Gentle scrub to remove dead skin cells',
        price: 26.99,
        stockCount: 40,
        categoryId: categoryMap['bath-body'].id,
        brand: 'SmoothSkin',
        images: [
          'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=500',
          'https://images.unsplash.com/photo-1611080541599-1e1b6dc0fab5?q=80&w=500'
        ]
      },
      {
        name: 'Anti-Aging Night Serum',
        description: 'Powerful serum that works overnight to reduce fine lines',
        price: 49.99,
        stockCount: 30,
        categoryId: categoryMap['skincare'].id,
        brand: 'AgelessGlow',
        images: [
          'https://images.unsplash.com/photo-1615897232508-49b0d9e39c1a?q=80&w=500',
          'https://images.unsplash.com/photo-1600428863532-acd205e5aa64?q=80&w=500'
        ]
      }
    ];

    for (const product of products) {
      const { images, ...productData } = product;
      
      // First check if product exists
      const existingProduct = await prisma.product.findFirst({
        where: { name: product.name }
      });
      
      let createdProduct;
      
      if (existingProduct) {
        // Update existing product
        createdProduct = await prisma.product.update({
          where: { id: existingProduct.id },
          data: productData
        });
        console.log(`Updated product: ${product.name}`);
      } else {
        // Create new product
        createdProduct = await prisma.product.create({
          data: productData
        });
        console.log(`Created product: ${product.name}`);
      }
      
      // Add product images
      if (images && images.length > 0) {
        // First, delete existing images to prevent duplicates
        await prisma.productImage.deleteMany({
          where: { productId: createdProduct.id }
        });
        
        // Create new image entries
        for (const imageUrl of images) {
          await prisma.productImage.create({
            data: {
              productId: createdProduct.id,
              imageUrl: imageUrl
            }
          });
        }
        console.log(`Added ${images.length} images to product: ${product.name}`);
      }
    }
    
    // Create some sample orders
    const user = await prisma.user.create({
      data: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'hashedpassword', // In production, hash this password
        role: 1
      }
    });

    const address = await prisma.address.create({
      data: {
        street: '123 Main St',
        city: 'Sample City',
        state: 'Sample State',
        country: 'Sample Country',
        zipCode: '12345',
        userId: user.id
      }
    });

    await prisma.order.create({
      data: {
        userId: user.id,
        totalPrice: 99.99,
        status: 'PENDING',
        shippingAddressId: address.id,
        subtotal: 89.99,
        shippingCost: 10.00,
        isPaid: false,
        statusHistory: JSON.stringify(['PENDING']),
        statusDates: JSON.stringify([new Date().toISOString()]),
        items: {
          create: []
        }
      }
    });
    
    console.log('Seed data created/updated successfully');
  } catch (error) {
    console.error("Error during seeding:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

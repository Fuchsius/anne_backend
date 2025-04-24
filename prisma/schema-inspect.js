const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectSchema() {
  try {
    // Try to create a category to see the error
    await prisma.category.create({
      data: {
        name: 'Test Category',
        description: 'This is a test'
      }
    });
    console.log("Category created successfully");
    
    // Show models and their fields
    const dmmf = prisma._baseDmmf;
    console.log("Available models:", dmmf.modelMap.keys());
    
    // Print Category model fields if it exists
    if (dmmf.modelMap.has('Category')) {
      console.log("Category model fields:", 
        dmmf.modelMap.get('Category').fields.map(f => f.name)
      );
    } else {
      console.log("No Category model found");
    }
    
    // List all data models
    console.log("All models:");
    for (const [name, model] of dmmf.modelMap.entries()) {
      console.log(`- ${name} fields:`, model.fields.map(f => f.name));
    }
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

inspectSchema().catch(console.error); 
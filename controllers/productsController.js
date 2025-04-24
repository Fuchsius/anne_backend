const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

const fs = require("fs");
const path = require("path");
const { parseArgs } = require("util");

dotenv.config();
const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "K.3y$3cr3t";

// Product Controller - CRUD Operations ----------------------------------------

// Get all products

const getAllProducts = async (req, res) => {
    try {
        const products = await prisma.product.findMany(
            {
                include: {
                    productImages: true,
                    reviews: true,
                    ProductTags: true,
                    category: true,
                },
            }
        );
        if (!products || products.length === 0) {
            return res.status(404).json({ error: "No products found." });
        }
        
        // Debug: log the first product's images to check URL format
        if (products.length > 0 && products[0].productImages && products[0].productImages.length > 0) {
            console.log('Sample product image URL:', products[0].productImages[0].imageUrl);
        } else {
            console.log('No product images found in the first product');
        }
        
        res.status(200).json(products);
    } catch (error) {
        console.error('Error in getAllProducts:', error);
        res.status(500).json({ error: "Failed to fetch products." });
    }
};

// Get product by ID
const getProductById = async (req, res) => {
    const { id } = req.params;
    
    try {
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({ error: "Invalid product ID" });
        }
        
        console.log("Fetching product with ID:", id);
        
        const product = await prisma.product.findUnique({
            where: { id: Number(id) },
            include: {
                category: true,
                productImages: true,
                reviews: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });
        
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }
        
        // Transform the data to include a name field for backward compatibility
        if (product.reviews && product.reviews.length > 0) {
            product.reviews = product.reviews.map(review => {
                if (review.user) {
                    review.user.name = `${review.user.firstName} ${review.user.lastName}`;
                }
                return review;
            });
        }
        
        // Add an empty productImages array if it doesn't exist
        if (!product.productImages) {
            product.productImages = [];
        }
        
        console.log("Successfully retrieved product:", product.id);
        res.json(product);
    } catch (error) {
        console.error("Error in getProductById:", error);
        res.status(500).json({ error: "Failed to fetch product. " + error.message });
    }
};

// Create a new product
const createProduct = async (req, res) => {
    const { name, description, price, stockCount, sku, categoryId, brand, videoUrl, weight, discount, salePrice } = req.body;

    if (!name || !description || !price || !stockCount || !categoryId) {
        return res.status(400).json({ error: "All fields are required." });
    }
    if (isNaN(price) || isNaN(stockCount) || isNaN(categoryId)) {
        return res.status(400).json({ error: "Price, stock count, and category ID must be numbers." });
    }
    if (weight && isNaN(weight)) {
        return res.status(400).json({ error: "Weight must be a number." });
    }
    if (discount && isNaN(discount)) {
        return res.status(400).json({ error: "Discount must be a number." });
    }
    if (salePrice && isNaN(salePrice)) {
        return res.status(400).json({ error: "Sale price must be a number." });
    }
    if (weight && typeof weight !== "number") {
        return res.status(400).json({ error: "Weight must be a number." });
    }
    if (discount && typeof discount !== "number") {
        return res.status(400).json({ error: "Discount must be a number." });
    }
    if (salePrice && typeof salePrice !== "number") {
        return res.status(400).json({ error: "Sale price must be a number." });
    }
    if (stockCount && typeof stockCount !== "number") {
        return res.status(400).json({ error: "Stock count must be a number." });
    }
    if (categoryId && typeof categoryId !== "number") {
        return res.status(400).json({ error: "Category ID must be a number." });
    }
   
    try {

        // Check if the category exists
        const category = await prisma.category.findUnique({
            where: { 
                id: parseInt(categoryId) 
            },
        });

        if (!category) {
            return res.status(404).json({ error: "Category not found." });
        }
        // Check if the SKU is unique
        if(sku == null || sku == undefined || sku == "") {
            sku = null;
        }

        // Create the product

        const newProduct = await prisma.product.create({
            data: {
                name,
                description,
                price,
                stockCount,
                sku,
                categoryId,
                brand,
                videoUrl,
                weight,
                discount,
                salePrice,
            },
        });
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(500).json({ error: "Failed to create product." });
    }
};

// Update product
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        // Clean the data before sending to Prisma
        const cleanedData = {
            ...data,
            // Convert empty strings to null for numeric fields
            discount: data.discount === '' ? null : parseFloat(data.discount),
            salePrice: data.salePrice === '' ? null : parseFloat(data.salePrice),
            weight: data.weight === '' ? null : parseFloat(data.weight),
            // Ensure numeric fields are properly converted
            price: parseFloat(data.price),
            stockCount: parseInt(data.stockCount),
            categoryId: parseInt(data.categoryId)
        };

        console.log('Cleaned data for Prisma update:', cleanedData);

        const updatedProduct = await prisma.product.update({
            where: { id: parseInt(id) },
            data: cleanedData,
            include: {
                productImages: true,
                category: true
            }
        });

        res.json(updatedProduct);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: `Failed to update product: ${error.message}` });
    }
};

// Delete product
const deleteProduct = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: "Product ID is required." });
    }
    if (isNaN(id)) {
        return res.status(400).json({ error: "Product ID must be a number." });
    }

    try {
        console.log(`Attempting to delete product with ID: ${id}`);
        
        // Check if the product exists
        const product = await prisma.product.findUnique({
            where: { id: parseInt(id) },
            include: {
                productImages: true
            }
        });
        
        if (!product) {
            console.log(`Product with ID ${id} not found`);
            return res.status(404).json({ error: "Product not found." });
        }

        // Delete associated image files first
        if (product.productImages && product.productImages.length > 0) {
            console.log(`Deleting ${product.productImages.length} associated image files`);
            
            for (const image of product.productImages) {
                if (image.imageUrl && fs.existsSync(image.imageUrl)) {
                    try {
                        fs.unlinkSync(image.imageUrl);
                        console.log(`Deleted image file: ${image.imageUrl}`);
                    } catch (fileErr) {
                        console.error(`Failed to delete image file: ${image.imageUrl}`, fileErr);
                        // Continue with deletion even if file removal fails
                    }
                }
            }
        }

        // Now delete the product (Prisma will cascade delete related records)
        await prisma.product.delete({
            where: { 
                id: parseInt(id) 
            }
        });
        
        console.log(`Product ${id} deleted successfully`);
        res.status(200).json({ message: "Product deleted successfully." });
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ error: "Failed to delete product: " + error.message });
    }
}

// search products
const searchProducts = async (req, res) => {
    const rawQuery = req.query.query || '';
    const rawCategory = req.query.category || '';
    const rawMinPrice = req.query.minprice || '';
    const rawMaxPrice = req.query.maxprice || '';
  
    const query = rawQuery.toLowerCase();
    const category = rawCategory.toLowerCase();
    const minPrice = parseFloat(rawMinPrice) || 0;
    const maxPrice = parseFloat(rawMaxPrice) || Infinity;
  
    try {
      // Fetch products with related category and images
      const products = await prisma.product.findMany({
        include: {
          productImages: true,
          category: true,
        },
        where: {
          price: {
            gte: minPrice,
            lte: maxPrice,
          },
        },
      });
  
      // Filter manually for text query and category
      const filtered = products.filter((product) => {
        const matchesText =
          product.name?.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query) ||
          product.brand?.toLowerCase().includes(query);
  
        const matchesCategory =
          category === '' || product.category?.name?.toLowerCase().includes(category);
  
        return matchesText && matchesCategory;
      });
  
      res.status(200).json(filtered);
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'An error occurred while searching for products.' });
    }
  };


//   model ProductImage {
//     id        Int     @id @default(autoincrement())
//     productId Int
//     imageUrl  String
//     product   Product @relation(fields: [productId], references: [id])
//   }


// add product image

const addProductImage = async (req, res) => {

    const productId = req.params.id;
    const imageUrl = req.file.path;


    if (!productId) {
        return res.status(400).json({ error: "Product ID is required." });
    }
    if (isNaN(productId)) {
        return res.status(400).json({ error: "Product ID must be a number." });
    }

    try {
        const productImage = await prisma.productImage.create({
            data: {
                productId: parseInt(productId),
                imageUrl,
            },
        });
        res.status(201).json(productImage);
    } catch (error) {
        res.status(500).json({ error: "Failed to add product image." });
    }
}

// Delete product image
const deleteProductImage = async (req, res) => {
    const { id } = req.params;
    
    try {
        console.log(`Attempting to delete image with ID: ${id}`);
        
        // Validate the image ID
        if (!id || isNaN(parseInt(id))) {
            console.log(`Invalid image ID: ${id}`);
            return res.status(400).json({ error: "Invalid image ID" });
        }
        
        // Check if image exists
        const productImage = await prisma.productImage.findUnique({
            where: { id: parseInt(id) }
        });
        
        if (!productImage) {
            console.log(`Image with ID ${id} not found`);
            return res.status(404).json({ error: "Image not found" });
        }
        
        console.log(`Found image: ${JSON.stringify(productImage)}`);
        
        // Delete the file from the filesystem
        if (productImage.imageUrl && fs.existsSync(productImage.imageUrl)) {
            console.log(`Deleting file from filesystem: ${productImage.imageUrl}`);
            fs.unlinkSync(productImage.imageUrl);
            console.log('File deleted successfully');
        } else {
            console.log(`File not found in filesystem: ${productImage.imageUrl}`);
        }
        
        // Delete the image from the database
        console.log(`Deleting image from database: ${id}`);
        await prisma.productImage.delete({
            where: { id: parseInt(id) }
        });
        console.log('Image record deleted successfully');
        
        res.status(200).json({ message: "Image deleted successfully" });
        
    } catch (error) {
        console.error("Error deleting product image:", error);
        res.status(500).json({ error: "Failed to delete product image: " + error.message });
    }
}


// model Reviews {
//     id        Int      @id @default(autoincrement())
//     productId Int
//     userId    Int
//     rating    Float
//     comment   String?
//     createdAt DateTime @default(now())
//     product   Product  @relation(fields: [productId], references: [id])
//     user      User     @relation(fields: [userId], references: [id])
//   }



// Reviews Controller - CRUD Operations ----------------------------------------

// get review by id


// create review

const createReview = async (req, res) => {
    const { productId, userId, rating, comment } = req.body;

    if (!productId) {
        return res.status(400).json({ error: "Product ID is required." });
    }
    if (isNaN(productId)) {
        return res.status(400).json({ error: "Product ID must be a number." });
    }
    if (!userId) {
        return res.status(400).json({ error: "User ID is required." });
    }
    if (isNaN(userId)) {
        return res.status(400).json({ error: "User ID must be a number." });
    }
    if (isNaN(rating)) {
        return res.status(400).json({ error: "Rating must be a number." });
    }

    try {

        // Check if the product exists
        const product = await prisma.product.findUnique({
            where: { id: parseInt(productId) },
        });
        if (!product) {
            return res.status(404).json({ error: "Product not found." });
        }
        // Check if the user exists
        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
        });
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }
        // Check if the review already exists
        const existingReview = await prisma.reviews.findFirst({
            where: {
                productId: parseInt(productId),
                userId: parseInt(userId),
            },
        });
        if (existingReview) {
            return res.status(400).json({ error: "Review already exists." });
        }

        // Create the review
        const review = await prisma.reviews.create({
            data: {
                productId: parseInt(productId),
                userId: parseInt(userId),
                rating,
                comment,
            },
        });
        res.status(201).json(review);
    } catch (error) {
        res.status(500).json({ error: "Failed to create review." });
    }
}

// update review

const updateReview = async (req, res) => {
    const id = req.params.id;
    const { rating, comment } = req.body;

    if (!id) {
        return res.status(400).json({ error: "Review ID is required." });
    }
    if (isNaN(id)) {
        return res.status(400).json({ error: "Review ID must be a number." });
    }
    if (isNaN(rating)) {
        return res.status(400).json({ error: "Rating must be a number." });
    }

    try {
        const review = await prisma.reviews.update({
            where: { id: parseInt(id) },
            data: {
                rating,
                comment,
            },
        });
        res.status(200).json(review);
    } catch (error) {
        res.status(500).json({ error: "Failed to update review." });
    }
}

// delete review

const deleteReview = async (req, res) => {
    const id = req.params.id;

    if (!id) {
        return res.status(400).json({ error: "Review ID is required." });
    }
    if (isNaN(id)) {
        return res.status(400).json({ error: "Review ID must be a number." });
    }

    try {

        // Check if the review exists
        const review = await prisma.reviews.findUnique({
            where: { id: parseInt(id) },
        });
        if (!review) {
            return res.status(404).json({ error: "Review not found." });
        }

        await prisma.reviews.delete({
            where: { id: parseInt(id) },
        });
        res.status(200).json({ message: "Review deleted successfully." });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete review." });
    }
}

// Add or update this function in your productsController.js

const getProductsByCategory = async (req, res) => {
  const { categoryId } = req.params;
  
  try {
    // Validate that categoryId is a valid number
    const categoryIdNum = parseInt(categoryId);
    if (isNaN(categoryIdNum)) {
      return res.status(400).json({ error: "Invalid category ID format" });
    }
    
    const products = await prisma.product.findMany({
      where: {
        categoryId: categoryIdNum,
        // Remove the isActive filter as it might be filtering out your products
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        productImages: {
          select: {
            id: true,
            imageUrl: true,
            isFeatured: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Add debug logging
    console.log(`Found ${products.length} products for category ${categoryId}`);
    
    // Transform user data if it exists
    const transformedProducts = products.map(product => {
      // Check if user property exists before trying to transform it
      if (product.user) {
        return {
          ...product,
          user: {
            ...product.user,
            name: `${product.user.firstName || ''} ${product.user.lastName || ''}`.trim()
          }
        };
      }
      return product;
    });
    
    res.json(transformedProducts);
  } catch (error) {
    console.error("Error fetching products by category:", error);
    res.status(500).json({ error: "Failed to fetch products by category: " + error.message });
  }
};

// Modify the uploadProductImages function to avoid using the isFeatured field
const uploadProductImages = async (req, res) => {
  const { id } = req.params;
  
  try {
    console.log(`Received image upload request for product ${id}`);
    console.log('Files received:', req.files ? req.files.length : 'none');
    
    // Validate the product ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: "Invalid product ID" });
    }
    
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!product) {
      // Clean up uploaded files if product doesn't exist
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
      return res.status(404).json({ error: "Product not found" });
    }
    
    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No images uploaded" });
    }
    
    // Save image paths to database
    const productImages = [];
    
    for (const file of req.files) {
      console.log('Processing file:', file.originalname);
      console.log('File path:', file.path);
      
      // Standardize the path format for database storage
      const imageUrl = file.path.replace(/\\/g, '/');
      console.log('Normalized path:', imageUrl);
      
      try {
        // Try to create the product image without the isFeatured field
        // Check your Prisma schema first to see if this field exists
        const productImage = await prisma.productImage.create({
          data: {
            productId: parseInt(id),
            imageUrl: imageUrl
          }
        });
        
        productImages.push(productImage);
      } catch (createError) {
        console.error("Failed to create product image:", createError);
        // Continue with the next image
      }
    }
    
    console.log(`Successfully uploaded ${productImages.length} images`);
    res.status(201).json({
      message: `Successfully uploaded ${productImages.length} images`,
      images: productImages
    });
    
  } catch (error) {
    console.error("Error uploading product images:", error);
    res.status(500).json({ error: "Failed to upload product images: " + error.message });
  }
};

// Export all functions
module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts,
    addProductImage,
    deleteProductImage,
    uploadProductImages,
    createReview,
    updateReview,
    deleteReview,
    getProductsByCategory
};

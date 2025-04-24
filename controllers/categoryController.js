const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

const fs = require("fs");
const path = require("path");

dotenv.config();
const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "K.3y$3cr3t";

// Category Controller - CRUD Operations ----------------------------------------

// Get all categories
const getAllCategories = async (req, res) => {
    try {
        const categories = await prisma.category.findMany(
            {
                include: {
                    products: true,
                },
            }
        );
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch categories." });
    }
};

// Get category by ID
const getCategoryById = async (req, res) => {
    const id = req.params.id;

    if (!id) {
        return res.status(400).json({ error: "Category ID is required." });
    }
    if (isNaN(id)) {
        return res.status(400).json({ error: "Category ID must be a number." });
    }

    try {
        const category = await prisma.category.findUnique({
            where: { 
                id: parseInt(id)
             },
            include: {
                products: true,
            },
        });
        if (!category) {
            return res.status(404).json({ error: "Category not found." });
        }
        res.status(200).json(category);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch category." });
    }

};

// Create a new category
const createCategory = async (req, res) => {
    console.log("Create category request received:", req.body);
    console.log("File:", req.file);
    
    const { name, description } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: "Category name is required." });
    }
    
    // Fix the image path to use categories folder instead of products
    const imagePath = req.file ? `uploads/categories/${req.file.filename}` : null;
    
    try {
        // Ensure the categories directory exists
        if (req.file) {
            const categoriesDir = path.join(__dirname, '../uploads/categories');
            if (!fs.existsSync(categoriesDir)) {
                fs.mkdirSync(categoriesDir, { recursive: true });
            }
            
            // Move the file from uploads to uploads/categories
            const oldPath = req.file.path;
            const newPath = path.join(__dirname, '..', imagePath);
            
            // Only move if it's not already in the right place
            if (oldPath !== newPath) {
                // Create a read stream from the old file and pipe it to the new location
                fs.copyFileSync(oldPath, newPath);
                // Delete the old file
                fs.unlinkSync(oldPath);
                console.log(`Moved file from ${oldPath} to ${newPath}`);
            }
        }
        
        const newCategory = await prisma.category.create({
            data: {
                name,
                description: description || null,
                image: imagePath,
                slug: name.toLowerCase().replace(/\s+/g, '-')
            },
        });
        
        console.log("Category created successfully:", newCategory);
        res.status(201).json(newCategory);
    } catch (error) {
        console.error("Error creating category:", error);
        res.status(500).json({ error: "Failed to create category: " + error.message });
    }
};

// Update category
const updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    // Fix this path too
    const imagePath = req.file ? `uploads/categories/${req.file.filename}` : null;

    if (!id) {
        if (imagePath && req.file) {
            fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ error: "Category ID is required." });
    }
    if (isNaN(id)) {
        if (imagePath && req.file) {
            fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({ error: "Category ID must be a number." });
    }

    try {
        const category = await prisma.category.findUnique({
            where: {
                id: parseInt(id)
            },
        });

        if (!category) {
            if (imagePath && req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(404).json({ error: "Category not found." });
        }

        // Move the file from uploads to uploads/categories if needed
        if (req.file) {
            const categoriesDir = path.join(__dirname, '../uploads/categories');
            if (!fs.existsSync(categoriesDir)) {
                fs.mkdirSync(categoriesDir, { recursive: true });
            }
            
            // Move the file
            const oldPath = req.file.path;
            const newPath = path.join(__dirname, '..', imagePath);
            
            // Only move if it's not already in the right place
            if (oldPath !== newPath) {
                // Create a read stream from the old file and pipe it to the new location
                fs.copyFileSync(oldPath, newPath);
                // Delete the old file
                fs.unlinkSync(oldPath);
                console.log(`Moved file from ${oldPath} to ${newPath}`);
            }
            
            // If the image is updated, delete the old image
            if (category.image && fs.existsSync(path.join(__dirname, '..', category.image))) {
                fs.unlinkSync(path.join(__dirname, '..', category.image));
            }
        }

        // Update the category
        // If no new image is provided, keep the old image
        const updatedCategory = await prisma.category.update({
            where: { id: parseInt(id) },
            data: {
                name,
                description,
                image: imagePath || category.image,
            },
        });

        res.status(200).json(updatedCategory);
    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({ error: "Failed to update category: " + error.message });
    }
};

// Delete category
const deleteCategory = async (req, res) => {
    const id = req.params.id;

    if (!id) {
        return res.status(400).json({ error: "Category ID is required." });
    }

    if (isNaN(id)) {
        return res.status(400).json({ error: "Category ID must be a number." });
    }

    try {
        const category = await prisma.category.findUnique({ 
            where: { id: parseInt(id) }
        });

        if (!category) {
            return res.status(404).json({ error: "Category not found." });
        }

        // Delete the category image if it exists
        if (category.image && fs.existsSync(category.image)) {
            fs.unlinkSync(category.image);
        }

        // Delete the category
        await prisma.category.delete({ where: { id: parseInt(id) } });

        res.status(200).json({ message: "Category deleted successfully." });
        
    } catch (error) {
        console.error("Error deleting category:", error);
        return res.status(500).json({ error: "Failed to delete category." });
    }
};

// Delete category image
const deleteCategoryImage = async (req, res) => {
    const id = req.params.id;

    if (!id) {
        return res.status(400).json({ error: "Category ID is required." });
    }
    if (isNaN(id)) {
        return res.status(400).json({ error: "Category ID must be a number." });
    }
    try {
        const category = await prisma.category.findUnique({
            where: { id: parseInt(id) },
        });
        if (!category) {
            return res.status(404).json({ error: "Category not found." });
        }
        
        if(category.image == null){
            return res.status(400).json({ error: "No image to delete." });
        }

        if (category.image && fs.existsSync(category.image)) {
            fs.unlinkSync(category.image);
        }
        const updatedCategory = await prisma.category.update({
            where: { id: parseInt(id) },
            data: { image: null },
        });
    
        res.status(200).json(updatedCategory);
    } catch (error) {
        console.error("Error deleting category image:", error);
        res.status(500).json({ error: "Failed to delete category image." });
    }

};

// Exporting the functions
module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    deleteCategoryImage,
};


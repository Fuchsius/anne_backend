const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();
const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "K.3y$3cr3t";

// Address Controller - CRUD Operations ----------------------------------------

// Get all addresses
const getAllAddresses = async (req, res) => {
    try {
        const addresses = await prisma.address.findMany();
        res.status(200).json(addresses);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch addresses." });
    }
};

// Get address by ID
const getAddressById = async (req, res) => {
    const id = req.params.id;

    if (!id) {
        return res.status(400).json({ error: "Address ID is required." });
    }
    if (isNaN(id)) {
        return res.status(400).json({ error: "Address ID must be a number." });
    }

    try {
        const address = await prisma.address.findUnique({
            where: { id: parseInt(id) },
        });
        if (!address) {
            return res.status(404).json({ error: "Address not found." });
        }
        res.status(200).json(address);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch address." });
    }
};
// Create a new address
const createAddress = async (req, res) => {
    const {userId, country, street, city, state, zipCode } = req.body;

    if (!userId || !street || !city || !state ) {
        return res.status(400).json({ error: "All fields are required." });
    }
    if (isNaN(userId)) {
        return res.status(400).json({ error: "User ID must be a number." });
    }

    try {

        // Check if the user exists
        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
        });
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }
        // Create the address
        const address = await prisma.address.create({
            data: {
                userId: parseInt(userId),
                country,
                street,
                city,
                state,
                zipCode,
            },
        });
        res.status(201).json(address);
    } catch (error) {
        res.status(500).json({ error: "Failed to create address." });
    }
    
};

// Update an existing address
const updateAddress = async (req, res) => {
    const { id } = req.params;
    const {userId, country, street, city, state, zipCode } = req.body;

    if (!id) {
        return res.status(400).json({ error: "Address ID is required." });
    }
    if (isNaN(id)) {
        return res.status(400).json({ error: "Address ID must be a number." });
    }

    console.log(zipCode)

    try {

        // Check if the user exists
        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
        });
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        const address = await prisma.address.update({
            where: { id: parseInt(id) },
            data: {
                userId: parseInt(userId),
                country,
                street,
                city,
                state,
                zipCode,
            },
        });
        res.status(200).json(address);
    } catch (error) {
        res.status(500).json({ error: "Failed to update address." });
    }
}
// Delete an address
const deleteAddress = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: "Address ID is required." });
    }
    if (isNaN(id)) {
        return res.status(400).json({ error: "Address ID must be a number." });
    }

    try {
        await prisma.address.delete({
            where: { id: parseInt(id) },
        });
        res.status(200).json({ message: "Address deleted successfully." });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete address." });
    }
};
// Exporting the address controller functions
module.exports = {
    getAllAddresses,
    getAddressById,
    createAddress,
    updateAddress,
    deleteAddress,
};


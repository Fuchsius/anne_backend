const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

const fs = require("fs");
const path = require("path");

dotenv.config();
const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "K.3y$3cr3t";


// Contact Controller - CRUD Operations ----------------------------------------

// model Contact {
//     id        Int      @id @default(autoincrement())
//     name      String
//     email     String
//     subject   String
//     message   String
//     phone     String
//     createdAt DateTime @default(now())
//   }

// Get all contacts

const getAllContacts = async (req, res) => {
    try {

        // Fetch all contacts from the database

        const contacts = await prisma.contact.findMany();
        if (!contacts || contacts.length === 0) {
            return res.status(404).json({ error: "No contacts found." });
        }
        // Return the contacts in the response
        res.status(200).json(contacts);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch contacts." });
    }
};

// Get contact by ID

const getContactById = async (req, res) => {
    const id = req.params.id;

    if (!id) {
        return res.status(400).json({ error: "Contact ID is required." });
    }
    if (isNaN(id)) {
        return res.status(400).json({ error: "Contact ID must be a number." });
    }

    try {
        const contact = await prisma.contact.findUnique({
            where: { id: parseInt(id) },
        });
        if (!contact) {
            return res.status(404).json({ error: "Contact not found." });
        }
        res.status(200).json(contact);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch contact." });
    }
};

// Create a new contact
const createContact = async (req, res) => {
    const { name, email, subject, message, phone } = req.body;

    if (!name || !email || !subject || !message || !phone) {
        return res.status(400).json({ error: "All fields are required." });
    }

    try {
        const contact = await prisma.contact.create({
            data: {
                name,
                email,
                subject,
                message,
                phone
            },
        });
        res.status(201).json(contact);
    } catch (error) {
        res.status(500).json({ error: "Failed to create contact." });
    }
}
// Update a contact

const updateContact = async (req, res) => {
    const id = req.params.id;
    const { name, email, subject, message, phone } = req.body;
    if (!id) {
        return res.status(400).json({ error: "Contact ID is required." });
    }
    if (isNaN(id)) {
        return res.status(400).json({ error: "Contact ID must be a number." });
    }
    try {
        const contact = await prisma.contact.update({
            where: { id: parseInt(id) },
            data: {
                name,
                email,
                subject,
                message,
                phone
            },
        });
        res.status(200).json(contact);
    } catch (error) {
        res.status(500).json({ error: "Failed to update contact." });
    }
}
// Delete a contact
const deleteContact = async (req, res) => {
    const id = req.params.id;

    if (!id) {
        return res.status(400).json({ error: "Contact ID is required." });
    }
    if (isNaN(id)) {
        return res.status(400).json({ error: "Contact ID must be a number." });
    }

    try {
        const contact = await prisma.contact.delete({
            where: { id: parseInt(id) },
        });
        res.status(200).json(contact);
    } catch (error) {
        res.status(500).json({ error: "Failed to delete contact." });
    }
}
// Export all functions
module.exports = {
    getAllContacts,
    getContactById,
    createContact,
    updateContact,
    deleteContact
};

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const fs = require('node:fs')
const ROLES = require('../constants/roles');

dotenv.config();
const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET || "K.3y$3cr3t";


// Add New User

const addNewUser = async (req, res) => {
    let {
        fullName,
        firstName,
        lastName,
        username,
        phone,
        email,
        dateOfBirth,
        gender,
        role,
        password,
        status
    } = req.body;

    const imagePath = req.file ? `uploads/${req.file.filename}` : null;

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            fs.unlinkSync(imagePath)
            return res.status(400).json({ error: "Email is already in use" });
        }
        // Check if the role exists
        role = parseInt(role);
        const roleExists = await prisma.role.findUnique({
            where: { id: role },
        });
        if (!roleExists) {
            fs.unlinkSync(imagePath)
            return res.status(400).json({ error: "Role does not exist" });
        }
        if (!firstName) {
            fs.unlinkSync(imagePath)
            return res.status(400).json({ error: "First name is required" });
        }
        if (!lastName) {
            fs.unlinkSync(imagePath)
            return res.status(400).json({ error: "Last name is required" });
        }
        if (!email) {
            fs.unlinkSync(imagePath)
            return res.status(400).json({ error: "Email is required" });
        }
        if (!password) {
            fs.unlinkSync(imagePath)
            return res.status(400).json({ error: "Password is required" });
        }

        // Check if the email is valid
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            fs.unlinkSync(imagePath)
            return res.status(400).json({ error: "Invalid email format" });
        }
        // Check if the password is valid
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!]).{8,}$/;
        if (!passwordRegex.test(password)) {
            fs.unlinkSync(imagePath)
            return res.status(400).json({ error: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number" })
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        let [day, month, year] = dateOfBirth.split("/");
        dateOfBirth = new Date(`${year}-${month}-${day}`);

        if (isNaN(dateOfBirth.getTime())) {
            fs.unlinkSync(imagePath)
            return res.status(400).json({ error: "Invalid date of birth" });
        }

        const newUser = await prisma.user.create({
            data: {
                fullName,
                firstName,
                lastName,
                username,
                phone,
                email,
                dateOfBirth,
                gender,
                role,
                password: hashedPassword,
                profilePic: imagePath,
                status,
            },
        });

        res.json(newUser);

    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: "Error creating user" });
    }
};

// get all users
const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                fullName: true,
                firstName: true,
                lastName: true,
                username: true,
                email: true,
                dateOfBirth: true,
                gender: true,
                phone: true,
                profilePic: true,
                role: true,
                password: false,
                registrationDate: true,
                status: true,
            },
        });
        if (!users || users.length == 0) return res.status(404).json({ error: "Users not found" });
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Error fetching users" });
    }
};

// get user by id
const getUserById = async (req, res) => {
    const userId = parseInt(req.params.id);
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                fullName: true,
                firstName: true,
                lastName: true,
                username: true,
                email: true,
                dateOfBirth: true,
                gender: true,
                phone: true,
                profilePic: true,
                role: true,
                password: false,
                registrationDate: true,
                status: true,
            },
        });
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ error: "Error fetching user" });
    }
};

// get user by email
const getUserByEmail = async (req, res) => {
    const email = req.params.email;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }
    try {
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                fullName: true,
                firstName: true,
                lastName: true,
                username: true,
                email: true,
                dateOfBirth: true,
                gender: true,
                phone: true,
                profilePic: true,
                role: true,
                password: false,
                registrationDate: true,
                status: true,
            },
        });
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ error: "Error fetching user" });
    }
};

// update user
const updateUser = async (req, res) => {
    const userId = parseInt(req.params.id);

    // Check if the userId is valid
    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    let {
        fullName,
        firstName,
        lastName,
        username,
        phone,
        email,
        dateOfBirth,
        gender,
    } = req.body;

    console.log(req.body);

    if (!firstName) {
        return res.status(400).json({ error: "First name is required" });
    }
    if (!lastName) {
        return res.status(400).json({ error: "Last name is required" });
    }
    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }

    // Check if the email is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
    }

    if (dateOfBirth) {
        let [day, month, year] = dateOfBirth.split("/");
        dateOfBirth = new Date(`${year}-${month}-${day}`);

        if (isNaN(dateOfBirth.getTime())) {
            return res.status(400).json({ error: "Invalid date of birth" });
        }
    }

    try {
        // First, check if the user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!existingUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Proceed to update if the user exists
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                fullName,
                firstName,
                lastName,
                username,
                phone,
                email,
                dateOfBirth,
                gender,
            },
        });

        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ error: "Error updating user" });
    }
};

// update user status
const updateUserStatus = async (req, res) => {
    const userId = parseInt(req.params.id);
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }
    const { status } = req.body;
    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }
    try {
        const user = await prisma.user.update({
            where: { id: userId },
            data: { status },
        });
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (error) {
        console.error("Error updating user status:", error);
        res.status(500).json({ error: "Error updating user status" });
    }
};

// update user password
const updateUserPassword = async (req, res) => {
    const userId = parseInt(req.params.id);
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }
    const { password } = req.body;
    if (!password) {
        return res.status(400).json({ error: 'Password is required' });
    }
    try {

        // Check if the password is valid
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!]).{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ error: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number" })
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (error) {
        console.error("Error updating user password:", error);
        res.status(500).json({ error: "Error updating user password" });
    }
};

// update profile image 
const updateProfile = async (req, res) => {
    const userId = parseInt(req.params.id);
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }
    const imagePath = req.file ? `uploads/${req.file.filename}` : null;

    if (imagePath) {
        // Delete the old image if it exists
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            fs.unlinkSync(imagePath);
            return res.status(404).json({ error: "User not found" })
        };

        if (user && user.profilePic) {
            const oldImagePath = user.profilePic;
            fs.unlinkSync(oldImagePath);
        }
    }

    if (!imagePath) {
        return res.status(400).json({ error: 'Image is required' });
    }
    try {
        const user = await prisma.user.update({
            where: { id: userId },
            data: { profilePic: imagePath },
        });
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (error) {
        console.error("Error updating profile image:", error);
        res.status(500).json({ error: "Error updating profile image" });
    }

}

// update user role
const updateUserRole = async (req, res) => {
    const userId = parseInt(req.params.id);
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }
    const { role } = req.body;
    if (!role) {
        return res.status(400).json({ error: 'Role is required' });
    }
    
    // Check if role is 1 (User) or 3 (Admin) only
    if (role !== 1 && role !== 3) {
        return res.status(400).json({ error: 'Invalid role. Must be 1 (User) or 3 (Admin)' });
    }
    
    try {
        const user = await prisma.user.update({
            where: { id: userId },
            data: { role },
        });
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (error) {
        console.error("Error updating user role:", error);
        res.status(500).json({ error: "Error updating user role" });
    }
};

// login user
const loginUser = async (req, res) => {
    console.log("Login request received:", req.body);
    const { email, password } = req.body;
    
    if (!email || !password) {
        console.log("Missing email or password");
        return res.status(400).json({ error: 'Email and password are required' });
    }
    
    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            console.log("User not found:", email);
            return res.status(404).json({ error: "User not found" });
        }

        if (user.status === "inactive") {
            console.log("User is inactive:", email);
            return res.status(403).json({ error: "User is not active" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            console.log("Invalid password for user:", email);
            return res.status(401).json({ error: "Invalid password" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            }, 
            process.env.JWT_SECRET || "K.3y$3cr3t", 
            { expiresIn: '7d' }
        );

        console.log("Login successful for user:", email);
        
        // Return user data without password and with token
        const { password: _, ...userWithoutPassword } = user;
        res.json({ 
            ...userWithoutPassword, 
            token 
        });
    } catch (error) {
        console.error("Error logging in user:", error);
        res.status(500).json({ error: "Error logging in user" });
    }
};

// Add verify token endpoint
const verifyToken = async (req, res) => {
    try {
        // At this point, the token has been verified by the middleware
        // and req.user contains the decoded token payload
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                profilePic: true,
                status: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(user);
    } catch (error) {
        console.error("Error verifying token:", error);
        res.status(500).json({ error: "Error verifying token" });
    }
};

// delete user
const deleteUser = async (req, res) => {
    const userId = parseInt(req.params.id);
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {


        const userProfile = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!userProfile) return res.status(404).json({ error: "User not found" });

        if (userProfile && userProfile.profilePic) {
            const oldImagePath = userProfile.profilePic;
            fs.unlinkSync(oldImagePath);
        }

        const user = await prisma.user.delete({
            where: { id: userId },
            include: {
                address: true,
                orders: true,
                cart: true,
                reviews: true,
            },
        });
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: "Error deleting user" });
    }
};

// delete profile image
const deleteProfileImage = async (req, res) => {
    const userId = parseInt(req.params.id);
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) return res.status(404).json({ error: "User not found" });

        if (user.profilePic) {

            console.log(user.profilePic)

            if (user.profilePic == null) {
                return res.status(400).json({ error: "No profile image found" });
            }

            fs.unlinkSync(user.profilePic);

            await prisma.user.update({
                where: { id: userId },
                data: {
                    profilePic: null
                },
            });
            res.json({ message: "Profile image deleted successfully" });
        } else {
            return res.status(400).json({ error: "No profile image found" });
        }
    } catch (error) {
        console.error("Error deleting profile image:", error);
        res.status(500).json({ error: "Error deleting profile image" });
    }
}

// Register user
const registerUser = async (req, res) => {
    console.log("Registration request received:", req.body);
    
    const {
        firstName,
        lastName,
        email,
        password,
    } = req.body;

    try {
        // Validate inputs
        if (!firstName || !lastName || !email || !password) {
            console.log("Missing required fields");
            return res.status(400).json({ error: "All fields are required" });
        }

        // Check for existing user
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        
        if (existingUser) {
            console.log("Email already in use:", email);
            return res.status(400).json({ error: "Email is already in use" });
        }

        // Check email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log("Invalid email format:", email);
            return res.status(400).json({ error: "Invalid email format" });
        }

        // Check if role 1 (regular user) exists
        const roleExists = await prisma.role.findUnique({
            where: { id: 1 },
        });
        
        if (!roleExists) {
            console.log("Default role not found. Creating it...");
            await prisma.role.create({
                data: {
                    id: 1,
                    name: 'User',
                    description: 'Regular user'
                }
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: hashedPassword,
                status: "active", 
                role: ROLES.USER // Use the constant instead of hardcoded 1
            },
            include: {
                roleRelation: true // Include the role relation in the response
            }
        });

        console.log("User registered successfully:", email);

        // Generate token for immediate login
        const token = jwt.sign(
            { 
                id: newUser.id, 
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                role: newUser.role
            }, 
            process.env.JWT_SECRET || "K.3y$3cr3t", 
            { expiresIn: '7d' }
        );

        // Return user without password and with token
        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json({ 
            ...userWithoutPassword, 
            token 
        });

    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ error: "Error registering user" });
    }
};

// Get user addresses
const getUserAddresses = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Find all addresses for this user
        const addresses = await prisma.address.findMany({
            where: { userId: parseInt(userId) },
        });
        
        res.json(addresses);
    } catch (error) {
        console.error('Error fetching addresses:', error);
        res.status(500).json({ error: 'Failed to fetch addresses' });
    }
};

// Create a new address for user
const createUserAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { street, city, state, country, zipCode } = req.body;
        
        // Validation
        if (!street || !city || !state) {
            return res.status(400).json({ error: 'Street, city and state are required' });
        }
        
        // Create the address
        const address = await prisma.address.create({
            data: {
                userId: parseInt(userId),
                street,
                city,
                state,
                country: country || '',
                zipCode: zipCode || '',
            },
        });
        
        res.status(201).json(address);
    } catch (error) {
        console.error('Error creating address:', error);
        res.status(500).json({ error: 'Failed to create address' });
    }
};

module.exports = {
    addNewUser,
    getAllUsers,
    getUserById,
    getUserByEmail,
    updateUser,
    updateUserStatus,
    updateUserPassword,
    updateProfile,
    updateUserRole,
    loginUser,
    registerUser,
    verifyToken,
    deleteUser,
    deleteProfileImage,
    getUserAddresses,
    createUserAddress
};

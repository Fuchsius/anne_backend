const express = require("express");

const {
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
    deleteUser,
    deleteProfileImage,
    registerUser,
    verifyToken
} = require("../controllers/userController");

const { upload, processImage } = require("../middleware/upload");

const router = express.Router();

router.post("/", upload.single('profilePic'), processImage, addNewUser);
router.post("/login", loginUser);
router.post("/register", registerUser);
router.get("/verify-token", verifyToken);

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.get("/email/:email", getUserByEmail);

router.put("/update/:id", updateUser);
router.put("/status/:id", updateUserStatus);
router.put("/password/:id", updateUserPassword);
router.put("/profile/:id", upload.single('profilePic'), processImage, updateProfile);
router.put("/role/:id", updateUserRole);

router.delete("/:id", deleteUser);
router.delete("/profile/:id", deleteProfileImage);

module.exports = router;
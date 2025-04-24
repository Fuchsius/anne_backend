const express = require("express");
const {upload, processImage} = require("../middleware/upload");

const router = express.Router();

const {
    getAllContacts,
    getContactById,
    createContact,
    updateContact,
    deleteContact,
} = require("../controllers/contactController");

// Contact routes
router.get("/", getAllContacts);
router.get("/:id", getContactById);
router.post("/", createContact);
router.put("/update/:id", upload.single("image"), processImage, updateContact);
router.delete("/delete/:id", deleteContact);

module.exports = router;
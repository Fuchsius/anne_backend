const express = require("express");
const {
    getAllAddresses,
    getAddressById,
    createAddress,
    updateAddress,
    deleteAddress,
} = require("../controllers/addressController");

const router = express.Router();

// address routes
router.get("/", getAllAddresses);
router.get("/:id", getAddressById);
router.post("/", createAddress);
router.put("/update/:id", updateAddress);
router.delete("/delete/:id", deleteAddress);

module.exports = router;

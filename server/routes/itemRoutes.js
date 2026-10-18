const express = require("express");
const {
    getItems,
    createItem,
    markRecovered
} = require("../controllers/itemController");
const { protect, optionalAuth } = require("../middleware/authMiddleware");
const { uploadImage } = require("../middleware/upload");

const router = express.Router();

router.get("/", optionalAuth, getItems);
router.post("/", protect, uploadImage, createItem);
router.patch("/:id", protect, markRecovered);

module.exports = router;
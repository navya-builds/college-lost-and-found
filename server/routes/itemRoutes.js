const express = require("express");
const {
    getItems,
    createItem,
    markRecovered
} = require("../controllers/itemController");
const { protect, optionalAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", optionalAuth, getItems);
router.post("/", protect, createItem);
router.patch("/:id", protect, markRecovered);

module.exports = router;
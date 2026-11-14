const express = require("express");
const {
    getItems,
    getItemById,
    createItem,
    markRecovered
} = require("../controllers/itemController");
const {
    createClaim,
    getItemClaims
} = require("../controllers/claimController");
const { protect, optionalAuth } = require("../middleware/authMiddleware");
const { uploadImage } = require("../middleware/upload");

const router = express.Router();

router.get("/", optionalAuth, getItems);
router.get("/:id", optionalAuth, getItemById);
router.post("/", protect, uploadImage, createItem);
router.patch("/:id", protect, markRecovered);

router.get("/:id/claims", protect, getItemClaims);
router.post("/:id/claims", protect, createClaim);

module.exports = router;

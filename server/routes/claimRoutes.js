const express = require("express");
const { updateClaimStatus } = require("../controllers/claimController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.patch("/:id", protect, updateClaimStatus);

module.exports = router;
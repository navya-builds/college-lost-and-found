const express = require("express");
const {
    getMyItems,
    getMyClaims,
    getReceivedClaims
} = require("../controllers/meController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Every route here needs a login
router.use(protect);

router.get("/items", getMyItems);
router.get("/claims", getMyClaims);
router.get("/received-claims", getReceivedClaims);

module.exports = router;
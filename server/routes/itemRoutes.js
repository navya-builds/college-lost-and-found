const express = require("express");
const {
    getItems,
    createItem,
    markRecovered
} = require("../controllers/itemController");

const router = express.Router();

router.get("/", getItems);
router.post("/", createItem);
router.patch("/:id", markRecovered);

module.exports = router;
require("dotenv").config();

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Item = require("./models/Item");

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "client")));

app.get("/api", (req, res) => {
    res.json({
        message: "College Lost & Found backend is running!"
    });
});

// Get all items (newest first)
app.get("/api/items", async (req, res) => {
    try {
        const items = await Item.find().sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        console.error("Error loading items:", error);
        res.status(500).json({ message: "Could not load items." });
    }
});

// Report a new item
app.post("/api/items", async (req, res) => {
    try {
        const { name, status, category, description, location, date, contact } = req.body;

        if (!name || !status || !category || !location || !date || !contact) {
            return res.status(400).json({
                message: "Please provide all required item details."
            });
        }

        if (!["lost", "found"].includes(status)) {
            return res.status(400).json({
                message: "Status must be lost or found."
            });
        }

        const item = await Item.create({
            name,
            status,
            category,
            description: description || "",
            location,
            date,
            contact
        });

        res.status(201).json({
            message: "Item reported successfully!",
            item
        });
    } catch (error) {
        console.error("Error creating item:", error);

        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: "Please provide valid item details."
            });
        }

        res.status(500).json({ message: "Could not report item." });
    }
});

// Mark an item as recovered
app.patch("/api/items/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid item id." });
        }

        if (req.body.status !== "recovered") {
            return res.status(400).json({ message: "Invalid status." });
        }

        const item = await Item.findByIdAndUpdate(
            id,
            { status: "recovered" },
            { new: true }
        );

        if (!item) {
            return res.status(404).json({ message: "Item not found." });
        }

        res.json({
            message: "Item marked as recovered!",
            item
        });
    } catch (error) {
        console.error("Error updating item:", error);
        res.status(500).json({ message: "Could not update item." });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
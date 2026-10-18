const mongoose = require("mongoose");
const Item = require("../models/Item");
const { uploadImageBuffer } = require("../config/cloudinary");

// Item ko frontend ke liye taiyar karo (privacy aur permissions ke saath)
function formatItem(item, user) {
    const data = item.toJSON();

    const isOwner = Boolean(
        user &&
        item.reportedBy &&
        item.reportedBy.toString() === user._id.toString()
    );

    const isAdmin = Boolean(user && user.role === "admin");

    // Andar ki cheezein bahar nahi bhejte
    delete data.reportedBy;
    delete data.imagePublicId;

    // Logged-out visitors ko contact info nahi dikhegi
    if (!user) {
        delete data.contact;
        data.contactHidden = true;
    }

    data.canManage = isOwner || isAdmin;

    return data;
}

// Get all items (newest first)
async function getItems(req, res) {
    try {
        const items = await Item.find().sort({ createdAt: -1 });
        res.json(items.map(item => formatItem(item, req.user)));
    } catch (error) {
        console.error("Error loading items:", error);
        res.status(500).json({ message: "Could not load items." });
    }
}

// Report a new item (login zaroori, photo optional)
async function createItem(req, res) {
    try {
        const { name, status, category, description, location, date, contact } =
            req.body || {};

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

        // NAYA: agar photo aayi hai to Cloudinary pe upload karo
        let imageUrl = "";
        let imagePublicId = "";

        if (req.file) {
            try {
                const result = await uploadImageBuffer(req.file.buffer);
                imageUrl = result.secure_url;
                imagePublicId = result.public_id;
            } catch (uploadError) {
                console.error("Image upload failed:", uploadError);
                return res.status(500).json({
                    message: "Could not upload the image. Please try again."
                });
            }
        }

        const item = await Item.create({
            name,
            status,
            category,
            description: description || "",
            location,
            date,
            contact,
            imageUrl,
            imagePublicId,
            reportedBy: req.user._id
        });

        res.status(201).json({
            message: "Item reported successfully!",
            item: formatItem(item, req.user)
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
}

// Mark an item as recovered (sirf owner ya admin)
async function markRecovered(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid item id." });
        }

        if (req.body.status !== "recovered") {
            return res.status(400).json({ message: "Invalid status." });
        }

        const item = await Item.findById(id);

        if (!item) {
            return res.status(404).json({ message: "Item not found." });
        }

        const isOwner =
            item.reportedBy &&
            item.reportedBy.toString() === req.user._id.toString();

        const isAdmin = req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                message: "You can only update items that you reported."
            });
        }

        item.status = "recovered";
        await item.save();

        res.json({
            message: "Item marked as recovered!",
            item: formatItem(item, req.user)
        });
    } catch (error) {
        console.error("Error updating item:", error);
        res.status(500).json({ message: "Could not update item." });
    }
}

module.exports = { getItems, createItem, markRecovered };
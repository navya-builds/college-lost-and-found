const mongoose = require("mongoose");
const Item = require("../models/Item");
const Claim = require("../models/Claim");
const { uploadImageBuffer } = require("../config/cloudinary");

// Un items ki ids jinpe is user ka claim approve ho chuka hai
async function getApprovedItemIds(user) {
    if (!user) return new Set();

    const claims = await Claim.find({
        claimant: user._id,
        status: "approved"
    }).select("item");

    return new Set(claims.map(claim => claim.item.toString()));
}

// Item ko frontend ke liye taiyar karo (privacy aur permissions ke saath)
function formatItem(item, user, approvedItemIds = new Set()) {
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

    // Contact sirf owner, admin ya approved claimant ko
    const canSeeContact =
        isOwner || isAdmin || approvedItemIds.has(item._id.toString());

    if (!canSeeContact) {
        delete data.contact;
        data.contactHidden = true;
        data.contactReason = user ? "claim" : "login";
    }

    data.canManage = isOwner || isAdmin;

    return data;
}

// Get all items (newest first)
async function getItems(req, res) {
    try {
        const items = await Item.find().sort({ createdAt: -1 });
        const approvedIds = await getApprovedItemIds(req.user);

        res.json(items.map(item => formatItem(item, req.user, approvedIds)));
    } catch (error) {
        console.error("Error loading items:", error);
        res.status(500).json({ message: "Could not load items." });
    }
}

// Get one item by id
async function getItemById(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid item id." });
        }

        const item = await Item.findById(id);

        if (!item) {
            return res.status(404).json({ message: "Item not found." });
        }

        const approvedIds = await getApprovedItemIds(req.user);

        res.json(formatItem(item, req.user, approvedIds));
    } catch (error) {
        console.error("Error loading item:", error);
        res.status(500).json({ message: "Could not load item." });
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

module.exports = { getItems, getItemById, createItem, markRecovered };
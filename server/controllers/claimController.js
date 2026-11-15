const mongoose = require("mongoose");
const Claim = require("../models/Claim");
const Item = require("../models/Item");

// Claim ko frontend ke liye taiyar karo
function formatClaim(claim, showClaimant) {
    const data = {
        id: claim._id.toString(),
        status: claim.status,
        message: claim.message,
        createdAt: claim.createdAt
    };

    if (showClaimant && claim.claimant && claim.claimant.name) {
        data.claimant = {
            name: claim.claimant.name,
            email: claim.claimant.email
        };
    }

    return data;
}

// Kya ye user item ka owner ya admin hai?
function canManageItem(item, user) {
    const isOwner = Boolean(
        item.reportedBy &&
        item.reportedBy.toString() === user._id.toString()
    );

    return isOwner || user.role === "admin";
}

// Send a claim on an item
async function createClaim(req, res) {
    try {
        const { id } = req.params;
        const message =
            typeof req.body?.message === "string" ? req.body.message.trim() : "";

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid item id." });
        }

        if (message.length < 10 || message.length > 500) {
            return res.status(400).json({
                message: "Please write between 10 and 500 characters."
            });
        }

        const item = await Item.findById(id);

        if (!item) {
            return res.status(404).json({ message: "Item not found." });
        }

        if (item.status === "recovered") {
            return res.status(400).json({
                message: "This item has already been recovered."
            });
        }

        if (
            item.reportedBy &&
            item.reportedBy.toString() === req.user._id.toString()
        ) {
            return res.status(400).json({
                message: "You cannot claim your own item."
            });
        }

        const claim = await Claim.create({
            item: item._id,
            claimant: req.user._id,
            message
        });

        res.status(201).json({
            message: "Claim sent! The reporter will review it.",
            claim: formatClaim(claim, false)
        });
    } catch (error) {
        console.error("Error creating claim:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "You have already sent a claim for this item."
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: "Please provide a valid message."
            });
        }

        res.status(500).json({ message: "Could not send claim." });
    }
}

// Owner/admin ko saare claims, baaki sabko sirf apna claim
async function getItemClaims(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid item id." });
        }

        const item = await Item.findById(id);

        if (!item) {
            return res.status(404).json({ message: "Item not found." });
        }

        const isManager = canManageItem(item, req.user);

        const filter = isManager
            ? { item: item._id }
            : { item: item._id, claimant: req.user._id };

        const claims = await Claim.find(filter)
            .populate("claimant", "name email")
            .sort({ createdAt: -1 });

        res.json({
            canManage: isManager,
            claims: claims.map(claim => formatClaim(claim, isManager))
        });
    } catch (error) {
        console.error("Error loading claims:", error);
        res.status(500).json({ message: "Could not load claims." });
    }
}

// Approve or reject a claim (sirf item owner ya admin)
async function updateClaimStatus(req, res) {
    try {
        const { id } = req.params;
        const status = req.body?.status;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid claim id." });
        }

        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({ message: "Invalid status." });
        }

        const claim = await Claim.findById(id);

        if (!claim) {
            return res.status(404).json({ message: "Claim not found." });
        }

        const item = await Item.findById(claim.item);

        if (!item) {
            return res.status(404).json({ message: "Item not found." });
        }

        if (!canManageItem(item, req.user)) {
            return res.status(403).json({
                message: "Only the person who reported this item can review claims."
            });
        }

        if (claim.status !== "pending") {
            return res.status(400).json({
                message: "This claim has already been reviewed."
            });
        }

        claim.status = status;
        await claim.save();

        // Ek claim approve hone par baaki pending claims reject ho jaate hain
        if (status === "approved") {
            await Claim.updateMany(
                { item: item._id, _id: { $ne: claim._id }, status: "pending" },
                { status: "rejected" }
            );
        }

        res.json({
            message:
                status === "approved"
                    ? "Claim approved. Your contact details are now shared with the claimant."
                    : "Claim rejected.",
            claim: formatClaim(claim, false)
        });
    } catch (error) {
        console.error("Error updating claim:", error);
        res.status(500).json({ message: "Could not update claim." });
    }
}

module.exports = { createClaim, getItemClaims, updateClaimStatus };
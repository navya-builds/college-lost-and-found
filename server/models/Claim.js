const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema(
    {
        item: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Item",
            required: true
        },
        claimant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        message: {
            type: String,
            required: true,
            trim: true,
            minlength: 10,
            maxlength: 500
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending"
        }
    },
    { timestamps: true }
);

// Ek user ek item pe sirf ek claim kar sakta hai
claimSchema.index({ item: 1, claimant: 1 }, { unique: true });

module.exports = mongoose.model("Claim", claimSchema);
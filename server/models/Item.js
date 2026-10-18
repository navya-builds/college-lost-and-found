const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        status: {
            type: String,
            enum: ["lost", "found", "recovered"],
            required: true
        },
        category: { type: String, required: true, trim: true },
        description: { type: String, default: "", trim: true },
        location: { type: String, required: true, trim: true },
        date: { type: String, required: true },
        contact: { type: String, required: true, trim: true },
        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    { timestamps: true }
);

// Frontend ko "id" chahiye, MongoDB "_id" deta hai, isliye convert karte hain
itemSchema.set("toJSON", {
    versionKey: false,
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
    }
});

module.exports = mongoose.model("Item", itemSchema);
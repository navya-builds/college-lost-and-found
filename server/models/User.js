const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: { type: String, required: true, select: false },
        role: {
            type: String,
            enum: ["student", "admin"],
            default: "student"
        }
    },
    { timestamps: true }
);

// Never send the password back to the frontend
userSchema.set("toJSON", {
    versionKey: false,
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.password;
        return ret;
    }
});

module.exports = mongoose.model("User", userSchema);

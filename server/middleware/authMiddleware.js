const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Strict guard: login zaroori hai
async function protect(req, res, next) {
    try {
        const header = req.headers.authorization || "";

        if (!header.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Please log in to continue."
            });
        }

        const token = header.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                message: "User no longer exists. Please log in again."
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token. Please log in again."
        });
    }
}

// Soft guard: login ho to user pehchano, na ho to bhi aage jaane do
async function optionalAuth(req, res, next) {
    try {
        const header = req.headers.authorization || "";

        if (header.startsWith("Bearer ")) {
            const token = header.split(" ")[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);

            if (user) {
                req.user = user;
            }
        }
    } catch (error) {
        // Galat ya expire token: user ko logged-out maan lo
    }

    next();
}

module.exports = { protect, optionalAuth };
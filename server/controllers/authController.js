const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function createToken(user) {
    return jwt.sign(
        { id: user._id.toString(), role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
}

// Sign up a new user
async function register(req, res) {
    try {
        const { name, email, password } = req.body;

        if (
            !name ||
            !email ||
            !password ||
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                message: "Name, email and password are required."
            });
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            return res.status(400).json({
                message: "Please enter a valid email address."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long."
            });
        }

        const existingUser = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (existingUser) {
            return res.status(409).json({
                message: "An account with this email already exists."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        res.status(201).json({
            message: "Account created successfully!",
            token: createToken(user),
            user
        });
    } catch (error) {
        console.error("Error registering user:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                message: "An account with this email already exists."
            });
        }

        res.status(500).json({ message: "Could not create account." });
    }
}

// Log in an existing user
async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (
            !email ||
            !password ||
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim()
        }).select("+password");

        const passwordMatches =
            user && (await bcrypt.compare(password, user.password));

        // Same message for both cases, so attackers can't guess which emails exist
        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        res.json({
            message: "Logged in successfully!",
            token: createToken(user),
            user
        });
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({ message: "Could not log in." });
    }
}

// Get the currently logged-in user
function getMe(req, res) {
    res.json({ user: req.user });
}

module.exports = { register, login, getMe };
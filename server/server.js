require("dotenv").config();

const express = require("express");
const path = require("path");
const connectDB = require("./config/db");
const itemRoutes = require("./routes/itemRoutes");

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

app.use("/api/items", itemRoutes);

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
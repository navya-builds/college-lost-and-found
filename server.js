
const express = require("express");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

let items = [
    {
        id: 1,
        name: "Casio Calculator",
        status: "lost",
        category: "electronics",
        description: "Black Casio scientific calculator.",
        location: "CSE Block",
        date: "2026-09-18",
        contact: "student@example.com"
    },
    {
        id: 2,
        name: "Black Backpack",
        status: "found",
        category: "bags",
        description: "Black backpack found near the college library.",
        location: "College Library",
        date: "2026-09-19",
        contact: "student@example.com"
    }
];

app.get("/api", (req, res) => {
    res.json({
        message: "College Lost & Found backend is running!"
    });
});

// Get all items
app.get("/api/items", (req, res) => {
    res.json(items);
});

// Report a new item
app.post("/api/items", (req, res) => {
    const { name, status, category, description, location, date, contact } = req.body;

    if (!name || !status || !category || !location || !date || !contact) {
        return res.status(400).json({
            message: "Please provide all required item details."
        });
    }

    const newItem = {
        id: items.length > 0
            ? Math.max(...items.map(item => item.id)) + 1
            : 1,
        name,
        status,
        category,
        description: description || "",
        location,
        date,
        contact
    };

    items.push(newItem);

    res.status(201).json({
        message: "Item reported successfully!",
        item: newItem
    });
});

// Mark an item as recovered
app.patch("/api/items/:id", (req, res) => {
    const id = Number(req.params.id);
    const item = items.find(item => item.id === id);

    if (!item) {
        return res.status(404).json({
            message: "Item not found."
        });
    }

    const { status } = req.body;

    if (status !== "recovered") {
        return res.status(400).json({
            message: "Invalid status."
        });
    }

    item.status = "recovered";

    res.json({
        message: "Item marked as recovered!",
        item
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});


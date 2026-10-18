
let items = [];
let selectedStatus = "all";

// Load items from the backend
async function loadItems() {
    try {
        const response = await fetch("/api/items");

        if (!response.ok) {
            throw new Error("Could not load items.");
        }

        items = await response.json();
        filterItems();
    } catch (error) {
        console.error("Error loading items:", error);

        const container = document.querySelector("#items-container");

        if (container) {
            container.innerHTML =
                "<p>Unable to load items. Please check that the server is running.</p>";
        }
    }
}

// Safely display user-provided text in HTML
function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

// Display items as cards
function displayItems(itemsToDisplay) {
    const container = document.querySelector("#items-container");

    if (!container) return;

    if (itemsToDisplay.length === 0) {
        container.innerHTML = "<p>No items found.</p>";
        return;
    }

    container.innerHTML = itemsToDisplay.map(item => `
        <div class="item-card">
            <h3>${escapeHtml(item.name)}</h3>

            <p>
                <strong>Status:</strong>
                <span class="item-status">
                    ${escapeHtml(item.status)}
                </span>
            </p>

            <p><strong>Category:</strong> ${escapeHtml(item.category)}</p>

            <p><strong>Description:</strong> ${escapeHtml(item.description || "No description")}</p>

            <p><strong>Location:</strong> ${escapeHtml(item.location)}</p>

            <p><strong>Date:</strong> ${escapeHtml(item.date)}</p>

            <p><strong>Contact:</strong> ${escapeHtml(item.contact)}</p>

            ${
                item.status !== "recovered"
                    ? `<button class="recover-button" data-id="${escapeHtml(item.id)}">
                        Mark as Recovered
                       </button>`
                    : "<p><strong>Item Recovered</strong></p>"
            }
        </div>
    `).join("");
}

// Search and filter items
function filterItems() {
    const searchInput = document.querySelector("#search-input");
    const searchTerm = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    const filteredItems = items.filter(item => {
        const matchesSearch =
            String(item.name || "").toLowerCase().includes(searchTerm) ||
            String(item.category || "").toLowerCase().includes(searchTerm) ||
            String(item.location || "").toLowerCase().includes(searchTerm);

        const matchesStatus =
            selectedStatus === "all" ||
            item.status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    displayItems(filteredItems);
}

// Search form
const searchForm = document.querySelector("#search-form");

if (searchForm) {
    searchForm.addEventListener("submit", event => {
        event.preventDefault();
        filterItems();
    });
}

// Update results while typing
const searchInput = document.querySelector("#search-input");

if (searchInput) {
    searchInput.addEventListener("input", filterItems);
}

// Status filter buttons
function setupFilterButton(buttonId, status) {
    const button = document.querySelector(buttonId);

    if (button) {
        button.addEventListener("click", () => {
            selectedStatus = status;
            filterItems();
        });
    }
}

setupFilterButton("#all-button", "all");
setupFilterButton("#lost-button", "lost");
setupFilterButton("#found-button", "found");
setupFilterButton("#recovered-button", "recovered");

// Mark an item as recovered using the backend
const itemsContainer = document.querySelector("#items-container");

if (itemsContainer) {
    itemsContainer.addEventListener("click", async event => {
        const button = event.target.closest(".recover-button");

        if (!button) return;

        const itemId = button.dataset.id;

        if (!itemId) return;

        const confirmed = confirm(
            "Are you sure you want to mark this item as recovered?"
        );

        if (!confirmed) return;

        button.disabled = true;

        try {
            const response = await fetch(`/api/items/${itemId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status: "recovered"
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Could not update item.");
            }

            alert("Item marked as recovered successfully!");

            await loadItems();
        } catch (error) {
            console.error("Error updating item:", error);
            alert(error.message || "Something went wrong.");

            button.disabled = false;
        }
    });
}

// Report a new item using the backend
const reportForm = document.querySelector("#report-form");

if (reportForm) {
    reportForm.addEventListener("submit", async event => {
        event.preventDefault();

        const name = document.querySelector("#item-name").value.trim();
        const status = document.querySelector("#item-type").value;
        const category = document.querySelector("#category").value;
        const description = document.querySelector("#description").value.trim();
        const location = document.querySelector("#location").value.trim();
        const date = document.querySelector("#date").value;
        const contact = document.querySelector("#contact").value.trim();

        if (!name || !status || !category || !location || !date || !contact) {
            alert("Please fill in all required fields.");
            return;
        }

        const validContact =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) ||
            /^\+?[0-9\s()-]{10,15}$/.test(contact);

        if (!validContact) {
            alert("Please enter a valid email address or phone number.");
            return;
        }

        const submitButton = reportForm.querySelector(
            'button[type="submit"], input[type="submit"]'
        );

        if (submitButton) submitButton.disabled = true;

        try {
            const response = await fetch("/api/items", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    status,
                    category,
                    description,
                    location,
                    date,
                    contact
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Could not report item.");
            }

            alert("Item reported successfully!");

            window.location.href = "index.html";
        } catch (error) {
            console.error("Error reporting item:", error);
            alert(error.message || "Unable to report item. Please try again.");

            if (submitButton) submitButton.disabled = false;
        }
    });
}

// Fetch items only on the homepage
if (document.querySelector("#items-container")) {
    loadItems();
}

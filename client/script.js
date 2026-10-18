let items = [];
let selectedStatus = "all";

// Load items from the backend
async function loadItems() {
    try {
        const response = await authFetch("/api/items");

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

    container.innerHTML = itemsToDisplay.map(item => {
        const contactHtml = item.contactHidden
            ? `<a class="contact-login-link" href="login.html">Log in to view contact details</a>`
            : escapeHtml(item.contact);

        const imageHtml = item.imageUrl
            ? `<img
                    class="item-image"
                    src="${escapeHtml(item.imageUrl)}"
                    alt="${escapeHtml(item.name)}"
                    loading="lazy">`
            : "";

        let actionHtml = "";

        if (item.status === "recovered") {
            actionHtml = "<p><strong>Item recovered successfully.</strong></p>";
        } else if (item.canManage) {
            actionHtml = `
                <button
                    type="button"
                    class="recover-button"
                    data-id="${escapeHtml(item.id)}">
                    Mark as Recovered
                </button>`;
        }

        return `
            <article>
                ${imageHtml}
                <h3>${escapeHtml(item.name)}</h3>

                <p>
                    <strong>Status:</strong>
                    <span class="status-badge status-${escapeHtml(item.status)}">
                        ${escapeHtml(item.status)}
                    </span>
                </p>

                <p><strong>Category:</strong> ${escapeHtml(item.category)}</p>

                <p><strong>Description:</strong> ${escapeHtml(item.description || "No description")}</p>

                <p><strong>Location:</strong> ${escapeHtml(item.location)}</p>

                <p><strong>Date:</strong> ${escapeHtml(item.date)}</p>

                <p><strong>Contact:</strong> ${contactHtml}</p>

                ${actionHtml}
            </article>
        `;
    }).join("");
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

// Mark an item as recovered (login zaroori)
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
            const response = await authFetch(`/api/items/${itemId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status: "recovered"
                })
            });

            if (response.status === 401) {
                clearSession();
                alert("Your session has expired. Please log in again.");
                window.location.href = "login.html";
                return;
            }

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

// Form ka field dhundo; na mile to saaf error do
function getField(id) {
    const element = document.querySelector(`#${id}`);

    if (!element) {
        throw new Error(`The form field "${id}" is missing from report.html.`);
    }

    return element;
}

// Report a new item (login zaroori)
const reportForm = document.querySelector("#report-form");

if (reportForm && requireLogin()) {
    // Contact me logged-in user ki email pehle se bhar do (badal sakte hain)
    const contactInput = document.querySelector("#contact");

    if (contactInput && !contactInput.value) {
        contactInput.value = getUser().email;
    }

    // Chuni hui photo ka preview dikhao
    const imageInput = document.querySelector("#image");
    const imagePreview = document.querySelector("#image-preview");

    if (imageInput && imagePreview) {
        imageInput.addEventListener("change", () => {
            const file = imageInput.files[0];

            if (file) {
                imagePreview.src = URL.createObjectURL(file);
                imagePreview.hidden = false;
            } else {
                imagePreview.removeAttribute("src");
                imagePreview.hidden = true;
            }
        });
    }

    reportForm.addEventListener("submit", async event => {
        event.preventDefault();

        const submitButton = reportForm.querySelector(
            'button[type="submit"], input[type="submit"]'
        );

        try {
            const name = getField("item-name").value.trim();
            const status = getField("item-type").value;
            const category = getField("category").value;
            const description = getField("description").value.trim();
            const location = getField("location").value.trim();
            const date = getField("date").value;
            const contact = getField("contact").value.trim();
            const imageInputField = document.querySelector("#image");
            const imageFile = imageInputField ? imageInputField.files[0] : null;

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

            if (imageFile) {
                const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

                if (!allowedTypes.includes(imageFile.type)) {
                    alert("Please choose a JPG, PNG or WEBP image.");
                    return;
                }

                if (imageFile.size > 5 * 1024 * 1024) {
                    alert("Image must be smaller than 5 MB.");
                    return;
                }
            }

            if (submitButton) submitButton.disabled = true;

            const formData = new FormData();
            formData.append("name", name);
            formData.append("status", status);
            formData.append("category", category);
            formData.append("description", description);
            formData.append("location", location);
            formData.append("date", date);
            formData.append("contact", contact);

            if (imageFile) {
                formData.append("image", imageFile);
            }

            // Content-Type khud mat lagana, browser FormData ke liye khud set karta hai
            const response = await authFetch("/api/items", {
                method: "POST",
                body: formData
            });

            if (response.status === 401) {
                clearSession();
                alert("Your session has expired. Please log in again.");
                window.location.href = "login.html?next=report.html";
                return;
            }

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
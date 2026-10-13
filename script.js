
const defaultItems = [
    {
        id: 1,
        name: "Casio Calculator",
        status: "lost",
        category: "electronics",
        description: "Black Casio scientific calculator with a small scratch near the display.",
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

let items =
    JSON.parse(localStorage.getItem("lostFoundItems")) ||
    defaultItems;

let selectedStatus = "all";


function saveItems() {
    localStorage.setItem(
        "lostFoundItems",
        JSON.stringify(items)
    );
}


function displayItems(itemsToDisplay) {
    const container =
        document.querySelector("#items-container");

    if (!container) {
        return;
    }

    if (itemsToDisplay.length === 0) {
        container.innerHTML = "<p>No items found.</p>";
        return;
    }

    let html = "";

    itemsToDisplay.forEach(function(item) {
        html += `
            <article>
                <h3>${item.name}</h3>

               <p>
           <strong>Status:</strong>
            <span class="status-badge status-${item.status}">
           ${item.status}
            </span>
               </p>

                <p>
                    <strong>Category:</strong>
                    ${item.category}
                </p>

                <p>
                    <strong>Location:</strong>
                    ${item.location}
                </p>

                <p>
                    <strong>Date:</strong>
                    ${item.date}
                </p>

                <p>${item.description}</p>
            </article>
        `;
    });

    container.innerHTML = html;
}


function filterItems() {
    const searchInput =
        document.querySelector("#search-input");

    let searchText = "";

    if (searchInput) {
        searchText =
            searchInput.value.toLowerCase().trim();
    }

    const filteredItems = items.filter(function(item) {
        const matchesStatus =
            selectedStatus === "all" ||
            item.status === selectedStatus;

        const matchesSearch =
            item.name.toLowerCase().includes(searchText) ||
            item.category.toLowerCase().includes(searchText) ||
            item.location.toLowerCase().includes(searchText);

        return matchesStatus && matchesSearch;
    });

    displayItems(filteredItems);
}


// Search form
const searchForm =
    document.querySelector("#search-form");

if (searchForm) {
    searchForm.addEventListener("submit", function(event) {
        event.preventDefault();
        filterItems();
    });
}


// Live search
const searchInput =
    document.querySelector("#search-input");

if (searchInput) {
    searchInput.addEventListener("input", function() {
        filterItems();
    });
}


// All items filter
const allButton =
    document.querySelector("#all-button");

if (allButton) {
    allButton.addEventListener("click", function() {
        selectedStatus = "all";
        filterItems();
    });
}


// Lost items filter
const lostButton =
    document.querySelector("#lost-button");

if (lostButton) {
    lostButton.addEventListener("click", function() {
        selectedStatus = "lost";
        filterItems();
    });
}


// Found items filter
const foundButton =
    document.querySelector("#found-button");

if (foundButton) {
    foundButton.addEventListener("click", function() {
        selectedStatus = "found";
        filterItems();
    });
}


// Report item form
const reportForm =
    document.querySelector("#report-form");

if (reportForm) {
    reportForm.addEventListener("submit", function(event) {
        event.preventDefault();

        const status =
            document.querySelector("#item-type").value;

        const name =
            document.querySelector("#item-name").value.trim();

        const category =
            document.querySelector("#category").value;

        const description =
            document.querySelector("#description").value.trim();

        const location =
            document.querySelector("#location").value.trim();

        const date =
            document.querySelector("#date").value;

        const contact =
            document.querySelector("#contact").value.trim();


        // Check required fields
        if (
            name === "" ||
            description === "" ||
            location === "" ||
            date === "" ||
            contact === ""
        ) {
            alert("Please fill in all required fields.");
            return;
        }


        // Validate email or phone number
        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        const phonePattern =
            /^\+?[0-9\s()-]{10,20}$/;

        if (
            !emailPattern.test(contact) &&
            !phonePattern.test(contact)
        ) {
            alert(
                "Please enter a valid email address or phone number."
            );
            return;
        }


        // Create new item
        const newItem = {
            id: Date.now(),
            name: name,
            status: status,
            category: category,
            description: description,
            location: location,
            date: date,
            contact: contact
        };


        // Save item
        items.push(newItem);

        saveItems();

        alert("Item reported successfully!");

        reportForm.reset();

        window.location.href = "index.html";
    });
}


// Display items on home page
if (document.querySelector("#items-container")) {
    displayItems(items);
}

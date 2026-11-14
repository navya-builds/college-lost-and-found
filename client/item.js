(function () {
    const container = document.querySelector("#item-detail");

    if (!container) return;

    const itemId = new URLSearchParams(window.location.search).get("id");

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

    function formatDate(value) {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return "";

        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    }

    function showMessage(text) {
        container.innerHTML = `<p>${escapeHtml(text)}</p>`;
    }

    function itemPageLink(item) {
        return encodeURIComponent(`item.html?id=${item.id}`);
    }

    // ---------- Item ----------

    function renderItem(item) {
        document.title = `${item.name} - College Lost & Found`;

        let contactHtml;

        if (!item.contactHidden) {
            contactHtml = escapeHtml(item.contact);
        } else if (item.contactReason === "login") {
            contactHtml = `<a class="contact-login-link" href="login.html?next=${itemPageLink(item)}">Log in to view contact details</a>`;
        } else {
            contactHtml = "<em>Shared after your claim is approved</em>";
        }

        const imageHtml = item.imageUrl
            ? `<img
                    class="detail-image"
                    src="${escapeHtml(item.imageUrl)}"
                    alt="${escapeHtml(item.name)}">`
            : "";

        let actionHtml = "";

        if (item.status === "recovered") {
            actionHtml = "<p><strong>This item has been recovered.</strong></p>";
        } else if (item.canManage) {
            actionHtml = `
                <button type="button" id="recover-button" class="recover-button">
                    Mark as Recovered
                </button>`;
        }

        const reportedOn = formatDate(item.createdAt);

        container.innerHTML = `
            ${imageHtml}

            <h2>${escapeHtml(item.name)}</h2>

            <p>
                <span class="status-badge status-${escapeHtml(item.status)}">
                    ${escapeHtml(item.status)}
                </span>
            </p>

            <p><strong>Category:</strong> ${escapeHtml(item.category)}</p>

            <p><strong>Description:</strong> ${escapeHtml(item.description || "No description")}</p>

            <p><strong>Location:</strong> ${escapeHtml(item.location)}</p>

            <p><strong>Date:</strong> ${escapeHtml(item.date)}</p>

            ${reportedOn ? `<p><strong>Reported on:</strong> ${escapeHtml(reportedOn)}</p>` : ""}

            <p><strong>Contact:</strong> ${contactHtml}</p>

            <div id="claim-area"></div>

            ${actionHtml}
        `;

        const recoverButton = document.querySelector("#recover-button");

        if (recoverButton) {
            recoverButton.addEventListener("click", () => markRecovered(item, recoverButton));
        }

        loadClaims(item);
    }

    async function markRecovered(item, button) {
        const confirmed = confirm(
            "Are you sure you want to mark this item as recovered?"
        );

        if (!confirmed) return;

        button.disabled = true;

        try {
            const response = await authFetch(
                `/api/items/${encodeURIComponent(item.id)}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "recovered" })
                }
            );

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

            await loadItem();
        } catch (error) {
            console.error("Error updating item:", error);
            alert(error.message || "Something went wrong.");

            button.disabled = false;
        }
    }

    // ---------- Claims ----------

    async function loadClaims(item) {
        const area = document.querySelector("#claim-area");

        if (!area) return;

        // Logged-out user
        if (!isLoggedIn()) {
            if (item.status !== "recovered") {
                const label = item.status === "found" ? "claim" : "respond to";

                area.innerHTML = `
                    <p>
                        <a class="contact-login-link" href="login.html?next=${itemPageLink(item)}">
                            Log in to ${label} this item
                        </a>
                    </p>`;
            }

            return;
        }

        try {
            const response = await authFetch(
                `/api/items/${encodeURIComponent(item.id)}/claims`
            );

            if (!response.ok) return;

            const data = await response.json();

            if (data.canManage) {
                renderManagerClaims(area, data.claims);
            } else {
                renderMyClaim(area, item, data.claims[0]);
            }
        } catch (error) {
            console.error("Error loading claims:", error);
        }
    }

    // Owner / admin: saare claims
    function renderManagerClaims(area, claims) {
        if (claims.length === 0) {
            area.innerHTML = "<h3>Claims</h3><p>No claims yet.</p>";
            return;
        }

        area.innerHTML = `
            <h3>Claims (${claims.length})</h3>
            ${claims.map(claim => `
                <div class="claim-card">
                    <p>
                        <strong>${escapeHtml(claim.claimant ? claim.claimant.name : "User")}</strong>
                        ${claim.claimant ? `&middot; ${escapeHtml(claim.claimant.email)}` : ""}
                        <span class="status-badge claim-${escapeHtml(claim.status)}">
                            ${escapeHtml(claim.status)}
                        </span>
                    </p>

                    <p>${escapeHtml(claim.message)}</p>

                    <p class="claim-date">${escapeHtml(formatDate(claim.createdAt))}</p>

                    ${claim.status === "pending" ? `
                        <div class="claim-actions">
                            <button
                                type="button"
                                class="claim-action approve"
                                data-id="${escapeHtml(claim.id)}"
                                data-status="approved">
                                Approve
                            </button>
                            <button
                                type="button"
                                class="claim-action reject"
                                data-id="${escapeHtml(claim.id)}"
                                data-status="rejected">
                                Reject
                            </button>
                        </div>` : ""}
                </div>
            `).join("")}
        `;

        area.addEventListener("click", async event => {
            const button = event.target.closest(".claim-action");

            if (!button) return;

            const status = button.dataset.status;

            const confirmed = confirm(
                status === "approved"
                    ? "Approve this claim? Other pending claims will be rejected and your contact details will be shared."
                    : "Reject this claim?"
            );

            if (!confirmed) return;

            button.disabled = true;

            try {
                const response = await authFetch(
                    `/api/claims/${encodeURIComponent(button.dataset.id)}`,
                    {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status })
                    }
                );

                if (response.status === 401) {
                    clearSession();
                    alert("Your session has expired. Please log in again.");
                    window.location.href = "login.html";
                    return;
                }

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || "Could not update claim.");
                }

                alert(result.message);

                await loadItem();
            } catch (error) {
                console.error("Error updating claim:", error);
                alert(error.message || "Something went wrong.");

                button.disabled = false;
            }
        });
    }

    // Baaki users: apna claim ya claim form
    function renderMyClaim(area, item, claim) {
        if (claim) {
            const notes = {
                pending: "Waiting for the reporter's decision.",
                approved: "Approved! The contact details are now visible above.",
                rejected: "The reporter did not approve this claim."
            };

            area.innerHTML = `
                <h3>Your claim</h3>
                <div class="claim-card">
                    <p>
                        <span class="status-badge claim-${escapeHtml(claim.status)}">
                            ${escapeHtml(claim.status)}
                        </span>
                    </p>
                    <p>${escapeHtml(claim.message)}</p>
                    <p class="claim-date">${escapeHtml(notes[claim.status] || "")}</p>
                </div>`;

            return;
        }

        if (item.status === "recovered") return;

        const isFound = item.status === "found";

        area.innerHTML = `
            <h3>${isFound ? "Is this your item?" : "Did you find this item?"}</h3>

            <form id="claim-form" class="claim-form">
                <label for="claim-message">
                    ${isFound
                        ? "Describe something only the owner would know"
                        : "Tell the owner where and how you found it"}
                </label>

                <textarea
                    id="claim-message"
                    rows="4"
                    maxlength="500"
                    placeholder="${isFound
                        ? "For example: colour, stickers, what is inside, any marks"
                        : "For example: place, time and condition of the item"}"
                    required
                ></textarea>

                <p class="claim-hint">
                    The reporter will review your message and may approve or reject it.
                </p>

                <button type="submit">
                    ${isFound ? "Claim this item" : "I found this item"}
                </button>
            </form>`;

        const form = area.querySelector("#claim-form");

        form.addEventListener("submit", async event => {
            event.preventDefault();

            const message = area.querySelector("#claim-message").value.trim();

            if (message.length < 10) {
                alert("Please write at least 10 characters.");
                return;
            }

            const button = form.querySelector('button[type="submit"]');
            button.disabled = true;

            try {
                const response = await authFetch(
                    `/api/items/${encodeURIComponent(item.id)}/claims`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ message })
                    }
                );

                if (response.status === 401) {
                    clearSession();
                    alert("Your session has expired. Please log in again.");
                    window.location.href = `login.html?next=${itemPageLink(item)}`;
                    return;
                }

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.message || "Could not send claim.");
                }

                alert(result.message);

                await loadItem();
            } catch (error) {
                console.error("Error sending claim:", error);
                alert(error.message || "Something went wrong.");

                button.disabled = false;
            }
        });
    }

    // ---------- Load ----------

    async function loadItem() {
        if (!itemId) {
            showMessage("No item selected. Please go back and choose an item.");
            return;
        }

        try {
            const response = await authFetch(
                `/api/items/${encodeURIComponent(itemId)}`
            );

            if (response.status === 404) {
                showMessage("Item not found. It may have been removed.");
                return;
            }

            if (response.status === 400) {
                showMessage("This item link is not valid.");
                return;
            }

            if (!response.ok) {
                throw new Error("Could not load item.");
            }

            renderItem(await response.json());
        } catch (error) {
            console.error("Error loading item:", error);
            showMessage(
                "Unable to load this item. Please check that the server is running."
            );
        }
    }

    loadItem();
})();
(function () {
    const root = document.querySelector("#dashboard");

    if (!root) return;

    // Login zaroori
    if (!requireLogin()) return;

    const stats = document.querySelector("#dashboard-stats");
    const tabs = document.querySelector("#dashboard-tabs");
    const content = document.querySelector("#tab-content");
    const reviewBadge = document.querySelector("#review-badge");
    const welcome = document.querySelector("#dashboard-welcome");

    const state = {
        items: [],
        myClaims: [],
        received: [],
        tab: "reports",
        firstLoad: true
    };

    welcome.textContent = `Welcome back, ${getUser().name}.`;

    // ---------- Helpers ----------

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

    function itemLink(id) {
        return `item.html?id=${encodeURIComponent(id)}`;
    }

    function pendingReviewCount() {
        return state.received.filter(claim => claim.status === "pending").length;
    }

    function emptyState(text, href, label) {
        return `
            <div class="empty-state">
                <p>${escapeHtml(text)}</p>
                ${href ? `<a class="button" href="${href}">${escapeHtml(label)}</a>` : ""}
            </div>`;
    }

    // ---------- Render ----------

    function renderStats() {
        const openItems = state.items.filter(item => item.status !== "recovered").length;

        const cards = [
            [state.items.length, "Items reported"],
            [openItems, "Still open"],
            [state.myClaims.length, "Claims sent"],
            [pendingReviewCount(), "Claims to review"]
        ];

        stats.innerHTML = cards.map(([number, label]) => `
            <div class="stat-card">
                <span class="stat-number">${number}</span>
                <span class="stat-label">${escapeHtml(label)}</span>
            </div>
        `).join("");
    }

    function renderReports() {
        if (state.items.length === 0) {
            return emptyState(
                "You haven't reported any items yet.",
                "report.html",
                "Report an item"
            );
        }

        return state.items.map(item => `
            <div class="dash-row">
                ${item.imageUrl
                    ? `<img class="dash-thumb" src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.name)}">`
                    : `<div class="dash-thumb"></div>`}

                <div class="dash-main">
                    <h3>
                        <a class="title-link" href="${itemLink(item.id)}">${escapeHtml(item.name)}</a>
                    </h3>

                    <p>
                        <span class="status-badge status-${escapeHtml(item.status)}">
                            ${escapeHtml(item.status)}
                        </span>
                        <span class="dash-meta">
                            ${escapeHtml(item.category)} &middot; ${escapeHtml(item.location)} &middot; ${escapeHtml(item.date)}
                        </span>
                    </p>

                    ${item.pendingClaims > 0
                        ? `<p class="dash-alert">${item.pendingClaims} pending claim${item.pendingClaims > 1 ? "s" : ""} to review</p>`
                        : ""}
                </div>

                <a class="details-link" href="${itemLink(item.id)}">View &rarr;</a>
            </div>
        `).join("");
    }

    function renderMyClaims() {
        if (state.myClaims.length === 0) {
            return emptyState(
                "You haven't sent any claims yet.",
                "index.html",
                "Browse items"
            );
        }

        const notes = {
            pending: "Waiting for the reporter's decision.",
            approved: "Approved! You can contact the reporter.",
            rejected: "The reporter did not approve this claim."
        };

        return state.myClaims.map(claim => {
            const item = claim.item;

            const title = item
                ? `<a class="title-link" href="${itemLink(item.id)}">${escapeHtml(item.name)}</a>`
                : "Item no longer available";

            const contact =
                claim.status === "approved" && item && item.contact
                    ? `<p><strong>Contact:</strong> ${escapeHtml(item.contact)}</p>`
                    : "";

            return `
                <div class="claim-card">
                    <h3>${title}</h3>

                    <p>
                        <span class="status-badge claim-${escapeHtml(claim.status)}">
                            ${escapeHtml(claim.status)}
                        </span>
                        <span class="dash-meta">${escapeHtml(formatDate(claim.createdAt))}</span>
                    </p>

                    <p>${escapeHtml(claim.message)}</p>

                    ${contact}

                    <p class="claim-date">${escapeHtml(notes[claim.status] || "")}</p>
                </div>`;
        }).join("");
    }

    function renderReview() {
        if (state.received.length === 0) {
            return emptyState("Nobody has claimed your items yet.");
        }

        // Pending claims pehle
        const sorted = [...state.received].sort(
            (a, b) =>
                (a.status === "pending" ? 0 : 1) - (b.status === "pending" ? 0 : 1)
        );

        return sorted.map(claim => {
            const claimant = claim.claimant;
            const item = claim.item;

            return `
                <div class="claim-card">
                    <p>
                        <strong>${escapeHtml(claimant ? claimant.name : "User")}</strong>
                        ${claimant ? `&middot; ${escapeHtml(claimant.email)}` : ""}
                        <span class="status-badge claim-${escapeHtml(claim.status)}">
                            ${escapeHtml(claim.status)}
                        </span>
                    </p>

                    <p>
                        On:
                        ${item
                            ? `<a class="title-link" href="${itemLink(item.id)}">${escapeHtml(item.name)}</a>`
                            : "an item that no longer exists"}
                    </p>

                    <p>${escapeHtml(claim.message)}</p>

                    <p class="claim-date">${escapeHtml(formatDate(claim.createdAt))}</p>

                    ${claim.status === "pending"
                        ? `<div class="claim-actions">
                                <button
                                    type="button"
                                    class="claim-action approve review-action"
                                    data-id="${escapeHtml(claim.id)}"
                                    data-status="approved">
                                    Approve
                                </button>
                                <button
                                    type="button"
                                    class="claim-action reject review-action"
                                    data-id="${escapeHtml(claim.id)}"
                                    data-status="rejected">
                                    Reject
                                </button>
                           </div>`
                        : ""}
                </div>`;
        }).join("");
    }

    function render() {
        renderStats();

        const pending = pendingReviewCount();

        reviewBadge.textContent = pending;
        reviewBadge.hidden = pending === 0;

        tabs.querySelectorAll(".tab-button").forEach(button => {
            button.classList.toggle("active", button.dataset.tab === state.tab);
        });

        if (state.tab === "claims") {
            content.innerHTML = renderMyClaims();
        } else if (state.tab === "review") {
            content.innerHTML = renderReview();
        } else {
            content.innerHTML = renderReports();
        }
    }

    // ---------- Load data ----------

    async function fetchJson(url) {
        const response = await authFetch(url);

        if (response.status === 401) {
            clearSession();
            window.location.href = "login.html?next=dashboard.html";
            throw new Error("Session expired");
        }

        if (!response.ok) {
            throw new Error("Request failed");
        }

        return response.json();
    }

    async function loadAll() {
        try {
            const [items, myClaims, received] = await Promise.all([
                fetchJson("/api/me/items"),
                fetchJson("/api/me/claims"),
                fetchJson("/api/me/received-claims")
            ]);

            state.items = items;
            state.myClaims = myClaims;
            state.received = received;

            // Pehli baar: agar review karne wale claims hain to wahi tab kholo
            if (state.firstLoad) {
                state.firstLoad = false;

                if (pendingReviewCount() > 0) {
                    state.tab = "review";
                }
            }

            render();
        } catch (error) {
            if (error.message === "Session expired") return;

            console.error("Error loading dashboard:", error);
            content.innerHTML =
                "<p>Unable to load your dashboard. Please check that the server is running.</p>";
        }
    }

    // ---------- Events ----------

    tabs.addEventListener("click", event => {
        const button = event.target.closest(".tab-button");

        if (!button) return;

        state.tab = button.dataset.tab;
        render();
    });

    content.addEventListener("click", async event => {
        const button = event.target.closest(".review-action");

        if (!button) return;

        const status = button.dataset.status;

        const confirmed = confirm(
            status === "approved"
                ? "Approve this claim? Other pending claims on this item will be rejected and your contact details will be shared."
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
                window.location.href = "login.html?next=dashboard.html";
                return;
            }

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Could not update claim.");
            }

            alert(result.message);

            await loadAll();
        } catch (error) {
            console.error("Error updating claim:", error);
            alert(error.message || "Something went wrong.");

            button.disabled = false;
        }
    });

    loadAll();
})();
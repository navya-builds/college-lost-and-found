const TOKEN_KEY = "lf_token";
const USER_KEY = "lf_user";

// ---------- Session helpers ----------

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function getUser() {
    try {
        return JSON.parse(localStorage.getItem(USER_KEY));
    } catch (error) {
        return null;
    }
}

function isLoggedIn() {
    return Boolean(getToken() && getUser());
}

function saveSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

// fetch() jo token apne aap bhej deta hai
function authFetch(url, options = {}) {
    const headers = { ...(options.headers || {}) };
    const token = getToken();

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return fetch(url, { ...options, headers });
}

// Login nahi hai to login page pe bhej do
function requireLogin() {
    if (isLoggedIn()) return true;

    const page = window.location.pathname.split("/").pop() || "index.html";
    window.location.href = `login.html?next=${encodeURIComponent(page)}`;
    return false;
}

// Login ke baad kis page pe jaana hai (sirf apni site ke .html pages allowed)
function getNextPage() {
    const next = new URLSearchParams(window.location.search).get("next");
    return next && /^[a-zA-Z0-9_-]+\.html$/.test(next) ? next : "index.html";
}

// ---------- Navbar ----------

function makeLink(text, href) {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = text;
    return link;
}

function renderNavbar() {
    const box = document.querySelector("#nav-auth");

    if (!box) return;

    box.innerHTML = "";

    if (isLoggedIn()) {
        const hello = document.createElement("span");
        hello.className = "nav-user";
        hello.textContent = `Hi, ${getUser().name}`;

        const logout = makeLink("Logout", "#");
        logout.addEventListener("click", event => {
            event.preventDefault();
            clearSession();
            window.location.href = "index.html";
        });

        box.append(hello, logout);
    } else {
        box.append(makeLink("Login", "login.html"), makeLink("Sign up", "signup.html"));
    }
}

// Token expire ya galat ho gaya ho to session saaf karo
async function verifySession() {
    if (!getToken()) return;

    try {
        const response = await authFetch("/api/auth/me");

        if (response.status === 401) {
            clearSession();
            renderNavbar();
            return;
        }

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
            renderNavbar();
        }
    } catch (error) {
        // Server band ho to kuch mat karo
    }
}

// ---------- Login / Signup forms ----------

function showFormMessage(text) {
    const box = document.querySelector("#form-message");

    if (box) box.textContent = text;
}

const loginForm = document.querySelector("#login-form");

if (loginForm) {
    loginForm.addEventListener("submit", async event => {
        event.preventDefault();
        showFormMessage("");

        const email = document.querySelector("#login-email").value.trim();
        const password = document.querySelector("#login-password").value;
        const button = loginForm.querySelector('button[type="submit"]');

        button.disabled = true;

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Could not log in.");
            }

            saveSession(result.token, result.user);
            window.location.href = getNextPage();
        } catch (error) {
            showFormMessage(error.message || "Something went wrong.");
            button.disabled = false;
        }
    });
}

const signupForm = document.querySelector("#signup-form");

if (signupForm) {
    signupForm.addEventListener("submit", async event => {
        event.preventDefault();
        showFormMessage("");

        const name = document.querySelector("#signup-name").value.trim();
        const email = document.querySelector("#signup-email").value.trim();
        const password = document.querySelector("#signup-password").value;
        const confirmPassword = document.querySelector("#signup-confirm").value;
        const button = signupForm.querySelector('button[type="submit"]');

        if (password.length < 6) {
            showFormMessage("Password must be at least 6 characters long.");
            return;
        }

        if (password !== confirmPassword) {
            showFormMessage("Passwords do not match.");
            return;
        }

        button.disabled = true;

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Could not create account.");
            }

            saveSession(result.token, result.user);
            window.location.href = getNextPage();
        } catch (error) {
            showFormMessage(error.message || "Something went wrong.");
            button.disabled = false;
        }
    });
}

// ---------- Start ----------

renderNavbar();
verifySession();
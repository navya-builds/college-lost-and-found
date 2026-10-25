# 🎒 College Lost & Found

A full-stack web application that helps students report lost items, post found items, and reunite belongings with their owners on campus.

![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-47A248?logo=mongodb&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![JWT](https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Images-Cloudinary-3448C5?logo=cloudinary&logoColor=white)

**Live demo:** _Coming soon (deployment planned on Render)_

---

## 📌 Table of Contents

- [About the Project](#-about-the-project)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [How It Works](#-how-it-works)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Data Models](#-data-models)
- [Getting Started](#-getting-started)
- [Security](#-security)
- [Roadmap](#-roadmap)
- [Author](#-author)

---

## 📖 About the Project

Students often lose belongings such as calculators, ID cards, bags and bottles around campus, and the people who find them have no easy way to reach the owners. **College Lost & Found** gives the whole campus one place to report, search and recover items.

The project started as a front-end site that stored data in the browser's `localStorage`. It was then upgraded into a full-stack application with a REST API, a cloud database, user authentication and image uploads, migrating step by step without breaking the working site.

---

## ✨ Features

- **User accounts:** sign up and log in with email and password (passwords are hashed, sessions use JWT tokens)
- **Report items:** post a lost or found item with category, description, location, date, contact details and an optional photo
- **Photo upload:** images are validated (JPG, PNG or WEBP, up to 5 MB) and stored on Cloudinary
- **Search and filters:** search by item name, category or location, and filter by All, Lost, Found or Recovered
- **Item details page:** every item has its own shareable page (`item.html?id=...`) with a large photo and full details
- **Mark as recovered:** only the person who reported an item (or an admin) can mark it as recovered
- **Contact privacy:** contact details are hidden from logged-out visitors and shown only to logged-in users
- **Protected routes:** reporting and updating items require a valid login
- **Safe rendering:** user-provided text is escaped before it is shown, to prevent XSS
- **Responsive design:** works on desktop and mobile screens

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (`fetch` API) |
| **Backend** | Node.js, Express 5 |
| **Database** | MongoDB Atlas with Mongoose |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` |
| **File Uploads** | Multer (memory storage) and Cloudinary |
| **Dev Tools** | Nodemon, Git, GitHub, REST Client (VS Code) |

---

## 🔄 How It Works

```
Browser (client/)
   │   fetch("/api/...")  with  Authorization: Bearer <token>
   ▼
Express server (server/)
   │   routes → middleware (auth, upload) → controllers
   ▼
MongoDB Atlas (users, items)          Cloudinary (item photos)
```

1. The Express server serves the static files from `client/` and exposes a JSON API under `/api`.
2. After login, the server returns a JWT. The frontend stores it and sends it with every protected request.
3. Middleware checks the token (`protect`, or the softer `optionalAuth` for public pages) before the controller runs.
4. Photos are received by Multer, uploaded to Cloudinary, and only the image URL is saved in the database.

---

## 📁 Project Structure

```
college-lost-and-found/
├── client/                     # Frontend (served by Express)
│   ├── index.html              # Home page: search, filters, item cards
│   ├── report.html             # Report a lost or found item
│   ├── item.html               # Single item details page
│   ├── login.html
│   ├── signup.html
│   ├── style.css
│   ├── auth.js                 # Session helpers, navbar, login/signup logic
│   ├── script.js               # Home and report page logic
│   └── item.js                 # Item details page logic
│
├── server/                     # Backend
│   ├── config/
│   │   ├── db.js               # MongoDB connection
│   │   └── cloudinary.js       # Cloudinary upload helper
│   ├── controllers/
│   │   ├── authController.js   # register, login, getMe
│   │   └── itemController.js   # get, create, update items
│   ├── middleware/
│   │   ├── authMiddleware.js   # protect, optionalAuth
│   │   └── upload.js           # Multer image validation
│   ├── models/
│   │   ├── User.js
│   │   └── Item.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── itemRoutes.js
│   ├── server.js               # App entry point
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🔌 API Endpoints

Base URL: `http://localhost:3000/api`

### Auth

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/auth/register` | Create a new account | No |
| POST | `/auth/login` | Log in and receive a JWT | No |
| GET | `/auth/me` | Get the logged-in user | Yes |

### Items

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/items` | List all items (newest first) | Optional* |
| GET | `/items/:id` | Get a single item | Optional* |
| POST | `/items` | Report a new item (`multipart/form-data`, optional `image`) | Yes |
| PATCH | `/items/:id` | Mark an item as recovered (owner or admin only) | Yes |

\* Public, but contact details are included only when a valid token is sent.

### Example

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "your-password"
}
```

```json
{
  "message": "Logged in successfully!",
  "token": "<jwt-token>",
  "user": { "id": "...", "name": "Student", "email": "student@example.com", "role": "student" }
}
```

---

## 🗄 Data Models

**User**

| Field | Type | Notes |
|---|---|---|
| `name` | String | Required |
| `email` | String | Required, unique, lowercase |
| `password` | String | Hashed with bcrypt, never returned by the API |
| `role` | String | `student` (default) or `admin` |

**Item**

| Field | Type | Notes |
|---|---|---|
| `name` | String | Required |
| `status` | String | `lost`, `found` or `recovered` |
| `category` | String | Electronics, bags, documents, and so on |
| `description` | String | Optional |
| `location` | String | Required |
| `date` | String | Date the item was lost or found |
| `contact` | String | Email or phone, visible only to logged-in users |
| `imageUrl` | String | Cloudinary image URL (optional) |
| `reportedBy` | ObjectId | Reference to the `User` who reported it |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- A free [MongoDB Atlas](https://www.mongodb.com/atlas) account and cluster
- A free [Cloudinary](https://cloudinary.com/) account
- [Git](https://git-scm.com/)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/navya-builds/college-lost-and-found.git
cd college-lost-and-found

# 2. Install backend dependencies
cd server
npm install
```

### Environment variables

Create a file named `.env` inside the `server/` folder:

```env
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/college_lost_found?appName=Cluster0

JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

| Variable | Description |
|---|---|
| `PORT` | Port the server runs on (default `3000`) |
| `MONGO_URI` | MongoDB Atlas connection string, with the database name added |
| `JWT_SECRET` | Long random string used to sign login tokens |
| `JWT_EXPIRES_IN` | Token lifetime, for example `7d` |
| `CLOUDINARY_*` | Cloud name, API key and API secret from your Cloudinary dashboard |

Generate a strong `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> In MongoDB Atlas, add your IP address under **Network Access**, and create a database user under **Database Access**. Use a password without special characters, or URL-encode it.

### Run the app

```bash
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

Open **http://localhost:3000** in your browser. The server serves both the website and the API.

---

## 🔐 Security

- Passwords are hashed with **bcrypt** and are never stored or returned in plain text
- Authentication uses **JWT** with an expiry time
- Login errors use one generic message, so attackers cannot tell which emails are registered
- Users cannot choose their own role during signup
- **Ownership checks:** only the reporter (or an admin) can update an item
- Contact details are removed from API responses for logged-out visitors
- Uploads are limited to **JPG, PNG and WEBP images up to 5 MB**
- User content is **HTML-escaped** before rendering, to prevent XSS
- Only the `client/` folder is served publicly, so server code and `.env` are never exposed
- Secrets live in `.env`, which is excluded through `.gitignore`

---

## 🗺 Roadmap

- [x] Migrate from `localStorage` to an Express REST API
- [x] MongoDB Atlas database with Mongoose
- [x] Signup, login and JWT authentication
- [x] Protected routes, owner-only actions and contact privacy
- [x] Photo upload with Cloudinary
- [x] Item details page
- [ ] Claim system ("This is mine" request with approve or reject)
- [ ] User dashboard (my reports and my claims)
- [ ] Admin panel (moderate posts and users)
- [ ] Toast notifications instead of browser alerts
- [ ] Email notifications
- [ ] Deployment (Render for the API, MongoDB Atlas for data)

---

<!--
## 📸 Screenshots

Add your screenshots to a `docs/screenshots/` folder, then remove the comment markers around this section.

| Home | Item details |
|---|---|
| ![Home page](docs/screenshots/home.png) | ![Item details](docs/screenshots/item-details.png) |

| Report an item | Login |
|---|---|
| ![Report page](docs/screenshots/report.png) | ![Login page](docs/screenshots/login.png) |
-->

## 👤 Author

**Navya Tiwari**
GitHub: [@navya-builds](https://github.com/navya-builds)

If you found this project useful, consider giving it a ⭐

---

## 📄 License

This project is licensed under the ISC License.

# FlexyTube Backend API

A RESTful backend for a video-sharing and social platform built with **Node.js, Express 5, MongoDB, JWT, and Cloudinary**.

## 🚀 Features

- **Authentication** — Registration, login/logout, JWT access & refresh tokens, bcrypt password hashing
- **Videos** — Upload, publish/unpublish, update/delete, search, filtering, pagination, watch history and view tracking
- **Social** — Likes, comments, tweets, subscriptions and playlists
- **Creator Dashboard** — Channel statistics and video engagement metrics
- **Media** — Multer uploads with Cloudinary storage and video/thumbnail processing
- **Architecture** — MVC, centralized error handling, standardized responses and MongoDB aggregation
- **Security** — Ownership checks, HTTP-only cookies, bcrypt hashing and sensitive-field protection

## 🛠️ Tech Stack

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express 5
- **Database:** MongoDB + Mongoose
- **Storage:** Cloudinary
- **File Uploads:** Multer
- **Authentication:** JWT + bcrypt
- **Utilities:** dotenv, cors, cookie-parser, mongoose-aggregate-paginate-v2

## 📁 Project Structure

```text
src/
├── controllers/     # Business logic
├── db/              # Database connection
├── middlewares/     # JWT and upload middleware
├── models/          # Mongoose schemas
├── routes/          # API routes
├── utils/           # Errors, responses, async handlers, Cloudinary
├── app.js            # Express configuration
├── constant.js       # Application constants
└── index.js          # Entry point

public/
└── temp/             # Temporary uploads

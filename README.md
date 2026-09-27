FlexyTube Backend API
A RESTful backend for a video-sharing and social platform built with Node.js, Express 5, MongoDB, JWT, and Cloudinary.
Features
- Authentication: Registration, login/logout, JWT access & refresh tokens, bcrypt password hashing.
- Videos: Upload, publish/unpublish, update/delete, search, filtering, pagination, watch history and view tracking.
- Social: Likes, comments, tweets, subscriptions and playlists.
- Creator Dashboard: Channel statistics and video engagement metrics.
- Media: Multer uploads with Cloudinary storage and video/thumbnail processing.
- Architecture: MVC, centralized errors/responses, async handlers and MongoDB aggregation.
- Security: Ownership checks, HTTP-only cookies, bcrypt hashing and sensitive-field projection.
Tech Stack
Layer	Technology
Runtime	Node.js (ES Modules)
Framework	Express 5
Database	MongoDB + Mongoose
Storage	Cloudinary
Uploads	Multer
Auth	JWT + bcrypt
Utilities	dotenv, cors, cookie-parser, mongoose-aggregate-paginate-v2


Project Structure
src/
├── controllers/     # Business logic
├── db/              # Database connection
├── middlewares/     # JWT & upload middleware
├── models/          # Mongoose schemas
├── routes/          # API routes
├── utils/           # Errors, responses, async handlers, Cloudinary
├── app.js
├── constant.js
└── index.js         # Entry point
public/temp/         # Temporary uploads
Setup
Prerequisites
- Node.js 18+
- MongoDB / MongoDB Atlas
- Cloudinary account
Installation
git clone https://github.com/your-username/megaproj.git
cd megaproj
npm install
Create .env in the project root:
PORT=8000
CORS_ORIGIN=*

MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRES_IN=1d

REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRES_IN=10d

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
Start the development server:
npm run dev
Server: http://localhost:8000
API Overview
All endpoints use the /api/v1 prefix.
Resource	Main Operations
/users	Register, login, logout, profile, password, avatar, history
/videos	Upload, search, view, update, delete, publish/unpublish
/comments	Create, read, update, delete
/likes	Toggle likes on videos, comments and tweets
/tweets	Create, read, update, delete
/playlist	Create, manage and view playlists
/subscriptions	Subscribe/unsubscribe and view subscribers
/dashboard	Channel and video analytics


Authentication
Protected routes use JWT-based authentication. Access and refresh tokens are stored in HTTP-only cookies, with refresh-token rotation for session renewal.
Security
- Object ownership checks prevent unauthorized updates/deletes.
- HTTP-only cookies reduce client-side token exposure.
- Passwords are salted and hashed with bcrypt.
- Passwords and refresh tokens are excluded from API responses.
License
ISC

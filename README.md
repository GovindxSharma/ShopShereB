# 🛠️ ShopSphere — Backend REST API

Production-grade, scalable TypeScript backend API powering **ShopSphere**, a modern e-commerce web platform. Built with **Node.js, Express, MongoDB (Mongoose), TypeScript, JWT Authentication, and Razorpay / Demo Checkout Gateways**.

---

## 🚀 Key Highlights & Architecture

- 🔐 **Secure Authentication**: JWT-based auth stored in HTTP-only, SameSite-compliant cookies, supporting email/password registration, password reset flows, and Google OAuth 2.0.
- 🛍️ **Catalog & Inventory Engine**: Full CRUD for products, category filtering, multi-field regex search, sorting, atomic stock deductions, and low-stock protection.
- 💳 **Dual Checkout Engine**:
  - **Razorpay Gateway**: Real-time cryptographic signature verification (`HMAC-SHA256`).
  - **Instant Demo / COD Checkout**: Seamless order placement and stock deduction for immediate review and testing without active API keys.
- 📦 **Order Lifecycle & Tracking**: Real-time status transitions (`Placed` -> `Processing` -> `Shipped` -> `Delivered` -> `Cancelled`), stock restoration on user cancellation, and downloadable tax invoice endpoints.
- 🤖 **AI Assistant Endpoint**: Powered by Llama-3 via Groq with intelligent offline rule-based fallback answering questions about orders, products, and policies.
- 🌱 **Database Seeder**: Pre-populates 10+ realistic catalog items with high-res Unsplash CDN images and pre-configured Admin & Customer accounts.

---

## 📦 Tech Stack

- **Runtime**: Node.js (v18+) & Express 5
- **Language**: TypeScript 5
- **Database**: MongoDB & Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs
- **Payments**: Razorpay Node SDK & crypto
- **Image Storage**: Cloudinary SDK
- **Email Service**: Nodemailer

---

## 🧑‍💻 Quickstart & Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/shopshere
JWT_SECRET=super_secret_jwt_shopshere_token_key_2026
CLIENT_URL=http://localhost:5173

# Optional: Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional: Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Optional: Groq AI
GROQ_API_KEY=your_groq_api_key
```

### 3. Seed the Database
```bash
npm run seed
```
> Pre-configures Admin (`admin@shopshere.com` / `Admin@12345`) and Demo User (`user@shopshere.com` / `User@12345`).

### 4. Run in Development
```bash
npm run dev
```
Server runs at `http://localhost:5000`.

---

## 🧪 API Endpoints Overview

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/health` | Service health status check | Public |
| `POST` | `/api/auth/register` | Register new user account | Public |
| `POST` | `/api/auth/login` | Login user & set cookie | Public |
| `GET` | `/api/auth/me` | Fetch authenticated session | Auth |
| `GET` | `/api/products` | Browse catalog with search & filter | Public |
| `GET` | `/api/products/:id` | Single product details & reviews | Public |
| `GET` | `/api/products/:id/related` | Related category items | Public |
| `POST` | `/api/orders/demo` | Instant Demo / COD checkout | Auth |
| `POST` | `/api/orders` | Razorpay order placement | Auth |
| `GET` | `/api/orders/mine` | Customer order history | Auth |
| `PUT` | `/api/orders/:id/cancel` | Cancel order & restore stock | Auth |
| `GET` | `/api/orders/admin/analytics` | Store revenue & metrics | Admin |
| `PUT` | `/api/orders/:id/status` | Update delivery lifecycle | Admin |
| `POST` | `/api/chat` | AI Shopping Assistant | Public |

---

## 🧩 License
MIT License.

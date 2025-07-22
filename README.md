

# 🛠️ Shopshere Backend

The backend API for **Shopshere**, a full-stack e-commerce web application. It handles user authentication, product management, cart, orders, reviews, payments (Razorpay), and admin operations.

🔗 **Live Backend URL:** [https://shopshereb.onrender.com](https://shopshereb.onrender.com)
🔗 **Frontend:** [https://shopsheretheshoppingzone.onrender.com](https://shopsheretheshoppingzone.onrender.com)

---

## 🚀 Features

* ✅ User registration & login (local + Google OAuth)
* ✅ JWT-based authentication with secure cookies
* ✅ Password reset with email (Nodemailer)
* ✅ Product CRUD (admin only)
* ✅ Shopping cart management
* ✅ Razorpay payment integration
* ✅ Orders & order status updates
* ✅ Review system for products
* ✅ Full admin panel routes

---

## 📦 Tech Stack

* **Node.js** + **Express**
* **MongoDB** + **Mongoose**
* **TypeScript**
* **JWT + Cookies**
* **Cloudinary** for image uploads
* **Razorpay** for payments
* **Nodemailer** for email
* **Google OAuth** via `@react-oauth/google` and `google-auth-library`

---

## 🧑‍💻 Local Development

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/shopshere-backend.git
cd shopshere-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root with the following:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

GOOGLE_CLIENT_ID=your_google_client_id

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_app_password
```

### 4. Run in Development

```bash
npm run dev
```

Server will run on: `http://localhost:5000`

---

## 📁 Folder Structure

```bash
src/
│
├── controllers/       # All route handlers
├── models/            # Mongoose models
├── routes/            # Route files
├── middleware/        # Auth, admin, error handling
├── utils/             # Helper functions (JWT, email, etc.)
├── index.ts           # Entry point
└── ...
```

---

## 🧪 API Base URL

**All routes are prefixed with:** `/api`

Examples:

* `POST /api/auth/login`
* `GET /api/products`
* `POST /api/orders`
* `DELETE /api/admin/users/:id`

---

## 🛡️ CORS & Auth Setup

* CORS is dynamically configured using `CLIENT_URL` from `.env`
* Secure `httpOnly` cookie is used to store JWT
* All protected routes use `isAuthenticated` middleware

---

## 🌐 Deployment (Render)

### Backend Render Setup

* Add environment variables in Render dashboard
* Set `Build Command`: `npm run build`
* Set `Start Command`: `npm start`
* Add `web service` pointing to `dist/index.js`

---

## 🧩 License

This project is licensed under the MIT License.

---


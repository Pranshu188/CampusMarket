# CampusMarket 🎓
> **Buy. Sell. Rent. Campus Life Made Easy.**

CampusMarket is a production-ready, peer-to-peer student marketplace built for college and university students across India (Gujarat Technological University, Mumbai University, Delhi University, VTU, and campuses nationwide).

Students can buy, sell, or rent used and new academic materials they need for college life — including textbooks, handwritten notes, scientific calculators, lab coats, dissection kits, hostel furniture, electronics, and project components.

---

## 🚀 Key Features

### 1. Peer-to-Peer Student Marketplace (Buy, Sell, Rent, Request)
- **Direct Campus Handover:** Students arrange safe on-campus meetings (library, canteen, gate) without expensive middleman shipping.
- **Selling Flow:** High-speed listing form supporting multiple image previews, product condition, general campus location, and contact preferences.
- **Rental System:** Semester or monthly rentals (e.g. ₹150/mo) with automated calculation of rental duration, total payable, and refundable security deposit tracking.
- **Wanted / Item Request Board:** Students can post what they need (e.g., *"Need GTU BBA Sem 3 Financial Accounting textbook"*), and batchmates/seniors with the item can contact them directly.

### 2. Comprehensive Academic Filtering
- Listings support rich academic metadata:
  - **University / College** (GTU, MU, DU, VTU, etc.)
  - **Course / Degree** (BBA, B.Tech / BE, B.Com, MBA, etc.)
  - **Branch / Department** (Computer, Mechanical, Finance, etc.)
  - **Semester** (1 through 8)
  - **Subject Name**
  - **Author / Publisher**
  - **Edition & Optional ISBN**
- Full-text search across titles, descriptions, subjects, courses, and universities.

### 3. Internal Buyer-Seller Chat
- Built-in real-time student messaging system with conversation list and attached product reference card.
- Unread message counters, timestamps, and read receipts.
- Privacy-first: Students do not have to expose private mobile numbers publicly.

### 4. Indian Payment & Razorpay Sandbox Abstraction
- Supports Indian payment modes:
  - **UPI Apps:** Google Pay, PhonePe, Paytm, BHIM
  - **Cards:** Debit & Credit Cards (RuPay, Visa, Mastercard)
  - **Netbanking**
- Works out-of-the-box with an interactive test sandbox and signature verification.
- Easily switches to live Razorpay by setting `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env`.

### 5. Verified Ratings & Reviews
- 1 to 5-star rating with written student reviews.
- **Integrity protection:** Only buyers and renters who have completed genuine transactions can rate a seller.

### 6. Admin Moderation & Control Dashboard
- Access at `/admin`
- **Product Approval Workflow:** Set to optional or mandatory pre-approval before listings go public.
- **Moderation Queue:** Approve or reject listings with reason.
- **Account Management:** Search and suspend/activate student accounts.
- **Reports Resolution:** Review reports submitted for fake listings, scams, or prohibited items.
- **Category CRUD:** Create, edit, and manage marketplace categories.

### 7. Mobile-First Responsive Design
- Dedicated sticky mobile bottom navigation bar (`Home`, `Browse`, `Sell +`, `Chat`, `Account`).
- Mobile-friendly touch cards and responsive drawer filters.
- Professional human-developed design (clean slate navy `#0f172a`, forest teal `#0f766e`, warm amber `#d97706`), crisp borders, zero AI-generator bloat.

---

## 🛠️ Technology Stack

| Component | Technology | Rationale |
|---|---|---|
| **Frontend Framework** | React 19 + Vite | Blazing fast rendering, modular component structure |
| **Styling** | Custom Vanilla CSS Design System | Exact control, zero Tailwind bloat, crisp typography (Plus Jakarta Sans & Inter) |
| **Backend API** | Node.js + Express 5 (REST API) | Scalable backend decoupled for future iOS & Android mobile apps |
| **Database** | SQLite via `better-sqlite3` | Zero-configuration, ACID compliant, high-concurrency WAL mode |
| **Authentication** | JWT (`jsonwebtoken`) + `bcryptjs` | Secure session tokens, hashed passwords, role-based authorization |
| **Uploads** | `multer` | Whitelisted image mime types with 5MB size limits |
| **Payment Abstraction** | Razorpay Sandbox Architecture | Native Indian UPI/Card flow with clean production switch |

---

## 📂 Project Structure

```
CampusMarket/
├── server/
│   ├── index.js               # Express server entry point & static SPA fallback
│   ├── db.js                  # Database schema, indexes, and realistic demo seed data
│   ├── test_flows.js          # Automated end-to-end integration test suite
│   ├── middleware/
│   │   └── auth.js            # JWT verification & role authorization (requireAdmin, requireAuth)
│   ├── routes/
│   │   ├── auth.js            # Register, login, phone OTP, Google login, seller profile
│   │   ├── products.js        # Search, academic filtering, details, listing creation
│   │   ├── categories.js      # Category listing with active item counts & admin CRUD
│   │   ├── orders.js          # Purchase orders & campus pickup coordination
│   │   ├── rentals.js         # Semester rentals & refundable deposit lifecycle
│   │   ├── requests.js        # Community item requests board
│   │   ├── messages.js        # Buyer-seller chat & conversation management
│   │   ├── wishlist.js        # Saved favorite items
│   │   ├── notifications.js   # Notification bell alerts
│   │   ├── reviews.js         # Verified transaction reviews
│   │   ├── admin.js           # Admin metrics, moderation queue, user management, reports
│   │   └── payment.js         # Payment order creation & signature verification
│   └── uploads/               # Uploaded product image storage
├── client/
│   ├── index.html             # SEO meta tags, favicon & Google Fonts
│   ├── vite.config.js         # Dev proxy config to backend
│   └── src/
│       ├── main.jsx           # React DOM root
│       ├── App.jsx            # Central client-side router & navigation state
│       ├── index.css          # Design system, cards, tables, buttons, chat UI
│       ├── context/
│       │   └── AuthContext.jsx # User auth state, badges & global modal handler
│       ├── services/
│       │   └── api.js         # Standardized API client with JWT bearer tokens
│       ├── components/
│       │   ├── Navbar.jsx      # Top navigation with live search & notifications
│       │   ├── Footer.jsx      # Footer with safety disclaimer & policy links
│       │   ├── MobileBottomNav.jsx # Fixed bottom bar for smartphones
│       │   ├── ProductCard.jsx # Marketplace card with academic pill & price
│       │   ├── AuthModal.jsx   # Multi-mode login, OTP, and 1-click demo buttons
│       │   ├── CheckoutModal.jsx # Buy & Rent checkout with UPI/Card simulation
│       │   ├── ReportModal.jsx # Listing report submission modal
│       │   └── ReviewModal.jsx # Star rating & written review modal
│       └── pages/
│           ├── HomePage.jsx    # Hero, categories, popular, recently listed, how it works
│           ├── BrowsePage.jsx  # Multi-field academic filter sidebar & search
│           ├── ProductDetailPage.jsx # Image gallery, specs table, seller card, Buy/Rent CTA
│           ├── SellPage.jsx    # Sell/Rent listing creation form
│           ├── RequestsPage.jsx # Student item request board
│           ├── MessagesPage.jsx # Split conversation & message bubbles interface
│           ├── DashboardPage.jsx # Student dashboard (listings, orders, rentals, wishlist)
│           ├── SellerProfilePage.jsx # Public seller profile with reviews
│           ├── AdminDashboardPage.jsx # Admin metrics, moderation queue, users, reports
│           └── PolicyPages.jsx # Terms, Privacy, Community & Campus Safety Guidelines
├── .env                       # Environment variables
├── package.json               # Root scripts (dev, server, client, build, start)
└── README.md                  # Documentation
```

---

## 🗄️ Database Schema & Entities

The SQLite database (`server/campusmarket.db`) implements proper relational tables, foreign keys with cascade rules, and indexes:

1. **`users`** — `id, name, email, phone, password_hash, role ('student'|'admin'), college, course, branch, semester, location, bio, avatar, status ('active'|'suspended')`
2. **`categories`** — `id, name, slug, icon, description, item_count`
3. **`products`** — `id, title, description, category_name, seller_id, price, listing_type ('sell'|'rent'|'both'), rent_price_monthly, security_deposit, rental_terms, condition, college, course, branch, semester, subject, edition, author, isbn, location, availability ('available'|'sold'|'rented'), status ('pending_approval'|'active'|'rejected')`
4. **`product_images`** — `id, product_id, image_url, is_primary`
5. **`wishlist`** — `id, user_id, product_id` (Unique pair)
6. **`requests`** — `id, user_id, title, description, category_name, college, course, semester, budget, preferred_type, location, required_by_date, status`
7. **`orders`** — `id, order_number, product_id, buyer_id, seller_id, amount, payment_method, payment_status, order_status, pickup_notes`
8. **`rentals`** — `id, rental_number, product_id, renter_id, owner_id, monthly_rent, security_deposit, duration_months, total_amount, start_date, end_date, rental_status, deposit_status`
9. **`conversations` & `messages`** — `conversation_id, sender_id, recipient_id, text, is_read, product_id`
10. **`notifications`** — `user_id, title, message, type, link, is_read`
11. **`reviews`** — `reviewer_id, seller_id, product_id, order_id, rental_id, rating (1-5), comment`
12. **`reports`** — `reporter_id, target_type, target_id, target_title, reason, details, status ('pending'|'resolved'|'dismissed')`
13. **`settings`** — `key, value` (`require_approval`)

---

## 🔑 Demo Accounts & Pre-seeded Data

The database seeds automatically with realistic Indian college products, students, and an official administrator:

| Role | Email | Password | Details |
|---|---|---|---|
| **Admin Moderator** | `admin@campusmarket.com` | `admin123` | Full access to `/admin` dashboard, product moderation, user suspensions, and report management. |
| **Student 1 (Engg)** | `aarav.patel@gtu.ac.in` | `campus123` | 6th Sem Computer Engineering student at LDCE (GTU), Ahmedabad. |
| **Student 2 (BBA)** | `priya.sharma@bba.gtu.ac.in` | `campus123` | 4th Sem BBA Finance student at Som-Lalit Institute (GTU). |
| **Student 3 (Mech)** | `rohan.deshmukh@mu.ac.in` | `campus123` | 5th Sem Mechanical Engineering at VJTI (Mumbai University). |
| **Student 4 (Commerce)**| `ananya.verma@du.ac.in` | `campus123` | 3rd Sem B.Com (Hons) student at SRCC (Delhi University). |

> **Convenience:** When you open the login modal, you will see **Instant 1-Click Demo Login** buttons for Aarav, Priya, and Admin for immediate testing!

---

## ⚡ How to Run the Project

### Prerequisites
- Node.js v18+ (tested on Node v24)
- npm installed

### Quick Start (Single Command)
From the project root (`d:\BizGrow Digital_Websites\CampusMarket`):

```bash
# 1. Start the unified production server (serves both API and frontend on port 5000):
npm start
```
Open **`http://localhost:5000`** in your browser.

### Development Mode (Concurrent Dev Servers)
To run with hot module reloading (HMR) for client development:
```bash
npm run dev
```
- Backend API: `http://localhost:5000`
- Frontend Vite Dev Server: `http://localhost:3000`

---

## ⚙️ Environment Variables

Create or customize `.env` in the root directory:

```env
# CampusMarket Server Port
PORT=5000

# JSON Web Token Secret
JWT_SECRET=campusmarket-student-auth-secret-key-2026

# Razorpay Payment Gateway (Optional)
# Leave blank to use the built-in interactive sandbox:
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Database Path
DB_PATH=campusmarket.db
```

---

## 🧪 Testing the Complete Student User Journey

1. **Explore the Homepage:**
   - Go to `http://localhost:5000/`.
   - View the Hero section, search bar, popular tags, and category tiles.
2. **Search by Academic Syllabus:**
   - Type `"GTU BBA"` or click the quick tag **GTU BBA Sem 3 Financial Accounting**.
   - Browse the results with active filter pills.
3. **Inspect Product Details:**
   - Click on **GTU BBA Semester 3 Financial Accounting Textbook**.
   - Check the academic specs table, pricing breakdown (Buy ₹320 or Rent ₹100/mo), and seller card for Priya Sharma.
4. **Log In in 1 Click:**
   - Click **Log In** in the navbar.
   - Click the button **Aarav (Engg)** for instant student authentication.
5. **Buy / Rent Flow with Checkout:**
   - Click **Rent for Semester** or **Buy Now**.
   - The Checkout modal opens: choose duration (e.g. 2 months), view the refundable deposit calculation, review the on-campus handover disclaimer, and select a simulated payment mode (UPI / GPay / Card).
   - Click **Pay & Confirm**.
   - The order confirmation screen gives you a transaction number and a direct button to chat with the seller.
6. **Chat with Seller:**
   - Click **Chat with Seller**.
   - Send a message to coordinate campus handover at the library.
7. **Post an Item Request:**
   - Click **Requests** in the navbar.
   - View requests from other students or click **Post an Item Request** to post what book or calculator you need.
8. **Test Admin Moderation:**
   - Log in using **Admin Moderator** (`admin@campusmarket.com` / `admin123`).
   - Navigate to `/admin`.
   - View platform metrics, approve/reject newly submitted listings, manage student accounts, inspect orders/rentals, and adjust moderation policies.

# StrangerLink ⚡

A premium, high-performance real-time anonymous chat application designed for instant, secure connections. StrangerLink features both text and video modes, an integrated VIP tier system, and a sleek, glassmorphism-inspired UI.

![StrangerLink UI Preview](public/Logo.png) *(You can replace this with an actual screenshot of your app later)*

## ✨ Key Features

- **Instant Matching:** Algorithm connects users seamlessly based on preferences.
- **Dual Modes:** Real-time text and high-quality video chat.
- **Premium UI:** Custom themes (Midnight Noir, Deep Ocean, etc.) with a completely scrollbar-free, glassmorphism design.
- **Secure Authentication:** Custom email/username login with secure password hashing (bcrypt), plus Firebase Google Auth integration.
- **VIP System:** Integrated Razorpay payments for unlocking unlimited matches and premium badges.
- **Robust Backend:** Fast and scalable API built with FastAPI and SQLAlchemy.

## 🛠️ Tech Stack

- **Frontend:** React, Tailwind CSS, Framer Motion, Lucide Icons, Vite
- **Backend:** Python, FastAPI, SQLAlchemy, SQLite (Development) / PostgreSQL (Production)
- **Authentication:** Custom JWT + bcrypt / Firebase
- **Payments:** Razorpay API

## 🚀 Quick Start (Local Development)

### Backend Setup
1. Navigate to the `backend` directory.
2. Install dependencies: `pip install fastapi uvicorn sqlalchemy passlib bcrypt python-multipart` (Add others as needed).
3. Run the server: `uvicorn main:app --reload --port 8000`

### Frontend Setup
1. Navigate to the `frontend` (or root) directory.
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`
4. Open `http://localhost:3000` in your browser.
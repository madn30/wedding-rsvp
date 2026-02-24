# 💍 Wedding RSVP System

A full-stack MERN wedding RSVP platform with Hebrew RTL support, Twilio SMS/WhatsApp integration, and an admin dashboard.

## 📁 Project Structure

```
wedding-rsvp/
├── server/                     # Express + TypeScript backend
│   ├── src/
│   │   ├── config/             # DB connection
│   │   ├── controllers/        # Route handlers
│   │   ├── middlewares/        # Auth, error, validation
│   │   ├── models/             # Mongoose schemas
│   │   ├── routes/             # API routes
│   │   ├── services/           # Twilio service
│   │   ├── utils/              # JWT, helpers, validators, seed
│   │   └── server.ts           # Express entry point
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── client/                     # Vite + React + TypeScript frontend
    ├── src/
    │   ├── components/
    │   │   ├── admin/          # AdminSidebar, GuestTable, AddGuestModal
    │   │   ├── guest/          # RSVPButtons
    │   │   └── ui/             # Spinner, Badge, StatCard, Modal
    │   ├── context/            # AuthContext
    │   ├── hooks/              # useGuests, useStats, useDebounce
    │   ├── pages/              # LoginPage, DashboardPage, GuestsPage, RSVPPage
    │   ├── services/           # api.ts, authService, guestService
    │   ├── types/              # TypeScript interfaces
    │   ├── App.tsx
    │   └── main.tsx
    ├── .env.example
    ├── package.json
    └── vite.config.ts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Twilio account (with SMS + WhatsApp sandbox)

### Backend Setup

```bash
cd server
cp .env.example .env
# Fill in your .env values
npm install
npm run dev
```

**Seed admin user:**
```bash
npx ts-node src/utils/seed.ts
```

### Frontend Setup

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Visit: http://localhost:5173

## 🔐 API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/admin/login` | ❌ | Admin login |
| GET | `/api/admin/me` | ✅ | Get current admin |
| GET | `/api/guests` | ✅ | List guests (paginated, filtered) |
| POST | `/api/guests` | ✅ | Add new guest |
| DELETE | `/api/guests/:id` | ✅ | Delete guest |
| POST | `/api/guests/:id/send` | ✅ | Send SMS/WhatsApp |
| GET | `/api/guests/export` | ✅ | Export CSV |
| GET | `/api/rsvp/:token` | ❌ | Get RSVP data |
| POST | `/api/rsvp/:token` | ❌ | Submit RSVP |
| GET | `/api/stats` | ✅ | Dashboard stats |

## 📱 Phone Number Format

Israeli numbers are accepted as:
- `0501234567` → normalized to `+972501234567`
- `+972501234567` → used as-is

## ☁️ Deployment

### Backend → Render / Railway

1. Push to GitHub
2. Connect repo to Render/Railway
3. Set `Build Command`: `npm install && npm run build`
4. Set `Start Command`: `npm start`
5. Add all `.env` variables

### Frontend → Vercel

1. Push `client/` to GitHub (or use monorepo)
2. Import to Vercel
3. Set `Build Command`: `npm run build`
4. Set `Output Directory`: `dist`
5. Add env variable: `VITE_API_URL=https://your-backend.render.com`

### MongoDB → Atlas

1. Create free cluster at mongodb.com/atlas
2. Whitelist `0.0.0.0/0` for production (or specific IPs)
3. Copy connection string to `MONGODB_URI`

## 🛡️ Security Features

- JWT authentication (admin routes)
- Bcrypt password hashing (12 salt rounds)
- Rate limiting (global + RSVP-specific)
- Helmet.js security headers
- Input validation with Joi
- Duplicate submission prevention
- Token-based RSVP (no personal data in URL)

## 🎨 Tech Stack

**Backend:** Node.js, Express, TypeScript, MongoDB, Mongoose, JWT, Twilio, Joi, Helmet, express-rate-limit

**Frontend:** React 18, TypeScript, Vite, TailwindCSS, React Router v6, Axios, Recharts, React Hot Toast

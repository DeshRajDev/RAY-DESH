# Desh & Rey — Private Couple Sanctuary Backend API

A production-quality modular Express + TypeScript + MongoDB + Socket.IO backend built exclusively for a private couples sanctuary.

---

## 🏛 Architecture Overview

- **Runtime**: Node.js + Express + TypeScript
- **Database**: MongoDB with Mongoose ODM (connection pooling, indexes, schema validation)
- **Real-Time Layer**: Socket.IO with JWT authentication handshake and couple room isolation (`couple:${coupleId}`)
- **Security**: Argon2id/Bcrypt password hashing, HttpOnly JWT cookies, strict CORS, Helmet, Rate Limiting, Request ID tracking
- **Validation**: Zod schema request validation for all inputs and environment variables
- **Storage**: Pluggable storage engine (Local disk storage with static server & Cloudinary adapter)
- **Schedulers**: Node-cron jobs for 24h story expiration cleanup & automated birthday/anniversary reminders
- **Testing**: Vitest & Supertest automated test suites

---

## 📁 Directory Structure

```text
backend/
├── src/
│   ├── app.ts                 # Express application & middleware assembly
│   ├── server.ts              # HTTP & Socket.IO listener & DB bootstrap
│   ├── seed.ts                # Database seeder with Desh & Rey data
│   ├── config/
│   │   ├── env.ts             # Validated environment configuration (Zod)
│   │   ├── database.ts        # Mongoose connection manager with pooling
│   │   ├── cors.ts            # Strict CORS allowlist
│   │   └── storage.ts         # Multer & Cloudinary media processor
│   ├── middleware/
│   │   ├── authenticate.ts    # JWT token extraction & verification
│   │   ├── authorize.ts       # Strict couple boundary enforcement
│   │   ├── validate.ts        # Zod request schema validator
│   │   ├── rate-limit.ts      # Auth & API rate limiters
│   │   ├── request-id.ts      # UUID request tracking
│   │   └── error-handler.ts   # Centralized error handler
│   ├── models/                # Validated Mongoose Schemas & Indexes
│   │   ├── User.ts
│   │   ├── Couple.ts
│   │   ├── Message.ts
│   │   ├── Story.ts
│   │   ├── Post.ts
│   │   ├── Memory.ts
│   │   ├── MediaAsset.ts
│   │   ├── Favorite.ts
│   │   ├── Song.ts
│   │   ├── DateEvent.ts
│   │   ├── Birthday.ts
│   │   ├── BucketList.ts
│   │   ├── Trip.ts
│   │   ├── Place.ts
│   │   ├── Journal.ts
│   │   ├── LoveLetter.ts
│   │   ├── Milestone.ts
│   │   └── Notification.ts
│   ├── modules/               # Feature-based modular routes & controllers
│   │   ├── auth/
│   │   ├── users/
│   │   ├── couples/
│   │   ├── chat/
│   │   ├── stories/
│   │   ├── posts/
│   │   ├── memories/
│   │   ├── media/
│   │   ├── favorites/
│   │   ├── music/
│   │   ├── dates/
│   │   ├── birthdays/
│   │   ├── bucket-list/
│   │   ├── trips/
│   │   ├── places/
│   │   ├── journal/
│   │   ├── love-letters/
│   │   ├── timeline/
│   │   ├── notifications/
│   │   └── search/
│   ├── sockets/               # Real-time WebSocket handlers
│   │   ├── index.ts
│   │   └── chat.handler.ts
│   ├── jobs/                  # Background schedulers
│   │   └── scheduler.ts
│   ├── utils/                 # Cryptography, JWT, logger, and date math
│   │   ├── date-calculator.ts
│   │   ├── jwt.ts
│   │   ├── logger.ts
│   │   ├── password.ts
│   │   └── response.ts
│   └── types/                 # TypeScript domain models & request types
├── tests/                     # Automated Vitest & Supertest test suite
│   ├── auth.test.ts
│   ├── couple-isolation.test.ts
│   └── dates.test.ts
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your MongoDB instance is running (e.g. `mongodb://localhost:27017/couple_sanctuary`).

### 3. Seed Database with Desh & Rey Sanctuary
```bash
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```
The API server starts on **http://localhost:4000**.
Health check: `http://localhost:4000/health`
API Base: `http://localhost:4000/api/v1`

### 5. Run Automated Tests
```bash
npm run test
```

---

## 🔒 Security & Privacy Features
- **Couple Isolation**: Every protected route derives `coupleId` from the authenticated session. Cross-couple data access returns `403 Forbidden`.
- **Scheduled Letters**: Locked love letters with a future reveal date hide contents from the recipient until the scheduled timestamp.
- **Private Journal**: Personal entries marked `isPrivate: true` are only visible to their author.
- **WebSocket Scoping**: Socket events only emit to `couple:${coupleId}` rooms after JWT verification.

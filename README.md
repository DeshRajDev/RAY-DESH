# RAY-DESH — Private Sanctuary (Full-Stack) 💑✨

A full-stack web application with a Next.js frontend and an Express + TypeScript + MongoDB + Socket.IO backend built for a private couple experience.

---

## 🏗 Architecture & Tech Stack

- **Frontend**: Next.js (App Router, React 19, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons)
- **Backend**: Node.js, Express, TypeScript, MongoDB (Mongoose), Socket.IO
- **Realtime**: WebSockets for live chat, presence, notifications
- **Authentication**: JWT authentication with protected routes & couple isolation

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher)
- MongoDB running locally on `mongodb://127.0.0.1:27017` or a MongoDB Atlas URI

### 2. Backend Setup
1. Open terminal and navigate to backend:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
   *(On Windows PowerShell: `Copy-Item .env.example .env`)*
4. Seed initial database data (optional):
   ```bash
   npm run seed
   ```
5. Start backend development server:
   ```bash
   npm run dev
   ```
   Backend will be running at `http://localhost:4000`.

### 3. Frontend Setup
1. In the project root:
   ```bash
   npm install
   ```
2. Setup environment configuration:
   ```bash
   cp .env.example .env.local
   ```
   *(On Windows PowerShell: `Copy-Item .env.example .env.local`)*
   Ensure `NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1`.
3. Start frontend development server:
   ```bash
   npm run dev
   ```
   Frontend will be running at `http://localhost:3000`.

---

## 📦 Scripts Overview (Root)

From the root directory, you can also manage both services:

- `npm run dev`: Start Next.js frontend dev server (`localhost:3000`)
- `npm run build`: Build Next.js frontend for production
- `npm run start`: Start Next.js frontend production server
- `npm run backend:dev`: Start backend dev server with hot reload (`localhost:4000`)
- `npm run backend:build`: Compile backend TypeScript
- `npm run backend:start`: Run compiled backend server
- `npm run backend:seed`: Seed sample couple data into MongoDB
- `npm run backend:test`: Run backend test suite

---

## 🌐 Connecting Frontend & Backend

- The frontend communicates with the backend via `NEXT_PUBLIC_API_URL` configured in `src/services/api/client.ts`.
- Default API root: `http://localhost:4000/api/v1`
- Backend CORS is configured to allow `http://localhost:3000` by default.

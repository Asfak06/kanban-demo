# Real-Time Kanban Board (2-User Sync)

A real-time Kanban board where two users can collaborate on the same board with instant synchronization. Built with Next.js, Express, PostgreSQL, Socket.IO, and Prisma.

## Login Credentials

| User    | Username | Password |
| ------- | -------- | -------- |
| User A  | `usera`  | `password` |
| User B  | `userb`  | `password` |

Open two browser windows/tabs, log in as different users, and see changes sync in real time.

---

## Quick Start with Docker (Recommended)

**Prerequisites:** Docker and Docker Compose installed.

```bash
make up
```

This single command spins up PostgreSQL, the backend, and the frontend. Once ready:

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:4000

```bash
make down    # Stop all services
make clean   # Stop and remove volumes (fresh DB)
make logs    # Tail logs from all services
```

---

## Manual Setup

**Prerequisites:** Node.js 20.x, PostgreSQL running locally.

### 1. Database

Create a PostgreSQL database named `kanban`:

```sql
CREATE DATABASE kanban;
```

### 2. Backend

```bash
cd backend
cp .env.example .env     # Edit DATABASE_URL if needed
npm install
npx prisma db push
npm run dev
```

Backend runs on http://localhost:4000

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Frontend runs on http://localhost:3000

---

## Environment Variables

### Backend (`backend/.env`)

| Variable       | Default                                        | Description              |
| -------------- | ---------------------------------------------- | ------------------------ |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/kanban` | Primary DB connection string |
| `PORT`         | `4000`                                         | Server port              |
| `FRONTEND_URL` | `http://localhost:3000`                         | CORS allowed origin      |

### Using Supabase as Remote PostgreSQL

Set backend `.env` like this:

```dotenv
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-[REGION].pooler.supabase.com:5432/postgres?sslmode=require
PORT=4000
FRONTEND_URL=http://localhost:3000
```

- Use your Supabase connection string as `DATABASE_URL`.
- Then run:

```bash
cd backend
npx prisma db push
npm run dev
```

### Frontend (`frontend/.env.local`)

| Variable              | Default                  | Description         |
| --------------------- | ------------------------ | ------------------- |
| `NEXT_PUBLIC_API_URL`  | `http://localhost:4000`  | Backend API URL     |

---

## Architecture Overview

```
┌─────────────┐     REST API      ┌─────────────┐     Prisma      ┌────────────┐
│   Next.js   │ ──────────────▶   │   Express   │ ─────────────▶  │ PostgreSQL │
│  Frontend   │                   │   Backend   │                  │            │
│  (Port 3000)│ ◀──── Socket.IO ──│  (Port 4000)│                  │            │
└─────────────┘                   └─────────────┘                  └────────────┘
```

### Monorepo Structure

```
├── frontend/          # Next.js 14, App Router, TypeScript
│   ├── src/
│   │   ├── app/           # Next.js App Router pages
│   │   ├── components/    # React components (Board, Column, Card, etc.)
│   │   ├── stores/        # Zustand stores (auth, cards)
│   │   ├── lib/           # API client, Socket.IO client
│   │   └── types/         # Shared TypeScript types
│   └── ...
├── backend/           # Express + Socket.IO server
│   ├── src/
│   │   ├── controllers/   # Request handlers (auth, cards)
│   │   ├── routes/        # Express route definitions
│   │   ├── socket/        # Socket.IO setup (single file)
│   │   ├── config/        # Prisma client
│   │   └── types/         # TypeScript types
│   ├── prisma/            # Prisma schema & migrations
│   └── ...
├── docker-compose.yml
├── Makefile
└── README.md
```

---

## Database Schema

The database has a single `Card` table managed by Prisma:

| Field         | Type       | Notes                              |
| ------------- | ---------- | ---------------------------------- |
| `id`          | `UUID`     | Primary key, auto-generated        |
| `title`       | `String`   | Required                           |
| `description` | `String?`  | Optional                           |
| `status`      | `Enum`     | `TODO` / `DOING` / `DONE`         |
| `order`       | `Int`      | Position within column (0-indexed) |
| `updatedAt`   | `DateTime` | Auto-updated, used for conflict handling |
| `createdAt`   | `DateTime` | Auto-set on creation               |

Authentication is mocked with hardcoded users (no user table needed).

---

## API Endpoints

| Method  | Endpoint              | Description                          |
| ------- | --------------------- | ------------------------------------ |
| POST    | `/api/auth/login`     | Login with username/password         |
| GET     | `/api/cards`          | Fetch all cards (board data)         |
| POST    | `/api/cards`          | Create a new card                    |
| PUT     | `/api/cards/:id`      | Update card title/description        |
| PATCH   | `/api/cards/:id/move` | Move/reorder a card                  |

---

## Real-Time Communication Design

### Flow

1. **Initial load:** Frontend fetches all cards via `GET /api/cards`
2. **User action:** Frontend calls REST API (create/update/move)
3. **Server broadcasts:** After the DB write, the server emits a Socket.IO event to **all** connected clients
4. **Clients update:** Each client's Zustand store is updated by the socket event handler

### Socket Events

| Event           | Payload         | Trigger                        |
| --------------- | --------------- | ------------------------------ |
| `card:created`  | Single card     | After a card is created        |
| `card:updated`  | Single card     | After a card is edited         |
| `card:moved`    | All cards array | After a card is moved/reordered |

`card:moved` sends the full board state to guarantee ordering consistency across clients — since a single move can shift the order of multiple cards.

Socket connections are identified by `userId` passed as a query parameter during handshake.

---

## Conflict Handling Strategy: Last Write Wins

### Approach

This project uses the **Last Write Wins (LWW)** strategy for conflict resolution.

Every card has an `updatedAt` timestamp managed by Prisma's `@updatedAt` directive. When two users edit the same card concurrently, the last write to reach the server overwrites the previous one. The server broadcasts the latest state to all clients, ensuring they converge to the same view.

### Why LWW?

- **Simplicity:** No version tracking, no 409 rejections, no lock management
- **User experience:** Both users' actions succeed — no confusing error modals
- **Suitability:** For a 2-user Kanban board, the chance of true simultaneous edits on the same card is low. LWW is the pragmatic choice

### Trade-offs

| Pros | Cons |
| ---- | ---- |
| Simple implementation | Last edit silently overwrites earlier ones |
| No failed requests for users | No notification that another user edited the same card |
| Always converges to consistent state | In rare cases, a user's changes may be lost |

For this 2-user scenario, LWW provides the best balance of simplicity and correctness. If more granular conflict handling were needed (e.g., many concurrent editors), optimistic locking with version numbers or operational transforms would be more appropriate.

---

## Tech Stack

| Layer      | Technology                                  |
| ---------- | ------------------------------------------- |
| Frontend   | Next.js 14, React 18, TypeScript, Tailwind CSS |
| State      | Zustand (module-wise stores)                |
| Drag & Drop| @hello-pangea/dnd                           |
| Backend    | Node.js, Express                            |
| Real-Time  | Socket.IO                                   |
| ORM        | Prisma                                      |
| Database   | PostgreSQL                                  |
| DevOps     | Docker, Docker Compose, Makefile            |

---

## Stretch Question

> If this system needed to support 100,000 concurrent users, what would you change first and why?

**1. Horizontally scale the WebSocket layer with Redis adapter.**
Socket.IO alone runs in a single Node process. With 100K users, I'd add the `@socket.io/redis-adapter` so multiple server instances can broadcast events to all clients via a shared Redis pub/sub channel. This is the single most impactful change because the WebSocket layer is the bottleneck — REST APIs are inherently stateless and easier to scale behind a load balancer.

**2. Connection-based architecture changes:**
- **Sticky sessions** (via IP hash or cookie) on the load balancer so that Socket.IO's long-polling fallback works correctly.
- **Room-based broadcasting** — instead of broadcasting to all connected sockets, scope events to board-specific rooms. This avoids sending irrelevant updates.

**3. Database optimization:**
- Add indexes on `(status, order)` for fast column queries.
- Consider **read replicas** for the `GET /api/cards` endpoint.
- Use **connection pooling** (e.g., PgBouncer) since each Node process would otherwise hold its own pool.

**4. Rate limiting & batching:**
- Debounce rapid drag-and-drop events on the client to reduce API calls.
- Add API rate limiting to protect the server.

The first change (Redis adapter for Socket.IO) delivers the largest impact because it transforms the single-process WebSocket server into a horizontally scalable cluster, which is the primary constraint at 100K users.

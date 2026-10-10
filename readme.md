# Project & Task Management API

REST API for managing users, projects, and tasks, built with Node.js, TypeScript, and Express.

## 1. Overview

- **Runtime / framework:** Node.js 20+ with Express 4 and TypeScript (strict mode).
- **Users & projects:** MySQL via **Prisma** (`src/modules/auth`, `src/modules/projects`).
- **Tasks:** MongoDB via **Mongoose** (`src/modules/tasks`).
- **Auth:** JWT bearer tokens (`Authorization: Bearer <token>`, or the `x-access-token` header/cookie) with **bcryptjs** password hashing. Passwords are never returned by the API.
- **Validation:** rule-based validator wrapper returning `string[]` error lists.
- **Docs:** Swagger UI (swagger-jsdoc + swagger-ui-express) at `/api-docs`.
- **Hardening:** helmet, CORS, cookie-parser, and an express-rate-limit instance mounted on `/api/auth`.

Every response uses a single envelope:

```json
{ "success": true,  "message": "…", "data": … }
{ "success": false, "message": "…", "data": null }
```

`data` on errors is either `null` or a `string[]` of validation messages (and, for the project-delete 409, an object such as `{ "taskCount": 3 }`).

## 2. Prerequisites

- **Node.js 20 or newer** (npm or pnpm)
- **MySQL 8** (XAMPP works) reachable through `DATABASE_URL`
- **MongoDB 6+** running on `MONGODB_URI` (default `mongodb://127.0.0.1:27017/project_task_db`)

## 3. Installation

```bash
npm install          # or: pnpm install
cp .env.example .env # then edit the values (see section 6)
```

## 4. MySQL setup (Prisma)

```bash
# 1. Create the database (example using the mysql client):
mysql -u root -e "CREATE DATABASE project_task_api CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. Make sure DATABASE_URL in .env points at that database, then:
npm run prisma:generate
npm run prisma:migrate -- --name init
```

`prisma:generate` creates the Prisma client; `prisma:migrate` applies `prisma/migrations` to create the `users` and `projects` tables.

## 5. MongoDB setup (Mongoose)

```bash
# ensure mongod is running, e.g.
mongod --dbpath /path/to/data
```

Set `MONGODB_URI` in `.env` (default `mongodb://127.0.0.1:27017/project_task_db`). The app connects at startup. Tasks live in the `tasks` collection.

## 6. Environment variables

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | HTTP port the server listens on | `3000` |
| `NODE_ENV` | Runtime mode: `development`, `test`, or `production` | `development` |
| `DATABASE_URL` | MySQL connection string used by Prisma, e.g. `mysql://root:@localhost:3306/project_task_api` | *(required, no default)* |
| `MONGODB_URI` | MongoDB connection string used by Mongoose | `mongodb://127.0.0.1:27017/project_task_db` |
| `JWT_SECRET` | Secret used to sign/verify JWTs — **must be at least 32 characters** | *(required, no default)* |
| `JWT_EXPIRES_IN` | Default token lifetime (e.g. `1d`, `7d`) | `1d` |
| `CORS_ORIGIN` | Comma-separated list of allowed origins; empty allows any origin | *(empty)* |
| `RATE_LIMIT_WINDOW_MS` | Rate-limit window for `/api/auth` in milliseconds | `900000` (15 min) |
| `RATE_LIMIT_MAX` | Max requests per window on `/api/auth` | `500` |

Extra (not in `.env.example`): `SEED_ALLOW_WIPE=true` **must** be set to run `npm run seed:mongo` — it wipes the `tasks` collection first, so the seed refuses to run without this explicit opt-in.

## 7. Seeding

```bash
npm run seed:prisma                          # users + projects (idempotent upserts)
SEED_ALLOW_WIPE=true npm run seed:mongo      # wipes tasks, then re-seeds tasks
# or both in one go:
SEED_ALLOW_WIPE=true npm run seed
```

Demo login after seeding:

| Field | Value |
| --- | --- |
| Email | `demo@example.com` |
| Password | `password123` |

(A second user, `jane@example.com` / `password123`, is also seeded with its own projects.)

## 8. Running

```bash
npm run dev             # hot reload via ts-node-dev
npm run build && npm start   # tsc → dist/, then node dist/index.js
npm run lint            # eslint .
```

The server refuses to start unless `JWT_SECRET` (≥32 chars) and `DATABASE_URL` are set, and it connects to both databases before listening. Health check: `GET /api/health`.

## 9. API reference

Interactive Swagger UI: **`/api-docs`** · Raw spec: **`/api-docs.json`**

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/health` | — | Liveness check |
| POST | `/api/auth/register` | — | Register a user (201) |
| POST | `/api/auth/login` | — | Login, returns JWT (200) |
| GET | `/api/auth/me` | Bearer | Current user profile |
| PUT | `/api/auth/profile` | Bearer | Update name/email/password |
| GET | `/api/projects` | Bearer | List own projects (paginated, `status` filter) |
| POST | `/api/projects` | Bearer | Create a project (201) |
| GET | `/api/projects/:id` | Bearer | Get one project |
| PUT | `/api/projects/:id` | Bearer | Update a project |
| DELETE | `/api/projects/:id` | Bearer | Delete a project (409 if it still has tasks) |
| GET | `/api/tasks` | Bearer | List own tasks (paginated, `status`/`priority`/`projectId` filters) |
| POST | `/api/tasks` | Bearer | Create a task (201) |
| GET | `/api/tasks/:id` | Bearer | Get one task |
| PUT | `/api/tasks/:id` | Bearer | Update a task |
| DELETE | `/api/tasks/:id` | Bearer | Delete a task |
| GET | `/api/dashboard` | Bearer | Project/task statistics |

All `/api/projects`, `/api/tasks`, and `/api/dashboard` routes require `Authorization: Bearer <token>`. Project/task reads, updates, and deletes are scoped to the signed-in user: another user's resource answers `404`, never data.

### Sample requests and responses

**Register** — `POST /api/auth/register`

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada Lovelace","email":"ada@example.com","password":"password123"}'
```

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { "id": 5, "name": "Ada Lovelace", "email": "ada@example.com", "createdAt": "2026-10-10T09:00:00.000Z" },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
  }
}
```

Duplicate email → `409 { "success": false, "message": "Email already registered", "data": null }`;
weak/missing fields → `422` with `data` as a `string[]`. The password is never echoed back.

**Login** — `POST /api/auth/login`

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"password123"}'
```

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "id": 1, "name": "Demo User", "email": "demo@example.com", "createdAt": "2026-10-10T08:00:00.000Z" },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…"
  }
}
```

Wrong password **and** unknown email both answer `401` with the identical message `"Invalid email or password"` (no user enumeration).

**Create project** — `POST /api/projects` (Bearer required)

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Website Redesign","description":"Refresh the marketing site","status":"active"}'
```

```json
{
  "success": true,
  "message": "Project created",
  "data": { "id": 5, "name": "Website Redesign", "description": "Refresh the marketing site", "status": "active", "userId": 1, "createdAt": "2026-10-10T09:05:00.000Z", "updatedAt": "2026-10-10T09:05:00.000Z" }
}
```

`name` is required (2–150 chars); `name: null`, `status: null`, or an unknown `status` answer `422` — they are never stored as the string `"null"`.

**Create task** — `POST /api/tasks` (Bearer required)

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Build login","projectId":1,"status":"todo","priority":"high","dueDate":null}'
```

```json
{
  "success": true,
  "message": "Task created",
  "data": { "_id": "65f1c0a2e4b0a1b2c3d4e5f6", "title": "Build login", "description": "", "status": "todo", "priority": "high", "dueDate": null, "projectId": 1, "userId": 1, "createdAt": "2026-10-10T09:10:00.000Z", "updatedAt": "2026-10-10T09:10:00.000Z" }
}
```

`title` (1–200) and `projectId` are required; `projectId` must be a project **owned by the caller** (`404` otherwise); `dueDate` is nullable; unknown `status`/`priority` answer `422`.

**List tasks with filters** — `GET /api/tasks?status=todo&priority=high&projectId=1&page=1&limit=10` (Bearer required)

```json
{
  "success": true,
  "message": "Tasks retrieved",
  "data": {
    "items": [
      { "_id": "65f1c0a2e4b0a1b2c3d4e5f6", "title": "Build login", "status": "todo", "priority": "high", "dueDate": null, "projectId": 1, "userId": 1 }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
  }
}
```

Invalid enum filter values (e.g. `?status=bogus`) answer `422`. Project list (`GET /api/projects`) uses the same pagination shape.

**Dashboard** — `GET /api/dashboard` (Bearer required)

```json
{
  "success": true,
  "message": "Dashboard statistics retrieved",
  "data": {
    "totalProjects": 4,
    "activeProjects": 2,
    "completedProjects": 1,
    "totalTasks": 10,
    "pendingTasks": 7,
    "completedTasks": 3,
    "highPriorityTasks": 4
  }
}
```

## 10. Design notes

- **Why two databases:** the assessment requires projects/users in relational storage (Prisma/MySQL, with unique email constraints, relations, and cascading deletes) while tasks are document-oriented (Mongoose/MongoDB) — the dashboard then aggregates counts from both.
- **Cross-DB ownership check on tasks:** a task's `projectId` refers to a MySQL `Project.id`. Creating/updating a task runs `assertProjectOwned(projectId, userId)` against Prisma first, so no task can point at a project the caller does not own; task queries themselves are always filtered by `userId` in MongoDB, so another user's task is a `404`.
- **Project-delete 409 guard:** because tasks live in another database, MySQL cannot cascade them. `DELETE /api/projects/:id` counts Mongo tasks with that `projectId` and answers `409` with `{ "taskCount": n }` and message `"Cannot delete project: it is already in use by tasks"` instead of orphaning documents.
- **Pagination shape:** list endpoints accept `page`/`limit` and return `data: { items, pagination: { page, limit, total, totalPages } }`. `limit` is capped at 100, `page` is floored and min 1, and `totalPages = ceil(total / limit)`.
- **Uniform errors:** everything flows through one Express error handler that serializes `HttpError` (status + message + `data`) and Prisma/Mongoose/JWT failures into the same `{ success, message, data }` envelope — including `400` for malformed numeric/ObjectIds, `401` for bad tokens, `404` for cross-user access, `409` for conflicts, and `422` for validation.

# Project Task API

Project & Task management API with **dual databases**:

- **MySQL** via [Prisma](https://www.prisma.io/) — users, projects, tasks (relational core)
- **MongoDB** via [Mongoose](https://mongoosejs.com/) — activity logs, notifications (flexible documents)

Built on Express 5 + TypeScript (CommonJS), modeled on the Propertist backend architecture.

## Prerequisites

- Node.js >= 18
- pnpm
- MySQL 8+
- MongoDB (local or Atlas)

## Setup

```bash
pnpm install
cp example.env .env       # then set DATABASE_URL, MONGODB_URI, JWT_SECRET
pnpm run create-db        # prisma db push (creates MySQL tables)
pnpm run prisma-generate  # generate Prisma Client
pnpm run dev              # start dev server (nodemon + ts-node)
```

## Scripts

| Script | Description |
|---|---|
| `pnpm run dev` | Dev server with hot reload |
| `pnpm run build` | `prisma generate` + compile TypeScript to `dist/` |
| `pnpm start` | Run compiled build |
| `pnpm run create-db` | Push Prisma schema to MySQL (`prisma db push`) |
| `pnpm run prisma-generate` | Regenerate Prisma Client |
| `pnpm typecheck` | Type-check without emitting |

## Environment Variables

```bash
DATABASE_URL="mysql://user:pass@localhost:3306/project_task_api"   # Prisma (MySQL)
MONGODB_URI="mongodb://localhost:27017/project_task_api"           # Mongoose (MongoDB)
JWT_SECRET="your_jwt_secret_key"
PORT=3000
```

## Project Structure

```
├── bin/www.ts                    # HTTP server bootstrap (connects Mongo, listens)
├── index.ts                      # App factory: middleware, routes, error handlers
├── libs/
│   ├── config/
│   │   ├── prismaClient.ts       # Prisma singleton (hot-reload safe)
│   │   ├── mongoose.ts           # Mongoose connection singleton
│   │   ├── jwt.ts                # signToken / verifyToken
│   │   └── swagger.ts            # OpenAPI 3.0 + /api-docs
│   ├── helper/validator.ts       # validatorjs wrapper
│   └── middleware/
│       ├── verifyToken.ts        # JWT auth (x-access-token header/cookie)
│       └── guestMiddleware.ts    # optional auth
├── prisma/schema.prisma          # MySQL: User, Project, ProjectMember, Task
└── src/Module/
    ├── auth/                     # MySQL — register/login/me
    ├── project/                  # MySQL — project CRUD
    ├── task/                     # MySQL — task CRUD per project
    ├── log/                      # MongoDB — activity logs (TTL 30d)
    └── notification/             # MongoDB — user notifications
```

## API Endpoints

Auth: send JWT in `x-access-token` header.

| Method | Path | Auth | DB | Description |
|---|---|---|---|---|
| GET | `/health` | — | Both | Pings MySQL (`SELECT 1`) + Mongo readyState |
| GET | `/api-docs` | — | — | Swagger UI |
| POST | `/api/v1/auth/register` | — | MySQL | Register (name, email, password) |
| POST | `/api/v1/auth/login` | — | MySQL | Login → JWT (24h) |
| GET | `/api/v1/auth/me` | JWT | MySQL | Current user |
| GET | `/api/v1/project` | JWT | MySQL | My projects (paginated) |
| POST | `/api/v1/project` | JWT | MySQL | Create project |
| GET | `/api/v1/project/:id` | JWT | MySQL | Project detail + tasks |
| PUT | `/api/v1/project/:id` | JWT | MySQL | Update (owner only) |
| DELETE | `/api/v1/project/:id` | JWT | MySQL | Delete (owner only) |
| GET | `/api/v1/task/project/:projectId` | JWT | MySQL | List tasks (filter `?status=`) |
| POST | `/api/v1/task/project/:projectId` | JWT | MySQL | Create task |
| PUT | `/api/v1/task/:id` | JWT | MySQL | Update task |
| DELETE | `/api/v1/task/:id` | JWT | MySQL | Delete task |
| GET | `/api/v1/log` | JWT | **Mongo** | My activity logs (filter `?entityType=`) |
| POST | `/api/v1/log` | JWT | **Mongo** | Record an activity log |
| GET | `/api/v1/notification` | JWT | **Mongo** | My notifications (`?unread=true`) |
| POST | `/api/v1/notification` | JWT | **Mongo** | Create notification |
| PATCH | `/api/v1/notification/:id/read` | JWT | **Mongo** | Mark as read |

## Response Envelope

All responses follow:

```json
{ "success": true, "message": "...", "data": [], "pagination": { "page": 1, "limit": 10, "total": 0, "totalPages": 1 } }
```

## Notes

- Validation rules use Laravel-style strings via `validatorjs`; the `nullable` prefix is handled by `libs/helper/validator.ts` (stripped + skipped when the value is absent).
- Passwords are hashed with **bcryptjs**.
- Mongoose connects eagerly at boot (`bin/www.ts`); Prisma connects lazily on first query.
- `/health` returns 503 if either database is unreachable.

# Project & Task Management API

Express + TypeScript backend based on the supplied `src(3).zip` structure and assessment document.

## Database decision
- Users and projects: MySQL through Prisma.
- Tasks: MongoDB through Mongoose, matching the assessment's explicit task-management requirement.
- Dashboard combines MySQL project counts and MongoDB task counts.

## Setup
1. Install Node.js 20+ and run `npm install`.
2. Copy `.env.example` to `.env` and configure MySQL, MongoDB, and a random JWT secret (minimum 32 characters).
3. Ensure the MySQL database named in `DATABASE_URL` exists.
4. Run `npm run prisma:generate`.
5. Run `npm run prisma:migrate -- --name init`.
6. Run `npm run dev`.

The server requires both databases at startup. API base URL defaults to `http://localhost:3000`. Swagger UI is at `/api-docs`.

## Authentication
Pass JWT using `Authorization: Bearer <token>` (also accepts `x-access-token` for compatibility with the existing code).

## Endpoints
- `POST /api/auth/register` body `{ "name": "Kunal", "email": "kunal@example.com", "password": "StrongPassword123" }`
- `POST /api/auth/login` body `{ "email": "kunal@example.com", "password": "StrongPassword123" }`
- `GET /api/auth/me`
- `PUT /api/auth/profile` body can include `name`, `email`, and/or `password`
- `POST /api/projects` body `{ "name": "Website", "description": "Project details", "status": "active" }`
- `GET /api/projects?page=1&limit=10&status=active`
- `GET /api/projects/:id`, `PUT /api/projects/:id`, `DELETE /api/projects/:id`
- `POST /api/tasks` body `{ "title": "Build login", "projectId": 1, "status": "todo", "priority": "high" }`
- `GET /api/tasks?page=1&limit=10&status=todo&priority=high&projectId=1`
- `GET /api/tasks/:id`, `PUT /api/tasks/:id`, `DELETE /api/tasks/:id`
- `GET /api/dashboard`
- `GET /api/health`

All project/task/dashboard endpoints are authenticated. Project and task reads/updates/deletes are scoped to the signed-in user. Task project IDs refer to MySQL Project IDs.

## Responses
Success: `{ "success": true, "message": "...", "data": ... }`
Error: `{ "success": false, "message": "...", "data": ... }`

## Important
The uploaded source ZIP did not include `index.ts`, `package.json`, `tsconfig.json`, or a Prisma schema. These are supplied here to make a complete project scaffold. The schema is copied from the separately supplied `schema(2).prisma`. Run the build and test endpoints in your environment before submission.

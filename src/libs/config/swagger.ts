import { Express, Request, Response } from "express";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const bearerAuth = { bearerAuth: [] } as Record<string, string[]>;
const errorResponse = {
  type: "object",
  properties: {
    success: { type: "boolean", example: false },
    message: { type: "string", example: "Validation failed" },
    data: {
      oneOf: [
        { type: "null" },
        {
          type: "array",
          items: { type: "string" },
          example: ["The name field is required."],
        },
      ],
    },
  },
};

const pagination = {
  type: "object",
  properties: {
    page: { type: "integer", example: 1 },
    limit: { type: "integer", example: 10 },
    total: { type: "integer", example: 42 },
    totalPages: { type: "integer", example: 5 },
  },
};

const user = {
  type: "object",
  properties: {
    id: { type: "integer", example: 1 },
    name: { type: "string", example: "Demo User" },
    email: { type: "string", format: "email", example: "demo@example.com" },
    createdAt: { type: "string", format: "date-time" },
  },
};

const project = {
  type: "object",
  properties: {
    id: { type: "integer", example: 1 },
    name: { type: "string", example: "Website Redesign" },
    description: {
      type: "string",
      nullable: true,
      example: "Refresh marketing site design and copy",
    },
    status: {
      type: "string",
      enum: ["active", "completed", "archived"],
      example: "active",
    },
    userId: { type: "integer", example: 1 },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const task = {
  type: "object",
  properties: {
    _id: { type: "string", example: "65f1c0a2e4b0a1b2c3d4e5f6" },
    title: { type: "string", example: "Design new homepage" },
    description: { type: "string", example: "Hero, features, and CTA sections" },
    status: {
      type: "string",
      enum: ["todo", "in_progress", "completed"],
      example: "in_progress",
    },
    priority: {
      type: "string",
      enum: ["low", "medium", "high"],
      example: "high",
    },
    dueDate: {
      type: "string",
      format: "date-time",
      nullable: true,
      example: "2026-10-17T00:00:00.000Z",
    },
    projectId: { type: "integer", example: 1 },
    userId: { type: "integer", example: 1 },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const ok = (description: string, schema: object) => ({
  description,
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Success" },
          data: schema,
        },
      },
    },
  },
});

const unauthorized = {
  description: "Missing, invalid, or expired token",
  content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
};

const rateLimited = {
  description: "Too many requests to /api/auth (rate limit exceeded)",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
      example: {
        success: false,
        message: "Too many requests, please try again later",
        data: null,
      },
    },
  },
};

const notFound = (message: string) => ({
  description: message,
  content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
});

const conflict = (message: string, data: object | null = null) => ({
  description: message,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
      example: { success: false, message, data },
    },
  },
});

const unprocessable = (example: string) => ({
  description: "Validation failed",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
      example: { success: false, message: "Validation failed", data: [example] },
    },
  },
});

const secured = [bearerAuth];

const options: swaggerJsDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Project Task API",
      version: "1.0.0",
      description: [
        "Project & Task management API with dual databases (MySQL via Prisma for users/projects, MongoDB via Mongoose for tasks).",
        "",
        "**Authentication:** obtain a token from `POST /api/auth/login`, then send it as `Authorization: Bearer <token>`.",
        "The token may also be sent in the `x-access-token` header or as an `x-access-token` cookie.",
        "",
        "**Responses:** every endpoint returns `{ success, message, data }`.",
        "List endpoints return `{ items, pagination }` in `data`.",
      ].join("\n"),
    },
    servers: [
      { url: "http://localhost:3000", description: "Local (default PORT)" },
      { url: "/", description: "Same origin" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Error: errorResponse,
        Pagination: pagination,
        User: user,
        Project: project,
        Task: task,
      },
    },
    tags: [
      { name: "Health", description: "Service health checks" },
      { name: "Auth", description: "Registration, login, and profile (MySQL)" },
      { name: "Projects", description: "CRUD for projects (MySQL)" },
      { name: "Tasks", description: "CRUD for tasks (MongoDB)" },
      { name: "Dashboard", description: "Aggregated statistics (MySQL + MongoDB)" },
    ],
    paths: {
      "/api/health": {
        get: {
          tags: ["Health"],
          summary: "Health check",
          security: [],
          responses: {
            200: ok("API is healthy", {
              type: "object",
              properties: { success: { type: "boolean" }, message: { type: "string" } },
            }),
          },
        },
      },
      "/api/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register a new user",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "email", "password"],
                  properties: {
                    name: { type: "string", minLength: 2, maxLength: 100, example: "Demo User" },
                    email: { type: "string", format: "email", example: "demo@example.com" },
                    password: { type: "string", minLength: 8, example: "password123" },
                  },
                },
              },
            },
          },
          responses: {
            201: ok("Registration successful", {
              type: "object",
              properties: {
                user: { $ref: "#/components/schemas/User" },
                token: { type: "string" },
              },
            }),
            409: conflict("Email already registered"),
            422: unprocessable("The email field must be a valid email address."),
            429: rateLimited,
          },
        },
      },
      "/api/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login and receive a JWT",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email", example: "demo@example.com" },
                    password: { type: "string", example: "password123" },
                  },
                },
              },
            },
          },
          responses: {
            200: ok("Login successful", {
              type: "object",
              properties: {
                user: { $ref: "#/components/schemas/User" },
                token: { type: "string" },
              },
            }),
            401: notFound("Invalid email or password"),
            422: unprocessable("The email field must be a valid email address."),
            429: rateLimited,
          },
        },
      },
      "/api/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Get the authenticated user's profile",
          security: secured,
          responses: {
            200: ok("Success", { $ref: "#/components/schemas/User" }),
            401: unauthorized,
            404: notFound("User not found"),
            429: rateLimited,
          },
        },
      },
      "/api/auth/profile": {
        put: {
          tags: ["Auth"],
          summary: "Update the authenticated user's profile",
          description: "Provide at least one of name, email, or password.",
          security: secured,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  minProperties: 1,
                  properties: {
                    name: { type: "string", minLength: 2, maxLength: 100, example: "Demo User" },
                    email: { type: "string", format: "email", example: "demo@example.com" },
                    password: { type: "string", minLength: 8, example: "newpassword123" },
                  },
                },
              },
            },
          },
          responses: {
            200: ok("Profile updated", { $ref: "#/components/schemas/User" }),
            401: unauthorized,
            409: conflict("Email already registered"),
            422: unprocessable("Provide name, email, or password to update"),
            429: rateLimited,
          },
        },
      },
      "/api/projects": {
        get: {
          tags: ["Projects"],
          summary: "List the authenticated user's projects",
          security: secured,
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 10 } },
            {
              name: "status",
              in: "query",
              schema: { type: "string", enum: ["active", "completed", "archived"] },
            },
          ],
          responses: {
            200: ok("Projects retrieved", {
              type: "object",
              properties: {
                items: { type: "array", items: { $ref: "#/components/schemas/Project" } },
                pagination: { $ref: "#/components/schemas/Pagination" },
              },
            }),
            401: unauthorized,
            422: unprocessable("The selected status is invalid."),
          },
        },
        post: {
          tags: ["Projects"],
          summary: "Create a project",
          security: secured,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name"],
                  properties: {
                    name: { type: "string", minLength: 2, maxLength: 150, example: "Website Redesign" },
                    description: {
                      type: "string",
                      nullable: true,
                      example: "Refresh marketing site design and copy",
                    },
                    status: {
                      type: "string",
                      enum: ["active", "completed", "archived"],
                      default: "active",
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: ok("Project created", { $ref: "#/components/schemas/Project" }),
            401: unauthorized,
            422: unprocessable("The name field must be 2 to 150 characters."),
          },
        },
      },
      "/api/projects/{id}": {
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer", example: 1 } },
        ],
        get: {
          tags: ["Projects"],
          summary: "Get a project by ID",
          security: secured,
          responses: {
            200: ok("Project retrieved", { $ref: "#/components/schemas/Project" }),
            400: notFound("Invalid project ID"),
            401: unauthorized,
            404: notFound("Project not found"),
          },
        },
        put: {
          tags: ["Projects"],
          summary: "Update a project",
          description: "Provide at least one of name, description, or status.",
          security: secured,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  minProperties: 1,
                  properties: {
                    name: { type: "string", minLength: 2, maxLength: 150, example: "Website Redesign v2" },
                    description: { type: "string", nullable: true },
                    status: { type: "string", enum: ["active", "completed", "archived"] },
                  },
                },
              },
            },
          },
          responses: {
            200: ok("Project updated", { $ref: "#/components/schemas/Project" }),
            400: notFound("Invalid project ID"),
            401: unauthorized,
            404: notFound("Project not found"),
            422: unprocessable("No valid fields supplied"),
          },
        },
        delete: {
          tags: ["Projects"],
          summary: "Delete a project",
          security: secured,
          responses: {
            200: ok("Project deleted", { type: "null" }),
            400: notFound("Invalid project ID"),
            401: unauthorized,
            404: notFound("Project not found"),
            409: {
              description: "Project still has tasks",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Error" },
                  example: {
                    success: false,
                    message: "Cannot delete project: it is already in use by tasks",
                    data: { taskCount: 3 },
                  },
                },
              },
            },
          },
        },
      },
      "/api/tasks": {
        get: {
          tags: ["Tasks"],
          summary: "List the authenticated user's tasks",
          security: secured,
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 10 } },
            {
              name: "status",
              in: "query",
              schema: { type: "string", enum: ["todo", "in_progress", "completed"] },
            },
            {
              name: "priority",
              in: "query",
              schema: { type: "string", enum: ["low", "medium", "high"] },
            },
            { name: "projectId", in: "query", schema: { type: "integer", minimum: 1 } },
          ],
          responses: {
            200: ok("Tasks retrieved", {
              type: "object",
              properties: {
                items: { type: "array", items: { $ref: "#/components/schemas/Task" } },
                pagination: { $ref: "#/components/schemas/Pagination" },
              },
            }),
            401: unauthorized,
            422: unprocessable("The selected status is invalid."),
          },
        },
        post: {
          tags: ["Tasks"],
          summary: "Create a task",
          security: secured,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["title", "projectId"],
                  properties: {
                    title: { type: "string", minLength: 1, maxLength: 200, example: "Design new homepage" },
                    description: { type: "string", maxLength: 2000, example: "Hero, features, and CTA" },
                    status: {
                      type: "string",
                      enum: ["todo", "in_progress", "completed"],
                      default: "todo",
                    },
                    priority: {
                      type: "string",
                      enum: ["low", "medium", "high"],
                      default: "medium",
                    },
                    dueDate: {
                      oneOf: [{ type: "string", format: "date-time" }, { type: "null" }],
                      example: "2026-10-17",
                    },
                    projectId: { type: "integer", minimum: 1, example: 1 },
                  },
                },
              },
            },
          },
          responses: {
            201: ok("Task created", { $ref: "#/components/schemas/Task" }),
            401: unauthorized,
            404: notFound("Project not found or not owned by user"),
            422: unprocessable("The projectId format is invalid."),
          },
        },
      },
      "/api/tasks/{id}": {
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            example: "65f1c0a2e4b0a1b2c3d4e5f6",
          },
        ],
        get: {
          tags: ["Tasks"],
          summary: "Get a task by ID",
          security: secured,
          responses: {
            200: ok("Task retrieved", { $ref: "#/components/schemas/Task" }),
            400: notFound("Invalid task ID"),
            401: unauthorized,
            404: notFound("Task not found"),
          },
        },
        put: {
          tags: ["Tasks"],
          summary: "Update a task",
          description:
            "Provide at least one of title, description, status, priority, dueDate, or projectId.",
          security: secured,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  minProperties: 1,
                  properties: {
                    title: { type: "string", minLength: 1, maxLength: 200 },
                    description: { type: "string", maxLength: 2000 },
                    status: { type: "string", enum: ["todo", "in_progress", "completed"] },
                    priority: { type: "string", enum: ["low", "medium", "high"] },
                    dueDate: {
                      oneOf: [{ type: "string", format: "date-time" }, { type: "null" }],
                    },
                    projectId: { type: "integer", minimum: 1 },
                  },
                },
              },
            },
          },
          responses: {
            200: ok("Task updated", { $ref: "#/components/schemas/Task" }),
            400: notFound("Invalid task ID"),
            401: unauthorized,
            404: notFound("Task not found"),
            422: unprocessable("No valid fields supplied"),
          },
        },
        delete: {
          tags: ["Tasks"],
          summary: "Delete a task",
          security: secured,
          responses: {
            200: ok("Task deleted", { type: "null" }),
            400: notFound("Invalid task ID"),
            401: unauthorized,
            404: notFound("Task not found"),
          },
        },
      },
      "/api/dashboard": {
        get: {
          tags: ["Dashboard"],
          summary: "Get project/task statistics for the authenticated user",
          security: secured,
          responses: {
            200: ok("Success", {
              type: "object",
              properties: {
                totalProjects: { type: "integer", example: 4 },
                activeProjects: { type: "integer", example: 2 },
                completedProjects: { type: "integer", example: 1 },
                totalTasks: { type: "integer", example: 10 },
                pendingTasks: { type: "integer", example: 7 },
                completedTasks: { type: "integer", example: 3 },
                highPriorityTasks: { type: "integer", example: 4 },
              },
            }),
            401: unauthorized,
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsDoc(options);

export function swaggerSetup(app: Express): void {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/api-docs.json", (req: Request, res: Response) => {
    res.json(swaggerSpec);
  });
}

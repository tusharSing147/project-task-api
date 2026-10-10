import { Express, Request, Response } from "express";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options: swaggerJsDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Project Task API",
      version: "1.0.0",
      description:
        "Project & Task management API with dual databases (MySQL + MongoDB)",
    },
    servers: [
      {
        url: "/",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "apiKey",
          in: "header",
          name: "x-access-token",
        },
      },
    },
    tags: [
      { name: "Health", description: "Service health checks" },
      { name: "Auth", description: "Authentication (MySQL)" },
      { name: "Project", description: "Projects (MySQL)" },
      { name: "Task", description: "Tasks (MySQL)" },
      { name: "Log", description: "Activity logs (MongoDB)" },
      { name: "Notification", description: "Notifications (MongoDB)" },
    ],
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

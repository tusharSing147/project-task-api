import "dotenv/config";
import mongoose from "mongoose";
import { prisma } from "../libs/config/prismaClient";
import { connectMongo } from "../libs/config/mongoose";
import { Task } from "../libs/config/schema";

type TaskSeed = {
  title: string;
  description?: string;
  status?: "todo" | "in_progress" | "completed";
  priority?: "low" | "medium" | "high";
  dueDate?: number | null; // days from now
};

const DAY = 24 * 60 * 60 * 1000;

const tasksByProject: Record<string, TaskSeed[]> = {
  "Website Redesign": [
    {
      title: "Audit current pages",
      description: "List pages to keep, rewrite, or drop",
      status: "completed",
      priority: "high",
      dueDate: -3,
    },
    {
      title: "Design new homepage",
      description: "Hero, features, and CTA sections",
      status: "in_progress",
      priority: "high",
      dueDate: 2,
    },
    {
      title: "Implement responsive nav",
      status: "todo",
      priority: "medium",
      dueDate: 5,
    },
  ],
  "Mobile App Launch": [
    {
      title: "Finalize onboarding flow",
      status: "in_progress",
      priority: "high",
      dueDate: 3,
    },
    {
      title: "App store listing assets",
      description: "Screenshots and copy for both stores",
      status: "todo",
      priority: "medium",
      dueDate: 7,
    },
    {
      title: "Crash reporting setup",
      status: "todo",
      priority: "low",
      dueDate: null,
    },
  ],
  "Q4 Marketing Campaign": [
    {
      title: "Write campaign brief",
      status: "completed",
      priority: "high",
      dueDate: -10,
    },
    {
      title: "Schedule social posts",
      status: "completed",
      priority: "medium",
      dueDate: -5,
    },
  ],
  "Legacy Cleanup": [
    {
      title: "Inventory deprecated services",
      status: "in_progress",
      priority: "medium",
      dueDate: 14,
    },
    {
      title: "Draft decommission plan",
      status: "todo",
      priority: "low",
      dueDate: null,
    },
  ],
};

function fallbackTasks(projectName: string): TaskSeed[] {
  return [
    {
      title: `Kick off ${projectName}`,
      status: "todo",
      priority: "medium",
      dueDate: 7,
    },
  ];
}

async function main() {
  await connectMongo();

  const projects = await prisma.project.findMany({
    orderBy: { id: "asc" },
  });
  if (!projects.length) {
    throw new Error("No projects found. Run `npm run seed:prisma` first.");
  }

  await Task.deleteMany({});

  const docs = projects.flatMap((project) =>
    (tasksByProject[project.name] ?? fallbackTasks(project.name)).map((t) => ({
      title: t.title,
      description: t.description ?? "",
      status: t.status ?? "todo",
      priority: t.priority ?? "medium",
      dueDate: t.dueDate == null ? null : new Date(Date.now() + t.dueDate * DAY),
      projectId: project.id,
      userId: project.userId,
    })),
  );

  await Task.insertMany(docs);
  console.log(`Seeded ${docs.length} tasks across ${projects.length} projects`);
}

main()
  .catch((err) => {
    console.error("MongoDB seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await mongoose.disconnect();
  });

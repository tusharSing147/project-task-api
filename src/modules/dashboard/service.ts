import { prisma } from "../../libs/config/prismaClient";
import { Task } from "../../libs/config/schema";

export async function getStats(userId: number) {
  const [
    totalProjects,
    activeProjects,
    completedProjects,
    totalTasks,
    pendingTasks,
    completedTasks,
    highPriorityTasks,
  ] = await Promise.all([
    prisma.project.count({ where: { userId } }),
    prisma.project.count({ where: { userId, status: "active" } }),
    prisma.project.count({ where: { userId, status: "completed" } }),
    Task.countDocuments({ userId }),
    Task.countDocuments({ userId, status: { $in: ["todo", "in_progress"] } }),
    Task.countDocuments({ userId, status: "completed" }),
    Task.countDocuments({ userId, priority: "high" }),
  ]);
  return {
    totalProjects,
    activeProjects,
    completedProjects,
    totalTasks,
    pendingTasks,
    completedTasks,
    highPriorityTasks,
  };
}

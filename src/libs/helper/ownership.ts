import { prisma } from "../config/prismaClient";
import { HttpError } from "./httpError";

export async function assertProjectOwned(
  projectId: number,
  userId: number,
): Promise<void> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
  if (!project) {
    throw new HttpError(404, "Project not found or not owned by user");
  }
}

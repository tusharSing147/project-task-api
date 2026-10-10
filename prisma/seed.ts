import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type ProjectSeed = {
  name: string;
  description: string | null;
  status: "active" | "completed" | "archived";
};

const users = [
  { name: "Demo User", email: "demo@example.com", password: "password123" },
  { name: "Jane Manager", email: "jane@example.com", password: "password123" },
];

const projectsByEmail: Record<string, ProjectSeed[]> = {
  "demo@example.com": [
    {
      name: "Website Redesign",
      description: "Refresh marketing site design and copy",
      status: "active",
    },
    {
      name: "Mobile App Launch",
      description: "Ship v1 of the mobile app",
      status: "active",
    },
  ],
  "jane@example.com": [
    {
      name: "Q4 Marketing Campaign",
      description: "Plan and execute Q4 campaigns",
      status: "completed",
    },
    {
      name: "Legacy Cleanup",
      description: "Archive deprecated services",
      status: "archived",
    },
  ],
};

async function main() {
  for (const u of users) {
    const password = await bcrypt.hash(u.password, 12);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name },
      create: { name: u.name, email: u.email, password },
    });
    console.log(`Seeded user ${user.email} (id=${user.id})`);

    for (const p of projectsByEmail[u.email] ?? []) {
      const exists = await prisma.project.findFirst({
        where: { userId: user.id, name: p.name },
      });
      if (exists) {
        console.log(`  project "${p.name}" already exists (id=${exists.id})`);
        continue;
      }
      const created = await prisma.project.create({
        data: { ...p, userId: user.id },
      });
      console.log(`  created project "${p.name}" (id=${created.id})`);
    }
  }
}

main()
  .catch((err) => {
    console.error("Prisma seed failed:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

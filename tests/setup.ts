import 'dotenv/config';
import mongoose from 'mongoose';
import { prisma } from '../src/libs/config/prismaClient';

beforeAll(async () => {
  await prisma.$connect();
  await mongoose.connect(process.env.MONGODB_URI as string);
});

afterAll(async () => {
  await prisma.$disconnect();
  await mongoose.disconnect();
});

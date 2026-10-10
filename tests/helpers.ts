import request from 'supertest';
import app from '../index';

const uniq = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const api = () => request(app);

export const uniqueEmail = () => `test-${uniq()}@example.com`;

export const uniqueName = (prefix = 'Project') => `${prefix} ${uniq()}`;

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

export interface TestUser {
  token: string;
  user: { id: number; name: string; email: string; createdAt: string };
  email: string;
  password: string;
}

export async function registerUser(): Promise<TestUser> {
  const email = uniqueEmail();
  const password = 'password123';
  const name = `Test User ${uniq()}`;
  const res = await api()
    .post('/api/auth/register')
    .send({ name, email, password });
  if (res.status !== 201) {
    throw new Error(
      `registerUser failed (${res.status}): ${JSON.stringify(res.body)}`,
    );
  }
  return {
    token: res.body.data.token,
    user: res.body.data.user,
    email,
    password,
  };
}

export async function createProject(
  token: string,
  overrides: Record<string, unknown> = {},
): Promise<any> {
  const res = await api()
    .post('/api/projects')
    .set(authHeader(token))
    .send({ name: uniqueName('Project'), ...overrides });
  if (res.status !== 201) {
    throw new Error(
      `createProject failed (${res.status}): ${JSON.stringify(res.body)}`,
    );
  }
  return res.body.data;
}

export async function createTask(
  token: string,
  projectId: number,
  overrides: Record<string, unknown> = {},
): Promise<any> {
  const res = await api()
    .post('/api/tasks')
    .set(authHeader(token))
    .send({ title: uniqueName('Task'), projectId, ...overrides });
  if (res.status !== 201) {
    throw new Error(
      `createTask failed (${res.status}): ${JSON.stringify(res.body)}`,
    );
  }
  return res.body.data;
}

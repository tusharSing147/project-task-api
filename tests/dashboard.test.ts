import { api, authHeader, registerUser } from './helpers';

describe('dashboard', () => {
  it('GET /api/dashboard returns exactly the seven statistics', async () => {
    const { token } = await registerUser();
    const res = await api().get('/api/dashboard').set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const expected = [
      'totalProjects',
      'activeProjects',
      'completedProjects',
      'totalTasks',
      'pendingTasks',
      'completedTasks',
      'highPriorityTasks',
    ].sort();
    expect(Object.keys(res.body.data).sort()).toEqual(expected);

    for (const value of Object.values(res.body.data)) {
      expect(typeof value).toBe('number');
    }
  });

  it('rejects unauthenticated dashboard access with 401', async () => {
    const res = await api().get('/api/dashboard');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

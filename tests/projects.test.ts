import {
  api,
  authHeader,
  createProject,
  createTask,
  registerUser,
} from './helpers';

describe('projects', () => {
  it('POST /api/projects creates a project with 201', async () => {
    const { token } = await registerUser();
    const res = await api()
      .post('/api/projects')
      .set(authHeader(token))
      .send({ name: 'Created Project' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Created Project');
    expect(res.body.data.status).toBe('active');
    expect(typeof res.body.data.id).toBe('number');
  });

  it('rejects name:null with 422 (never 500, never stored as "null")', async () => {
    const { token } = await registerUser();
    const res = await api()
      .post('/api/projects')
      .set(authHeader(token))
      .send({ name: null });

    expect(res.status).toBe(422);
    expect(res.status).not.toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.data).not.toBe('null');
    expect(res.body.data).not.toBe(null);

    const list = await api().get('/api/projects').set(authHeader(token));
    expect(list.status).toBe(200);
    for (const p of list.body.data.items) expect(p.name).not.toBe('null');
  });

  it('rejects status:"bogus" with 422', async () => {
    const { token } = await registerUser();
    const res = await api()
      .post('/api/projects')
      .set(authHeader(token))
      .send({ name: 'Bad Status Project', status: 'bogus' });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/projects returns items plus a pagination object', async () => {
    const { token } = await registerUser();
    await createProject(token);
    await createProject(token);

    const res = await api()
      .get('/api/projects?page=1&limit=1')
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.items).toHaveLength(1);
    const pagination = res.body.data.pagination;
    expect(pagination.page).toBe(1);
    expect(pagination.limit).toBe(1);
    expect(pagination.total).toBe(2);
    expect(pagination.totalPages).toBe(2);
  });

  it('caps the requested limit at 100', async () => {
    const { token } = await registerUser();
    await createProject(token);

    const res = await api()
      .get('/api/projects?limit=500')
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.data.pagination.limit).toBe(100);
  });

  it('safely floors page=1.5', async () => {
    const { token } = await registerUser();
    const res = await api()
      .get('/api/projects?page=1.5')
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.data.pagination.page).toBe(1);
  });

  it('GET /api/projects/:id returns the project', async () => {
    const { token } = await registerUser();
    const project = await createProject(token);

    const res = await api()
      .get(`/api/projects/${project.id}`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(project.id);
    expect(res.body.data.name).toBe(project.name);
  });

  it('GET /api/projects/not-a-number returns 400', async () => {
    const { token } = await registerUser();
    const res = await api()
      .get('/api/projects/abc')
      .set(authHeader(token));

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 404 for another user's project", async () => {
    const userA = await registerUser();
    const userB = await registerUser();
    const project = await createProject(userA.token);

    const res = await api()
      .get(`/api/projects/${project.id}`)
      .set(authHeader(userB.token));

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.data).toBeNull();
  });

  it('PUT /api/projects/:id renames the project', async () => {
    const { token } = await registerUser();
    const project = await createProject(token);

    const res = await api()
      .put(`/api/projects/${project.id}`)
      .set(authHeader(token))
      .send({ name: 'Renamed Project' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Renamed Project');
    expect(res.body.data.id).toBe(project.id);
  });

  it('DELETE /api/projects/:id removes a project without tasks', async () => {
    const { token } = await registerUser();
    const project = await createProject(token);

    const res = await api()
      .delete(`/api/projects/${project.id}`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const after = await api()
      .get(`/api/projects/${project.id}`)
      .set(authHeader(token));
    expect(after.status).toBe(404);
  });

  it('DELETE returns 409 with taskCount when the project still has tasks', async () => {
    const { token } = await registerUser();
    const project = await createProject(token);
    await createTask(token, project.id);

    const res = await api()
      .delete(`/api/projects/${project.id}`)
      .set(authHeader(token));

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      'Cannot delete project: it is already in use by tasks',
    );
    expect(typeof res.body.data.taskCount).toBe('number');
    expect(res.body.data.taskCount).toBeGreaterThan(0);
  });
});

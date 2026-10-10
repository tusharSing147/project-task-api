import {
  api,
  authHeader,
  createProject,
  createTask,
  registerUser,
} from './helpers';

describe('tasks', () => {
  it('POST /api/tasks creates a task with 201', async () => {
    const { token, user } = await registerUser();
    const project = await createProject(token);
    const res = await api()
      .post('/api/tasks')
      .set(authHeader(token))
      .send({ title: 'First task', projectId: project.id });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('First task');
    expect(res.body.data.status).toBe('todo');
    expect(res.body.data.priority).toBe('medium');
    expect(res.body.data.projectId).toBe(project.id);
    expect(res.body.data.userId).toBe(user.id);
  });

  it("rejects another user's projectId with 404", async () => {
    const userA = await registerUser();
    const userB = await registerUser();
    const projectA = await createProject(userA.token);

    const res = await api()
      .post('/api/tasks')
      .set(authHeader(userB.token))
      .send({ title: 'Cross user task', projectId: projectA.id });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.data).toBeNull();
  });

  it('rejects an invalid status with 422', async () => {
    const { token } = await registerUser();
    const project = await createProject(token);

    const res = await api()
      .post('/api/tasks')
      .set(authHeader(token))
      .send({ title: 'Bad status', projectId: project.id, status: 'bogus' });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('accepts dueDate:null (nullable)', async () => {
    const { token } = await registerUser();
    const project = await createProject(token);

    const res = await api()
      .post('/api/tasks')
      .set(authHeader(token))
      .send({ title: 'No due date', projectId: project.id, dueDate: null });

    expect(res.status).toBe(201);
    expect(res.body.data.dueDate).toBeNull();
  });

  it('GET /api/tasks filters by status', async () => {
    const { token } = await registerUser();
    const project = await createProject(token);
    await createTask(token, project.id, { status: 'todo' });
    await createTask(token, project.id, { status: 'completed' });

    const res = await api()
      .get('/api/tasks?status=todo')
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.items.length).toBeGreaterThan(0);
    for (const item of res.body.data.items) expect(item.status).toBe('todo');
    expect(res.body.data.pagination.total).toBe(1);
    expect(typeof res.body.data.pagination.totalPages).toBe('number');
  });

  it('GET /api/tasks with an invalid status filter returns 422', async () => {
    const { token } = await registerUser();
    const res = await api()
      .get('/api/tasks?status=bogus')
      .set(authHeader(token));

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/tasks/:id returns the task', async () => {
    const { token } = await registerUser();
    const project = await createProject(token);
    const task = await createTask(token, project.id);

    const res = await api()
      .get(`/api/tasks/${task._id}`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(task._id);
    expect(res.body.data.title).toBe(task.title);
  });

  it('GET /api/tasks/nope returns 400 for an invalid ObjectId', async () => {
    const { token } = await registerUser();
    const res = await api().get('/api/tasks/nope').set(authHeader(token));

    expect(res.status).toBe(400);
    expect(res.status).not.toBe(500);
    expect(res.body.success).toBe(false);
  });

  it("returns 404 for another user's task", async () => {
    const userA = await registerUser();
    const userB = await registerUser();
    const projectA = await createProject(userA.token);
    const taskA = await createTask(userA.token, projectA.id);

    const res = await api()
      .get(`/api/tasks/${taskA._id}`)
      .set(authHeader(userB.token));

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.data).toBeNull();
  });

  it('PUT /api/tasks/:id updates the title without changing the owner', async () => {
    const { token, user } = await registerUser();
    const project = await createProject(token);
    const task = await createTask(token, project.id);

    const res = await api()
      .put(`/api/tasks/${task._id}`)
      .set(authHeader(token))
      .send({ title: 'Updated title' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated title');
    expect(res.body.data.userId).toBe(task.userId);
    expect(res.body.data.userId).toBe(user.id);
  });

  it('DELETE /api/tasks/:id removes the task', async () => {
    const { token } = await registerUser();
    const project = await createProject(token);
    const task = await createTask(token, project.id);

    const res = await api()
      .delete(`/api/tasks/${task._id}`)
      .set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const after = await api()
      .get(`/api/tasks/${task._id}`)
      .set(authHeader(token));
    expect(after.status).toBe(404);
  });
});

import {
  api,
  authHeader,
  registerUser,
  uniqueEmail,
} from './helpers';

describe('auth', () => {
  it('POST /api/auth/register returns 201 with a token and never exposes the password', async () => {
    const email = uniqueEmail();
    const res = await api()
      .post('/api/auth/register')
      .send({ name: 'Auth Tester', email, password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.token).toBe('string');
    expect(res.body.data.token.length).toBeGreaterThan(0);
    expect(res.body.data.user).toMatchObject({ email, name: 'Auth Tester' });
    expect(typeof res.body.data.user.id).toBe('number');
    expect(res.body.data.user).not.toHaveProperty('password');
    expect(res.body.data).not.toHaveProperty('password');
    expect(JSON.stringify(res.body)).not.toContain('password');
  });

  it('POST /api/auth/register rejects a duplicate email with 409', async () => {
    const { email, password } = await registerUser();
    const res = await api()
      .post('/api/auth/register')
      .send({ name: 'Duplicate User', email, password });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Email already registered');
  });

  it('POST /api/auth/register rejects a short password with 422', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ name: 'Weak Password', email: uniqueEmail(), password: 'short' });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/auth/login returns 200 with a token', async () => {
    const { email, password } = await registerUser();
    const res = await api()
      .post('/api/auth/login')
      .send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.token).toBe('string');
    expect(res.body.data.user.email).toBe(email);
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  it('returns the same 401 message for a wrong password and an unknown email', async () => {
    const { email, password } = await registerUser();

    const wrongPassword = await api()
      .post('/api/auth/login')
      .send({ email, password: 'definitely-not-my-password' });
    const unknownEmail = await api()
      .post('/api/auth/login')
      .send({ email: uniqueEmail(), password });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.message).toBe('Invalid email or password');
    expect(unknownEmail.body.message).toBe('Invalid email or password');
    expect(unknownEmail.body.message).toBe(wrongPassword.body.message);
  });

  it('GET /api/auth/me returns the authenticated user', async () => {
    const { token, email } = await registerUser();
    const res = await api().get('/api/auth/me').set(authHeader(token));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(email);
    expect(res.body.data).not.toHaveProperty('password');
  });

  it('GET /api/auth/me without a token returns 401', async () => {
    const res = await api().get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('PUT /api/auth/profile updates the name with 200', async () => {
    const { token } = await registerUser();
    const res = await api()
      .put('/api/auth/profile')
      .set(authHeader(token))
      .send({ name: 'Renamed Tester' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Renamed Tester');
    expect(res.body.data).not.toHaveProperty('password');
  });

  it('PUT /api/auth/profile with an empty body returns 422', async () => {
    const { token } = await registerUser();
    const res = await api()
      .put('/api/auth/profile')
      .set(authHeader(token))
      .send({});

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });
});

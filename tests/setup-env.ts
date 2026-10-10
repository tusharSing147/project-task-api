// Loaded via jest `setupFiles` — runs BEFORE any test module (and before
// index.ts imports dotenv/config), so the app sees these values.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test-secret-that-is-at-least-32-chars!!';
process.env.RATE_LIMIT_MAX = '1000000';

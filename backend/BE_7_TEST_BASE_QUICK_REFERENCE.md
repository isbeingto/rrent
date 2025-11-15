# BE-7 Test Base Quick Reference

The BE-7 testing base provides a single helper, `createTestingApp()`, to spin up a full NestJS application that mirrors production middleware and connects to a dedicated test database.

## 1. Configure the test environment

1. Copy `.env.test.example` to `.env.test` and adjust the connection string so it points to your isolated test database (never reuse dev/prod DBs).
2. Ensure the database exists and is reachable. Prisma will run migrations automatically when the app starts.
3. Run tests with `NODE_ENV=test` (Jest does this automatically) so `AppModule` loads `.env.test` first.

## 2. Creating a testing app

```ts
import { createTestingApp, TestingApp } from "./utils/testing-app";

let testing: TestingApp;

beforeAll(async () => {
  testing = await createTestingApp({
    resetDbOnStart: true,
    enableCors: true, // optional overrides; defaults mirror main.ts
  });
});

afterAll(async () => {
  await testing.close();
});
```

`TestingApp` exposes:

- `app`: the initialized `INestApplication`
- `httpServer`: the server instance for `supertest`
- `prisma`: the shared `PrismaService`
- `resetDatabase()`: wipes all business tables (safe to call between suites)
- `close()`: shuts down the Nest application

## 3. Resetting or seeding data

```ts
beforeEach(async () => {
  await testing.resetDatabase();
  await testing.prisma.organization.create({ /* seed org */ });
});
```

`createTestingApp({ seed: async ({ prisma }) => { ... } })` lets you provide a one-off async seeding routine that executes right after the database reset.

## 4. Running the verification script

A helper script ensures the new foundation is healthy:

```bash
cd backend
./tools/verify_be7_test_base.sh
```

The script runs `pnpm test -- --runTestsByPath test/auth-smoke.e2e-spec.ts`, which now uses the shared testing base.

## 5. Common tips

- Do not bypass auth/guards inside `createTestingApp`; override them per test when necessary.
- Always rely on `testing.prisma` (instead of creating new Prisma clients) to maintain connection pooling and tenant middleware behavior.
- Prefer constructing fixtures through Prisma rather than shell scripts so Jest can control lifecycle hooks.

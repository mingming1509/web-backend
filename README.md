# web-backend

A clean [NestJS](https://nestjs.com/) backend using **PostgreSQL** via [TypeORM](https://typeorm.io/).

## Features

- NestJS 10 with a modular, feature-based structure
- PostgreSQL via TypeORM (`@nestjs/typeorm`)
- Typed, validated environment configuration (`@nestjs/config` + Joi)
- Database migrations (no `synchronize` in production)
- Health checks (`@nestjs/terminus`) at `GET /api/health`
- JWT authentication restricted to **`@usth.edu.vn`** student emails
- Global validation pipe, CORS, and an `/api` route prefix
- ESLint + Prettier, Jest unit & e2e tests
- Docker Compose runs the **app and PostgreSQL together** — one command, no manual port forwarding

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your database credentials.

### 3. Start PostgreSQL

Using Docker:

```bash
docker compose up -d
```

Or point `.env` at an existing PostgreSQL instance.

### 4. Run the app

```bash
npm run start:dev
```

The API is available at `http://localhost:3000/api`.

## Running with Docker (recommended)

The Compose stack builds the app image and starts it alongside PostgreSQL.
Pending migrations run automatically on boot, so a single command gives you a
working API — no local Node or database setup required:

```bash
docker compose up -d --build
```

The API is then available at `http://localhost:3000/api`. Stop it with:

```bash
docker compose down          # keep data
docker compose down -v       # also wipe the database volume
```

> The app reads `JWT_SECRET`, `DB_PASSWORD`, etc. from your shell / `.env`,
> falling back to development defaults. Set a real `JWT_SECRET` before deploying.

## Authentication

Access is restricted to student accounts on the **`@usth.edu.vn`** domain. The
rule is enforced by a custom validator (`IsStudentEmail`) on both registration
and login — any other domain (including subdomains like `x@mail.usth.edu.vn`)
is rejected with `400`.

| Method | Route                | Auth   | Description                          |
| ------ | -------------------- | ------ | ------------------------------------ |
| `POST` | `/api/auth/register` | —      | Create a student account, returns a JWT |
| `POST` | `/api/auth/login`    | —      | Exchange credentials for a JWT       |
| `GET`  | `/api/auth/me`       | Bearer | Return the current authenticated user |

```bash
# Register (emails are normalised to lowercase; @usth.edu.vn required)
curl -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"nam.tran@usth.edu.vn","password":"password123","fullName":"Nam Tran"}'

# Log in and call a protected route
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"nam.tran@usth.edu.vn","password":"password123"}' | jq -r .accessToken)

curl http://localhost:3000/api/auth/me -H "Authorization: Bearer $TOKEN"
```

Passwords are hashed with bcrypt (cost 12) and the hash is never returned or
selected by default. JWTs are signed with `JWT_SECRET` and expire after
`JWT_EXPIRES_IN` (default `15m`).

## Project structure

```
src/
├── auth/             # Login/registration, JWT strategy, @usth.edu.vn rule
├── users/            # User entity & persistence
├── config/           # Environment configuration & validation
├── database/         # TypeORM setup, data source, migrations
│   └── migrations/
├── health/           # Health-check endpoint
├── app.module.ts     # Root module
└── main.ts           # Application bootstrap
```

## Database migrations

```bash
# Generate a migration from entity changes
npm run migration:generate -- src/database/migrations/MigrationName

# Create an empty migration
npm run migration:create src/database/migrations/MigrationName

# Apply migrations
npm run migration:run

# Revert the last migration
npm run migration:revert
```

> Migrations are the source of truth for the schema. `synchronize` is disabled
> by default — keep it that way outside of throwaway local experiments.

## Scripts

| Script                  | Description                       |
| ----------------------- | --------------------------------- |
| `npm run start:dev`     | Start in watch mode               |
| `npm run start:prod`    | Run the compiled build            |
| `npm run build`         | Compile to `dist/`                |
| `npm run lint`          | Lint and auto-fix                 |
| `npm run test`          | Unit tests                        |
| `npm run test:e2e`      | End-to-end tests                  |
| `npm run migration:run` | Apply pending database migrations |

## Adding a feature module

```bash
npx nest generate resource users
```

This scaffolds a controller, service, module, DTOs, and entity following the
same conventions used throughout `src/`.

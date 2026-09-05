# web-backend

A clean [NestJS](https://nestjs.com/) backend using **PostgreSQL** via [TypeORM](https://typeorm.io/).

## Features

- NestJS 10 with a modular, feature-based structure
- PostgreSQL via TypeORM (`@nestjs/typeorm`)
- Typed, validated environment configuration (`@nestjs/config` + Joi)
- Database migrations (no `synchronize` in production)
- Health checks (`@nestjs/terminus`) at `GET /api/health`
- Global validation pipe, CORS, and an `/api` route prefix
- ESLint + Prettier, Jest unit & e2e tests
- Docker Compose for a local PostgreSQL instance

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

## Project structure

```
src/
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

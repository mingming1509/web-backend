import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

// Unique per run so repeated runs never collide on the unique email constraint.
const EMAIL = `e2e.${Date.now()}@usth.edu.vn`;
const PASSWORD = 'password123';
const FULL_NAME = 'E2E Student';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Mirror main.ts so validation/transform behaves exactly as in production.
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    // Remove the account this run created.
    await dataSource.query('DELETE FROM users WHERE email = $1', [
      EMAIL.toLowerCase(),
    ]);
    await app.close();
  });

  const server = () => app.getHttpServer();

  describe('POST /api/auth/register', () => {
    it('rejects a non-@usth.edu.vn domain with 400', async () => {
      await request(server())
        .post('/api/auth/register')
        .send({ email: 'someone@gmail.com', password: PASSWORD, fullName: FULL_NAME })
        .expect(400);
    });

    it('rejects a usth.edu.vn subdomain with 400', async () => {
      await request(server())
        .post('/api/auth/register')
        .send({ email: 'someone@mail.usth.edu.vn', password: PASSWORD, fullName: FULL_NAME })
        .expect(400);
    });

    it('rejects a password shorter than 8 chars with 400', async () => {
      await request(server())
        .post('/api/auth/register')
        .send({ email: `short.${Date.now()}@usth.edu.vn`, password: 'short', fullName: FULL_NAME })
        .expect(400);
    });

    it('strips unknown properties (forbidNonWhitelisted) with 400', async () => {
      await request(server())
        .post('/api/auth/register')
        .send({ email: EMAIL, password: PASSWORD, fullName: FULL_NAME, isAdmin: true })
        .expect(400);
    });

    it('registers a valid student and returns a token without the password hash', async () => {
      const res = await request(server())
        .post('/api/auth/register')
        .send({ email: EMAIL, password: PASSWORD, fullName: FULL_NAME })
        .expect(201);

      expect(typeof res.body.accessToken).toBe('string');
      expect(res.body.user).toMatchObject({
        email: EMAIL.toLowerCase(),
        fullName: FULL_NAME,
      });
      expect(res.body.user.id).toEqual(expect.any(String));
      // The hash must never leak.
      expect(res.body.user.passwordHash).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toContain('$2b$');
    });

    it('rejects a duplicate email with 409', async () => {
      await request(server())
        .post('/api/auth/register')
        .send({ email: EMAIL, password: PASSWORD, fullName: FULL_NAME })
        .expect(409);
    });
  });

  describe('POST /api/auth/login', () => {
    it('rejects a wrong password with 401', async () => {
      await request(server())
        .post('/api/auth/login')
        .send({ email: EMAIL, password: 'wrong-password' })
        .expect(401);
    });

    it('rejects an unknown account with 401', async () => {
      await request(server())
        .post('/api/auth/login')
        .send({ email: `nobody.${Date.now()}@usth.edu.vn`, password: PASSWORD })
        .expect(401);
    });

    it('logs in with an uppercased email (case-insensitive) and issues a 15m token', async () => {
      const res = await request(server())
        .post('/api/auth/login')
        .send({ email: EMAIL.toUpperCase(), password: PASSWORD })
        .expect(200);

      expect(typeof res.body.accessToken).toBe('string');

      const payload = JSON.parse(
        Buffer.from(res.body.accessToken.split('.')[1], 'base64').toString(),
      );
      expect(payload.email).toBe(EMAIL.toLowerCase());
      expect(payload.exp - payload.iat).toBe(15 * 60);
    });
  });

  describe('GET /api/auth/me', () => {
    let token: string;

    beforeAll(async () => {
      const res = await request(server())
        .post('/api/auth/login')
        .send({ email: EMAIL, password: PASSWORD });
      token = res.body.accessToken;
    });

    it('returns 401 without a token', async () => {
      await request(server()).get('/api/auth/me').expect(401);
    });

    it('returns 401 with a malformed token', async () => {
      await request(server())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer not-a-real-token')
        .expect(401);
    });

    it('returns the current user with a valid token', async () => {
      const res = await request(server())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toMatchObject({
        email: EMAIL.toLowerCase(),
        fullName: FULL_NAME,
      });
      expect(res.body.passwordHash).toBeUndefined();
    });
  });
});

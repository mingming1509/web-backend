import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from './utils/test-app';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('exposes the health check without authentication', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);

    expect(response.body.status).toBe('ok');
  });

  it('requires authentication on routes that are not marked public', async () => {
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });
});

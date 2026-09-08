import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Health & Security Endpoints', () => {
  const app = createApp();

  it('GET /api/health returns 200 and status ok', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('service', 'fixora-backend');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptime');
  });

  it('GET / returns 200 with service metadata', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name', 'Fixora API Service');
    expect(res.body).toHaveProperty('healthCheck', '/api/health');
  });

  it('GET /api/unknown-route returns 404 with structured error', async () => {
    const res = await request(app).get('/api/unknown-route');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.error).toContain('Route not found');
  });

  it('includes security headers set by helmet', async () => {
    const res = await request(app).get('/api/health');

    expect(res.headers).toHaveProperty('x-content-type-options', 'nosniff');
    expect(res.headers).toHaveProperty('x-frame-options');
  });

  describe('CORS Configuration for Vercel and Localhost', () => {
    it('allows requests from localhost:5173', async () => {
      const res = await request(app)
        .options('/api/health')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });

    it('allows requests from Vercel production and preview deployments (*.vercel.app)', async () => {
      const prodRes = await request(app)
        .options('/api/health')
        .set('Origin', 'https://fixora-app.vercel.app')
        .set('Access-Control-Request-Method', 'GET');

      expect(prodRes.status).toBe(204);
      expect(prodRes.headers['access-control-allow-origin']).toBe('https://fixora-app.vercel.app');

      const previewRes = await request(app)
        .options('/api/health')
        .set('Origin', 'https://fixora-git-feat-ui-team.vercel.app')
        .set('Access-Control-Request-Method', 'GET');

      expect(previewRes.status).toBe(204);
      expect(previewRes.headers['access-control-allow-origin']).toBe('https://fixora-git-feat-ui-team.vercel.app');
    });

    it('blocks requests from unauthorized external origins', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'https://malicious-site.com');

      // Supertest/cors returns 500 when CORS error is thrown by the callback
      expect(res.status).toBe(500);
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });
});

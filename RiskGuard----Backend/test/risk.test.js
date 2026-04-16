// test/risk.test.js
const request = require('supertest');
const app = require('../app').default || require('../app');

describe('Risk API', () => {
  it('should require authentication', async () => {
    const res = await request(app).get('/api/v1/risks');
    expect(res.statusCode).toBe(401);
  });
  // Add more tests for CRUD, ownership, pagination, etc.
});

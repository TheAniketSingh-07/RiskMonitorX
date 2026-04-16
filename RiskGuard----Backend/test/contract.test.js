// test/contract.test.js
const request = require('supertest');
const app = require('../app').default || require('../app');

describe('API Contract', () => {
  it('should return standard contract for errors', async () => {
    const res = await request(app).get('/api/v1/projects/invalidid');
    expect(res.body).toHaveProperty('success');
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('error');
  });
  // Add more contract shape tests
});

// test/security.test.js
const request = require('supertest');
const app = require('../app').default || require('../app');

describe('Security', () => {
  it('should prevent cross-user project access', async () => {
    // Register user1, create project, register user2, try to access user1's project
    // ...
  });
  // Add more tests for IDOR, forbidden access, etc.
});

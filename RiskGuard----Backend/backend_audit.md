# Risk Management System Backend Audit

## 1. System Overview

The backend is a secure Risk Management API that manages the full lifecycle:

Project -> Risks -> Status Updates -> History

### What the backend does

1. Provides authenticated CRUD APIs for projects and risks.
2. Enforces that every risk belongs to a project via `projectId`.
3. Supports controlled status transitions for each risk.
4. Maintains an append-only status history trail inside each risk document.
5. Returns consistent JSON responses for success and error cases.

### Main business logic

1. Projects are top-level containers for risks.
2. Risks are operational records that track probability, impact, and mitigation actions.
3. Status changes are performed through a dedicated endpoint.
4. Every valid status change automatically creates a history entry with actor and timestamp.
5. Deleting a project cascades deletion of all associated risks.

### Relationship model

1. One Project has many Risks.
2. One Risk has many embedded History entries.
3. History entries provide an audit trail of status transitions.

### Full risk lifecycle inside a project

1. Create project.
2. Create risk under project.
3. Update risk details.
4. Update risk status through `PATCH /api/risks/:riskId/status`.
5. Review timeline through `GET /api/risks/:riskId/history`.
6. Close risk, or remove risk/project when no longer needed.

---

## 2. Architecture Diagram (Text-Based UML)

```text
+------------------+           +------------------+           +------------------+
|      Client      |  HTTP     |      app.js      |  Mount    |   Route Layer    |
| (Frontend/Test)  +----------->  Middleware Hub  +-----------> /api/projects    |
+------------------+           |  CORS/Helmet     |           | /api/risks       |
                               |  RateLimiter     |           +--------+---------+
                               +------------------+                    |
                                                                        v
                                                            +----------------------+
                                                            |   Controller Layer   |
                                                            | projectController    |
                                                            | riskController       |
                                                            +----------+-----------+
                                                                       |
                                                                       v
                                                            +----------------------+
                                                            |     Mongoose Models  |
                                                            | Project              |
                                                            | Risk (embedded       |
                                                            | history[])           |
                                                            +----------+-----------+
                                                                       |
                                                                       v
                                                            +----------------------+
                                                            |      MongoDB         |
                                                            | projects collection  |
                                                            | risks collection     |
                                                            +----------------------+
```

### Data flow for status update

1. Client calls `PATCH /api/risks/:riskId/status`.
2. JWT middleware validates token and attaches `req.user`.
3. Controller validates `riskId` and request body.
4. `currentStatus` is updated, history entry is appended.
5. Updated status payload is returned.

---

## 3. Database Schema (MongoDB)

## Project Schema

Collection: `projects`

Fields:

1. `title` (String, required)
2. `description` (String, optional)
3. `owner` (Mixed, optional)
4. `startDate` (Date, optional)
5. `endDate` (Date, optional)
6. `createdAt` (Date, auto)
7. `updatedAt` (Date, auto)

Sample document:

```json
{
  "_id": "6610fbe8c3b6a4e35e11a101",
  "title": "Digital Banking Revamp",
  "description": "Upgrade core banking modules and API gateway",
  "owner": "6610f987c3b6a4e35e11a055",
  "startDate": "2026-04-01T00:00:00.000Z",
  "endDate": "2026-10-01T00:00:00.000Z",
  "createdAt": "2026-04-04T09:10:11.123Z",
  "updatedAt": "2026-04-04T09:10:11.123Z",
  "__v": 0
}
```

## Risk Schema

Collection: `risks`

Fields:

1. `projectId` (ObjectId, required, ref Project)
2. `title` (String, required)
3. `description` (String, optional)
4. `probability` (Enum: Low, Medium, High)
5. `impact` (Enum: Low, Medium, High, Critical)
6. `mitigationActions` (String, required)
7. `currentStatus` (Enum: Open, Monitoring, Mitigated, Closed)
8. `createdBy` (ObjectId, required, ref User)
9. `updatedBy` (ObjectId, optional, ref User)
10. `history[]` (Array of History Entry)
11. `createdAt` (Date, auto)
12. `updatedAt` (Date, auto)

## History Entry

Embedded in `Risk.history[]`.

Fields:

1. `status` (Enum: Open, Monitoring, Mitigated, Closed)
2. `changedBy` (ObjectId, ref User)
3. `timestamp` (Date)
4. `note` (String)

Sample risk document:

```json
{
  "_id": "6610fd3ac3b6a4e35e11a151",
  "projectId": "6610fbe8c3b6a4e35e11a101",
  "title": "Third-party API downtime",
  "description": "Payment processor instability affects checkout",
  "probability": "High",
  "impact": "Critical",
  "mitigationActions": "Introduce fallback provider and circuit breaker",
  "currentStatus": "Monitoring",
  "createdBy": "6610f987c3b6a4e35e11a055",
  "updatedBy": "6610f987c3b6a4e35e11a055",
  "history": [
    {
      "status": "Open",
      "note": "Risk created",
      "changedBy": "6610f987c3b6a4e35e11a055",
      "timestamp": "2026-04-04T09:20:00.000Z",
      "_id": "6610fd3ac3b6a4e35e11a152"
    },
    {
      "status": "Monitoring",
      "note": "Alerting and fallback configured",
      "changedBy": "6610f987c3b6a4e35e11a055",
      "timestamp": "2026-04-05T12:40:00.000Z",
      "_id": "66121f0cc3b6a4e35e11a333"
    }
  ],
  "createdAt": "2026-04-04T09:20:00.000Z",
  "updatedAt": "2026-04-05T12:40:00.000Z",
  "__v": 1
}
```

---

## 4. Full API Documentation

Base URL pattern:

1. Default prefix: `/api`
2. Configurable via `API_PREFIX`
3. All routes below require Bearer token auth.

Common headers:

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

Standard error payload:

```json
{
  "success": false,
  "message": "Error message",
  "path": "/api/...",
  "timestamp": "2026-04-04T10:00:00.000Z",
  "stack": null
}
```

## Project Routes

### POST /api/projects

Purpose: Create a new project.

Required params: None.

Request body:

```json
{
  "title": "Digital Banking Revamp",
  "description": "Upgrade core banking modules",
  "owner": "6610f987c3b6a4e35e11a055",
  "startDate": "2026-04-01",
  "endDate": "2026-10-01"
}
```

Response 201:

```json
{
  "success": true,
  "data": {
    "_id": "6610fbe8c3b6a4e35e11a101",
    "title": "Digital Banking Revamp",
    "description": "Upgrade core banking modules",
    "owner": "6610f987c3b6a4e35e11a055",
    "startDate": "2026-04-01T00:00:00.000Z",
    "endDate": "2026-10-01T00:00:00.000Z",
    "createdAt": "2026-04-04T09:10:11.123Z",
    "updatedAt": "2026-04-04T09:10:11.123Z"
  }
}
```

Error responses:

1. `400` invalid or missing body values
2. `500` server error

Curl:

```bash
curl -X POST "https://your-domain.com/api/projects" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Digital Banking Revamp","description":"Upgrade core modules","startDate":"2026-04-01","endDate":"2026-10-01"}'
```

### GET /api/projects

Purpose: List all projects.

Response 200:

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "6610fbe8c3b6a4e35e11a101",
      "title": "Project A"
    },
    {
      "_id": "6610fc11c3b6a4e35e11a120",
      "title": "Project B"
    }
  ]
}
```

Error responses:

1. `500` server error

Curl:

```bash
curl -X GET "https://your-domain.com/api/projects" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### GET /api/projects/:projectId

Purpose: Get one project by ID.

Required params:

1. `projectId`

Response 200:

```json
{
  "success": true,
  "data": {
    "_id": "6610fbe8c3b6a4e35e11a101",
    "title": "Digital Banking Revamp",
    "description": "Upgrade core banking modules"
  }
}
```

Error responses:

1. `400` invalid `projectId`
2. `404` project not found
3. `500` server error

Curl:

```bash
curl -X GET "https://your-domain.com/api/projects/6610fbe8c3b6a4e35e11a101" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### PUT /api/projects/:projectId

Purpose: Update project fields.

Required params:

1. `projectId`

Request body (partial update payload accepted by implementation):

```json
{
  "title": "Digital Banking Revamp - Phase 2",
  "endDate": "2026-12-01"
}
```

Response 200:

```json
{
  "success": true,
  "data": {
    "_id": "6610fbe8c3b6a4e35e11a101",
    "title": "Digital Banking Revamp - Phase 2",
    "endDate": "2026-12-01T00:00:00.000Z"
  }
}
```

Error responses:

1. `400` invalid ID/date/body
2. `404` project not found
3. `500` server error

Curl:

```bash
curl -X PUT "https://your-domain.com/api/projects/6610fbe8c3b6a4e35e11a101" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Digital Banking Revamp - Phase 2","endDate":"2026-12-01"}'
```

### DELETE /api/projects/:projectId

Purpose: Delete project and all linked risks.

Required params:

1. `projectId`

Response 200:

```json
{
  "success": true,
  "data": {}
}
```

Error responses:

1. `400` invalid `projectId`
2. `404` project not found
3. `500` server error

Curl:

```bash
curl -X DELETE "https://your-domain.com/api/projects/6610fbe8c3b6a4e35e11a101" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Risk Routes (Nested + Global)

### POST /api/projects/:projectId/risks

Purpose: Create a risk under a specific project.

Required params:

1. `projectId`

Request body:

```json
{
  "title": "Third-party API downtime",
  "description": "Payment failures expected during peak",
  "probability": "High",
  "impact": "Critical",
  "mitigationActions": "Fallback provider + retries",
  "currentStatus": "Open",
  "note": "Risk identified in architecture review"
}
```

Response 201:

```json
{
  "success": true,
  "data": {
    "_id": "6610fd3ac3b6a4e35e11a151",
    "projectId": "6610fbe8c3b6a4e35e11a101",
    "currentStatus": "Open",
    "history": [
      {
        "status": "Open",
        "note": "Risk identified in architecture review",
        "changedBy": "6610f987c3b6a4e35e11a055",
        "timestamp": "2026-04-04T09:20:00.000Z"
      }
    ]
  }
}
```

Error responses:

1. `400` invalid/missing fields
2. `404` project not found
3. `500` server error

Curl:

```bash
curl -X POST "https://your-domain.com/api/projects/6610fbe8c3b6a4e35e11a101/risks" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Third-party API downtime","probability":"High","impact":"Critical","mitigationActions":"Fallback provider + retries"}'
```

### GET /api/projects/:projectId/risks

Purpose: List all risks in a project.

Required params:

1. `projectId`

Response 200:

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "6610fd3ac3b6a4e35e11a151",
      "projectId": "6610fbe8c3b6a4e35e11a101",
      "title": "Third-party API downtime",
      "currentStatus": "Open"
    }
  ]
}
```

Error responses:

1. `400` invalid `projectId`
2. `404` project not found
3. `500` server error

Curl:

```bash
curl -X GET "https://your-domain.com/api/projects/6610fbe8c3b6a4e35e11a101/risks" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### GET /api/risks/:riskId

Purpose: Get one risk by ID.

Required params:

1. `riskId`

Response 200:

```json
{
  "success": true,
  "data": {
    "_id": "6610fd3ac3b6a4e35e11a151",
    "projectId": "6610fbe8c3b6a4e35e11a101",
    "title": "Third-party API downtime",
    "currentStatus": "Open"
  }
}
```

Error responses:

1. `400` invalid `riskId`
2. `404` risk not found
3. `500` server error

Curl:

```bash
curl -X GET "https://your-domain.com/api/risks/6610fd3ac3b6a4e35e11a151" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### PUT /api/risks/:riskId

Purpose: Update risk details and optionally status.

Required params:

1. `riskId`

Request body:

```json
{
  "impact": "High",
  "mitigationActions": "Add regional failover",
  "currentStatus": "Monitoring",
  "note": "Post-mitigation tracking"
}
```

Response 200:

```json
{
  "success": true,
  "data": {
    "_id": "6610fd3ac3b6a4e35e11a151",
    "currentStatus": "Monitoring",
    "updatedAt": "2026-04-05T12:40:00.000Z"
  }
}
```

Error responses:

1. `400` invalid data or enums
2. `404` risk not found
3. `500` server error

Curl:

```bash
curl -X PUT "https://your-domain.com/api/risks/6610fd3ac3b6a4e35e11a151" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentStatus":"Monitoring","note":"Post-mitigation tracking"}'
```

### DELETE /api/risks/:riskId

Purpose: Delete a risk by ID.

Required params:

1. `riskId`

Response 200:

```json
{
  "success": true,
  "data": {}
}
```

Error responses:

1. `400` invalid `riskId`
2. `404` risk not found
3. `500` server error

Curl:

```bash
curl -X DELETE "https://your-domain.com/api/risks/6610fd3ac3b6a4e35e11a151" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Status Update Route

### PATCH /api/risks/:riskId/status

Purpose: Update risk status through dedicated workflow endpoint.

Required params:

1. `riskId`

Request body:

```json
{
  "status": "Mitigated",
  "note": "Control rollout completed"
}
```

How history is automatically appended:

1. Backend validates `riskId` and `status`.
2. If new status differs from current status:
   - `currentStatus` is updated
   - `updatedBy` is set
   - new history entry `{status, note, changedBy, timestamp}` is pushed
3. If same status is sent, no duplicate history entry is added.

Response 200:

```json
{
  "success": true,
  "message": "Risk status updated successfully",
  "data": {
    "id": "6610fd3ac3b6a4e35e11a151",
    "currentStatus": "Mitigated",
    "updatedAt": "2026-04-06T08:15:00.000Z"
  }
}
```

Error responses:

1. `400` invalid `riskId` or status
2. `404` risk not found
3. `500` server error

Curl:

```bash
curl -X PATCH "https://your-domain.com/api/risks/6610fd3ac3b6a4e35e11a151/status" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"Mitigated","note":"Control rollout completed"}'
```

## History Route

### GET /api/risks/:riskId/history

Purpose: Retrieve risk history entries sorted by latest timestamp first.

Required params:

1. `riskId`

Response 200:

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "status": "Mitigated",
      "note": "Control rollout completed",
      "changedBy": {
        "_id": "6610f987c3b6a4e35e11a055",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "timestamp": "2026-04-06T08:15:00.000Z"
    },
    {
      "status": "Monitoring",
      "note": "Post-mitigation tracking",
      "changedBy": {
        "_id": "6610f987c3b6a4e35e11a055",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "timestamp": "2026-04-05T12:40:00.000Z"
    },
    {
      "status": "Open",
      "note": "Risk created",
      "changedBy": {
        "_id": "6610f987c3b6a4e35e11a055",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "timestamp": "2026-04-04T09:20:00.000Z"
    }
  ]
}
```

Timestamp storage:

1. Stored as MongoDB Date, returned as ISO-8601 UTC string.

Error responses:

1. `400` invalid `riskId`
2. `404` risk not found
3. `500` server error

Curl:

```bash
curl -X GET "https://your-domain.com/api/risks/6610fd3ac3b6a4e35e11a151/history" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 5. Frontend Integration Snippets (Vanilla JS)

Shared helper:

```js
const BASE_URL = "https://your-domain.com";
const TOKEN = "YOUR_JWT_TOKEN";

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + TOKEN,
      ...(options.headers || {})
    }
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}
```

Fetch all projects:

```js
fetch(`${BASE_URL}/api/projects`, {
  method: "GET",
  headers: {
    Authorization: `Bearer ${TOKEN}`
  }
})
  .then((res) => res.json())
  .then((data) => console.log(data))
  .catch((err) => console.error(err));
```

Create project:

```js
async function createProject(payload) {
  return apiFetch(`${BASE_URL}/api/projects`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
```

Fetch project by ID:

```js
async function fetchProject(projectId) {
  return apiFetch(`${BASE_URL}/api/projects/${projectId}`);
}
```

Update project:

```js
async function updateProject(projectId, payload) {
  return apiFetch(`${BASE_URL}/api/projects/${projectId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}
```

Delete project:

```js
async function deleteProject(projectId) {
  return apiFetch(`${BASE_URL}/api/projects/${projectId}`, {
    method: "DELETE"
  });
}
```

Create risk under project:

```js
async function createRisk(projectId, payload) {
  return apiFetch(`${BASE_URL}/api/projects/${projectId}/risks`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
```

Fetch risks in project:

```js
async function fetchProjectRisks(projectId) {
  return apiFetch(`${BASE_URL}/api/projects/${projectId}/risks`);
}
```

Fetch risk by ID:

```js
async function fetchRisk(riskId) {
  return apiFetch(`${BASE_URL}/api/risks/${riskId}`);
}
```

Update risk details:

```js
async function updateRisk(riskId, payload) {
  return apiFetch(`${BASE_URL}/api/risks/${riskId}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}
```

Delete risk:

```js
async function deleteRisk(riskId) {
  return apiFetch(`${BASE_URL}/api/risks/${riskId}`, {
    method: "DELETE"
  });
}
```

Update risk status:

```js
async function updateRiskStatus(riskId, status, note) {
  return apiFetch(`${BASE_URL}/api/risks/${riskId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, note })
  });
}
```

Fetch risk history:

```js
async function fetchRiskHistory(riskId) {
  return apiFetch(`${BASE_URL}/api/risks/${riskId}/history`);
}
```

---

## 6. Operational Notes

1. Set `MONGODB_URI` in environment for startup.
2. Configure `FRONTEND_URL` as comma-separated origins for production CORS.
3. Keep `API_PREFIX=/api` unless deployment gateway requires a different base path.
4. All endpoints listed are JWT-protected except root health route `/`.

const BASE_URL = 'https://your-domain.com';
const TOKEN = 'YOUR_JWT_TOKEN';

async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
      ...(options.headers || {})
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export const fetchProjects = () => apiFetch(`${BASE_URL}/api/projects`);

export const createProject = (payload) =>
  apiFetch(`${BASE_URL}/api/projects`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const fetchProjectById = (projectId) =>
  apiFetch(`${BASE_URL}/api/projects/${projectId}`);

export const updateProject = (projectId, payload) =>
  apiFetch(`${BASE_URL}/api/projects/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });

export const deleteProject = (projectId) =>
  apiFetch(`${BASE_URL}/api/projects/${projectId}`, {
    method: 'DELETE'
  });

export const createRisk = (projectId, payload) =>
  apiFetch(`${BASE_URL}/api/projects/${projectId}/risks`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

export const fetchProjectRisks = (projectId) =>
  apiFetch(`${BASE_URL}/api/projects/${projectId}/risks`);

export const fetchRiskById = (riskId) =>
  apiFetch(`${BASE_URL}/api/risks/${riskId}`);

export const updateRisk = (riskId, payload) =>
  apiFetch(`${BASE_URL}/api/risks/${riskId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });

export const deleteRisk = (riskId) =>
  apiFetch(`${BASE_URL}/api/risks/${riskId}`, {
    method: 'DELETE'
  });

export const updateRiskStatus = (riskId, status, note) =>
  apiFetch(`${BASE_URL}/api/risks/${riskId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, note })
  });

export const fetchRiskHistory = (riskId) =>
  apiFetch(`${BASE_URL}/api/risks/${riskId}/history`);

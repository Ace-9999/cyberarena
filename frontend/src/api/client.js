const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle(res) {
  const result = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(result.error || `API error: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return result;
}

export const apiClient = {
  get(endpoint) {
    return fetch(`${BASE_URL}${endpoint}`, { headers: { ...authHeaders() } }).then(handle);
  },
  post(endpoint, data) {
    return fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data || {}),
    }).then(handle);
  },
  put(endpoint, data) {
    return fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data || {}),
    }).then(handle);
  },
};

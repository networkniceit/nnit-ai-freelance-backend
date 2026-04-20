// Minimal fetch helper for standalone frontend
const BASE = '/api';

async function request(method, path, body, token) {
  const headers = {};
  const opts = { method, headers };
  if (body) {
    headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(BASE + path, opts);
  const text = await res.text();
  try { return { status: res.status, data: JSON.parse(text) }; } catch (e) { return { status: res.status, data: text }; }
}

window.standaloneApi = {
  request,
  apiRequest: (m,u,b,t)=>request(m,u,b,t),
  notificationsAPI: { getAll: (t)=>request('GET','/notifications',null,t) }
};

export default window.standaloneApi;
export const apiRequest = window.standaloneApi.apiRequest;
export const notificationsAPI = window.standaloneApi.notificationsAPI;
// NNIT Freelance – Standalone API helper
const BASE = '/api';

async function request(method, path, body, token) {
  const headers = {};
  const opts = { method, headers };
  if (body) {
    headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const res = await fetch(BASE + path, opts);
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    return { status: res.status, ok: res.ok, data };
  } catch (err) {
    return { status: 0, ok: false, data: { error: err.message } };
  }
}

window.standaloneApi = {
  request,
  apiRequest: (m, u, b, t) => request(m, u, b, t),

  auth: {
    register: (email, password)       => request('POST', '/auth/register', { email, password }),
    login:    (email, password)       => request('POST', '/auth/login',    { email, password }),
    profile:  (token)                 => request('GET',  '/auth/profile',  null, token),
  },

  notificationsAPI: {
    getAll:   (token)                 => request('GET',  '/notifications', null, token),
    markRead: (id, token)             => request('PATCH',`/notifications/${id}/read`, null, token),
  },

  audit: {
    getLogs:  (token)                 => request('GET',  '/audit-log', null, token),
  },

  jobs: {
    list:     ()                      => request('GET',  '/jobs'),
    apply:    (jobId, token)          => request('POST', `/jobs/${jobId}/apply`, null, token),
  },
};
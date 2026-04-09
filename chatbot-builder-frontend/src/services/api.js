// src/services/api.js
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─── Token Helpers ────────────────────────────────────────────────────────────
export const getToken = () => localStorage.getItem('token');
export const setToken = (token) => localStorage.setItem('token', token);
export const removeToken = () => localStorage.removeItem('token');

// ─── Core Fetch Wrapper ───────────────────────────────────────────────────────
const request = async (endpoint, options = {}) => {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    // If token expired or invalid, clear storage
    if (response.status === 401) {
      removeToken();
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  register: (fullName, email, password) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password })
    }),

  getMe: () => request('/auth/me'),

  logout: () => request('/auth/logout', { method: 'POST' }),

  forgotPassword: (email) =>
    request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),

  resetPassword: (token, password) =>
    request(`/auth/reset-password/${token}`, {
      method: 'PATCH',
      body: JSON.stringify({ password })
    })
};

// ─── Bots API ─────────────────────────────────────────────────────────────────
export const botsAPI = {
  getAll: () => request('/bots'),
  getOne: (id) => request(`/bots/${id}`),
  create: (data) => request('/bots', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/bots/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/bots/${id}`, { method: 'DELETE' })
};

// ─── Conversations API ────────────────────────────────────────────────────────
export const conversationsAPI = {
  getAll: (params = '') => request(`/conversations${params}`),
  getOne: (id) => request(`/conversations/${id}`),
  getMessages: (id) => request(`/conversations/${id}/messages`)
};

// ─── Analytics API ────────────────────────────────────────────────────────────
export const analyticsAPI = {
  getOverview: (params = '') => request(`/analytics/overview${params}`),
  getDetailed: (params = '') => request(`/analytics/detailed${params}`),
  getRealtime: () => request('/analytics/realtime'),
  export: (params = '') => request(`/analytics/export${params}`)
};

// ─── Training API ─────────────────────────────────────────────────────────────
export const trainingAPI = {
  getJobs: () => request('/training/jobs'),
  getJob: (id) => request(`/training/jobs/${id}`),
  createJob: (data) => request('/training/jobs', { method: 'POST', body: JSON.stringify(data) }),
  deleteJob: (id) => request(`/training/jobs/${id}`, { method: 'DELETE' }),
  getModels: () => request('/training/models')
};

// ─── Integrations API ─────────────────────────────────────────────────────────
export const integrationsAPI = {
  getAll: () => request('/integrations'),
  getAvailable: () => request('/integrations/available'),
  getCategories: () => request('/integrations/categories'),
  connect: (data) => request('/integrations/connect', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/integrations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/integrations/${id}`, { method: 'DELETE' }),
  test: (id) => request(`/integrations/${id}/test`, { method: 'POST' })
};

// ─── Team API ─────────────────────────────────────────────────────────────────
export const teamAPI = {
  getTeam: () => request('/team'),
  updateSettings: (data) => request('/team/settings', { method: 'PUT', body: JSON.stringify(data) }),
  invite: (data) => request('/team/invite', { method: 'POST', body: JSON.stringify(data) }),
  acceptInvite: (token) => request('/team/invite/accept', { method: 'POST', body: JSON.stringify({ token }) }),
  updateMemberRole: (memberId, role) => request(`/team/members/${memberId}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  removeMember: (memberId) => request(`/team/members/${memberId}`, { method: 'DELETE' }),
  getActivity: (params = '') => request(`/team/activity${params}`),
  getRoles: () => request('/team/roles')
};

// ─── Billing API ──────────────────────────────────────────────────────────────
export const billingAPI = {
  getSubscription: () => request('/billing/subscription'),
  getPlans: () => request('/billing/plans'),
  getUsage: () => request('/billing/usage'),
  getInvoices: () => request('/billing/invoices'),
  createCheckout: (data) => request('/billing/checkout', { method: 'POST', body: JSON.stringify(data) }),
  cancelSubscription: () => request('/billing/subscription', { method: 'DELETE' }),
  resumeSubscription: () => request('/billing/subscription/resume', { method: 'POST' })
};

// ─── API Keys API ─────────────────────────────────────────────────────────────
export const apiKeysAPI = {
  getAll: () => request('/keys'),
  create: (data) => request('/keys', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/keys/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/keys/${id}`, { method: 'DELETE' })
};
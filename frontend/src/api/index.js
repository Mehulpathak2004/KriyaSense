import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const analyzeText = async (text, sessionId, model = 'kriyacore') => {
  const response = await api.post('/analyze', { text, session_id: sessionId, model });
  return response.data;
};

export const analyzeAudio = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/analyze/audio', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const reportPrediction = async (data) => {
  const response = await api.post('/report', data);
  return response.data;
};

export const fetchStats = async () => {
  const response = await api.get('/stats');
  return response.data;
};

export const submitContact = async (data) => {
  const response = await api.post('/contact', data);
  return response.data;
};

// --- AUTH & USER ---

export const sendOtp = async (email) => {
  const response = await api.post('/auth/send-otp', { email });
  return response.data;
};

export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  if (response.data.access_token) {
    localStorage.setItem('token', response.data.access_token);
    localStorage.setItem('role', response.data.role);
    localStorage.setItem('is_blocked', response.data.is_blocked);
    localStorage.setItem('block_message', response.data.block_message || '');
  }
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (email, otp, new_password) => {
  const response = await api.post('/auth/reset-password', { email, otp, new_password });
  return response.data;
};

export const registerUser = async (username, password, email, otp, companyProfile = {}) => {
  const response = await api.post('/auth/register', { 
    username, password, email, otp,
    company_name: companyProfile.company_name || null,
    industry: companyProfile.industry || null,
    company_size: companyProfile.company_size || null,
    use_case: companyProfile.use_case || null
  });
  return response.data;
};

export const fetchCurrentUser = async () => {
  const response = await api.get('/user/me');
  return response.data;
};

export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('is_blocked');
  localStorage.removeItem('block_message');
};

// --- MODEL HEALTH ---

export const checkModelHealth = async () => {
  const response = await api.get('/health/models');
  return response.data;
};

// --- DEVELOPER API ---

export const generateApiKey = async () => {
  const response = await api.post('/developer/key');
  return response.data;
};

// --- ADMIN API ---

export const fetchAdminStats = async () => {
  const response = await api.get('/tbxadmin/stats');
  return response.data;
};

export const fetchAdminUsers = async () => {
  const response = await api.get('/tbxadmin/users');
  return response.data;
};

export const blockUser = async (userId, message) => {
  const response = await api.put(`/tbxadmin/users/${userId}/block`, { message });
  return response.data;
};

export const unblockUser = async (userId) => {
  const response = await api.put(`/tbxadmin/users/${userId}/unblock`);
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await api.delete(`/tbxadmin/users/${userId}`);
  return response.data;
};

export const updateUserDailyLimit = async (userId, limit) => {
  const response = await api.put(`/tbxadmin/users/${userId}/limit?limit=${limit}`);
  return response.data;
};

export const fetchAdminReports = async () => {
  const response = await api.get('/tbxadmin/reports');
  return response.data;
};

export const fetchAdminMessages = async () => {
  const response = await api.get('/tbxadmin/messages');
  return response.data;
};

export const replyAdminMessage = async (msgId, replyMessage, status) => {
  const response = await api.post(`/tbxadmin/messages/${msgId}/reply`, { reply_message: replyMessage, status });
  return response.data;
};

export const updateMessageStatus = async (msgId, status) => {
  const response = await api.put(`/tbxadmin/messages/${msgId}/status?status=${status}`);
  return response.data;
};

export const fetchAdminSettings = async () => {
  const response = await api.get('/tbxadmin/settings');
  return response.data;
};

export const updateAdminSettings = async (kriyasense_v1_url) => {
  const response = await api.post('/tbxadmin/settings', { kriyasense_v1_url });
  return response.data;
};

export const fetchRecentActivity = async () => {
  const response = await api.get('/tbxadmin/recent-activity');
  return response.data;
};

// --- CSV BATCH PREDICTION API ---

export const uploadCsv = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/csv/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
      ? (e) => onProgress(Math.round((e.loaded * 100) / e.total))
      : undefined,
  });
  return response.data;
};

export const previewCsvColumn = async (jobId, column) => {
  const response = await api.get(`/csv/${jobId}/preview?column=${encodeURIComponent(column)}`);
  return response.data;
};

export const startCsvPrediction = async (jobId, column, model = 'kriyacore') => {
  const response = await api.post(`/csv/${jobId}/predict`, { column, model });
  return response.data;
};

export const getCsvJobStatus = async (jobId) => {
  const response = await api.get(`/csv/${jobId}/status`);
  return response.data;
};

export const downloadCsvResult = async (jobId) => {
  const response = await api.get(`/csv/${jobId}/download`, {
    responseType: 'blob',
  });
  return response;
};

export const fetchCsvHistory = async () => {
  const response = await api.get('/csv/history');
  return response.data;
};

export const fetchAdminCsvJobs = async () => {
  const response = await api.get('/tbxadmin/csv-jobs');
  return response.data;
};


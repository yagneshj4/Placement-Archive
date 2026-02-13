import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// Experience API
export const experienceApi = {
  getAll: (params) => api.get('/experiences', { params }),
  getById: (id) => api.get(`/experiences/${id}`),
  create: (data) => api.post('/experiences', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.put(`/experiences/${id}`, data),
  delete: (id) => api.delete(`/experiences/${id}`),
  like: (id) => api.post(`/experiences/${id}/like`),
  bookmark: (id) => api.post(`/experiences/${id}/bookmark`),
  report: (id, data) => api.post(`/experiences/${id}/report`, data),
  getUserExperiences: () => api.get('/experiences/user/me'),
  getBookmarks: () => api.get('/experiences/user/bookmarks')
}

// Analytics API
export const analyticsApi = {
  getOverview: () => api.get('/analytics/overview'),
  getCompanies: (params) => api.get('/analytics/companies', { params }),
  getTopics: (params) => api.get('/analytics/topics', { params }),
  getTrends: (params) => api.get('/analytics/trends', { params }),
  getDifficultyHeatmap: (params) => api.get('/analytics/difficulty-heatmap', { params }),
  getInsights: () => api.get('/analytics/insights'),
  getCompanyDetails: (name) => api.get(`/analytics/company/${encodeURIComponent(name)}`)
}

// Query API
export const queryApi = {
  submit: (data) => api.post('/query', data),
  getSuggestions: (company) => api.get('/query/suggestions', { params: { company } }),
  getHistory: (params) => api.get('/query/history', { params }),
  submitFeedback: (id, data) => api.post(`/query/${id}/feedback`, data)
}

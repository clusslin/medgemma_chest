import axios from 'axios'

const API_BASE_URL = '/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// DICOM Nodes API
export const dicomNodesAPI = {
  getAll: (params) => api.get('/dicom-nodes', { params }),
  getById: (id) => api.get(`/dicom-nodes/${id}`),
  create: (data) => api.post('/dicom-nodes', data),
  update: (id, data) => api.put(`/dicom-nodes/${id}`, data),
  delete: (id) => api.delete(`/dicom-nodes/${id}`),
  testConnection: (id) => api.post(`/dicom-nodes/${id}/test`),
}

// Studies API
export const studiesAPI = {
  getAll: (params) => api.get('/studies', { params }),
  getById: (uid) => api.get(`/studies/${uid}`),
  getStats: () => api.get('/studies/stats'),
  delete: (uid) => api.delete(`/studies/${uid}`),
  reprocess: (uid) => api.post(`/studies/${uid}/reprocess`),
}

// Prompts API
export const promptsAPI = {
  getAll: (params) => api.get('/prompts', { params }),
  getById: (id) => api.get(`/prompts/${id}`),
  create: (data) => api.post('/prompts', data),
  update: (id, data) => api.put(`/prompts/${id}`, data),
  delete: (id) => api.delete(`/prompts/${id}`),
  setDefault: (id) => api.post(`/prompts/${id}/set-default`),
}

export default api

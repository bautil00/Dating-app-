import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : import.meta.env.PROD
    ? 'https://api-lemon-psi-31.vercel.app/api/v1'
    : '/api/v1'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authService = {
  register: (email: string, password: string) =>
    api.post('/auth/register', { email, password }),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  getGoogleUrl: () =>
    api.get('/auth/google/url'),

  getMe: () =>
    api.get('/auth/me'),
}

export const profileService = {
  create: (data: Record<string, unknown>) =>
    api.post('/profiles/', data),

  getMe: () =>
    api.get('/profiles/me'),

  update: (data: Record<string, unknown>) =>
    api.patch('/profiles/me', data),

  getCandidates: (limit = 10) =>
    api.get(`/profiles/candidates?limit=${limit}`),

  getById: (id: number) =>
    api.get(`/profiles/${id}`),
}

export const matchService = {
  like: (candidateId: string) =>
    api.post('/matches/', { receiver_id: candidateId }),

  create: (receiverId: number) =>
    api.post('/matches/', { receiver_id: receiverId }),

  getAll: () =>
    api.get('/matches/'),

  accept: (id: number) =>
    api.patch(`/matches/${id}/accept`),

  reject: (id: number) =>
    api.patch(`/matches/${id}/reject`),
}

export const messageService = {
  send: (receiverId: number, content: string) =>
    api.post('/messages/', { receiver_id: receiverId, content }),

  getConversations: () =>
    api.get('/messages/conversations'),

  getConversation: (userId: number) =>
    api.get(`/messages/conversations/${userId}`),

  markRead: (messageId: number) =>
    api.patch(`/messages/${messageId}/read`),
}

export const aiService = {
  getIcebreaker: (matchId: number) =>
    api.get(`/ai/icebreaker/${matchId}`),

  getCompatibility: (profileId: number) =>
    api.get(`/ai/compatibility/${profileId}`),
}

export default api

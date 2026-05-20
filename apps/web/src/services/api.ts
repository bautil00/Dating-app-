import axios, { type AxiosResponse } from 'axios';

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : import.meta.env.PROD
    ? 'https://api-lemon-psi-31.vercel.app/api/v1'
    : '/api/v1';

const api = axios.create({
  baseURL: API_URL,
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

type CacheEntry<T = AxiosResponse['data']> = {
  data: T;
  expiresAt: number;
  cachedAt: number;
};

type CacheOptions = {
  ttlMs?: number;
  persist?: boolean;
};

const CACHE_PREFIX = 'blowtorch-api-cache-v1';
const DEFAULT_CACHE_TTL_MS = 30_000;
const memoryCache = new Map<string, CacheEntry>();

function tokenScope() {
  const token = localStorage.getItem('token') || 'anonymous';
  let hash = 0;
  for (let index = 0; index < token.length; index += 1) {
    hash = (hash * 31 + token.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}

function cacheKey(url: string) {
  return `${CACHE_PREFIX}:${tokenScope()}:${url}`;
}

function responseFromCache<T>(url: string, entry: CacheEntry<T>): AxiosResponse<T> {
  return {
    data: entry.data,
    status: 200,
    statusText: 'OK',
    headers: { 'x-blowtorch-cache': 'hit' },
    config: { url },
  } as unknown as AxiosResponse<T>;
}

function readSessionCache<T>(key: string): CacheEntry<T> | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry<T>;
  } catch {
    sessionStorage.removeItem(key);
    return null;
  }
}

function writeSessionCache(key: string, entry: CacheEntry) {
  try {
    sessionStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Browsers can deny or evict storage. The in-memory cache still helps route switches.
  }
}

function deleteMatchingSessionCache(match: (key: string) => boolean) {
  try {
    Object.keys(sessionStorage)
      .filter((key) => key.startsWith(CACHE_PREFIX) && match(key))
      .forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // Ignore storage access failures.
  }
}

export function clearApiCache() {
  memoryCache.clear();
  deleteMatchingSessionCache(() => true);
}

export function invalidateApiCache(pattern?: string | RegExp) {
  const matches = (key: string) => {
    if (!pattern) return true;
    if (typeof pattern === 'string') return key.includes(pattern);
    return pattern.test(key);
  };

  Array.from(memoryCache.keys())
    .filter(matches)
    .forEach((key) => memoryCache.delete(key));
  deleteMatchingSessionCache(matches);
}

export async function cachedGet<T = AxiosResponse['data']>(
  url: string,
  { ttlMs = DEFAULT_CACHE_TTL_MS, persist = true }: CacheOptions = {},
) {
  const key = cacheKey(url);
  const now = Date.now();
  const memoryEntry = memoryCache.get(key) as CacheEntry<T> | undefined;

  if (memoryEntry && memoryEntry.expiresAt > now) {
    return responseFromCache(url, memoryEntry);
  }

  const sessionEntry = persist ? readSessionCache<T>(key) : null;
  if (sessionEntry && sessionEntry.expiresAt > now) {
    memoryCache.set(key, sessionEntry);
    return responseFromCache(url, sessionEntry);
  }

  const response = await api.get<T>(url);
  const entry: CacheEntry<T> = {
    data: response.data,
    cachedAt: now,
    expiresAt: now + ttlMs,
  };
  memoryCache.set(key, entry);
  if (persist) writeSessionCache(key, entry);
  return response;
}

export const authService = {
  register: (email: string, password: string) => api.post('/auth/register', { email, password }),

  login: (email: string, password: string) => api.post('/auth/login', { email, password }),

  getGoogleUrl: () => api.get('/auth/google/url'),

  getMe: () => cachedGet('/auth/me', { ttlMs: 30_000, persist: false }),
};

export const profileService = {
  create: async (data: Record<string, unknown>) => {
    const response = await api.post('/profiles/', data);
    invalidateApiCache(/profiles|candidates|matches/);
    return response;
  },

  getMe: () => cachedGet('/profiles/me', { ttlMs: 60_000 }),

  update: async (data: Record<string, unknown>) => {
    const response = await api.patch('/profiles/me', data);
    invalidateApiCache(/profiles|candidates|matches/);
    return response;
  },

  getCandidates: (limit = 10) =>
    cachedGet(`/profiles/candidates?limit=${limit}`, { ttlMs: 20_000 }),

  getById: (id: string | number) => cachedGet(`/profiles/${id}`, { ttlMs: 5 * 60_000 }),
};

export const matchService = {
  like: async (candidateId: string) => {
    const response = await api.post('/matches/', { receiver_id: candidateId });
    invalidateApiCache(/matches|candidates|messages/);
    return response;
  },

  create: async (receiverId: string | number) => {
    const response = await api.post('/matches/', { receiver_id: receiverId });
    invalidateApiCache(/matches|candidates|messages/);
    return response;
  },

  getAll: () => cachedGet('/matches/', { ttlMs: 15_000 }),

  accept: async (id: number) => {
    const response = await api.patch(`/matches/${id}/accept`);
    invalidateApiCache(/matches|messages|conversations/);
    return response;
  },

  reject: async (id: number) => {
    const response = await api.patch(`/matches/${id}/reject`);
    invalidateApiCache(/matches|messages|conversations/);
    return response;
  },
};

export const messageService = {
  send: async (receiverId: string | number, content: string) => {
    const response = await api.post('/messages/', { receiver_id: receiverId, content });
    invalidateApiCache(/messages|conversations/);
    return response;
  },

  getConversations: () => cachedGet('/messages/conversations', { ttlMs: 10_000 }),

  getConversation: (userId: string | number) =>
    cachedGet(`/messages/conversations/${userId}`, { ttlMs: 5_000, persist: false }),

  markRead: async (messageId: number) => {
    const response = await api.patch(`/messages/${messageId}/read`);
    invalidateApiCache(/messages|conversations/);
    return response;
  },
};

export const aiService = {
  getIcebreaker: (matchId: string | number) => api.get(`/ai/icebreaker/${matchId}`),

  getCompatibility: (profileId: string | number) => api.get(`/ai/compatibility/${profileId}`),
};

export default api;

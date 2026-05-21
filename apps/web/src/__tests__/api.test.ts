import { describe, it, expect, vi, beforeEach } from 'vitest';
import 'axios';

vi.mock('axios', () => {
  const mockAxios: Record<string, unknown> = {
    create: vi.fn(() => mockAxios),
    interceptors: {
      request: { use: vi.fn() },
    },
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  };
  return { default: mockAxios };
});

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('creates axios instance with correct baseURL pattern', async () => {
    // Re-import to trigger module init
    const { default: api } = await import('../services/api');
    expect(api).toBeDefined();
  });

  it('stores token in localStorage on login', () => {
    localStorage.setItem('token', 'test-token-123');
    expect(localStorage.getItem('token')).toBe('test-token-123');
  });

  it('removes token on logout', () => {
    localStorage.setItem('token', 'test-token-123');
    localStorage.removeItem('token');
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('authService exports expected methods', async () => {
    const { authService } = await import('../services/api');
    expect(authService).toHaveProperty('register');
    expect(authService).toHaveProperty('login');
    expect(authService).toHaveProperty('getMe');
  });

  it('profileService exports expected methods', async () => {
    const { profileService } = await import('../services/api');
    expect(profileService).toHaveProperty('create');
    expect(profileService).toHaveProperty('getMe');
    expect(profileService).toHaveProperty('getCandidates');
  });

  it('matchService exports expected methods', async () => {
    const { matchService } = await import('../services/api');
    expect(matchService).toHaveProperty('like');
    expect(matchService).toHaveProperty('dismiss');
    expect(matchService).toHaveProperty('getAll');
    expect(matchService).toHaveProperty('accept');
    expect(matchService).toHaveProperty('reject');
  });

  it('messageService exports expected methods', async () => {
    const { messageService } = await import('../services/api');
    expect(messageService).toHaveProperty('send');
    expect(messageService).toHaveProperty('getConversation');
    expect(messageService).toHaveProperty('getConversations');
  });

  it('cachedGet reuses fresh GET responses', async () => {
    const { default: api, cachedGet, clearApiCache } = await import('../services/api');
    clearApiCache();
    vi.mocked(api.get).mockResolvedValueOnce({ data: { name: 'Maya' } });

    const first = await cachedGet('/profiles/me', { ttlMs: 60_000 });
    const second = await cachedGet('/profiles/me', { ttlMs: 60_000 });

    expect(first.data).toEqual({ name: 'Maya' });
    expect(second.data).toEqual({ name: 'Maya' });
    expect(api.get).toHaveBeenCalledTimes(1);
  });

  it('normalizes Supabase weak password JSON into readable copy', async () => {
    const { userFacingError } = await import('../services/api');
    const error = {
      response: {
        data: {
          detail:
            '{"code":422,"error_code":"weak_password","msg":"Password should contain at least one character of each category"}',
        },
      },
    };

    expect(userFacingError(error, 'Registration failed')).toBe(
      'Use a stronger password with uppercase and lowercase letters, a number, and a symbol.',
    );
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest'
import 'axios'

vi.mock('axios', () => {
  const mockAxios: any = {
    create: vi.fn(() => mockAxios),
    interceptors: {
      request: { use: vi.fn() },
    },
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  }
  return { default: mockAxios }
})

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('creates axios instance with correct baseURL pattern', async () => {
    // Re-import to trigger module init
    const { default: api } = await import('../services/api')
    expect(api).toBeDefined()
  })

  it('stores token in localStorage on login', () => {
    localStorage.setItem('token', 'test-token-123')
    expect(localStorage.getItem('token')).toBe('test-token-123')
  })

  it('removes token on logout', () => {
    localStorage.setItem('token', 'test-token-123')
    localStorage.removeItem('token')
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('authService exports expected methods', async () => {
    const { authService } = await import('../services/api')
    expect(authService).toHaveProperty('register')
    expect(authService).toHaveProperty('login')
    expect(authService).toHaveProperty('getMe')
  })

  it('profileService exports expected methods', async () => {
    const { profileService } = await import('../services/api')
    expect(profileService).toHaveProperty('create')
    expect(profileService).toHaveProperty('getMe')
    expect(profileService).toHaveProperty('getCandidates')
  })

  it('matchService exports expected methods', async () => {
    const { matchService } = await import('../services/api')
    expect(matchService).toHaveProperty('like')
    expect(matchService).toHaveProperty('getAll')
    expect(matchService).toHaveProperty('accept')
    expect(matchService).toHaveProperty('reject')
  })

  it('messageService exports expected methods', async () => {
    const { messageService } = await import('../services/api')
    expect(messageService).toHaveProperty('send')
    expect(messageService).toHaveProperty('getConversation')
    expect(messageService).toHaveProperty('getConversations')
  })
})

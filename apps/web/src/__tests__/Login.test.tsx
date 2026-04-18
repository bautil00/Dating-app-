import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../services/api', () => ({
  default: {
    interceptors: { request: { use: vi.fn() } },
  },
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    getMe: vi.fn(),
  },
}))

import Login from '../pages/Login'
import Register from '../pages/Register'

describe('Login Page', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('renders email and password inputs', () => {
    render(<MemoryRouter><Login /></MemoryRouter>)
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
  })

  it('renders sign in button', () => {
    render(<MemoryRouter><Login /></MemoryRouter>)
    expect(screen.getByText('Sign In')).toBeInTheDocument()
  })

  it('renders link to register', () => {
    render(<MemoryRouter><Login /></MemoryRouter>)
    expect(screen.getByText('Sign up')).toBeInTheDocument()
  })

  it('renders BLOWTORCH branding', () => {
    render(<MemoryRouter><Login /></MemoryRouter>)
    expect(screen.getByText('BLOWTORCH')).toBeInTheDocument()
    expect(screen.getByText('Find your perfect match')).toBeInTheDocument()
  })

  it('email input accepts text', () => {
    render(<MemoryRouter><Login /></MemoryRouter>)
    const input = screen.getByPlaceholderText('Email address') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'test@example.com' } })
    expect(input.value).toBe('test@example.com')
  })
})

describe('Register Page', () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear() })

  it('renders three input fields', () => {
    render(<MemoryRouter><Register /></MemoryRouter>)
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password (min 6 characters)')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Confirm password')).toBeInTheDocument()
  })

  it('renders create account button', () => {
    render(<MemoryRouter><Register /></MemoryRouter>)
    expect(screen.getByText('Create Account')).toBeInTheDocument()
  })

  it('renders link to login', () => {
    render(<MemoryRouter><Register /></MemoryRouter>)
    expect(screen.getByText('Sign in')).toBeInTheDocument()
  })
})

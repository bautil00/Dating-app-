import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mockApi = vi.hoisted(() => ({
  get: vi.fn().mockResolvedValue({ data: { is_complete: false } }),
  post: vi.fn().mockResolvedValue({ data: {} }),
  patch: vi.fn(),
  interceptors: { request: { use: vi.fn() } },
}));

vi.mock('../services/api', () => ({
  default: mockApi,
  profileService: {
    getMe: () => mockApi.get('/profiles/me'),
    create: (data: Record<string, unknown>) => mockApi.post('/profiles/', data),
  },
  locationService: {
    search: vi.fn(),
  },
  userFacingError: () => 'Failed to save profile',
  clearApiCache: vi.fn(),
  invalidateApiCache: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import Profile from '../pages/Profile';

describe('Profile Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'fake-token');
  });

  it('renders all form sections', () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );
    expect(screen.getAllByText('Basic Info').length).toBeGreaterThan(0);
    expect(screen.getAllByText('About You').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Preferences').length).toBeGreaterThan(0);
  });

  it('renders gender dropdown with correct enum values', () => {
    const { container } = render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );
    const select = container.querySelector('select[name="gender"]');
    expect(select).not.toBeNull();
    expect(screen.getAllByText('Male').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Female').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Non-Binary').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Mtf').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ftm').length).toBeGreaterThan(0);
  });

  it('renders multi-select interests', () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );
    expect(screen.getByText('Music')).toBeInTheDocument();
    expect(screen.getByText('Gaming')).toBeInTheDocument();
    expect(screen.getByText('Programming')).toBeInTheDocument();
  });

  it('renders schedule and lifestyle fields', () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );
    expect(screen.getAllByText('Schedule').length).toBeGreaterThan(0);
    expect(screen.getByText('Available Days')).toBeInTheDocument();
    expect(screen.getByText('Available Time Windows')).toBeInTheDocument();
    expect(screen.getByText('Has Pets')).toBeInTheDocument();
  });

  it('renders job dropdown', () => {
    const { container } = render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );
    const select = container.querySelector('select[name="job"]');
    expect(select).not.toBeNull();
    expect(screen.getByText('Programmer')).toBeInTheDocument();
  });

  it('renders zodiac dropdown', () => {
    const { container } = render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );
    expect(container.querySelector('select[name="zodiac"]')).not.toBeNull();
  });

  it('renders save button', () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );
    expect(screen.getByText('Save Profile')).toBeInTheDocument();
  });

  it('redirects to login if no token', () => {
    localStorage.removeItem('token');
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});

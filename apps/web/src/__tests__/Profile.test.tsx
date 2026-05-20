import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    expect(screen.getAllByText('About You').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Identity').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Lifestyle').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Preferences').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Personality').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Appearance').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Socials').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Account').length).toBeGreaterThan(0);
  });

  it('renders gender dropdown with correct enum values', async () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole('button', { name: /identity/i }));
    await userEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(screen.getAllByText('Male').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Female').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Non-binary').length).toBeGreaterThan(0);
    expect(screen.getAllByText('MTF').length).toBeGreaterThan(0);
    expect(screen.getAllByText('FTM').length).toBeGreaterThan(0);
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

  it('renders schedule and lifestyle fields', async () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole('button', { name: /lifestyle/i }));
    expect(screen.getByText('Availability')).toBeInTheDocument();
    expect(screen.getByText('Time Availability')).toBeInTheDocument();
    expect(screen.getByText('Has Pets')).toBeInTheDocument();
  });

  it('renders job dropdown', () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );
    expect(screen.getByText('Programmer')).toBeInTheDocument();
  });

  it('renders zodiac dropdown', async () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole('button', { name: /personality/i }));
    await userEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(screen.getByText('Zodiac')).toBeInTheDocument();
    expect(screen.getByText('Leo')).toBeInTheDocument();
  });

  it('renders save button', () => {
    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );
    expect(screen.getByText('Save')).toBeInTheDocument();
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

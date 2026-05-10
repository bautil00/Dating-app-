import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { is_complete: false } }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    interceptors: { request: { use: vi.fn() } },
  },
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
    expect(screen.getByText('Basic Info')).toBeInTheDocument();
    expect(screen.getByText('About You')).toBeInTheDocument();
    expect(screen.getByText('Preferences')).toBeInTheDocument();
  });

  it('renders gender dropdown with correct enum values', () => {
    const { container } = render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );
    const select = container.querySelector('select[name="gender"]');
    expect(select).not.toBeNull();
    expect(screen.getByText('Male')).toBeInTheDocument();
    expect(screen.getByText('Female')).toBeInTheDocument();
    expect(screen.getByText('Non-Binary')).toBeInTheDocument();
    expect(screen.getByText('Mtf')).toBeInTheDocument();
    expect(screen.getByText('Ftm')).toBeInTheDocument();
  });

  it('renders interests dropdown', () => {
    const { container } = render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );
    const select = container.querySelector('select[name="interests"]');
    expect(select).not.toBeNull();
    expect(screen.getByText('Music')).toBeInTheDocument();
    expect(screen.getByText('Gaming')).toBeInTheDocument();
    expect(screen.getByText('Programming')).toBeInTheDocument();
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

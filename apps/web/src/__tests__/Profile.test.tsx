import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const mockApi = vi.hoisted(() => ({
  get: vi.fn().mockResolvedValue({ data: { is_complete: false } }),
  post: vi.fn().mockResolvedValue({ data: {} }),
  patch: vi.fn(),
  dataUrlForFile: vi.fn().mockResolvedValue('data:image/jpeg;base64,profile-photo'),
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

vi.mock('../lib/images', () => ({
  dataUrlForFile: mockApi.dataUrlForFile,
}));

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

  it('uploads a profile photo and includes it in the save payload', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );
    const file = new File(['fake-image'], 'profile.jpg', { type: 'image/jpeg' });

    await user.click(screen.getByRole('button', { name: 'Upload profile photo' }));
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    await screen.findByText('Profile photo ready. Save profile to keep it.');
    fireEvent.change(container.querySelector('input[name="display_name"]')!, {
      target: { value: 'Alice' },
    });
    fireEvent.change(container.querySelector('input[name="age"]')!, {
      target: { value: '25' },
    });
    fireEvent.change(container.querySelector('select[name="gender"]')!, {
      target: { value: 'female' },
    });
    fireEvent.click(screen.getByText('Save Profile'));

    await waitFor(() => expect(mockApi.post).toHaveBeenCalled());
    const lastCall = mockApi.post.mock.calls[mockApi.post.mock.calls.length - 1];
    expect(lastCall[1]).toMatchObject({
      display_name: 'Alice',
      age: 25,
      profile_image_url: 'data:image/jpeg;base64,profile-photo',
    });
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

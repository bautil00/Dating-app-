import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  getMe: vi.fn(),
  getProfile: vi.fn(),
  getCandidates: vi.fn(),
  getMatches: vi.fn(),
  createMatch: vi.fn(),
  dismissMatch: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('../services/api', () => ({
  authService: {
    getMe: mocks.getMe,
  },
  profileService: {
    getMe: mocks.getProfile,
    getCandidates: mocks.getCandidates,
  },
  matchService: {
    getAll: mocks.getMatches,
    create: mocks.createMatch,
    dismiss: mocks.dismissMatch,
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mocks.navigate };
});

import Dashboard from '../pages/Dashboard';

const candidate = {
  user_id: 'bob',
  name: 'Bob',
  age: 27,
  bio: 'Likes music and coffee.',
  interests: ['music', 'gaming'],
  profile_image_url: 'data:image/jpeg;base64,bob-photo',
  compatibility_score: 86,
  compatibility_reason: 'You both enjoy music and low-key coffee plans.',
  compatibility_factors: [
    {
      label: 'Shared interests',
      points: 86,
      detail: 'Music appears in both profiles.',
    },
  ],
};

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  );
}

describe('Dashboard swipe actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'fake-token');
    mocks.getMe.mockResolvedValue({ data: { id: 'alice', email: 'alice@test.com' } });
    mocks.getProfile.mockResolvedValue({
      data: { user_id: 'alice', display_name: 'Alice', is_complete: true },
    });
    mocks.getCandidates.mockResolvedValue({ data: [candidate] });
    mocks.getMatches.mockResolvedValue({ data: [] });
    mocks.createMatch.mockResolvedValue({
      data: { id: 1, sender_id: 'alice', receiver_id: 'bob', status: 'pending' },
    });
    mocks.dismissMatch.mockResolvedValue({
      data: { sender_id: 'alice', receiver_id: 'bob', status: 'rejected' },
    });
  });

  it('swipe right sends an ignite instead of only advancing', async () => {
    renderDashboard();

    const card = await screen.findByTestId('discover-card');
    fireEvent.pointerDown(card, { clientX: 120, pointerId: 1 });
    fireEvent.pointerMove(card, { clientX: 245, pointerId: 1 });
    fireEvent.pointerUp(card, { clientX: 245, pointerId: 1 });

    await waitFor(() => expect(mocks.createMatch).toHaveBeenCalledWith('bob'));
    expect(mocks.dismissMatch).not.toHaveBeenCalled();
  });

  it('swipe left records a pass instead of only advancing', async () => {
    renderDashboard();

    const card = await screen.findByTestId('discover-card');
    fireEvent.pointerDown(card, { clientX: 240, pointerId: 1 });
    fireEvent.pointerMove(card, { clientX: 110, pointerId: 1 });
    fireEvent.pointerUp(card, { clientX: 110, pointerId: 1 });

    await waitFor(() => expect(mocks.dismissMatch).toHaveBeenCalledWith('bob'));
    expect(mocks.createMatch).not.toHaveBeenCalled();
  });

  it('side arrow records a pass', async () => {
    renderDashboard();

    await screen.findByText('Bob, 27');
    fireEvent.click(screen.getByRole('button', { name: 'Pass profile' }));

    await waitFor(() => expect(mocks.dismissMatch).toHaveBeenCalledWith('bob'));
  });

  it('shows expandable compatibility reasons', async () => {
    renderDashboard();

    expect(await screen.findByText('You both enjoy music and low-key coffee plans.')).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: /why this score/i }));

    expect(screen.getByText('Shared interests')).toBeVisible();
    expect(screen.getByText('86 pts')).toBeVisible();
    expect(screen.getByText('Music appears in both profiles.')).toBeVisible();
  });

  it('renders candidate profile images on discover cards', async () => {
    renderDashboard();

    const image = await screen.findByAltText('Bob');
    expect(image).toHaveAttribute('src', 'data:image/jpeg;base64,bob-photo');
  });
});

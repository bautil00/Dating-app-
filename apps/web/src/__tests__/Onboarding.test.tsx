import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  getMe: vi.fn(),
  createProfile: vi.fn(),
  searchLocations: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('../services/api', () => ({
  authService: {
    getMe: mocks.getMe,
  },
  profileService: {
    create: mocks.createProfile,
  },
  locationService: {
    search: mocks.searchLocations,
  },
  userFacingError: () => 'Could not finish onboarding. Try again.',
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mocks.navigate };
});

import Onboarding from '../pages/Onboarding';

describe('Onboarding Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'fake-token');
    mocks.getMe.mockResolvedValue({ data: { email: 'tester@example.com' } });
    mocks.searchLocations.mockResolvedValue({
      data: [
        {
          label: 'Seattle, Washington, United States',
          latitude: 47.6062,
          longitude: -122.3321,
          source_id: '123',
        },
      ],
    });
  });

  it('walks through Zack-style onboarding steps before the photo gate', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Onboarding />
      </MemoryRouter>,
    );

    expect(await screen.findByText('What ignites your passion?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tech / AI' }));
    await user.click(screen.getByRole('button', { name: 'Music' }));
    await user.click(screen.getByRole('button', { name: 'Gaming' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByText('I am')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Female' })[0]);
    await user.click(screen.getByRole('button', { name: 'Everyone' }));
    await user.type(screen.getByLabelText('Location'), 'Seattle');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await user.click(
      await screen.findByRole('button', { name: 'Seattle, Washington, United States' }),
    );
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getByText('Tell your story')).toBeInTheDocument();
    await user.type(
      screen.getByLabelText('Bio'),
      'I like thoughtful conversations and weekend coffee.',
    );
    await user.click(screen.getByRole('button', { name: 'Ignite Your Journey' }));

    expect(screen.getByText('Add up to 3 photos')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });
});

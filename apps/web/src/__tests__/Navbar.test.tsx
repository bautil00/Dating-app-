import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../services/api', () => ({
  authService: {
    getMe: vi.fn().mockResolvedValue({ data: {} }),
  },
  clearApiCache: vi.fn(),
  matchService: {
    getAll: vi.fn().mockResolvedValue({ data: [] }),
  },
  messageService: {
    getConversations: vi.fn().mockResolvedValue({ data: [] }),
  },
  profileService: {
    getMe: vi.fn().mockResolvedValue({ data: null }),
    getCandidates: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

import Navbar from '../components/Navbar';

describe('Navbar', () => {
  it('renders mobile-accessible route tabs for all protected sections', () => {
    render(
      <MemoryRouter initialEntries={['/messages']}>
        <Navbar sparkCount={3} unreadCount={2} />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole('link', { name: /Discover/i }).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByRole('link', { name: /Sparks/i }).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByRole('link', { name: /Messages/i }).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByRole('link', { name: /Profile/i }).length).toBeGreaterThanOrEqual(2);
    expect(
      screen
        .getAllByRole('link', { current: 'page' })
        .some((link) => link.textContent?.includes('Messages')),
    ).toBe(true);
  });
});

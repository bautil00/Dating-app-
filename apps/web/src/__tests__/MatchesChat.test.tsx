import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import api from '../services/api';
import Matches from '../pages/Matches';
import Chat from '../pages/Chat';
import Messages from '../pages/Messages';

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: { request: { use: vi.fn() } },
  },
}));

describe('Matches and Chat profile names', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'fake-token');
  });

  it('renders matched profile names instead of UUIDs', async () => {
    vi.mocked(api.get).mockImplementation((path: string) => {
      if (path === '/matches/') {
        return Promise.resolve({
          data: [
            {
              id: 7,
              sender_id: 'alice-user-id',
              receiver_id: 'maya-user-id',
              status: 'accepted',
              created_at: '2026-05-19T00:00:00Z',
              other_profile: { user_id: 'maya-user-id', name: 'Maya Brooks' },
            },
          ],
        });
      }
      if (path === '/auth/me') {
        return Promise.resolve({ data: { id: 'alice-user-id' } });
      }
      return Promise.reject(new Error(`Unexpected path ${path}`));
    });

    render(
      <MemoryRouter>
        <Matches />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Maya Brooks')).toBeInTheDocument();
    expect(screen.queryByText(/maya-user-id/)).not.toBeInTheDocument();
  });

  it('renders the chat target profile name in the header', async () => {
    vi.mocked(api.get).mockImplementation((path: string) => {
      if (path === '/messages/conversations/maya-user-id') {
        return Promise.resolve({ data: [] });
      }
      if (path === '/profiles/maya-user-id') {
        return Promise.resolve({ data: { user_id: 'maya-user-id', name: 'Maya Brooks' } });
      }
      return Promise.reject(new Error(`Unexpected path ${path}`));
    });

    render(
      <MemoryRouter initialEntries={['/chat/maya-user-id']}>
        <Routes>
          <Route path="/chat/:userId" element={<Chat />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Maya Brooks' })).toBeInTheDocument();
    expect(screen.queryByText(/User #/)).not.toBeInTheDocument();
  });

  it('renders the message inbox tab with conversation profile names', async () => {
    vi.mocked(api.get).mockImplementation((path: string) => {
      if (path === '/messages/conversations') {
        return Promise.resolve({
          data: [
            {
              user_id: 'maya-user-id',
              last_message: 'See you Friday',
              last_timestamp: '2026-05-19T00:00:00Z',
              unread_count: 2,
            },
          ],
        });
      }
      if (path === '/profiles/maya-user-id') {
        return Promise.resolve({
          data: { user_id: 'maya-user-id', name: 'Maya Brooks', interests: ['music'] },
        });
      }
      return Promise.reject(new Error(`Unexpected path ${path}`));
    });

    render(
      <MemoryRouter initialEntries={['/messages']}>
        <Messages />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('link', { name: /messages/i })).toBeInTheDocument();
    expect(await screen.findByText('Maya Brooks')).toBeInTheDocument();
    expect(screen.getByText('See you Friday')).toBeInTheDocument();
  });
});

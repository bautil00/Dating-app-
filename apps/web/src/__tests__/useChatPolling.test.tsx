import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  markIncomingMessagesRead,
  mergeMessages,
  useChatPolling,
  type LiveMessageRecord,
} from '../hooks/useChatPolling';
import { messageService } from '../services/api';

vi.mock('../services/api', () => ({
  messageService: {
    markRead: vi.fn(() => Promise.resolve({ data: { is_read: true } })),
  },
}));

describe('chat polling helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('polls while enabled without overlapping requests', async () => {
    const onPoll = vi.fn(() => Promise.resolve());
    renderHook(() => useChatPolling({ enabled: true, intervalMs: 1_000, onPoll }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });

    expect(onPoll).toHaveBeenCalledTimes(1);
  });

  it('merges messages by backend id without duplicating optimistic sends', () => {
    const existing: LiveMessageRecord[] = [
      {
        id: 9,
        content: 'optimistic copy',
        created_at: '2026-05-20T00:00:00Z',
        sender_id: 'me',
      },
    ];
    const incoming: LiveMessageRecord[] = [
      {
        id: 9,
        content: 'server copy',
        created_at: '2026-05-20T00:00:00Z',
        sender_id: 'me',
      },
    ];

    expect(mergeMessages(existing, incoming)).toEqual(incoming);
  });

  it('marks only unread incoming messages as read', async () => {
    await markIncomingMessagesRead(
      [
        {
          id: 1,
          content: 'hello',
          created_at: '2026-05-20T00:00:00Z',
          sender_id: 'other-user',
          is_read: false,
        },
        {
          id: 2,
          content: 'sent by me',
          created_at: '2026-05-20T00:01:00Z',
          sender_id: 'current-user',
          is_read: false,
        },
        {
          id: 3,
          content: 'already read',
          created_at: '2026-05-20T00:02:00Z',
          sender_id: 'other-user',
          is_read: true,
        },
      ],
      'current-user',
    );

    expect(messageService.markRead).toHaveBeenCalledTimes(1);
    expect(messageService.markRead).toHaveBeenCalledWith(1);
  });
});

import { useEffect, useRef } from 'react';
import { messageService } from '../services/api';

export type LiveMessageRecord = {
  id: number;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id?: string;
  is_read?: boolean;
};

type PollingOptions = {
  enabled: boolean;
  intervalMs?: number;
  onPoll: () => void | Promise<void>;
};

export function useChatPolling({ enabled, intervalMs = 3_000, onPoll }: PollingOptions) {
  const callbackRef = useRef(onPoll);
  const inFlightRef = useRef(false);

  useEffect(() => {
    callbackRef.current = onPoll;
  }, [onPoll]);

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;

    const run = async () => {
      if (cancelled || inFlightRef.current || document.visibilityState === 'hidden') return;
      inFlightRef.current = true;
      try {
        await callbackRef.current();
      } finally {
        inFlightRef.current = false;
      }
    };

    const handleVisible = () => {
      if (document.visibilityState === 'visible') void run();
    };

    const timer = window.setInterval(run, intervalMs);
    window.addEventListener('focus', run);
    document.addEventListener('visibilitychange', handleVisible);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener('focus', run);
      document.removeEventListener('visibilitychange', handleVisible);
    };
  }, [enabled, intervalMs]);
}

export function mergeMessages(
  existing: LiveMessageRecord[],
  incoming: LiveMessageRecord[],
): LiveMessageRecord[] {
  const byId = new Map<number, LiveMessageRecord>();
  existing.forEach((message) => byId.set(message.id, message));
  incoming.forEach((message) => byId.set(message.id, message));

  return Array.from(byId.values()).sort((a, b) =>
    String(a.created_at || '').localeCompare(String(b.created_at || '')),
  );
}

export async function markIncomingMessagesRead(
  messages: LiveMessageRecord[],
  currentUserId: string,
) {
  if (!currentUserId) return;

  const unreadIncoming = messages.filter(
    (message) => String(message.sender_id) !== currentUserId && message.is_read === false,
  );

  await Promise.allSettled(unreadIncoming.map((message) => messageService.markRead(message.id)));
}

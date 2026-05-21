import { describe, expect, it } from 'vitest';
import { profileLocation } from '../lib/profile';

describe('profileLocation', () => {
  it('prefers location_name for display', () => {
    expect(
      profileLocation({
        location_name: 'Seattle, Washington, United States',
        location: 47.6062,
      }),
    ).toBe('Seattle, Washington, United States');
  });

  it('does not display legacy numeric locations', () => {
    expect(profileLocation({ location: 47.6062 })).toBe('');
  });
});

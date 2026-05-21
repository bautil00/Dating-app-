import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
  search: vi.fn(),
}));

vi.mock('../services/api', () => ({
  locationService: {
    search: mocks.search,
  },
}));

import LocationSearch from '../components/LocationSearch';

describe('LocationSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.search.mockResolvedValue({
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

  it('searches explicitly and selects a named location with coordinates', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<LocationSearch value="" onSelect={onSelect} />);

    await user.type(screen.getByLabelText('Location'), 'Seattle');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    await user.click(
      await screen.findByRole('button', { name: 'Seattle, Washington, United States' }),
    );

    expect(mocks.search).toHaveBeenCalledWith('Seattle');
    expect(onSelect).toHaveBeenLastCalledWith({
      location_name: 'Seattle, Washington, United States',
      latitude: 47.6062,
      longitude: -122.3321,
    });
  });
});

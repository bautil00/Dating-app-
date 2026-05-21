import { useEffect, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { locationService, type LocationResult } from '../services/api';

type LocationSearchProps = {
  id?: string;
  label?: string;
  value: string;
  onSelect: (location: {
    location_name: string;
    latitude: number | null;
    longitude: number | null;
  }) => void;
  required?: boolean;
  className?: string;
};

export default function LocationSearch({
  id = 'location',
  label = 'Location',
  value,
  onSelect,
  required = false,
  className = '',
}: LocationSearchProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const search = async () => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setError('Enter at least 2 characters.');
      setResults([]);
      setSearched(true);
      return;
    }

    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const response = await locationService.search(trimmed);
      setResults(response.data || []);
    } catch {
      setResults([]);
      setError('Location search is unavailable. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectResult = (result: LocationResult) => {
    setQuery(result.label);
    setResults([]);
    setError('');
    onSelect({
      location_name: result.label,
      latitude: result.latitude,
      longitude: result.longitude,
    });
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-xs font-semibold uppercase tracking-wide text-gray-500" htmlFor={id}>
        {label}
      </label>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            id={id}
            type="text"
            value={query}
            required={required}
            placeholder="Search a city or place"
            onChange={(event) => {
              setQuery(event.target.value);
              setResults([]);
              onSelect({ location_name: '', latitude: null, longitude: null });
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void search();
              }
            }}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 transition-all placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-50"
          />
        </div>
        <button
          type="button"
          onClick={() => void search()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-600 transition-all hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Search className="h-4 w-4" />
          {loading ? 'Searching' : 'Search'}
        </button>
      </div>

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      {!error && searched && !loading && results.length === 0 && (
        <p className="text-xs font-medium text-gray-400">No locations found.</p>
      )}

      {results.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {results.map((result) => (
            <button
              key={`${result.source_id}-${result.label}`}
              type="button"
              onClick={() => selectResult(result)}
              className="block w-full px-3 py-2 text-left text-sm text-gray-700 transition-all hover:bg-orange-50 hover:text-orange-700"
            >
              {result.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useGuests, useDebounce } from '../hooks';
import { GuestTable } from '../components/admin/GuestTable';
import { AddGuestModal } from '../components/admin/AddGuestModal';
import { Spinner } from '../components/ui';
import { exportCSV } from '../services/guestService';

const FILTER_OPTIONS = [
  { value: 'all', label: 'הכל' },
  { value: 'pending', label: 'ממתינים' },
  { value: 'yes', label: 'מגיעים' },
  { value: 'no', label: 'לא מגיעים' },
  { value: 'maybe', label: 'אולי' },
];

export const GuestsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [responseFilter, setResponseFilter] = useState('all');

  const debouncedSearch = useDebounce(search);
  const { guests, pagination, isLoading, refetch, setParams } = useGuests({
    page: 1,
    limit: 20,
  });

  const applyFilters = (newSearch?: string, newFilter?: string) => {
    const s = newSearch ?? search;
    const f = newFilter ?? responseFilter;
    setParams({
      search: s || undefined,
      response: f !== 'all' ? f : undefined,
      page: 1,
      limit: 20,
    });
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    // Use debounced value but trigger immediately here for UX
    setParams({
      search: val || undefined,
      response: responseFilter !== 'all' ? responseFilter : undefined,
      page: 1,
      limit: 20,
    });
  };

  const handleFilterChange = (val: string) => {
    setResponseFilter(val);
    applyFilters(debouncedSearch, val);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-gray-800">ניהול אורחים</h1>
          <p className="text-gray-500 mt-1">
            {pagination?.total ?? 0} אורחים סה״כ
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportCSV}
            className="btn-secondary flex items-center gap-2"
          >
            📥 ייצוא CSV
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            ➕ הוסף אורח
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-4">
        <input
          type="search"
          className="input-field max-w-xs"
          placeholder="חיפוש לפי שם או טלפון..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap">
          {FILTER_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleFilterChange(value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                responseFilter === value
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-rose-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card p-4">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : (
          <GuestTable guests={guests} onRefresh={refetch} />
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-gray-100">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setParams((prev) => ({ ...prev, page: p }))}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                  pagination.page === p
                    ? 'bg-rose-500 text-white'
                    : 'bg-white text-gray-600 border hover:border-rose-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      <AddGuestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={refetch}
      />
    </div>
  );
};

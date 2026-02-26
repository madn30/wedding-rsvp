import { useState } from 'react';
import { useGuests } from '../hooks';
// useDebounce intentionally omitted — search triggers params inline
import { GuestTable } from '../components/admin/GuestTable';
import { AddGuestModal } from '../components/admin/AddGuestModal';
import { Spinner } from '../components/ui';
import { exportCSV } from '../services/guestService';
import s from './GuestsPage.module.css';

const FILTER_OPTIONS = [
  { value: 'all',     label: 'הכל'       },
  { value: 'pending', label: 'ממתינים'   },
  { value: 'yes',     label: 'מגיעים'    },
  { value: 'no',      label: 'לא מגיעים' },
  { value: 'maybe',   label: 'אולי'      },
];

export const GuestsPage = () => {
  const [isModalOpen, setModalOpen]   = useState(false);
  const [search, setSearch]           = useState('');
  const [responseFilter, setFilter]   = useState('all');

  const { guests, pagination, isLoading, refetch, setParams } = useGuests({
    page: 1, limit: 20,
  });

  const applyFilters = (newSearch: string, newFilter: string) => {
    setParams({
      search:   newSearch  || undefined,
      response: newFilter !== 'all' ? newFilter : undefined,
      page: 1,
      limit: 20,
    });
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    applyFilters(val, responseFilter);
  };

  const handleFilter = (val: string) => {
    setFilter(val);
    applyFilters(search, val);
  };

  return (
    <div className={s.page}>
      {/* Header */}
      <header className={s.pageHeader}>
        <hgroup className={s.heading}>
          <h1 className={s.title}>ניהול אורחים</h1>
          <p className={s.subtitle}>{pagination?.total ?? 0} אורחים סה״כ</p>
        </hgroup>
        <div className={s.headerActions}>
          <button className={s.btnSecondary} onClick={exportCSV}>
            <span aria-hidden="true">📥</span>
            ייצוא CSV
          </button>
          <button className={s.btnPrimary} onClick={() => setModalOpen(true)}>
            <span aria-hidden="true">➕</span>
            הוסף אורח
          </button>
        </div>
      </header>

      {/* Filters */}
      <section aria-label="סינון">
        <div className={s.filterBar}>
          <input
            type="search"
            className={s.searchInput}
            placeholder="חיפוש לפי שם או טלפון..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            aria-label="חיפוש אורחים"
          />
          <div className={s.filterGroup} role="group" aria-label="סינון לפי תשובה">
            {FILTER_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleFilter(value)}
                className={`${s.filterChip} ${responseFilter === value ? s.filterChipActive : ''}`}
                aria-pressed={responseFilter === value}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Table */}
      <section aria-label="רשימת אורחים" className={s.tableCard}>
        {isLoading ? (
          <div className={s.spinnerWrap}><Spinner size="lg" /></div>
        ) : (
          <GuestTable guests={guests} onRefresh={refetch} />
        )}

        {pagination && pagination.pages > 1 && (
          <nav className={s.pagination} aria-label="ניווט עמודים">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setParams(prev => ({ ...prev, page: p }))}
                className={`${s.pageBtn} ${pagination.page === p ? s.pageBtnActive : ''}`}
                aria-current={pagination.page === p ? 'page' : undefined}
              >
                {p}
              </button>
            ))}
          </nav>
        )}
      </section>

      <AddGuestModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={refetch}
      />
    </div>
  );
};

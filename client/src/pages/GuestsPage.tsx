import { useState } from "react";
import { useGuests } from "../hooks";
import { GuestTable } from "../components/admin/GuestTable";
import { AddGuestModal } from "../components/admin/AddGuestModal";
import { Spinner } from "../components/ui";
import { exportCSV } from "../services/guestService";
import { Download, UserPlus, Search } from "lucide-react";

const FILTER_OPTIONS = [
  { value: "all", label: "הכל" },
  { value: "pending", label: "ממתינים" },
  { value: "yes", label: "מגיעים" },
  { value: "no", label: "לא מגיעים" },
  { value: "maybe", label: "אולי" },
];

export const GuestsPage = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [responseFilter, setFilter] = useState("all");

  const { guests, pagination, isLoading, refetch, setParams } = useGuests({
    page: 1,
    limit: 20,
  });

  const applyFilters = (newSearch: string, newFilter: string) => {
    setParams({
      search: newSearch || undefined,
      response: newFilter !== "all" ? newFilter : undefined,
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
    <div
      dir="rtl"
      className="p-4 md:p-8 w-full max-w-[1600px] mx-auto bg-[#111827] min-h-screen text-white font-sans flex flex-col gap-8 animate-in fade-in duration-500"
    >
      {}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <hgroup className="flex flex-col gap-1 text-center md:text-right">
          <h1 className="text-3xl lg:text-4xl font-serif text-[#faf6ef]">
            ניהול <em className="text-[#c9a84c] font-serif italic">אורחים</em>
          </h1>
          <p className="font-sans text-sm text-white/50">
            {pagination?.total ?? 0} אורחים סה״כ רשומים במערכת
          </p>
        </hgroup>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
            onClick={exportCSV}
          >
            <Download size={16} /> ייצוא CSV
          </button>
          <button
            className="px-4 py-2.5 bg-[#c9a84c] text-[#0d1b2a] rounded-xl text-sm font-bold shadow-lg shadow-[#c9a84c]/20 hover:scale-105 transition-all flex items-center gap-2"
            onClick={() => setModalOpen(true)}
          >
            <UserPlus size={16} /> הוסף אורח
          </button>
        </div>
      </header>

      {}
      <section
        aria-label="סינון"
        className="flex flex-col xl:flex-row gap-4 justify-between items-center bg-[#0d1b2a]/90 backdrop-blur-md border border-[#c9a84c]/15 rounded-2xl p-4 shadow-xl"
      >
        <div className="relative w-full xl:w-80">
          <Search
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30"
            size={18}
          />

          <input
            type="search"
            className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pr-10 pl-4 text-sm text-white placeholder-white/30 focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c] outline-none transition-all"
            placeholder="חיפוש לפי שם או טלפון..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            aria-label="חיפוש אורחים"
          />
        </div>

        <div
          className="flex flex-wrap gap-2 w-full xl:w-auto overflow-x-auto pb-1 xl:pb-0"
          role="group"
          aria-label="סינון לפי תשובה"
        >
          {FILTER_OPTIONS.map(({ value, label }) => {
            const isActive = responseFilter === value;
            return (
              <button
                key={value}
                onClick={() => handleFilter(value)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-[#c9a84c]/20 text-[#e8c97e] border border-[#c9a84c]/50 shadow-[0_0_10px_rgba(201,168,76,0.1)]"
                    : "bg-white/5 text-white/50 border border-white/5 hover:bg-white/10 hover:text-white"
                }`}
                aria-pressed={isActive}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      {}
      <section
        aria-label="רשימת אורחים"
        className="bg-[#0d1b2a]/90 backdrop-blur-md border border-[#c9a84c]/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col flex-1"
      >
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-20">
            <Spinner size="lg" />
          </div>
        ) : (
          <GuestTable guests={guests} onRefresh={refetch} />
        )}

        {}
        {pagination && pagination.pages > 1 && (
          <nav
            className="flex items-center justify-center gap-2 p-4 border-t border-white/5 bg-black/20"
            aria-label="ניווט עמודים"
          >
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
              (p) => {
                const isActive = pagination.page === p;
                return (
                  <button
                    key={p}
                    onClick={() => setParams((prev) => ({ ...prev, page: p }))}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
                      isActive
                        ? "bg-[#c9a84c] text-[#0d1b2a] shadow-md shadow-[#c9a84c]/20"
                        : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {p}
                  </button>
                );
              },
            )}
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

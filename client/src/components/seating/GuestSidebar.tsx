import React, { memo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { SeatingGuest, SeatingTable } from '../../store/seatingStore';

// ─── Draggable guest card ────────────────────────────────────────────────────

interface GuestCardProps {
  guest: SeatingGuest;
  isBeingDragged: boolean;
}

const GuestCard: React.FC<GuestCardProps> = memo(({ guest, isBeingDragged }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `guest-${guest._id}`,
    data: { type: 'guest', guestId: guest._id },
  });

  const initials = guest.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ touchAction: 'none' }}
      className={`
        flex items-center gap-2.5 p-2 rounded-xl border cursor-grab select-none
        transition-all duration-150
        ${isDragging
          ? 'opacity-30 border-white/5 bg-white/[0.02]'
          : 'border-white/[0.07] bg-white/[0.03] hover:bg-[#c9a84c]/10 hover:border-[#c9a84c]/25'
        }
        ${isBeingDragged ? 'ring-2 ring-[#60a5fa]/40' : ''}
      `}
    >
      {/* Avatar */}
      <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-[#c9a84c] to-[#f5e6c0] text-[#0d1b2a] flex items-center justify-center font-bold text-[11px]">
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[#faf6ef] truncate leading-tight">
          {guest.name}
        </p>
        {guest.numberOfGuests > 1 && (
          <p className="text-[9px] text-white/35 mt-0.5">+{guest.numberOfGuests - 1} נוספים</p>
        )}
      </div>

      {/* Drag handle hint */}
      <span className="text-white/20 text-sm shrink-0">⠿</span>
    </div>
  );
});

GuestCard.displayName = 'GuestCard';

// ─── Sidebar ─────────────────────────────────────────────────────────────────

interface GuestSidebarProps {
  guests: SeatingGuest[];
  tables: SeatingTable[];
  isLoading: boolean;
  activeDragGuestId: string | null;
}

const GuestSidebar: React.FC<GuestSidebarProps> = ({
  guests,
  tables,
  isLoading,
  activeDragGuestId,
}) => {
  // Compute which guests are already seated across all tables
  const seatedIds = new Set(
    tables.flatMap((t) => t.seatedGuests.map((g) => g._id))
  );

  // Map guestId → table name for the seated label
  const guestTableName = new Map<string, string>();
  tables.forEach((t) => t.seatedGuests.forEach((g) => guestTableName.set(g._id, t.name)));

  const unseated = guests.filter((g) => !seatedIds.has(g._id));
  const seated   = guests.filter((g) =>  seatedIds.has(g._id));

  return (
    <aside className="bg-[#0d1b2a]/90 border border-[#c9a84c]/15 rounded-2xl h-full flex flex-col overflow-hidden backdrop-blur-md">
      {/* Header */}
      <div className="p-3 border-b border-white/5 shrink-0">
        <h4 className="font-serif text-[#faf6ef] text-sm">רשימת אורחים</h4>
        <div className="flex gap-2 mt-1.5 text-[10px] text-white/40">
          <span>{unseated.length} ללא שיבוץ</span>
          <span>·</span>
          <span>{seated.length} משובצים</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {isLoading ? (
          // Skeleton placeholders
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-10 rounded-xl bg-white/[0.03] border border-white/5 animate-pulse"
            />
          ))
        ) : (
          <>
            {/* Unseated section */}
            {unseated.length > 0 && (
              <section>
                <p className="text-[9px] uppercase tracking-widest text-white/25 mb-1.5 px-1">
                  ממתינים לשיבוץ
                </p>
                <div className="space-y-1.5">
                  {unseated.map((g) => (
                    <GuestCard
                      key={g._id}
                      guest={g}
                      isBeingDragged={activeDragGuestId === g._id}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Seated section (collapsed / greyed) */}
            {seated.length > 0 && (
              <section>
                <p className="text-[9px] uppercase tracking-widest text-white/25 mb-1.5 px-1">
                  משובצים
                </p>
                <div className="space-y-1.5">
                  {seated.map((g) => (
                    <div
                      key={g._id}
                      className="flex items-center gap-2.5 p-2 rounded-xl border border-white/[0.04] bg-white/[0.015] opacity-60 cursor-default select-none"
                    >
                      <div className="w-8 h-8 shrink-0 rounded-full bg-[#c9a84c]/20 text-[#e8c97e] flex items-center justify-center text-[11px]">
                        {g.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/60 truncate leading-tight">{g.name}</p>
                        <p className="text-[9px] text-[#c9a84c]/60 truncate mt-0.5">
                          🪑 {guestTableName.get(g._id)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {guests.length === 0 && (
              <p className="text-center text-white/25 text-xs pt-8">
                אין אורחים מאושרים עדיין
              </p>
            )}
          </>
        )}
      </div>
    </aside>
  );
};

export default GuestSidebar;

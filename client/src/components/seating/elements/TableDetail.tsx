import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Trash2 } from 'lucide-react';
import { SeatingTable } from '../../../store/seatingStore';
import { ELEMENT_TYPES_SET } from '../constants';

interface TableDetailProps {
  table: SeatingTable;
  onUnseat: (guestId: string) => void;
}

const TableDetail: React.FC<TableDetailProps> = ({ table, onUnseat }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'table-detail-drop',
    data: { type: 'table-detail', tableId: table._id },
  });

  const emptySeats = Math.max(0, table.capacity - table.seatedGuests.length);
  const isElem = ELEMENT_TYPES_SET.has(table.type);

  return (
    <aside
      ref={setNodeRef}
      className="bg-[#0d1b2a]/90 border border-[#c9a84c]/15 rounded-2xl h-full flex flex-col overflow-hidden backdrop-blur-md transition-all duration-150"
      style={{
        boxShadow: isOver
          ? '0 0 0 2px #60a5fa, 0 0 30px rgba(96,165,250,0.25)'
          : undefined,
        borderColor: isOver ? '#60a5fa' : undefined,
      }}
    >
      <div className="p-3 border-b border-white/5 shrink-0">
        <h4 className="font-serif text-[#faf6ef] text-sm">{table.name}</h4>
        {!isElem && (
          <div className="flex items-center gap-2 mt-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#c9a84c]/10 border border-[#c9a84c]/25 rounded-lg text-[#e8c97e] text-[9px] font-semibold uppercase">
              🪑 {table.seatedGuests.length} / {table.capacity}
            </span>
            {table.seatedGuests.length >= table.capacity && (
              <span className="text-[9px] text-red-400 font-semibold">מלא</span>
            )}
          </div>
        )}
        {isOver && (
          <p className="text-[10px] text-[#60a5fa] mt-1.5 font-semibold animate-pulse">
            שחרר לשיבוץ בשולחן זה
          </p>
        )}
      </div>

      {isElem ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-white/25 text-xs text-center font-serif">
            אלמנט עיצובי — אין מקומות ישיבה
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {table.seatedGuests.map((guest, i) => (
            <div
              key={guest._id}
              className="flex items-center gap-2 p-2 bg-[#c9a84c]/5 border border-[#c9a84c]/15 rounded-xl"
            >
              <div className="w-6 h-6 shrink-0 rounded-md bg-[#c9a84c]/20 text-[#e8c97e] flex items-center justify-center text-[10px] font-bold">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#faf6ef] truncate">{guest.name}</p>
                {guest.foodPreference && (
                  <p className="text-[9px] text-white/30 truncate">{guest.foodPreference}</p>
                )}
              </div>
              <button
                className="p-1 rounded-md hover:bg-white/5 transition"
                onClick={() => onUnseat(guest._id)}
              >
                <Trash2 size={13} className="text-white/25 hover:text-red-400 transition" />
              </button>
            </div>
          ))}

          {Array.from({ length: emptySeats }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex items-center gap-2 p-2 border border-white/5 border-dashed rounded-xl opacity-25"
            >
              <div className="w-6 h-6 shrink-0 rounded-md bg-white/10 flex items-center justify-center text-[10px] text-white">
                {table.seatedGuests.length + i + 1}
              </div>
              <span className="text-[10px] text-white/40 italic">מקום פנוי</span>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
};

export default TableDetail;
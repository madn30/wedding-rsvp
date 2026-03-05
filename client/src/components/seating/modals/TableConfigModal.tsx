import React, { useState, useEffect } from "react";
import { RotateCw, X, Trash2 } from "lucide-react";
import { SeatingTable } from "../../../store/seatingStore";
import { TABLE_SHAPES, ELEMENTS, ELEMENT_TYPES_SET } from "../constants";

interface TableConfigModalProps {
  table: SeatingTable;
  onClose: () => void;
  onUpdate: (updates: Partial<SeatingTable>) => void;
  onUpdateLocal: (updates: Partial<SeatingTable>) => void;
  onDelete: () => void;
}

const TableConfigModal: React.FC<TableConfigModalProps> = ({
  table,
  onClose,
  onUpdate,
  onUpdateLocal,
  onDelete,
}) => {
  const [localSize, setLocalSize] = useState(table.size ?? 1);
  const [localRotation, setLocalRotation] = useState(table.rotation ?? 0);
  const [sliding, setSliding] = useState(false);

  useEffect(() => {
    setLocalSize(table.size ?? 1);
    setLocalRotation(table.rotation ?? 0);
  }, [table._id]);

  const isElem = ELEMENT_TYPES_SET.has(table.type);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-colors duration-200 ${
        sliding ? "bg-black/5" : "bg-black/65 backdrop-blur-sm"
      }`}
    >
      <div
        className={`bg-[#0d1b2a] border border-[#c9a84c]/30 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] transition-opacity duration-200 ${
          sliding ? "opacity-25" : "opacity-100"
        }`}
      >
        {}
        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5 shrink-0">
          <h2 className="text-base font-serif text-[#e8c97e]">
            {isElem ? "הגדרות אלמנט" : "הגדרות שולחן"}
          </h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition p-1.5"
          >
            <X size={18} />
          </button>
        </div>

        {}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">
              {isElem ? "שם אלמנט" : "שם שולחן"}
            </label>
            <input
              type="text"
              value={table.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#c9a84c]/50"
            />
          </div>

          {}
          <div
            className={`grid gap-3 ${isElem ? "grid-cols-1" : "grid-cols-2"}`}
          >
            {!isElem && (
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">
                  קיבולת
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={table.capacity}
                  onChange={(e) =>
                    onUpdate({ capacity: parseInt(e.target.value) || 1 })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#c9a84c]/50"
                />
              </div>
            )}
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-[#c9a84c]/70 mb-1">
                גודל — {localSize.toFixed(1)}×
              </label>
              <input
                type="range"
                min={0.5}
                max={2.5}
                step={0.1}
                value={localSize}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setLocalSize(val);
                  onUpdateLocal({ size: val });
                }}
                onPointerDown={() => setSliding(true)}
                onPointerUp={(e) => {
                  const val = parseFloat((e.target as HTMLInputElement).value);
                  setLocalSize(val);
                  onUpdate({ size: val });
                  setSliding(false);
                }}
                onTouchStart={() => setSliding(true)}
                onTouchEnd={(e) => {
                  const val = parseFloat(
                    (e.currentTarget as HTMLInputElement).value,
                  );
                  setLocalSize(val);
                  onUpdate({ size: val });
                  setSliding(false);
                }}
                className="w-full mt-2 accent-[#c9a84c]"
              />
            </div>
          </div>

          {}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1 flex items-center gap-1">
              <RotateCw size={11} /> זווית (מעלות)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={360}
                step={1}
                value={localRotation}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setLocalRotation(val);
                  onUpdateLocal({ rotation: val });
                }}
                onPointerDown={() => setSliding(true)}
                onPointerUp={(e) => {
                  const val = parseInt((e.target as HTMLInputElement).value);
                  setLocalRotation(val);
                  onUpdate({ rotation: val });
                  setSliding(false);
                }}
                onTouchStart={() => setSliding(true)}
                onTouchEnd={(e) => {
                  const val = parseInt(
                    (e.currentTarget as HTMLInputElement).value,
                  );
                  setLocalRotation(val);
                  onUpdate({ rotation: val });
                  setSliding(false);
                }}
                className="flex-1 accent-[#c9a84c]"
              />

              <span
                className="w-12 text-center bg-white/5 border border-white/10 rounded-lg py-1 text-[#e8c97e] font-bold text-xs"
                dir="ltr"
              >
                {localRotation}°
              </span>
            </div>
          </div>

          {}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">
              {isElem ? "סוג אלמנט" : "צורה"}
            </label>
            {!isElem ? (
              <div className="grid grid-cols-4 gap-2">
                {TABLE_SHAPES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onUpdate({ type: s.id })}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                      table.type === s.id
                        ? "bg-[#c9a84c]/20 border-[#c9a84c] text-[#e8c97e]"
                        : "bg-white/5 border-white/10 text-white/35 hover:text-white/60"
                    }`}
                  >
                    {s.preview}
                    <span className="text-[9px]">{s.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {ELEMENTS.map((el) => (
                  <button
                    key={el.type}
                    onClick={() => onUpdate({ type: el.type })}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                      table.type === el.type
                        ? "bg-[#c9a84c]/20 border-[#c9a84c] text-[#e8c97e]"
                        : "bg-white/5 border-white/10 text-white/35 hover:text-white/60"
                    }`}
                  >
                    <span className="text-lg">{el.emoji}</span>
                    <span className="text-[9px]">{el.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {}
        <div className="flex justify-between items-center p-4 border-t border-white/10 bg-black/20 shrink-0">
          <button
            onClick={onDelete}
            className="text-red-400 text-xs font-bold hover:text-red-300 transition flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-red-500/10"
          >
            <Trash2 size={13} /> מחק
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#c9a84c] text-[#0d1b2a] rounded-lg text-sm font-bold shadow-lg shadow-[#c9a84c]/20 hover:scale-105 transition"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableConfigModal;

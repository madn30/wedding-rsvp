import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  closestCenter,
  CollisionDetection,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  LayoutGrid,
  Layers,
  Plus,
  Settings,
  Trash2,
  RotateCw,
  X,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';

import Canvas from '../components/seating/Canvas';
import { getTableDims } from '../components/seating/TableItem';
import GuestSidebar from '../components/seating/GuestSidebar';
import { SeatingGuest, SeatingTable, TableType, useSeatingStore } from '../store/seatingStore';

// ─── Snap-to-grid helper ──────────────────────────────────────────────────────
const SNAP_PCT = 1;
function snap(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(v / SNAP_PCT) * SNAP_PCT));
}

// ─── Element types ─────────────────────────────────────────────────────────
const ELEMENT_TYPES_SET = new Set(['dj', 'dance', 'bar', 'stage']);

const ELEMENTS: { type: TableType; label: string; emoji: string; defaultName: string }[] = [
  { type: 'dj',    label: 'DJ בוקס',       emoji: '🎛️', defaultName: 'DJ' },
  { type: 'dance', label: 'רחבת ריקודים', emoji: '💃', defaultName: 'רחבת ריקודים' },
  { type: 'bar',   label: 'בר',             emoji: '🍹', defaultName: 'בר' },
  { type: 'stage', label: 'במה',            emoji: '🎤', defaultName: 'במה' },
];

// ─── Table Config Modal ───────────────────────────────────────────────────────

const TABLE_SHAPES: { id: TableType; label: string; preview: React.ReactNode }[] = [
  { id: 'round',  label: 'עגול',   preview: <div className="w-5 h-5 rounded-full border-2 border-current" /> },
  { id: 'rect',   label: 'מלבן',   preview: <div className="w-6 h-4 border-2 border-current rounded" /> },
  { id: 'square', label: 'ריבוע',  preview: <div className="w-5 h-5 border-2 border-current rounded" /> },
  { id: 'oval',   label: 'אליפסה', preview: <div className="w-6 h-4 border-2 border-current rounded-[50%]" /> },
];

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
  // Local state for sliders — prevents spamming API on every pixel move
  const [localSize, setLocalSize] = useState(table.size ?? 1);
  const [localRotation, setLocalRotation] = useState(table.rotation ?? 0);
  const [sliding, setSliding] = useState(false);

  // Sync local state when the table itself changes (e.g. switching selected table)
  useEffect(() => {
    setLocalSize(table.size ?? 1);
    setLocalRotation(table.rotation ?? 0);
  }, [table._id]);

  const isElem = ELEMENT_TYPES_SET.has(table.type);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-colors duration-200 ${
        sliding ? 'bg-black/5' : 'bg-black/65 backdrop-blur-sm'
      }`}
    >
      <div
        className={`bg-[#0d1b2a] border border-[#c9a84c]/30 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] transition-opacity duration-200 ${
          sliding ? 'opacity-25' : 'opacity-100'
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5 shrink-0">
          <h2 className="text-base font-serif text-[#e8c97e]">
            {isElem ? 'הגדרות אלמנט' : 'הגדרות שולחן'}
          </h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition p-1.5"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Name */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">
              {isElem ? 'שם אלמנט' : 'שם שולחן'}
            </label>
            <input
              type="text"
              value={table.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#c9a84c]/50"
            />
          </div>

          {/* Capacity (tables only) + Size */}
          <div className={`grid gap-3 ${isElem ? 'grid-cols-1' : 'grid-cols-2'}`}>
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
                  onUpdateLocal({ size: val }); // local-only, no API
                }}
                onPointerDown={() => setSliding(true)}
                onPointerUp={(e) => {
                  const val = parseFloat((e.target as HTMLInputElement).value);
                  setLocalSize(val);
                  onUpdate({ size: val }); // save to API
                  setSliding(false);
                }}
                onTouchStart={() => setSliding(true)}
                onTouchEnd={(e) => {
                  const val = parseFloat((e.currentTarget as HTMLInputElement).value);
                  setLocalSize(val);
                  onUpdate({ size: val });
                  setSliding(false);
                }}
                className="w-full mt-2 accent-[#c9a84c]"
              />
            </div>
          </div>

          {/* Rotation */}
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
                  onUpdateLocal({ rotation: val }); // local-only, no API
                }}
                onPointerDown={() => setSliding(true)}
                onPointerUp={(e) => {
                  const val = parseInt((e.target as HTMLInputElement).value);
                  setLocalRotation(val);
                  onUpdate({ rotation: val }); // save to API
                  setSliding(false);
                }}
                onTouchStart={() => setSliding(true)}
                onTouchEnd={(e) => {
                  const val = parseInt((e.currentTarget as HTMLInputElement).value);
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

          {/* Shape picker */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">
              {isElem ? 'סוג אלמנט' : 'צורה'}
            </label>
            {!isElem ? (
              <div className="grid grid-cols-4 gap-2">
                {TABLE_SHAPES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onUpdate({ type: s.id })}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                      table.type === s.id
                        ? 'bg-[#c9a84c]/20 border-[#c9a84c] text-[#e8c97e]'
                        : 'bg-white/5 border-white/10 text-white/35 hover:text-white/60'
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
                        ? 'bg-[#c9a84c]/20 border-[#c9a84c] text-[#e8c97e]'
                        : 'bg-white/5 border-white/10 text-white/35 hover:text-white/60'
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

        {/* Footer */}
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

// ─── Table Detail Panel ───────────────────────────────────────────────────────

interface TableDetailProps {
  table: SeatingTable;
  onUnseat: (guestId: string) => void;
}

const TableDetail: React.FC<TableDetailProps> = ({ table, onUnseat }) => {
  // Make the detail panel a drop target — guest dropped here → seat at this table
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

// ─── Drag overlay visuals ─────────────────────────────────────────────────────
// Tables move via their own CSS transform (no separate ghost needed).
// Only guest cards need an overlay since they travel from the sidebar to the canvas.

const GuestDragGhost: React.FC<{ guest: SeatingGuest }> = ({ guest }) => (
  <div className="flex items-center gap-2.5 px-3 py-2 bg-[#1a2e45] border border-[#60a5fa]/60 rounded-xl shadow-xl shadow-[#60a5fa]/20 opacity-90 cursor-grabbing select-none max-w-[180px]">
    <div className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-[#c9a84c] to-[#f5e6c0] text-[#0d1b2a] flex items-center justify-center font-bold text-[10px]">
      {guest.name[0]}
    </div>
    <span className="text-xs text-[#faf6ef] font-semibold truncate">{guest.name}</span>
  </div>
);

// ─── Add Table Prompt ─────────────────────────────────────────────────────────

interface AddTablePromptProps {
  onConfirm: (name: string, type: TableType) => void;
  onCancel: () => void;
}

const AddTablePrompt: React.FC<AddTablePromptProps> = ({ onConfirm, onCancel }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<TableType>('round');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { toast.error('הכנס שם לשולחן'); return; }
    onConfirm(trimmed, type);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="bg-[#0d1b2a] border border-[#c9a84c]/30 rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4"
      >
        <h2 className="font-serif text-[#e8c97e] text-base">שולחן חדש</h2>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">
            שם השולחן
          </label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='לדוגמה: "משפחת כהן"'
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#c9a84c]/50 placeholder-white/20"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2">צורה</label>
          <div className="grid grid-cols-4 gap-2">
            {TABLE_SHAPES.map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => setType(s.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                  type === s.id
                    ? 'bg-[#c9a84c]/20 border-[#c9a84c] text-[#e8c97e]'
                    : 'bg-white/5 border-white/10 text-white/35'
                }`}
              >
                {s.preview}
                <span className="text-[9px]">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-white/50 hover:text-white transition">
            ביטול
          </button>
          <button type="submit" className="px-5 py-2 bg-[#c9a84c] text-[#0d1b2a] rounded-lg text-sm font-bold hover:scale-105 transition">
            הוסף
          </button>
        </div>
      </form>
    </div>
  );
};

// ─── Add Element Prompt ───────────────────────────────────────────────────────

interface AddElementPromptProps {
  onConfirm: (name: string, type: TableType) => void;
  onCancel: () => void;
}

const AddElementPrompt: React.FC<AddElementPromptProps> = ({ onConfirm, onCancel }) => {
  const [selected, setSelected] = useState(ELEMENTS[0]);
  const [name, setName] = useState(ELEMENTS[0].defaultName);

  const handleSelect = (el: typeof ELEMENTS[0]) => {
    setSelected(el);
    setName(el.defaultName);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
      <div className="bg-[#0d1b2a] border border-[#c9a84c]/30 rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4">
        <h2 className="font-serif text-[#e8c97e] text-base">הוסף אלמנט</h2>

        {/* Element type picker */}
        <div className="grid grid-cols-2 gap-2">
          {ELEMENTS.map((el) => (
            <button
              key={el.type}
              onClick={() => handleSelect(el)}
              className={`flex items-center justify-center p-3 rounded-xl border transition-all text-sm font-semibold ${
                selected.type === el.type
                  ? 'bg-[#c9a84c]/20 border-[#c9a84c] text-[#e8c97e]'
                  : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80'
              }`}
            >
              {el.label}
            </button>
          ))}
        </div>

        {/* Custom name */}
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1">
            שם (אופציונלי)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#c9a84c]/50"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-white/50 hover:text-white transition">
            ביטול
          </button>
          <button
            onClick={() => onConfirm(name || selected.defaultName, selected.type)}
            className="px-5 py-2 bg-[#c9a84c] text-[#0d1b2a] rounded-lg text-sm font-bold hover:scale-105 transition"
          >
            הוסף
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main SeatingEngine ───────────────────────────────────────────────────────

const SeatingEngine: React.FC = () => {
  const {
    tables,
    guests,
    isLoadingTables,
    isLoadingGuests,
    activeTableId,
    fetchTables,
    fetchGuests,
    addTable,
    updateTableLocal,
    debouncedSavePosition,
    updateTableConfig,
    deleteTable,
    seatGuest,
    unseatGuest,
    setActiveTable,
  } = useSeatingStore();

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchTables();
    fetchGuests();
  }, [fetchTables, fetchGuests]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showAddPrompt, setShowAddPrompt] = useState(false);
  const [showAddElementPrompt, setShowAddElementPrompt] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [hoveredTableId, setHoveredTableId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const preDragPos = useRef<{ x: number; y: number } | null>(null);

  // ── Canvas dimensions (responsive table sizes + live drag clamping) ────────
  const REFERENCE_CANVAS_WIDTH = 600;
  const [canvasScale, setCanvasScale] = useState(1);
  const [canvasDims, setCanvasDims] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  useEffect(() => {
    if (!canvasRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0) {
        setCanvasScale(Math.max(0.45, Math.min(1.4, width / REFERENCE_CANVAS_WIDTH)));
        setCanvasDims({ w: width, h: height });
      }
    });
    observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, []);

  // ── Sensors ───────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  // ── Custom collision detection ────────────────────────────────────────────
  // Guests: closestCenter among ONLY table/table-detail droppables (canvas excluded)
  //   → prevents the huge canvas droppable from winning and causing wrong-table drops
  // Tables: pointerWithin (only trigger when pointer is inside the droppable)
  const collisionDetection: CollisionDetection = useCallback((args) => {
    const activeType = (args.active as any)?.data?.current?.type;
    if (activeType === 'guest') {
      // Only register a hit when the pointer is actually inside a table element.
      // pointerWithin returns [] when hovering empty canvas space → no accidental seats.
      const eligible = args.droppableContainers.filter((c) => {
        const t = c.data?.current?.type;
        return t === 'table' || t === 'table-detail';
      });
      if (eligible.length === 0) return [];
      return pointerWithin({ ...args, droppableContainers: eligible });
    }
    return pointerWithin(args);
  }, []);

  // ── DnD handlers ─────────────────────────────────────────────────────────

  const handleDragStart = useCallback(
    ({ active }: DragStartEvent) => {
      setActiveDragId(String(active.id));
      if (active.data.current?.type === 'table') {
        const table = tables.find((t) => t._id === active.data.current?.tableId);
        if (table) preDragPos.current = { x: table.x, y: table.y };
        setActiveTable(active.data.current?.tableId ?? null);
      }
    },
    [tables, setActiveTable]
  );

  const handleDragOver = useCallback(({ over }: DragOverEvent) => {
    if (over?.data.current?.type === 'table') {
      setHoveredTableId(over.data.current.tableId);
    } else {
      setHoveredTableId(null);
    }
  }, []);

const handleDragEnd = useCallback(
  ({ active, over, delta }: DragEndEvent) => {
    setActiveDragId(null);
    setHoveredTableId(null);

    const activeType = active.data.current?.type;

    if (activeType === 'table') {
      const tableId = active.data.current?.tableId as string;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const table = tables.find((t) => t._id === tableId);
      if (!table) return;

      // 1. חישוב המיקום המבוקש (כולל snap לגריד)
      const rawX = table.x + (delta.x / rect.width) * 100;
      const rawY = table.y + (delta.y / rect.height) * 100;

      // 2. חישוב מידות האלמנט הנוכחי באחוזים
      const dims = getTableDims(table.type, table.size);
      const halfWpct = ((dims.w * canvasScale) / 2 / rect.width) * 100;
      const halfHpct = ((dims.h * canvasScale) / 2 / rect.height) * 100;

      let newX = snap(rawX, halfWpct, 100 - halfWpct);
      let newY = snap(rawY, halfHpct, 100 - halfHpct);

      // 3. בדיקת התנגשויות (Collision Detection)
      // אנחנו בודקים האם המיקום החדש חופף לאחד השולחנות האחרים
      const hasCollision = tables.some((other) => {
        if (other._id === tableId) return false;

        const otherDims = getTableDims(other.type, other.size);
        
        // המרת מידות השולחן השני לאחוזים
        const otherHalfWpct = ((otherDims.w * canvasScale) / 2 / rect.width) * 100;
        const otherHalfHpct = ((otherDims.h * canvasScale) / 2 / rect.height) * 100;

        // בדיקה מתמטית של חפיפת מלבנים (AABB)
        const isOverlapping = 
          Math.abs(newX - other.x) < (halfWpct * 2 + otherHalfWpct * 2) / 2 &&
          Math.abs(newY - other.y) < (halfHpct * 2 + otherHalfHpct * 2) / 2;

        return isOverlapping;
      });

      // 4. אם יש התנגשות - אל תאפשר את התנועה (השאר במיקום המקורי)
      if (hasCollision) {
        newX = preDragPos.current?.x ?? table.x;
        newY = preDragPos.current?.y ?? table.y;
        toast.error('לא ניתן להניח אלמנטים אחד על השני', { id: 'collision' });
      }

      // 5. עדכון ושמירה
      updateTableLocal(tableId, { x: newX, y: newY });
      debouncedSavePosition(
        tableId,
        newX,
        newY,
        preDragPos.current?.x ?? table.x,
        preDragPos.current?.y ?? table.y
      );
      
      preDragPos.current = null;

    } else if (activeType === 'guest') {
      // ── לוגיקה קיימת לשיבוץ אורחים ───────────────────────────────────────────────
      const guestId = active.data.current?.guestId as string;
      let targetTableId: string | null = null;

      const overType = over?.data.current?.type;

      if (overType === 'table') {
        targetTableId = over!.data.current?.tableId as string;
      } else if (overType === 'table-detail') {
        targetTableId = over!.data.current?.tableId as string;
      }

      if (targetTableId) {
        seatGuest(guestId, targetTableId);
        setActiveTable(targetTableId);
      }
    }
  },
  [
    tables, 
    canvasScale, 
    updateTableLocal, 
    debouncedSavePosition, 
    seatGuest, 
    setActiveTable
  ]
);
  // ── Derived ───────────────────────────────────────────────────────────────
  const activeTable = tables.find((t) => t._id === activeTableId) ?? null;
  const seatedCount = tables.reduce((acc, t) => acc + t.seatedGuests.length, 0);

  const activeDragGuest = activeDragId?.startsWith('guest-')
    ? guests.find((g) => g._id === activeDragId.replace('guest-', ''))
    : null;

  // ── Add table / element ──────────────────────────────────────────────────
  const handleAddTable = useCallback(async (name: string, type: TableType) => {
    setShowAddPrompt(false);
    await addTable(name, type);
  }, [addTable]);

  const handleAddElement = useCallback(async (name: string, type: TableType) => {
    setShowAddElementPrompt(false);
    await addTable(name, type);
  }, [addTable]);

  // ── Config modal helpers ─────────────────────────────────────────────────
  const handleConfigUpdate = useCallback(
    (updates: Partial<SeatingTable>) => {
      if (!activeTableId) return;
      updateTableConfig(activeTableId, updates);
    },
    [activeTableId, updateTableConfig]
  );

  const handleConfigUpdateLocal = useCallback(
    (updates: Partial<SeatingTable>) => {
      if (!activeTableId) return;
      updateTableLocal(activeTableId, updates);
    },
    [activeTableId, updateTableLocal]
  );

  const handleConfigDelete = useCallback(() => {
    if (!activeTableId) return;
    setShowConfigModal(false);
    deleteTable(activeTableId);
  }, [activeTableId, deleteTable]);

  const handleDoubleClickTable = useCallback(() => {
    if (activeTableId) setShowConfigModal(true);
  }, [activeTableId]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      dir="rtl"
      className="p-4 md:p-6 w-full max-w-[1600px] mx-auto bg-[#111827] min-h-screen text-white font-sans flex flex-col"
    >
      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      {showAddPrompt && (
        <AddTablePrompt onConfirm={handleAddTable} onCancel={() => setShowAddPrompt(false)} />
      )}
      {showAddElementPrompt && (
        <AddElementPrompt onConfirm={handleAddElement} onCancel={() => setShowAddElementPrompt(false)} />
      )}
      {showConfigModal && activeTable && (
        <TableConfigModal
          table={activeTable}
          onClose={() => setShowConfigModal(false)}
          onUpdate={handleConfigUpdate}
          onUpdateLocal={handleConfigUpdateLocal}
          onDelete={handleConfigDelete}
        />
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="hidden md:block text-center mb-5">
        <h1 className="text-3xl font-serif text-[#faf6ef]">
          עיצוב אולם{' '}
          <em className="text-[#c9a84c] font-serif italic">ותכנון מקומות</em>
        </h1>
      </header>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row flex-wrap items-center justify-between gap-3 bg-[#0d1b2a]/90 border border-[#c9a84c]/15 rounded-2xl px-4 py-3 mb-5 backdrop-blur-md shrink-0">
        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-white/40">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#c9a84c]/10 border border-[#c9a84c]/25 rounded-full text-[#e8c97e] font-semibold">
            <Users size={13} />
            {seatedCount} / {guests.length} אורחים שובצו
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
            <LayoutGrid size={12} />
            {tables.length} פריטים
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 justify-end">
          {activeTableId && (
            <button
              onClick={() => setShowConfigModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#c9a84c]/15 border border-[#c9a84c]/40 rounded-lg text-xs font-semibold text-[#e8c97e] hover:bg-[#c9a84c]/25 transition shadow-[0_0_10px_rgba(201,168,76,0.15)]"
            >
              <Settings size={13} /> הגדרות
            </button>
          )}
          <button
            onClick={() => setShowAddElementPrompt(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-900/30 border border-purple-500/30 rounded-lg text-xs font-semibold text-purple-300 hover:bg-purple-900/50 transition"
          >
            <Layers size={13} /> הוסף אלמנט
          </button>
          <button
            onClick={() => setShowAddPrompt(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold hover:bg-white/10 transition"
          >
            <Plus size={13} /> הוסף שולחן
          </button>
        </div>
      </div>

      {/* ── DnD Context ─────────────────────────────────────────────────────── */}
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        
      >
        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-4 min-h-[500px] lg:min-h-[650px]">
          {/* Guest sidebar */}
          <div className="lg:col-span-3 h-[230px] lg:h-full order-2 lg:order-1">
            <GuestSidebar
              guests={guests}
              tables={tables}
              isLoading={isLoadingGuests}
              activeDragGuestId={
                activeDragId?.startsWith('guest-')
                  ? activeDragId.replace('guest-', '')
                  : null
              }
            />
          </div>

          {/* Canvas — flex flex-col + min-h-0 so flex-1 inside resolves correctly */}
          <div className="lg:col-span-6 flex-1 lg:h-full order-1 lg:order-2 flex flex-col min-h-0">
            <Canvas
              ref={canvasRef}
              tables={tables}
              activeTableId={activeTableId}
              hoveredTableId={hoveredTableId}
              isLoading={isLoadingTables}
              onSelectTable={setActiveTable}
              onDoubleClickTable={handleDoubleClickTable}
              canvasScale={canvasScale}
              canvasDims={canvasDims}
            />
          </div>

          {/* Table detail / placeholder */}
          <div className="lg:col-span-3 h-[230px] lg:h-full order-3">
            {activeTable ? (
              <TableDetail
                table={activeTable}
                onUnseat={(guestId) => unseatGuest(guestId, activeTable._id)}
              />
            ) : (
              <div className="bg-[#0d1b2a]/90 border border-white/5 rounded-2xl h-full flex items-center justify-center">
                <p className="text-white/20 text-sm font-serif">בחר שולחן לפרטים</p>
              </div>
            )}
          </div>
        </div>

        {/* Drag overlay — only for guests (tables move via their own CSS transform) */}
        <DragOverlay dropAnimation={null}>
          {activeDragGuest && <GuestDragGhost guest={activeDragGuest} />}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default SeatingEngine;

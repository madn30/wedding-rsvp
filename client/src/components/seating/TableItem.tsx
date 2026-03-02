import React, { memo, useCallback } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { SeatingTable } from '../../store/seatingStore';

interface TableItemProps {
  table: SeatingTable;
  isSelected: boolean;
  /** True when a guest is being dragged over this table */
  isGuestHovering: boolean;
  onSelect: (id: string) => void;
}

// ─── Pixel dimensions per table type ────────────────────────────────────────
function getTableDims(type: string, size: number): { w: number; h: number } {
  const s = Math.max(0.5, Math.min(2.5, size ?? 1));
  switch (type) {
    case 'rect':   return { w: Math.round(110 * s), h: Math.round(64 * s) };
    case 'square': return { w: Math.round(80  * s), h: Math.round(80  * s) };
    case 'oval':   return { w: Math.round(120 * s), h: Math.round(72  * s) };
    case 'round':
    default:       return { w: Math.round(80  * s), h: Math.round(80  * s) };
  }
}

function getBorderRadius(type: string): string {
  switch (type) {
    case 'round': return '50%';
    case 'oval':  return '50%';
    case 'rect':  return '8px';
    case 'square':return '8px';
    default:      return '8px';
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

const TableItem: React.FC<TableItemProps> = memo(
  ({ table, isSelected, isGuestHovering, onSelect }) => {
    // Draggable — for repositioning the table on the canvas
    const {
      attributes,
      listeners,
      setNodeRef: setDragRef,
      transform,
      isDragging,
    } = useDraggable({
      id: `drag-${table._id}`,
      data: { type: 'table', tableId: table._id },
    });

    // Droppable — for receiving a guest card dropped on this table
    const {
      setNodeRef: setDropRef,
      isOver: isGuestOver,
    } = useDroppable({
      id: `drop-${table._id}`,
      data: { type: 'table', tableId: table._id },
    });

    // Combine both refs onto a single DOM node
    const combinedRef = useCallback(
      (node: HTMLElement | null) => {
        setDragRef(node);
        setDropRef(node);
      },
      [setDragRef, setDropRef]
    );

    const isFull = table.seatedGuests.length >= table.capacity;
    const dims = getTableDims(table.type, table.size);
    const highlighting = isGuestOver || isGuestHovering;

    // ── Derived styles ────────────────────────────────────────────────────────
    const translateX = transform?.x ?? 0;
    const translateY = transform?.y ?? 0;

    const borderColor = isSelected
      ? '#c9a84c'
      : highlighting
      ? '#60a5fa'
      : isFull
      ? 'rgba(239,68,68,0.5)'
      : 'rgba(255,255,255,0.12)';

    const background = highlighting
      ? '#1e3a5f'
      : isFull
      ? '#1a2e20'
      : '#1a2e45';

    const boxShadow = isSelected
      ? '0 0 0 2px #c9a84c, 0 0 20px rgba(201,168,76,0.35)'
      : highlighting
      ? '0 0 0 2px #60a5fa, 0 0 20px rgba(96,165,250,0.4)'
      : '0 4px 12px rgba(0,0,0,0.45)';

    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${table.x}%`,
      top: `${table.y}%`,
      width: dims.w,
      height: dims.h,
      borderRadius: getBorderRadius(table.type),
      border: `2px solid ${borderColor}`,
      background,
      boxShadow,
      // Centering + drag-delta offset + visual rotation
      // Order matters: center → delta → rotate so rotation is always visual only
      transform: `translate(-50%, -50%) translate(${translateX}px, ${translateY}px) rotate(${table.rotation ?? 0}deg)`,
      zIndex: isDragging ? 100 : isSelected ? 20 : 10,
      opacity: isDragging ? 0.35 : 1,
      cursor: isDragging ? 'grabbing' : 'grab',
      // Suppress layout recalculation during rapid moves
      willChange: isDragging ? 'transform' : 'auto',
      transition: isDragging ? 'none' : 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
      userSelect: 'none',
    };

    return (
      <div
        ref={combinedRef}
        style={style}
        {...listeners}
        {...attributes}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(table._id);
        }}
      >
        {/* Counter-rotate the label so it always reads horizontally */}
        <div
          style={{ transform: `rotate(-${table.rotation ?? 0}deg)` }}
          className="flex flex-col items-center justify-center h-full pointer-events-none select-none px-1"
        >
          <span
            className="font-bold text-[#e8c97e] leading-none truncate max-w-full text-center"
            style={{ fontSize: Math.max(9, Math.min(13, dims.w / 8)) }}
          >
            {table.name}
          </span>
          <span className="text-[10px] text-white/40 mt-0.5 tabular-nums">
            {table.seatedGuests.length}/{table.capacity}
          </span>
          {isFull && (
            <span className="text-[9px] text-red-400 mt-0.5 font-semibold">מלא</span>
          )}
        </div>
      </div>
    );
  }
);

TableItem.displayName = 'TableItem';
export default TableItem;

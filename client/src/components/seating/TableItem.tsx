import React, { memo, useCallback } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { SeatingTable } from '../../store/seatingStore';

interface TableItemProps {
  table: SeatingTable;
  isSelected: boolean;
  /** True when a guest is being dragged over this table */
  isGuestHovering: boolean;
  onSelect: (id: string) => void;
  onDoubleClick?: () => void;
}

// ─── Element types (floor decorations, no seating) ───────────────────────────
const ELEMENT_TYPES = new Set(['dj', 'dance', 'bar', 'stage']);

function isElementType(type: string): boolean {
  return ELEMENT_TYPES.has(type);
}

interface ElementConfig {
  emoji: string;
  bg: string;
  border: string;
  label: string;
}

function getElementConfig(type: string): ElementConfig {
  switch (type) {
    case 'dj':    return { emoji: '🎛️', label: 'DJ',   bg: '#1a0a2e', border: '#9b59b6' };
    case 'dance': return { emoji: '💃', label: 'ריקוד', bg: '#0b2510', border: '#27ae60' };
    case 'bar':   return { emoji: '🍹', label: 'בר',   bg: '#2a1205', border: '#e67e22' };
    case 'stage': return { emoji: '🎤', label: 'במה',  bg: '#0a0a1e', border: '#2980b9' };
    default:      return { emoji: '📍', label: type,   bg: '#1a2e45', border: '#ffffff30' };
  }
}

// ─── Pixel dimensions per type ───────────────────────────────────────────────
function getTableDims(type: string, size: number): { w: number; h: number } {
  const s = Math.max(0.5, Math.min(2.5, size ?? 1));
  switch (type) {
    case 'rect':   return { w: Math.round(110 * s), h: Math.round(64 * s) };
    case 'square': return { w: Math.round(80  * s), h: Math.round(80  * s) };
    case 'oval':   return { w: Math.round(120 * s), h: Math.round(72  * s) };
    case 'dj':     return { w: Math.round(90  * s), h: Math.round(90  * s) };
    case 'dance':  return { w: Math.round(200 * s), h: Math.round(140 * s) };
    case 'bar':    return { w: Math.round(150 * s), h: Math.round(60  * s) };
    case 'stage':  return { w: Math.round(180 * s), h: Math.round(90  * s) };
    case 'round':
    default:       return { w: Math.round(80  * s), h: Math.round(80  * s) };
  }
}

function getBorderRadius(type: string): string {
  switch (type) {
    case 'round':
    case 'oval':  return '50%';
    case 'dj':    return '12px';
    case 'dance': return '6px';
    case 'bar':   return '8px';
    case 'stage': return '10px';
    default:      return '8px';
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

const TableItem: React.FC<TableItemProps> = memo(
  ({ table, isSelected, isGuestHovering, onSelect, onDoubleClick }) => {
    const isElem = isElementType(table.type);

    // Draggable — for repositioning on the canvas
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

    // Droppable — only for tables (elements don't seat guests)
    const {
      setNodeRef: setDropRef,
      isOver: isGuestOver,
    } = useDroppable({
      id: `drop-${table._id}`,
      data: { type: isElem ? 'element' : 'table', tableId: table._id },
    });

    // Combine both refs onto a single DOM node
    const combinedRef = useCallback(
      (node: HTMLElement | null) => {
        setDragRef(node);
        if (!isElem) setDropRef(node); // elements aren't guest drop targets
      },
      [setDragRef, setDropRef, isElem]
    );

    const isFull = !isElem && table.seatedGuests.length >= table.capacity;
    const dims = getTableDims(table.type, table.size);
    const highlighting = !isElem && (isGuestOver || isGuestHovering);

    const translateX = transform?.x ?? 0;
    const translateY = transform?.y ?? 0;

    // ── Shared base style ────────────────────────────────────────────────────
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${table.x}%`,
      top: `${table.y}%`,
      width: dims.w,
      height: dims.h,
      borderRadius: getBorderRadius(table.type),
      border: `2px solid`,
      // Centering + drag delta + visual rotation
      transform: `translate(-50%, -50%) translate(${translateX}px, ${translateY}px) rotate(${table.rotation ?? 0}deg)`,
      zIndex: isDragging ? 200 : isSelected ? 20 : 10,
      opacity: 1,
      cursor: isDragging ? 'grabbing' : 'grab',
      // GPU layer always on for smooth dragging and rotation/size changes
      willChange: 'transform',
      transition: isDragging ? 'none' : 'border-color 0.12s, box-shadow 0.12s, background 0.12s',
      userSelect: 'none',
      // Critical for mobile: prevents scroll from interfering with drag
      touchAction: 'none',
    };

    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect(table._id);
      },
      [table._id, onSelect]
    );

    const handleDoubleClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onDoubleClick?.();
      },
      [onDoubleClick]
    );

    // ── Element rendering ────────────────────────────────────────────────────
    if (isElem) {
      const cfg = getElementConfig(table.type);
      const borderColor = isSelected ? '#c9a84c' : cfg.border;
      const boxShadow = isSelected
        ? `0 0 0 2px #c9a84c, 0 0 20px rgba(201,168,76,0.35)`
        : `0 4px 16px rgba(0,0,0,0.5)`;

      return (
        <div
          ref={combinedRef}
          style={{
            ...baseStyle,
            borderColor,
            background: cfg.bg,
            boxShadow,
          }}
          {...listeners}
          {...attributes}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
        >
          <div
            style={{ transform: `rotate(-${table.rotation ?? 0}deg)` }}
            className="flex flex-col items-center justify-center h-full pointer-events-none select-none gap-0.5 px-1"
          >
            <span
              className="font-bold text-white/80 leading-none truncate max-w-full text-center"
              style={{ fontSize: Math.max(9, Math.min(14, dims.w / 8)) }}
            >
              {table.name}
            </span>
          </div>
        </div>
      );
    }

    // ── Table rendering ──────────────────────────────────────────────────────
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

    return (
      <div
        ref={combinedRef}
        style={{ ...baseStyle, borderColor, background, boxShadow }}
        {...listeners}
        {...attributes}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
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
          {highlighting && !isFull && (
            <span className="text-[9px] text-[#60a5fa] mt-0.5">+ שבץ</span>
          )}
        </div>
      </div>
    );
  }
);

TableItem.displayName = 'TableItem';
export default TableItem;

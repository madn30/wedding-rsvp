import React, { forwardRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import TableItem from './TableItem';
import { SeatingTable } from '../../store/seatingStore';

interface CanvasProps {
  tables: SeatingTable[];
  activeTableId: string | null;
  /** ID of the table a guest is currently hovering over */
  hoveredTableId: string | null;
  isLoading: boolean;
  onSelectTable: (id: string | null) => void;
}

/**
 * The floor-plan canvas.
 *
 * - Acts as a `useDroppable` zone so dnd-kit can resolve pointer collisions.
 * - All tables are rendered as absolutely-positioned children, with their
 *   coordinates expressed as percentages so the layout scales with the
 *   container.
 * - The `ref` is forwarded to the outer div so the parent can read its
 *   `getBoundingClientRect()` when computing percentage deltas after a drag.
 */
const Canvas = forwardRef<HTMLDivElement, CanvasProps>(
  ({ tables, activeTableId, hoveredTableId, isLoading, onSelectTable }, ref) => {
    // The canvas itself is a droppable so that when a table is released
    // anywhere on it the collision detection resolves correctly.
    const { setNodeRef: setDropRef } = useDroppable({
      id: 'canvas',
      data: { type: 'canvas' },
    });

    // Merge the forwarded ref with the droppable ref
    const mergedRef = (node: HTMLDivElement | null) => {
      setDropRef(node);
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    };

    return (
      <div
        ref={mergedRef}
        className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl select-none"
        style={{
          background: 'radial-gradient(ellipse at center, #243b5540 0%, #0d1b2a 100%)',
          backgroundImage: `
            radial-gradient(ellipse at center, #243b5540 0%, #0d1b2a 100%),
            repeating-linear-gradient(0deg, transparent, transparent 29px, rgba(255,255,255,0.022) 30px),
            repeating-linear-gradient(90deg, transparent, transparent 29px, rgba(255,255,255,0.022) 30px)
          `,
          border: '1px solid rgba(201,168,76,0.12)',
        }}
        // Clicking the bare canvas deselects any active table
        onClick={() => onSelectTable(null)}
      >
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0d1b2a]/60 z-50 rounded-2xl">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#e8c97e] text-xs">טוען תוכנית אולם...</p>
            </div>
          </div>
        )}

        {/* Empty-state hint */}
        {!isLoading && tables.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-white/15 text-sm font-serif">
              לחץ על &ldquo;הוסף שולחן&rdquo; כדי להתחיל
            </p>
          </div>
        )}

        {/* Render each table */}
        {tables.map((table) => (
          <TableItem
            key={table._id}
            table={table}
            isSelected={activeTableId === table._id}
            isGuestHovering={hoveredTableId === table._id}
            onSelect={onSelectTable}
          />
        ))}
      </div>
    );
  }
);

Canvas.displayName = 'Canvas';
export default Canvas;

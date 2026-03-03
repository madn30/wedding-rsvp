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
  /** Called when a table is double-clicked — opens the config modal */
  onDoubleClickTable?: () => void;
  /** Scale factor for table sizes (1 = reference 600px canvas width) */
  canvasScale?: number;
  /** Actual canvas pixel dimensions for live drag clamping */
  canvasDims?: { w: number; h: number };
  /** True while any item is being dragged (dims the grid) */
  isDragging?: boolean;
  /** True while a TABLE specifically is being dragged (suppresses guest-hover highlights) */
  isDraggingTable?: boolean;
  /** The table ID that just landed — it shows the lock-flash animation */
  justDroppedTableId?: string | null;
}

const Canvas = forwardRef<HTMLDivElement, CanvasProps>(
  (
    {
      tables,
      activeTableId,
      hoveredTableId,
      isLoading,
      onSelectTable,
      onDoubleClickTable,
      canvasScale = 1,
      canvasDims,
      isDragging = false,
      isDraggingTable = false,
      justDroppedTableId = null,
    },
    ref
  ) => {
    const { setNodeRef: setDropRef } = useDroppable({
      id: 'canvas',
      data: { type: 'canvas' },
    });

    const mergedRef = (node: HTMLDivElement | null) => {
      setDropRef(node);
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    };

    return (
      <div
        ref={mergedRef}
        className="relative w-full flex-1 rounded-2xl shadow-2xl select-none overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at center, #243b5540 0%, #0d1b2a 100%)',
          backgroundImage: isDragging
            ? 'radial-gradient(ellipse at center, #243b5540 0%, #0d1b2a 100%)'
            : `
              radial-gradient(ellipse at center, #243b5540 0%, #0d1b2a 100%),
              repeating-linear-gradient(0deg, transparent, transparent 29px, rgba(255,255,255,0.022) 30px),
              repeating-linear-gradient(90deg, transparent, transparent 29px, rgba(255,255,255,0.022) 30px)
            `,
          border: '1px solid rgba(201,168,76,0.12)',
          transition: 'background-image 0.15s',
        }}
        onClick={() => onSelectTable(null)}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0d1b2a]/60 z-50 rounded-2xl">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#e8c97e] text-xs">טוען תוכנית אולם...</p>
            </div>
          </div>
        )}

        {!isLoading && tables.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-white/15 text-sm font-serif">
              לחץ על &ldquo;הוסף שולחן&rdquo; כדי להתחיל
            </p>
          </div>
        )}

        {tables.map((table) => (
          <TableItem
            key={table._id}
            table={table}
            isSelected={activeTableId === table._id}
            isGuestHovering={hoveredTableId === table._id}
            onSelect={onSelectTable}
            onDoubleClick={onDoubleClickTable}
            canvasScale={canvasScale}
            canvasDims={canvasDims}
            isDraggingTable={isDraggingTable}
            isJustDropped={justDroppedTableId === table._id}
          />
        ))}
      </div>
    );
  }
);

Canvas.displayName = 'Canvas';
export default Canvas;

import React, { forwardRef, useState, useLayoutEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import TableItem from "./TableItem";
import { SeatingTable } from "../../store/seatingStore";

interface CanvasProps {
  tables: SeatingTable[];
  activeTableId: string | null;
  hoveredTableId: string | null;
  isLoading: boolean;
  onSelectTable: (id: string | null) => void;
  onDoubleClickTable?: () => void;
  isDraggingTable?: boolean;
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
      isDraggingTable = false,
      justDroppedTableId = null,
    },
    ref,
  ) => {
    const [dimensions, setDimensions] = useState({ w: 0, h: 0 });

    const { setNodeRef: setDropRef } = useDroppable({
      id: "canvas",
      data: { type: "canvas" },
    });

    useLayoutEffect(() => {
      const element = (ref as React.MutableRefObject<HTMLDivElement | null>)
        ?.current;
      if (!element) return;

      const resizeObserver = new ResizeObserver((entries) => {
        if (entries[0]) {
          const { width, height } = entries[0].contentRect;
          setDimensions({ w: width, h: height });
        }
      });

      resizeObserver.observe(element);

      const rect = element.getBoundingClientRect();
      setDimensions({ w: rect.width, h: rect.height });

      return () => resizeObserver.disconnect();
    }, [ref]);

    const mergedRef = (node: HTMLDivElement | null) => {
      setDropRef(node);
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    };

    const canvasScale = dimensions.w > 0 ? dimensions.w / 800 : 1;

    return (
      <div
        ref={mergedRef}
        className="relative w-full h-full min-h-[500px] rounded-2xl shadow-2xl select-none overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at center, #243b5540 0%, #0d1b2a 100%)",
          backgroundImage: `
            radial-gradient(ellipse at center, #243b5540 0%, #0d1b2a 100%),
            repeating-linear-gradient(0deg, transparent, transparent 29px, rgba(255,255,255,0.022) 30px),
            repeating-linear-gradient(90deg, transparent, transparent 29px, rgba(255,255,255,0.022) 30px)
          `,
          border: "1px solid rgba(201,168,76,0.12)",
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

        {}
        {dimensions.w > 0 &&
          tables.map((table) => (
            <TableItem
              key={table._id}
              table={table}
              isSelected={activeTableId === table._id}
              isGuestHovering={hoveredTableId === table._id}
              onSelect={onSelectTable}
              onDoubleClick={onDoubleClickTable}
              canvasScale={canvasScale}
              canvasDims={dimensions}
              isDraggingTable={isDraggingTable}
              isJustDropped={justDroppedTableId === table._id}
            />
          ))}
      </div>
    );
  },
);

Canvas.displayName = "Canvas";
export default Canvas;

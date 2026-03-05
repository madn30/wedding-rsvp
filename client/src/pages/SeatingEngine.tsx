import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  CollisionDetection,
  useSensor,
  useSensors,
  MeasuringStrategy,
} from "@dnd-kit/core";
import { LayoutGrid, Layers, Plus, Settings, Users } from "lucide-react";

import { TableType, useSeatingStore } from "../store/seatingStore";
import Canvas from "../components/seating/Canvas";
import { snap } from "../components/seating/constants";
import GuestDragGhost from "../components/seating/elements/GuestDragGhost";
import TableDetail from "../components/seating/elements/TableDetail";
import GuestSidebar from "../components/seating/GuestSidebar";
import AddElementPrompt from "../components/seating/modals/AddElementPrompt";
import AddTablePrompt from "../components/seating/modals/AddTablePrompt";
import TableConfigModal from "../components/seating/modals/TableConfigModal";

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

  useEffect(() => {
    fetchTables();
    fetchGuests();
  }, [fetchTables, fetchGuests]);

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showAddPrompt, setShowAddPrompt] = useState(false);
  const [showAddElementPrompt, setShowAddElementPrompt] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [hoveredTableId, setHoveredTableId] = useState<string | null>(null);

  const justDroppedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (justDroppedTimer.current) clearTimeout(justDroppedTimer.current);
    };
  }, []);

  const canvasRef = useRef<HTMLDivElement>(null);
  const preDragPos = useRef<{ x: number; y: number } | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
  );

  const collisionDetection: CollisionDetection = useCallback((args) => {
    const { active, droppableContainers, pointerCoordinates } = args;
    const activeType = active.data.current?.type;

    if (activeType === "guest" && pointerCoordinates) {
      const eligible = droppableContainers.filter((c) => {
        const t = c.data.current?.type;
        return t === "table" || t === "table-detail";
      });

      if (eligible.length === 0) return [];

      const sidebarDrop = pointerWithin({
        ...args,
        droppableContainers: eligible.filter(
          (c) => c.data.current?.type === "table-detail",
        ),
      });
      if (sidebarDrop.length > 0) return sidebarDrop;

      const tablesOnCanvas = eligible.filter(
        (c) => c.data.current?.type === "table",
      );
      const px = pointerCoordinates.x;
      const py = pointerCoordinates.y;

      let closestHit = null;
      let minDist = Infinity;

      for (const container of tablesOnCanvas) {
        const rect = container.rect.current;
        if (!rect) continue;

        const isInside =
          px >= rect.left &&
          px <= rect.left + rect.width &&
          py >= rect.top &&
          py <= rect.top + rect.height;

        if (isInside) {
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dist = Math.sqrt(Math.pow(px - cx, 2) + Math.pow(py - cy, 2));

          if (dist < minDist) {
            minDist = dist;
            closestHit = container;
          }
        }
      }

      if (closestHit) {
        return [
          {
            id: closestHit.id,
            data: closestHit.data,
            value: minDist,
            droppableContainer: closestHit,
          },
        ];
      }

      return [];
    }

    return pointerWithin(args);
  }, []);

  const handleDragStart = useCallback(
    ({ active }: DragStartEvent) => {
      setActiveDragId(String(active.id));
      const table = tables.find((t) => t._id === active.data.current?.tableId);
      if (table) preDragPos.current = { x: table.x, y: table.y };
      setActiveTable(active.data.current?.tableId ?? null);
    },
    [tables, setActiveTable],
  );

  const handleDragOver = useCallback(({ over }: DragOverEvent) => {
    setHoveredTableId(
      over?.data.current?.type === "table" ? over.data.current.tableId : null,
    );
  }, []);

  const handleDragEnd = useCallback(
    ({ active, over, delta }: DragEndEvent) => {
      setActiveDragId(null);
      setHoveredTableId(null);

      const activeType = active.data.current?.type;

      if (activeType === "table") {
        const tableId = active.data.current?.tableId as string;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const table = tables.find((t) => t._id === tableId);
        if (!table) return;

        const newX = snap(table.x + (delta.x / rect.width) * 100, 2, 97);
        const newY = snap(table.y + (delta.y / rect.height) * 100, 2, 97);

        updateTableLocal(tableId, { x: newX, y: newY });
        debouncedSavePosition(
          tableId,
          newX,
          newY,
          preDragPos.current?.x ?? table.x,
          preDragPos.current?.y ?? table.y,
        );
        preDragPos.current = null;
      } else if (activeType === "guest") {
        const guestId = active.data.current?.guestId as string;
        const overType = over?.data.current?.type;
        const targetTableId =
          overType === "table" || overType === "table-detail"
            ? (over!.data.current?.tableId as string)
            : null;

        if (targetTableId) {
          seatGuest(guestId, targetTableId);
          setActiveTable(targetTableId);
        }
      }
    },
    [
      tables,
      updateTableLocal,
      debouncedSavePosition,
      seatGuest,
      setActiveTable,
    ],
  );

  const activeTable = tables.find((t) => t._id === activeTableId) ?? null;
  const seatedCount = tables.reduce((acc, t) => acc + t.seatedGuests.length, 0);
  const activeDragGuest = activeDragId?.startsWith("guest-")
    ? guests.find((g) => g._id === activeDragId.replace("guest-", ""))
    : null;

  const handleAddTable = useCallback(
    async (name: string, type: TableType) => {
      setShowAddPrompt(false);
      await addTable(name, type);
    },
    [addTable],
  );

  const handleAddElement = useCallback(
    async (name: string, type: TableType) => {
      setShowAddElementPrompt(false);
      await addTable(name, type);
    },
    [addTable],
  );

  return (
    <div
      dir="rtl"
      className="p-4 md:p-6 w-full max-w-[1600px] mx-auto bg-[#111827] min-h-screen text-white font-sans flex flex-col"
    >
      {}
      {showAddPrompt && (
        <AddTablePrompt
          onConfirm={handleAddTable}
          onCancel={() => setShowAddPrompt(false)}
        />
      )}
      {showAddElementPrompt && (
        <AddElementPrompt
          onConfirm={handleAddElement}
          onCancel={() => setShowAddElementPrompt(false)}
        />
      )}
      {showConfigModal && activeTable && (
        <TableConfigModal
          table={activeTable}
          onClose={() => setShowConfigModal(false)}
          onUpdate={(updates) =>
            activeTableId && updateTableConfig(activeTableId, updates)
          }
          onUpdateLocal={(updates) =>
            activeTableId && updateTableLocal(activeTableId, updates)
          }
          onDelete={() =>
            activeTableId &&
            (setShowConfigModal(false), deleteTable(activeTableId))
          }
        />
      )}

      {}
      <header className="hidden md:block text-center mb-5">
        <h1 className="text-3xl font-serif text-[#faf6ef]">
          עיצוב אולם{" "}
          <em className="text-[#c9a84c] font-serif italic">ותכנון מקומות</em>
        </h1>
      </header>

      <div className="flex flex-col sm:flex-row flex-wrap items-center justify-between gap-3 bg-[#0d1b2a]/90 border border-[#c9a84c]/15 rounded-2xl px-4 py-3 mb-5 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3 text-xs text-white/40">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#c9a84c]/10 border border-[#c9a84c]/25 rounded-full text-[#e8c97e] font-semibold">
            <Users size={13} /> {seatedCount} / {guests.length} אורחים שובצו
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
            <LayoutGrid size={12} /> {tables.length} פריטים
          </div>
        </div>

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

      {}
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always,
          },
        }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-4 min-h-[500px] lg:min-h-[650px]">
          <div className="lg:col-span-3 h-[230px] lg:h-full order-2 lg:order-1">
            <GuestSidebar
              guests={guests}
              tables={tables}
              isLoading={isLoadingGuests}
              activeDragGuestId={activeDragId?.replace("guest-", "") || null}
            />
          </div>

          <div className="lg:col-span-6 flex-1 lg:h-full order-1 lg:order-2">
            <Canvas
              ref={canvasRef}
              tables={tables}
              activeTableId={activeTableId}
              hoveredTableId={hoveredTableId}
              isLoading={isLoadingTables}
              onSelectTable={setActiveTable}
              onDoubleClickTable={() =>
                activeTableId && setShowConfigModal(true)
              }
            />
          </div>

          <div className="lg:col-span-3 h-[230px] lg:h-full order-3">
            {activeTable ? (
              <TableDetail
                table={activeTable}
                onUnseat={(guestId) => unseatGuest(guestId, activeTable._id)}
              />
            ) : (
              <div className="bg-[#0d1b2a]/90 border border-white/5 rounded-2xl h-full flex items-center justify-center">
                <p className="text-white/20 text-sm font-serif">
                  בחר שולחן לפרטים
                </p>
              </div>
            )}
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDragGuest && <GuestDragGhost guest={activeDragGuest} />}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default SeatingEngine;

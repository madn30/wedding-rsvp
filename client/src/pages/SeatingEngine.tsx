import React, { useState, useRef } from 'react';
import { LayoutGrid,Trash2, X, Plus, Settings, DoorOpen, RotateCw } from 'lucide-react';

type TableShape = 'round' | 'rect' | 'square' | 'oval';

// --- נתוני דמה ---
const initialTables = [
  { id: 1, name: 'משפחת כהן', capacity: 12, cx: 200, cy: 160, shape: 'round' as TableShape, size: 1, rotation: 0 },
  { id: 2, name: 'משפחת החתן', capacity: 10, cx: 660, cy: 160, shape: 'rect' as TableShape, size: 1.2, rotation: 45 },
  { id: 3, name: 'חברים', capacity: 8, cx: 200, cy: 380, shape: 'square' as TableShape, size: 0.9, rotation: 15 },
  { id: 4, name: 'עבודה', capacity: 14, cx: 660, cy: 380, shape: 'oval' as TableShape, size: 1.1, rotation: 320 },
  { id: 5, name: 'שולחן VIP', capacity: 12, cx: 430, cy: 420, shape: 'round' as TableShape, size: 1.3, rotation: 0 },
];

const initialDecorations = [
  { id: 'dance', label: 'רחבת ריקודים', cx: 380, cy: 275, width: 180, height: 90, color: '#c9a84c', rotation: 0 },
  { id: 'dj', label: 'עמדת DJ', cx: 380, cy: 205, width: 80, height: 30, color: '#4a90e2', rotation: 0 },
  { id: 'door_main', label: '🚪 כניסה ראשית', cx: 390, cy: 515, width: 100, height: 30, color: '#2ecc71', rotation: 0 },
  { id: 'bar', label: '🍸 בר משקאות', cx: 70, cy: 260, width: 60, height: 120, color: '#9b59b6', rotation: 15 },
];

const initialGuests = [
  { id: 'g1', name: 'לילה מנצור', meal: 'דג', status: 'אישר/ה', tableId: null },
  { id: 'g2', name: 'נור רשידי', meal: 'עוף', status: 'אישר/ה', tableId: null },
  { id: 'g3', name: 'ז׳אן-לוק מרטין', meal: 'בקר', status: 'ממתין', tableId: null },
  { id: 'g6', name: 'מארי דובואה', meal: 'דג', status: 'אישר/ה', tableId: 2 },
  { id: 'g7', name: 'פייר קוטה', meal: 'בקר', status: 'אישר/ה', tableId: 2 },
];

const SeatingEngine = () => {
  const [selectedTableId, setSelectedTableId] = useState<number | null>(2);
  const [selectedDecorId, setSelectedDecorId] = useState<string | null>(null);
  
  const [guests, setGuests] = useState(initialGuests);
  const [tables, setTables] = useState(initialTables);
  const [decorations, setDecorations] = useState(initialDecorations);
  
  const [isTableConfigOpen, setIsTableConfigOpen] = useState(false);
  const [isDecorConfigOpen, setIsDecorConfigOpen] = useState(false);

  const handleGuestDragStart = (e: React.DragEvent, guestId: string) => {
    e.dataTransfer.setData('guestId', guestId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleGuestDropOnTable = (e: React.DragEvent, tableId: number | null) => {
    e.preventDefault();
    const guestId = e.dataTransfer.getData('guestId');
    if (guestId) {
      setGuests(prev => prev.map(g => g.id === guestId ? { ...g, tableId } : g));
      if (tableId !== null) {
        setSelectedTableId(tableId);
        setSelectedDecorId(null);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleAddTable = () => {
    const newId = tables.length > 0 ? Math.max(...tables.map(t => t.id)) + 1 : 1;
    const newTable = { id: newId, name: 'שולחן חדש', capacity: 10, cx: 380, cy: 270, shape: 'round' as TableShape, size: 1, rotation: 0 };
    setTables([...tables, newTable]);
    setSelectedTableId(newId);
    setSelectedDecorId(null);
    setIsTableConfigOpen(true);
  };

  const handleAddElement = () => {
    const newId = `decor_${Date.now()}`;
    const newDecor = { id: newId, label: 'אלמנט חדש', cx: 380, cy: 270, width: 80, height: 40, color: '#ffffff', rotation: 0 };
    setDecorations([...decorations, newDecor]);
    setSelectedDecorId(newId);
    setSelectedTableId(null);
    setIsDecorConfigOpen(true);
  };

  const assignedGuests = guests.filter(g => g.tableId !== null);
  const unassignedGuests = guests.filter(g => g.tableId === null);

  return (
    // הוספתי h-full במקום הגבלה כדי לתפוס את כל גובה העמוד
    <div dir="rtl" className="p-4 md:p-8 w-full max-w-[1600px] mx-auto bg-[#111827] min-h-[calc(100vh-64px)] md:min-h-screen text-white font-sans flex flex-col">
      
      {isTableConfigOpen && selectedTableId !== null && (
        <TableConfigModal 
          table={tables.find(t => t.id === selectedTableId)}
          onClose={() => setIsTableConfigOpen(false)}
          onUpdate={(updatedTable: any) => setTables(prev => prev.map(t => t.id === updatedTable.id ? updatedTable : t))}
          onDelete={() => {
            setTables(prev => prev.filter(t => t.id !== selectedTableId));
            setIsTableConfigOpen(false);
            setSelectedTableId(null);
          }}
        />
      )}

      {isDecorConfigOpen && selectedDecorId !== null && (
        <DecorConfigModal 
          decor={decorations.find(d => d.id === selectedDecorId)}
          onClose={() => setIsDecorConfigOpen(false)}
          onUpdate={(updatedDecor: any) => setDecorations(prev => prev.map(d => d.id === updatedDecor.id ? updatedDecor : d))}
          onDelete={() => {
            setDecorations(prev => prev.filter(d => d.id !== selectedDecorId));
            setIsDecorConfigOpen(false);
            setSelectedDecorId(null);
          }}
        />
      )}

      {/* כותרת מוסתרת במובייל כדי לחסוך מקום */}
      <header className="hidden md:block text-center mb-6 lg:mb-10">
        <h1 className="text-3xl lg:text-4xl font-serif text-[#faf6ef]">עיצוב אולם <em className="text-[#c9a84c] font-serif italic">ותכנון מקומות</em></h1>
      </header>

{/* סרגל כלים - מותאם למובייל עם flex-col במסכים קטנים */}
      <div className="flex flex-col sm:flex-row flex-wrap items-center justify-between gap-4 bg-[#0d1b2a]/90 border border-[#c9a84c]/15 rounded-2xl p-4 mb-6 backdrop-blur-md">
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2 px-4 py-2 bg-[#c9a84c]/10 border border-[#c9a84c]/25 rounded-full text-[#e8c97e] text-xs font-semibold">
            <LayoutGrid size={14} /> {assignedGuests.length} / {guests.length} אורחים שובצו
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-center sm:justify-end">
          
          {/* כפתור הגדרות חדש - מופיע רק אם נבחר שולחן או אלמנט עיצובי */}
          {(selectedTableId !== null || selectedDecorId !== null) && (
            <button 
              onClick={() => {
                if (selectedTableId !== null) setIsTableConfigOpen(true);
                if (selectedDecorId !== null) setIsDecorConfigOpen(true);
              }} 
              className="flex-1 sm:flex-none px-4 py-2 bg-[#c9a84c]/20 border border-[#c9a84c]/50 rounded-lg text-xs font-semibold text-[#e8c97e] hover:bg-[#c9a84c]/30 transition flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(201,168,76,0.2)]"
            >
              <Settings size={14} /> <span className="hidden sm:inline">הגדרות</span>
            </button>
          )}

          <button onClick={handleAddElement} className="flex-1 sm:flex-none px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold hover:bg-white/10 transition flex items-center justify-center gap-2">
            <DoorOpen size={14} /> <span className="hidden sm:inline">הוסף</span> אלמנט
          </button>
          <button onClick={handleAddTable} className="flex-1 sm:flex-none px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold hover:bg-white/10 transition flex items-center justify-center gap-2">
            <Plus size={14} /> <span className="hidden sm:inline">הוסף</span> שולחן
          </button>
        </div>
      </div>
      {/* מערך העמודות - הרספונסיביות המרכזית */}
      {/* במובייל: עמודה אחת (flex-col). בטאבלט/מחשב: גריד של 3 עמודות */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-6 min-h-[500px] lg:min-h-[700px]">
        
        {/* במובייל: סרגל זה הופך להיות אופקי/נגלל או נפתח בפופאפ. לבינתיים שמנו לו גובה קבוע במסכים קטנים */}
        <div className="lg:col-span-3 h-[250px] lg:h-full overflow-hidden order-2 lg:order-1">
          <UnassignedSidebar guests={unassignedGuests} onDragStart={handleGuestDragStart} onDrop={(e: any) => handleGuestDropOnTable(e, null)} onDragOver={handleDragOver} />
        </div>
        
        {/* מפת האולם - תופסת את רוב המקום במובייל */}
        <div className="lg:col-span-6 flex-1 lg:h-full order-1 lg:order-2">
          <FloorPlan 
            tables={tables} setTables={setTables}
            decorations={decorations} setDecorations={setDecorations}
            guests={guests}
            selectedTableId={selectedTableId} onSelectTable={(id: number) => { setSelectedTableId(id); setSelectedDecorId(null); }}
            selectedDecorId={selectedDecorId} onSelectDecor={(id: string) => { setSelectedDecorId(id); setSelectedTableId(null); }}
            onOpenTableConfig={() => setIsTableConfigOpen(true)}
            onOpenDecorConfig={() => setIsDecorConfigOpen(true)}
            onDropOnTable={handleGuestDropOnTable} onDragOver={handleDragOver}
          />
        </div>

        {/* פרטי שולחן נבחר - יופיע למטה במובייל */}
        <div className="lg:col-span-3 h-[250px] lg:h-full overflow-hidden order-3">
          {selectedTableId ? (
            <TableDetail 
              table={tables.find(t => t.id === selectedTableId)} 
              guests={guests.filter(g => g.tableId === selectedTableId)}
              onDragStart={handleGuestDragStart} onDrop={(e: any) => handleGuestDropOnTable(e, selectedTableId)} onDragOver={handleDragOver}
              onRemove={(guestId: string) => setGuests(prev => prev.map(g => g.id === guestId ? { ...g, tableId: null } : g))}
            />
          ) : (
            <div className="bg-[#0d1b2a]/90 border border-white/5 rounded-2xl h-full flex items-center justify-center text-white/30 text-sm">
              בחר שולחן לפרטים
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- חלון הגדרות שולחן ---
const TableConfigModal = ({ table, onClose, onUpdate, onDelete }: any) => {
  const [isSliding, setIsSliding] = useState(false);
  if (!table) return null;
  const shapes = [
    { id: 'round', label: 'עגול', icon: <div className="w-5 h-5 rounded-full border-2 border-current"></div> },
    { id: 'rect', label: 'מלבן', icon: <div className="w-6 h-4 border-2 border-current rounded-sm"></div> },
    { id: 'square', label: 'ריבוע', icon: <div className="w-5 h-5 border-2 border-current rounded-sm"></div> },
    { id: 'oval', label: 'אליפסה', icon: <div className="w-6 h-4 border-2 border-current rounded-[50%]"></div> },
  ];

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center transition-colors duration-200 p-4 ${isSliding ? 'bg-black/10' : 'bg-black/60 backdrop-blur-sm'}`}>
      <div className={`bg-[#0d1b2a] border border-[#c9a84c]/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transition-opacity duration-200 max-h-[90vh] flex flex-col ${isSliding ? 'opacity-30' : 'opacity-100'}`}>
        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5 shrink-0">
          <h2 className="text-lg font-serif text-[#e8c97e]">הגדרות שולחן {table.id}</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition p-2"><X size={20} /></button>
        </div>
        
        <div className="p-4 overflow-y-auto space-y-4">
          <div>
            <label className="block text-[11px] uppercase text-white/50 mb-1">שם קבוצה</label>
            <input type="text" value={table.name} onChange={(e) => onUpdate({ ...table, name: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] uppercase text-white/50 mb-1">סועדים</label>
              <input type="number" min="2" max="30" value={table.capacity} onChange={(e) => onUpdate({ ...table, capacity: parseInt(e.target.value) })} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none" />
            </div>
            <div>
              <label className="block text-[11px] uppercase text-white/50 mb-1 text-[#c9a84c]">גודל מפה</label>
              <input type="range" min="0.5" max="2.5" step="0.1" value={table.size || 1} onChange={(e) => onUpdate({ ...table, size: parseFloat(e.target.value) })} onPointerDown={() => setIsSliding(true)} onPointerUp={() => setIsSliding(false)} onTouchStart={() => setIsSliding(true)} onTouchEnd={() => setIsSliding(false)} className="w-full mt-2 accent-[#c9a84c]" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase text-white/50 mb-1 flex items-center gap-1"><RotateCw size={12}/> זווית (מעלות)</label>
            <div className="flex items-center gap-2">
              <input type="range" min="0" max="360" step="1" value={table.rotation || 0} onChange={(e) => onUpdate({ ...table, rotation: parseInt(e.target.value) })} onPointerDown={() => setIsSliding(true)} onPointerUp={() => setIsSliding(false)} onTouchStart={() => setIsSliding(true)} onTouchEnd={() => setIsSliding(false)} className="flex-1 accent-[#c9a84c]" />
              <span className="w-12 text-center bg-white/5 border border-white/10 rounded-lg py-1 text-[#e8c97e] font-bold text-xs" dir="ltr">{table.rotation || 0}°</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase text-white/50 mb-1">צורת שולחן</label>
            <div className="grid grid-cols-4 gap-2">
              {shapes.map(shape => (
                <button key={shape.id} onClick={() => onUpdate({ ...table, shape: shape.id })} className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${table.shape === shape.id ? 'bg-[#c9a84c]/20 border-[#c9a84c] text-[#e8c97e]' : 'bg-white/5 border-white/10 text-white/40'}`}>
                  {shape.icon}
                  <span className="text-[10px]">{shape.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center p-4 border-t border-white/10 bg-black/20 shrink-0">
          <button onClick={onDelete} className="text-red-400 text-xs font-bold hover:text-red-300 transition flex items-center gap-1 p-2"><Trash2 size={14} /> מחק</button>
          <button onClick={onClose} className="px-6 py-2 bg-[#c9a84c] text-[#0d1b2a] rounded-lg text-sm font-bold shadow-lg shadow-[#c9a84c]/20 hover:scale-105 transition">סגור</button>
        </div>
      </div>
    </div>
  );
};

// --- חלון הגדרות אלמנט ---
const DecorConfigModal = ({ decor, onClose, onUpdate, onDelete }: any) => {
  const [isSliding, setIsSliding] = useState(false);
  if (!decor) return null;
  const colors = ['#ffffff', '#c9a84c', '#e74c3c', '#2ecc71', '#4a90e2', '#9b59b6'];

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center transition-colors duration-200 p-4 ${isSliding ? 'bg-black/10' : 'bg-black/60 backdrop-blur-sm'}`}>
      <div className={`bg-[#0d1b2a] border border-blue-500/30 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transition-opacity duration-200 max-h-[90vh] flex flex-col ${isSliding ? 'opacity-30' : 'opacity-100'}`}>
        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5 shrink-0">
          <h2 className="text-lg font-serif text-blue-300">הגדרות אלמנט</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white transition p-2"><X size={20} /></button>
        </div>
        
        <div className="p-4 overflow-y-auto space-y-4">
          <div>
            <label className="block text-[11px] uppercase text-white/50 mb-1">טקסט תצוגה</label>
            <input type="text" value={decor.label} onChange={(e) => onUpdate({ ...decor, label: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] uppercase text-white/50 mb-1">רוחב</label>
              <input type="number" value={decor.width} onChange={(e) => onUpdate({ ...decor, width: parseInt(e.target.value) })} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none" />
            </div>
            <div>
              <label className="block text-[11px] uppercase text-white/50 mb-1">גובה</label>
              <input type="number" value={decor.height} onChange={(e) => onUpdate({ ...decor, height: parseInt(e.target.value) })} className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase text-white/50 mb-1 flex items-center gap-1"><RotateCw size={12}/> זווית (מעלות)</label>
            <div className="flex items-center gap-2">
              <input type="range" min="0" max="360" step="1" value={decor.rotation || 0} onChange={(e) => onUpdate({ ...decor, rotation: parseInt(e.target.value) })} onPointerDown={() => setIsSliding(true)} onPointerUp={() => setIsSliding(false)} onTouchStart={() => setIsSliding(true)} onTouchEnd={() => setIsSliding(false)} className="flex-1 accent-blue-500" />
              <span className="w-12 text-center bg-white/5 border border-white/10 rounded-lg py-1 text-blue-300 font-bold text-xs" dir="ltr">{decor.rotation || 0}°</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase text-white/50 mb-1">צבע</label>
            <div className="flex flex-wrap gap-2">
              {colors.map(c => (
                <button key={c} onClick={() => onUpdate({ ...decor, color: c })} className={`w-8 h-8 rounded-full border-2 transition-all ${decor.color === c ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center p-4 border-t border-white/10 bg-black/20 shrink-0">
          <button onClick={onDelete} className="text-red-400 text-xs font-bold hover:text-red-300 transition flex items-center gap-1 p-2"><Trash2 size={14} /> מחק</button>
          <button onClick={onClose} className="px-6 py-2 bg-blue-500 text-white rounded-lg text-sm font-bold hover:scale-105 transition">אישור</button>
        </div>
      </div>
    </div>
  );
};

// --- מפת האולם (הקנבס) ---
const FloorPlan = ({ tables, setTables, decorations, setDecorations, guests, selectedTableId, onSelectTable, selectedDecorId, onSelectDecor, onOpenTableConfig, onOpenDecorConfig, onDropOnTable, onDragOver }: any) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingItem, setDraggingItem] = useState<{ id: string | number, type: 'table' | 'decor', offsetX: number, offsetY: number } | null>(null);

  // מעקב האם המשתמש באמת גרר את האלמנט או רק נגע בו
  const dragMeta = useRef({ isMoved: false, startX: 0, startY: 0 });

  const getPointerCoords = (e: React.PointerEvent | React.TouchEvent) => {
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.PointerEvent).clientX;
      clientY = (e as React.PointerEvent).clientY;
    }
    return { clientX, clientY };
  };

  const handlePointerDown = (e: any, id: string | number, type: 'table' | 'decor', currentCx: number, currentCy: number) => {
    e.stopPropagation();
    if (!svgRef.current) return;

    const { clientX, clientY } = getPointerCoords(e);
    
    // איפוס המעקב בתחילת הלחיצה
    dragMeta.current = { isMoved: false, startX: clientX, startY: clientY };

    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return;
    const svgPoint = svgRef.current.createSVGPoint();
    svgPoint.x = clientX;
    svgPoint.y = clientY;
    const cursor = svgPoint.matrixTransform(CTM.inverse());

    setDraggingItem({ id, type, offsetX: cursor.x - currentCx, offsetY: cursor.y - currentCy });
  };

const handlePointerMove = (e: any) => {
    if (!draggingItem || !svgRef.current) return;

    const { clientX, clientY } = getPointerCoords(e);
    
    // אם האצבע זזה יותר מ-5 פיקסלים, אנחנו מסמנים שזו גרירה ולא לחיצה
    const dx = Math.abs(clientX - dragMeta.current.startX);
    const dy = Math.abs(clientY - dragMeta.current.startY);
    if (dx > 5 || dy > 5) {
      dragMeta.current.isMoved = true;
    }

    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return;
    const svgPoint = svgRef.current.createSVGPoint();
    svgPoint.x = clientX;
    svgPoint.y = clientY;
    const cursor = svgPoint.matrixTransform(CTM.inverse());

    // חישוב המיקום החדש
    let newCx = cursor.x - draggingItem.offsetX;
    let newCy = cursor.y - draggingItem.offsetY;

    // הגבלת הגרירה לגבולות ה-SVG (רוחב 760, גובה 540)
    // הוספנו שוליים של 20 פיקסלים כדי שהשולחן לא יידחף לגמרי החוצה
    const PADDING = 20;
    const MAX_WIDTH = 760;
    const MAX_HEIGHT = 540;

    newCx = Math.max(PADDING, Math.min(MAX_WIDTH - PADDING, newCx));
    newCy = Math.max(PADDING, Math.min(MAX_HEIGHT - PADDING, newCy));

    if (draggingItem.type === 'table') {
      setTables((prev: any) => prev.map((t: any) => t.id === draggingItem.id ? { ...t, cx: newCx, cy: newCy } : t));
    } else if (draggingItem.type === 'decor') {
      setDecorations((prev: any) => prev.map((d: any) => d.id === draggingItem.id ? { ...d, cx: newCx, cy: newCy } : d));
    }
  };
  const handlePointerUp = () => {
    if (draggingItem) {
      // אם שחררנו את העכבר/אצבע והאלמנט כמעט ולא זז - זה קליק! נפתח הגדרות
      if (!dragMeta.current.isMoved) {
        if (draggingItem.type === 'table') onOpenTableConfig();
        if (draggingItem.type === 'decor') onOpenDecorConfig();
      }
    }
    setDraggingItem(null);
  };

  const renderTableShapeAtOrigin = (table: any, isSelected: boolean, isFull: boolean) => {
    const baseClass = `transition-all duration-300 ${isSelected ? 'stroke-[#c9a84c] stroke-[3px]' : 'stroke-white/20 stroke-[1.5px] group-hover:stroke-[#c9a84c]/60'} ${isFull ? 'fill-[#1a2e20]' : 'fill-[#1a2e45]'}`;
    const s = table.size || 1; 
    switch (table.shape) {
      case 'rect': return <rect x={-(50 * s)} y={-(30 * s)} width={100 * s} height={60 * s} rx="8" className={baseClass} />;
      case 'square': return <rect x={-(40 * s)} y={-(40 * s)} width={80 * s} height={80 * s} rx="8" className={baseClass} />;
      case 'oval': return <ellipse cx="0" cy="0" rx={60 * s} ry={35 * s} className={baseClass} />;
      case 'round': default: return <circle cx="0" cy="0" r={42 * s} className={baseClass} />;
    }
  };

  return (
    <div className="bg-[#0d1b2a]/95 border border-[#c9a84c]/15 rounded-2xl h-full w-full relative overflow-hidden shadow-2xl group" onClick={() => { onSelectTable(null); onSelectDecor(null); }}>
      <svg 
        ref={svgRef} 
        viewBox="0 0 760 540" 
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full select-none touch-none" 
        onPointerMove={handlePointerMove} 
        onPointerUp={handlePointerUp} 
        onPointerLeave={handlePointerUp}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        onTouchCancel={handlePointerUp}
      >
        <defs>
          <radialGradient id="canvasBg" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#243b55" stopOpacity="0.4"/><stop offset="100%" stopColor="#0d1b2a" stopOpacity="0.95"/></radialGradient>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/></pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#canvasBg)" />
        <rect width="100%" height="100%" fill="url(#grid)" />

        {decorations.map((decor: any) => {
          const isSelected = selectedDecorId === decor.id;
          const rot = decor.rotation || 0;
          return (
            <g 
              key={decor.id} 
              onPointerDown={(e) => { 
                onSelectDecor(decor.id); 
                handlePointerDown(e, decor.id, 'decor', decor.cx, decor.cy); 
              }} 
              onTouchStart={(e) => { 
                onSelectDecor(decor.id); 
                handlePointerDown(e, decor.id, 'decor', decor.cx, decor.cy); 
              }}
              onClick={(e) => e.stopPropagation()} 
              className="cursor-move"
              transform={`translate(${decor.cx}, ${decor.cy}) rotate(${rot})`}
            >
              <rect x={-decor.width / 2} y={-decor.height / 2} width={decor.width} height={decor.height} rx="4" fill={`${decor.color}15`} stroke={decor.color} strokeWidth={isSelected ? "3" : "1.5"} strokeDasharray={isSelected ? "none" : "4 2"} className="transition-all" />
              <g transform={`rotate(-${rot})`}>
                <text x="0" y="4" textAnchor="middle" fill={decor.color} className="font-serif text-[11px] font-bold tracking-wider pointer-events-none">{decor.label}</text>
              </g>
            </g>
          );
        })}

        {tables.map((table: any) => {
          const tableGuests = guests.filter((g: any) => g.tableId === table.id);
          const isSelected = selectedTableId === table.id;
          const isFull = tableGuests.length >= table.capacity;
          const rot = table.rotation || 0;
          return (
            <g 
              key={table.id}
              onPointerDown={(e) => { 
                onSelectTable(table.id); 
                handlePointerDown(e, table.id, 'table', table.cx, table.cy); 
              }}
              onTouchStart={(e) => { 
                onSelectTable(table.id); 
                handlePointerDown(e, table.id, 'table', table.cx, table.cy); 
              }}
              onClick={(e) => e.stopPropagation()} 
              onDrop={(e) => onDropOnTable(e, table.id)}
              onDragOver={onDragOver}
              className="cursor-move group"
              transform={`translate(${table.cx}, ${table.cy}) rotate(${rot})`}
            >
              {renderTableShapeAtOrigin(table, isSelected, isFull)}
              <g transform={`rotate(-${rot})`}>
                 <text x="0" y="-2" textAnchor="middle" fill="#e8c97e" className="font-bold text-sm pointer-events-none">{table.id}</text>
                 <text x="0" y="15" textAnchor="middle" fill="white" className="opacity-40 text-[10px] pointer-events-none">{tableGuests.length}/{table.capacity}</text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
const UnassignedSidebar = ({ guests, onDragStart, onDrop, onDragOver }: any) => (
  <aside className="bg-[#0d1b2a]/90 border border-[#c9a84c]/15 rounded-2xl h-full flex flex-col overflow-hidden backdrop-blur-md" onDrop={onDrop} onDragOver={onDragOver}>
     <div className="p-3 border-b border-white/5 flex justify-between items-center"><h4 className="font-serif text-[#faf6ef] text-base">ללא שיבוץ</h4><span className="text-[10px] text-white/30 tracking-tighter">נותרו {guests.length}</span></div>
    <div className="flex-1 overflow-y-auto p-2 space-y-2">
      {guests.map((guest: any) => (
        <div key={guest.id} draggable onDragStart={(e) => onDragStart(e, guest.id)} className="flex items-center gap-3 p-2 bg-white/[0.03] border border-white/5 rounded-xl cursor-grab hover:bg-[#c9a84c]/10 transition-all">
          <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-[#c9a84c] to-[#f5e6c0] text-[#0d1b2a] flex items-center justify-center font-bold text-[11px]">{guest.name[0]}</div>
          <div className="flex-1 min-w-0"><h6 className="text-xs font-semibold text-[#faf6ef] truncate">{guest.name}</h6><p className="text-[9px] text-white/35 uppercase tracking-tighter truncate">{guest.meal}</p></div>
        </div>
      ))}
    </div>
  </aside>
);

const TableDetail = ({ table, guests, onDragStart, onDrop, onDragOver, onRemove }: any) => {
  if (!table) return null;
  const emptySeats = Math.max(0, table.capacity - guests.length);
  return (
    <aside className="bg-[#0d1b2a]/90 border border-[#c9a84c]/15 rounded-2xl h-full flex flex-col overflow-hidden backdrop-blur-md" onDrop={onDrop} onDragOver={onDragOver}>
      <div className="p-3 border-b border-white/5">
        <h4 className="font-serif text-[#faf6ef] text-base">פרטי שולחן</h4>
        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-[#c9a84c]/10 border border-[#c9a84c]/25 rounded-lg text-[#e8c97e] text-[10px] font-bold">🪑 שולחן {table.id}</div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {guests.map((guest: any, i: number) => (
          <div key={guest.id} draggable onDragStart={(e) => onDragStart(e, guest.id)} className="flex items-center gap-2 p-2 bg-[#c9a84c]/5 border border-[#c9a84c]/20 rounded-xl cursor-grab">
            <div className="w-6 h-6 shrink-0 rounded-md bg-[#c9a84c]/20 text-[#e8c97e] flex items-center justify-center text-[10px] font-bold">{i + 1}</div>
            <div className="flex-1 min-w-0"><h6 className="text-xs font-semibold text-[#faf6ef] truncate">{guest.name}</h6></div>
            <button className="p-1.5 hover:bg-white/5 rounded-md transition-colors" onClick={() => onRemove(guest.id)}><Trash2 size={14} className="text-white/30 hover:text-red-400" /></button>
          </div>
        ))}
        {Array.from({ length: emptySeats }).map((_, i) => (
          <div key={`empty-${i}`} className="flex items-center gap-2 p-2 border border-white/5 border-dashed rounded-xl opacity-30">
            <div className="w-6 h-6 shrink-0 rounded-md bg-white/10 text-white flex items-center justify-center text-[10px] font-bold">{guests.length + i + 1}</div>
            <span className="text-xs italic truncate">גרור אורח לכאן</span>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default SeatingEngine;
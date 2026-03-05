import { create } from "zustand";
import api from "../services/api";
import toast from "react-hot-toast";

export type TableType =
  | "round"
  | "rect"
  | "square"
  | "oval"
  | "dj"
  | "dance"
  | "bar"
  | "stage";

export interface SeatingGuest {
  _id: string;
  name: string;
  phone: string;
  response: string | null;
  numberOfGuests: number;
  foodPreference: string | null;
}

export interface SeatingTable {
  _id: string;
  name: string;
  type: TableType;

  x: number;

  y: number;
  capacity: number;
  rotation: number;
  size: number;
  seatedGuests: SeatingGuest[];
}

const positionTimers = new Map<string, ReturnType<typeof setTimeout>>();

interface SeatingStore {
  tables: SeatingTable[];
  guests: SeatingGuest[];
  isLoadingTables: boolean;
  isLoadingGuests: boolean;
  activeTableId: string | null;

  fetchTables: () => Promise<void>;
  fetchGuests: () => Promise<void>;

  addTable: (name: string, type?: TableType) => Promise<void>;
  updateTableLocal: (id: string, updates: Partial<SeatingTable>) => void;

  debouncedSavePosition: (
    id: string,
    x: number,
    y: number,
    preDragX: number,
    preDragY: number,
  ) => void;
  updateTableConfig: (
    id: string,
    updates: Partial<SeatingTable>,
  ) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;

  seatGuest: (guestId: string, tableId: string) => Promise<void>;
  unseatGuest: (guestId: string, tableId: string) => Promise<void>;

  setActiveTable: (id: string | null) => void;
}

export const useSeatingStore = create<SeatingStore>((set, get) => ({
  tables: [],
  guests: [],
  isLoadingTables: false,
  isLoadingGuests: false,
  activeTableId: null,

  fetchTables: async () => {
    set({ isLoadingTables: true });
    try {
      const { data } = await api.get("/tables");
      set({ tables: data.data });
    } catch {
      toast.error("שגיאה בטעינת השולחנות");
    } finally {
      set({ isLoadingTables: false });
    }
  },

  fetchGuests: async () => {
    set({ isLoadingGuests: true });
    try {
      const { data } = await api.get("/guests?response=yes&limit=500");
      set({ guests: data.data });
    } catch {
      toast.error("שגיאה בטעינת האורחים");
    } finally {
      set({ isLoadingGuests: false });
    }
  },

  addTable: async (name, type = "round") => {
    const toastId = toast.loading("מוסיף שולחן...");
    try {
      const { data } = await api.post("/tables", { name, type });
      set((state) => ({ tables: [...state.tables, data.data] }));
      toast.success("שולחן נוסף", { id: toastId });
    } catch {
      toast.error("שגיאה בהוספת שולחן", { id: toastId });
    }
  },

  updateTableLocal: (id, updates) => {
    set((state) => ({
      tables: state.tables.map((t) =>
        t._id === id ? { ...t, ...updates } : t,
      ),
    }));
  },

  debouncedSavePosition: (id, x, y, preDragX, preDragY) => {
    if (positionTimers.has(id)) clearTimeout(positionTimers.get(id)!);

    const timer = setTimeout(async () => {
      positionTimers.delete(id);
      try {
        await api.put(`/tables/${id}`, { x, y });
      } catch {
        set((state) => ({
          tables: state.tables.map((t) =>
            t._id === id ? { ...t, x: preDragX, y: preDragY } : t,
          ),
        }));
        toast.error("שמירת המיקום נכשלה — בוצע שחזור");
      }
    }, 500);

    positionTimers.set(id, timer);
  },

  updateTableConfig: async (id, updates) => {
    const snapshot = get().tables;

    set((state) => ({
      tables: state.tables.map((t) =>
        t._id === id ? { ...t, ...updates } : t,
      ),
    }));
    try {
      const { data } = await api.put(`/tables/${id}`, updates);

      set((state) => ({
        tables: state.tables.map((t) => (t._id === id ? data.data : t)),
      }));
    } catch {
      set({ tables: snapshot });
      toast.error("שגיאה בעדכון השולחן");
    }
  },

  deleteTable: async (id) => {
    const snapshot = get().tables;

    set((state) => ({
      tables: state.tables.filter((t) => t._id !== id),
      activeTableId: state.activeTableId === id ? null : state.activeTableId,
    }));
    try {
      await api.delete(`/tables/${id}`);
      toast.success("שולחן נמחק");
    } catch {
      set({ tables: snapshot });
      toast.error("שגיאה במחיקת השולחן");
    }
  },

  seatGuest: async (guestId, tableId) => {
    const snapshot = get().tables;
    const guest = get().guests.find((g) => g._id === guestId);
    if (!guest) return;

    const target = get().tables.find((t) => t._id === tableId);
    if (!target) return;
    if (target.seatedGuests.length >= target.capacity) {
      toast.error("השולחן מלא");
      return;
    }

    set((state) => ({
      tables: state.tables.map((t) => {
        const without = t.seatedGuests.filter((g) => g._id !== guestId);
        return t._id === tableId
          ? { ...t, seatedGuests: [...without, guest] }
          : { ...t, seatedGuests: without };
      }),
    }));

    try {
      await api.post(`/tables/${tableId}/seat/${guestId}`);
    } catch (err: any) {
      set({ tables: snapshot });
      toast.error(err?.response?.data?.message ?? "שגיאה בשיבוץ אורח");
    }
  },

  unseatGuest: async (guestId, tableId) => {
    const snapshot = get().tables;
    set((state) => ({
      tables: state.tables.map((t) =>
        t._id === tableId
          ? {
              ...t,
              seatedGuests: t.seatedGuests.filter((g) => g._id !== guestId),
            }
          : t,
      ),
    }));
    try {
      await api.delete(`/tables/${tableId}/seat/${guestId}`);
    } catch {
      set({ tables: snapshot });
      toast.error("שגיאה בהסרת אורח");
    }
  },

  setActiveTable: (id) => set({ activeTableId: id }),
}));

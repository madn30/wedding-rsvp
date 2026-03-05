import { useState, useEffect, useCallback } from "react";
import { Guest, Stats, PaginationMeta, Decoration, Table } from "../types";
import { getGuests, GetGuestsParams } from "../services/guestService";
import { getStats } from "../services/authService";

export const useGuests = (initialParams: GetGuestsParams = {}) => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [params, setParams] = useState<GetGuestsParams>(initialParams);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getGuests(params);
      setGuests(result.guests);
      setPagination(result.pagination);
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { guests, pagination, isLoading, refetch: fetch, setParams };
};

export const useStats = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getStats();
      setStats(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { stats, isLoading, refetch: fetch };
};

export const useDebounce = <T>(value: T, delay = 400): T => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

export const useSeatingManager = (
  initialTables: Table[],
  initialGuests: Guest[],
  initialDecors: Decoration[],
) => {
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [decorations, setDecorations] = useState<Decoration[]>(initialDecors);

  const assignGuest = useCallback((guestId: string, tableId: number | null) => {
    setGuests((prev) =>
      prev.map((g) => (g.id === guestId ? { ...g, tableId } : g)),
    );
  }, []);

  const updateTable = useCallback((updated: Table) => {
    setTables((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }, []);

  const deleteTable = useCallback((id: number) => {
    setTables((prev) => prev.filter((t) => t.id !== id));
    setGuests((prev) =>
      prev.map((g) => (g.tableId === id ? { ...g, tableId: null } : g)),
    );
  }, []);

  const addTable = useCallback(() => {
    const newId =
      tables.length > 0 ? Math.max(...tables.map((t) => t.id)) + 1 : 1;
    const newTable: Table = {
      id: newId,
      name: "שולחן חדש",
      capacity: 10,
      cx: 380,
      cy: 270,
      shape: "round",
      size: 1,
      rotation: 0,
    };
    setTables((prev) => [...prev, newTable]);
    return newId;
  }, [tables]);

  return {
    tables,
    guests,
    decorations,
    setTables,
    setDecorations,
    assignGuest,
    updateTable,
    deleteTable,
    addTable,
  };
};

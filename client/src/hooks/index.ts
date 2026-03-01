import { useState, useEffect, useCallback } from 'react';
import { Guest, Stats, PaginationMeta } from '../types';
import { getGuests, GetGuestsParams, getWhatsAppStatus } from '../services/guestService';
import { getStats } from '../services/authService';

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

  useEffect(() => { fetch(); }, [fetch]);

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

  useEffect(() => { fetch(); }, [fetch]);

  return { stats, isLoading, refetch: fetch };
};

export const useWhatsAppStatus = () => {
  const [whatsAppReady, setWhatsAppReady] = useState<boolean | null>(null);

  const check = useCallback(async () => {
    const ready = await getWhatsAppStatus();
    setWhatsAppReady(ready);
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, [check]);

  return { whatsAppReady };
};

export const useDebounce = <T>(value: T, delay = 400): T => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

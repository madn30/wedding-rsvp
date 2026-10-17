import { useState, useEffect, useCallback } from "react";
import { Guest, Stats, PaginationMeta } from "../types";
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

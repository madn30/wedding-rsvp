import api from "./api";
import {
  Admin,
  Stats,
  ApiResponse,
  RSVPData,
  RSVPSubmitPayload,
} from "../types";

export const login = async (
  email: string,
  password: string,
): Promise<{ token: string; admin: Admin }> => {
  const res = await api.post<{ success: boolean; token: string; admin: Admin }>(
    "/admin/login",
    { email, password },
  );
  return { token: res.data.token, admin: res.data.admin };
};

export const getMe = async (): Promise<Admin> => {
  const res = await api.get<ApiResponse<Admin>>("/admin/me");
  return res.data.data!;
};

export const getStats = async (): Promise<Stats> => {
  const res = await api.get<ApiResponse<Stats>>("/stats");
  return res.data.data!;
};

export const getRSVP = async (token: string): Promise<RSVPData> => {
  const res = await api.get<ApiResponse<RSVPData>>(`/rsvp/${token}`);
  return res.data.data!;
};

export const submitRSVP = async (
  token: string,
  payload: RSVPSubmitPayload,
): Promise<void> => {
  await api.post(`/rsvp/${token}`, payload);
};

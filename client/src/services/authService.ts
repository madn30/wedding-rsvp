import api from "./api";
import { Stats, ApiResponse, RSVPData, RSVPSubmitPayload } from "../types";

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

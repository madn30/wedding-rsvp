export type RSVPResponse = 'yes' | 'no' | 'maybe' | null;
export type MessageChannel = 'sms' | 'whatsapp';
export type FoodPreference = 'regular' | 'vegetarian' | 'vegan' | 'gluten-free' | null;

export interface Guest {
  _id: string;
  name: string;
  phone: string;
  token: string;
  response: RSVPResponse;
  respondedAt: string | null;
  numberOfGuests: number;
  foodPreference: FoodPreference;
  transportNeeded: boolean;
  specialRequests: string;
  messageSent: boolean;
  messageChannel: MessageChannel | null;
  messageSentAt: string | null;
  whatsappReplied: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GuestForm {
  name: string;
  phone: string;
}

export interface Stats {
  total: number;
  yes: number;
  no: number;
  maybe: number;
  pending: number;
  messageSent: number;
  responseRate: number;
  totalConfirmedGuests: number;
}

export interface Admin {
  id: string;
  email: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: PaginationMeta;
}

export interface RSVPData {
  name: string;
  response: RSVPResponse;
  respondedAt: string | null;
  numberOfGuests: number;
  foodPreference: FoodPreference;
  transportNeeded: boolean;
  specialRequests: string;
  coupleNames: string;
  weddingDate: string;
  venue: string;
}

export interface RSVPSubmitPayload {
  response: NonNullable<RSVPResponse>;
  numberOfGuests?: number;
  foodPreference?: FoodPreference;
  transportNeeded?: boolean;
  specialRequests?: string;
}

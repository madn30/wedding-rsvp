export type RSVPResponse = 'yes' | 'no' | 'maybe' | null;
/** SMS via Twilio has been removed — only WhatsApp is supported. */
export type MessageChannel = 'whatsapp';
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
  /** True when the wedding date has passed or admin has manually locked forms */
  isExpired?: boolean;
}

export interface RSVPSubmitPayload {
  response: NonNullable<RSVPResponse>;
  numberOfGuests?: number;
  foodPreference?: FoodPreference;
  transportNeeded?: boolean;
  specialRequests?: string;
}


export type TableShape = 'round' | 'rect' | 'square' | 'oval';

export interface Table {
  id: number;
  name: string;
  capacity: number;
  cx: number;
  cy: number;
  shape: TableShape;
  size: number;
  rotation: number;
}

export interface Decoration {
  id: string;
  label: string;
  cx: number;
  cy: number;
  width: number;
  height: number;
  color: string;
  rotation: number;
}

export interface Guest {
  id: string;
  name: string;
  meal: string;
  status: string;
  tableId: number | null;
}
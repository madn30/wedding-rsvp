import {
  AxiosError,
  AxiosHeaders,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

type RSVPResponse = "yes" | "no" | "maybe" | null;

interface StoredEvent {
  _id: string;
  name: string;
  groomName: string;
  brideName: string;
  date: string;
  startTime: string;
  location: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StoredGuest {
  _id: string;
  eventId: string;
  name: string;
  phone: string;
  token: string;
  response: RSVPResponse;
  respondedAt: string | null;
  numberOfGuests: number;
  foodPreference: string | null;
  transportNeeded: boolean;
  specialRequests: string;
  messageSent: boolean;
  messageChannel: "sms" | "whatsapp" | null;
  messageSentAt: string | null;
  whatsappReplied: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StoredTable {
  _id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  capacity: number;
  rotation: number;
  size: number;
  seatedGuests: string[];
  createdAt: string;
  updatedAt: string;
}

interface StoredSettings {
  _id: string;
  templates: Record<string, string>;
  rsvpLocked: boolean;
  lockedAt: string | null;
  updatedAt: string;
}

interface Db {
  events: StoredEvent[];
  guests: StoredGuest[];
  tables: StoredTable[];
  settings: StoredSettings;
}

type Body = Record<string, unknown>;

const STORAGE_KEY = "wedding-rsvp-local-db";

const now = (): string => new Date().toISOString();

const randomString = (chars: string, length: number): string => {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
};

const newId = (): string => randomString("0123456789abcdef", 24);

const generateToken = (): string =>
  randomString(
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    32,
  );

const defaultSettings = (): StoredSettings => ({
  _id: newId(),
  templates: {
    invitation:
      "היי {{guest_name}}, אנחנו שמחים להזמין אותך לחתונה של {{couple_names}}!\n" +
      "📅 {{wedding_date}}\n📍 {{venue}}\n\n" +
      "אנא אשרו הגעה כאן:\n{{rsvp_link}}\n\n" +
      "להוספת האירוע ליומן:\n{{calendar_link}}",
    reminder30Pending:
      "היי {{guest_name}}, נזכיר שנשאר רק חודש לחתונה של {{couple_names}}! 🎉\n" +
      "עדיין לא אישרת הגעה — נשמח לדעת:\n{{rsvp_link}}",
    reminder30Attending:
      "היי {{guest_name}}, חודש עוד ואנחנו מתחתנים! 🥂\n" +
      "אתם מגיעים ל{{couple_names}} — תודה שאישרתם!\n" +
      "אם יש שינוי בכמות האורחים, עדכנו כאן:\n{{rsvp_link}}",
    declinedReply:
      "חבל שלא תוכלו להגיע, {{guest_name}} 💛\n" +
      "תודה שעדכנתם אותנו — נתגעגע אליכם!",
    dayOf:
      "היום זה קורה! 🎊\n" +
      "היי {{guest_name}}, מחכים לכם בחתונה של {{couple_names}}!\n" +
      "📍 {{venue}}\n\n" +
      "לניווט עם Waze:\n{{waze_link}}",
  },
  rsvpLocked: false,
  lockedAt: null,
  updatedAt: now(),
});

const emptyDb = (): Db => ({
  events: [],
  guests: [],
  tables: [],
  settings: defaultSettings(),
});

const loadDb = (): Db => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Db;
  } catch {
    console.warn("Could not read saved data, starting with an empty one");
  }
  return emptyDb();
};

let db: Db = loadDb();

const saveDb = (): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    console.warn("Could not save data; changes last until the page reloads");
  }
};

class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const normalizeIsraeliPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("972") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("05") && digits.length === 10)
    return `+972${digits.slice(1)}`;
  if (digits.startsWith("5") && digits.length === 9) return `+972${digits}`;
  throw new HttpError(400, "Invalid Israeli phone number format.");
};

const activeEvent = (): StoredEvent | undefined =>
  db.events.find((e) => e.isActive);

const byCreatedDesc = <T extends { createdAt: string }>(a: T, b: T): number =>
  b.createdAt.localeCompare(a.createdAt);

const findEvent = (id: string): StoredEvent => {
  const event = db.events.find((e) => e._id === id);
  if (!event) throw new HttpError(404, "Event not found.");
  return event;
};

const findTable = (id: string): StoredTable => {
  const table = db.tables.find((t) => t._id === id);
  if (!table) throw new HttpError(404, "Table not found");
  return table;
};

const populateTable = (table: StoredTable) => ({
  ...table,
  seatedGuests: table.seatedGuests.flatMap((id) => {
    const g = db.guests.find((guest) => guest._id === id);
    return g
      ? [
          {
            _id: g._id,
            name: g.name,
            phone: g.phone,
            response: g.response,
            numberOfGuests: g.numberOfGuests,
            foodPreference: g.foodPreference,
          },
        ]
      : [];
  }),
});

const rsvpClosed = (event: StoredEvent | undefined): boolean =>
  !event || new Date() > new Date(event.date) || db.settings.rsvpLocked;

const markInvited = (guest: StoredGuest, eventId: string): void => {
  guest.eventId = eventId;
  guest.messageSent = true;
  guest.messageChannel = "whatsapp";
  guest.messageSentAt = now();
  guest.updatedAt = now();
};

export const exportGuestsCSV = (): string => {
  const event = activeEvent();
  if (!event) throw new HttpError(400, "No active event to export.");
  const responseMap: Record<string, string> = {
    yes: "מגיע",
    no: "לא מגיע",
    maybe: "אולי",
  };
  const headers = [
    "שם",
    "טלפון",
    "תשובה",
    "תאריך תשובה",
    "הודעה נשלחה",
    "ערוץ",
  ];
  const rows = db.guests
    .filter((g) => g.eventId === event._id)
    .sort(byCreatedDesc)
    .map((g) => [
      g.name,
      g.phone,
      g.response ? responseMap[g.response] : "ממתין",
      g.respondedAt ? new Date(g.respondedAt).toLocaleDateString("he-IL") : "",
      g.messageSent ? "כן" : "לא",
      g.messageChannel || "",
    ]);
  return "﻿" + [headers, ...rows].map((row) => row.join(",")).join("\n");
};

type Handler = (
  params: string[],
  body: Body,
  query: URLSearchParams,
) => { status?: number; data: unknown };

const routes: Array<[string, RegExp, Handler]> = [
  [
    "get",
    /^\/events$/,
    () => ({
      data: { success: true, data: [...db.events].sort(byCreatedDesc) },
    }),
  ],
  [
    "post",
    /^\/events$/,
    (_p, body) => {
      const name = String(body.name ?? "").trim();
      if (name.length < 2) throw new HttpError(400, "Event name is required.");
      if (!body.date || !body.startTime)
        throw new HttpError(400, "Event date and start time are required.");
      const event: StoredEvent = {
        _id: newId(),
        name,
        groomName: String(body.groomName ?? "").trim(),
        brideName: String(body.brideName ?? "").trim(),
        date: String(body.date),
        startTime: String(body.startTime),
        location: String(body.location ?? ""),
        description: String(body.description ?? ""),
        isActive: false,
        createdAt: now(),
        updatedAt: now(),
      };
      db.events.push(event);
      return { status: 201, data: { success: true, data: event } };
    },
  ],
  [
    "post",
    /^\/events\/clear-active$/,
    () => {
      db.events.forEach((e) => (e.isActive = false));
      return { data: { success: true, message: "Active event cleared." } };
    },
  ],
  [
    "put",
    /^\/events\/([^/]+)$/,
    ([id], body) => {
      const event = findEvent(id);
      Object.assign(event, body, { _id: event._id, updatedAt: now() });
      return { data: { success: true, data: event } };
    },
  ],
  [
    "post",
    /^\/events\/([^/]+)\/set-active$/,
    ([id]) => {
      const event = findEvent(id);
      db.events.forEach((e) => (e.isActive = false));
      event.isActive = true;
      return { data: { success: true, data: event } };
    },
  ],
  [
    "delete",
    /^\/events\/([^/]+)$/,
    ([id]) => {
      findEvent(id);
      db.events = db.events.filter((e) => e._id !== id);
      return {
        data: { success: true, message: "Event deleted successfully." },
      };
    },
  ],

  [
    "get",
    /^\/guests$/,
    (_p, _b, query) => {
      const event = activeEvent();
      if (!event)
        throw new HttpError(400, "Please set an active event to view guests.");
      const response = query.get("response");
      const search = query.get("search")?.toLowerCase();
      const page = parseInt(query.get("page") ?? "1");
      const limit = parseInt(query.get("limit") ?? "50");
      const matches = db.guests
        .filter((g) => g.eventId === event._id)
        .filter(
          (g) =>
            !response ||
            response === "all" ||
            g.response === (response === "pending" ? null : response),
        )
        .filter(
          (g) =>
            !search ||
            g.name.toLowerCase().includes(search) ||
            g.phone.includes(search),
        )
        .sort(byCreatedDesc);
      return {
        data: {
          success: true,
          data: matches.slice((page - 1) * limit, page * limit),
          activeEvent: event.name,
          pagination: {
            total: matches.length,
            page,
            limit,
            pages: Math.ceil(matches.length / limit),
          },
        },
      };
    },
  ],
  [
    "post",
    /^\/guests$/,
    (_p, body) => {
      const event = activeEvent();
      if (!event)
        throw new HttpError(
          400,
          "No active event found. Set an event to active first.",
        );
      const name = String(body.name ?? "").trim();
      if (name.length < 2)
        throw new HttpError(400, "Name must be at least 2 characters");
      const phone = normalizeIsraeliPhone(String(body.phone ?? ""));
      if (db.guests.some((g) => g.phone === phone && g.eventId === event._id))
        throw new HttpError(
          409,
          "A guest with this phone number already exists for this wedding.",
        );
      const guest: StoredGuest = {
        _id: newId(),
        eventId: event._id,
        name,
        phone,
        token: generateToken(),
        response: null,
        respondedAt: null,
        numberOfGuests: 1,
        foodPreference: null,
        transportNeeded: false,
        specialRequests: "",
        messageSent: false,
        messageChannel: null,
        messageSentAt: null,
        whatsappReplied: false,
        createdAt: now(),
        updatedAt: now(),
      };
      db.guests.push(guest);
      return { status: 201, data: { success: true, data: guest } };
    },
  ],
  [
    "delete",
    /^\/guests\/([^/]+)$/,
    ([id]) => {
      const event = activeEvent();
      const guest = db.guests.find(
        (g) => g._id === id && (!event || g.eventId === event._id),
      );
      if (!guest)
        throw new HttpError(
          404,
          "Guest not found or does not belong to the active event.",
        );
      db.guests = db.guests.filter((g) => g._id !== id);
      db.tables.forEach(
        (t) => (t.seatedGuests = t.seatedGuests.filter((gid) => gid !== id)),
      );
      return { data: { success: true, message: "Guest deleted." } };
    },
  ],
  [
    "post",
    /^\/messages\/send-invitation$/,
    (_p, body) => {
      const event = activeEvent();
      if (!event)
        throw new HttpError(
          400,
          "No active event found. Please set an event to active before sending invitations.",
        );
      const guest = db.guests.find((g) => g._id === body.guestId);
      if (!guest) throw new HttpError(404, "Guest not found.");
      markInvited(guest, event._id);
      return {
        data: {
          success: true,
          message: `WhatsApp invitation auto-generated and sent to ${guest.name}.`,
          data: guest,
        },
      };
    },
  ],

  [
    "get",
    /^\/rsvp\/([^/]+)$/,
    ([token]) => {
      const event = activeEvent();
      if (!event) throw new HttpError(404, "No active event found.");
      const guest = db.guests.find((g) => g.token === token);
      if (!guest)
        throw new HttpError(404, "RSVP link is invalid or has expired.");
      return {
        data: {
          success: true,
          data: {
            name: guest.name,
            response: guest.response,
            respondedAt: guest.respondedAt,
            numberOfGuests: guest.numberOfGuests,
            foodPreference: guest.foodPreference,
            transportNeeded: guest.transportNeeded,
            specialRequests: guest.specialRequests,
            coupleNames:
              event.groomName && event.brideName
                ? `${event.groomName} & ${event.brideName}`
                : event.name,
            weddingDate: event.date,
            startTime: event.startTime,
            venue: event.location,
            isExpired: rsvpClosed(event),
          },
        },
      };
    },
  ],
  [
    "post",
    /^\/rsvp\/([^/]+)$/,
    ([token], body) => {
      if (rsvpClosed(activeEvent()))
        throw new HttpError(
          403,
          "The event is over and RSVP updates are closed.",
        );
      const response = body.response;
      if (response !== "yes" && response !== "no" && response !== "maybe")
        throw new HttpError(400, "Response must be yes, no, or maybe");
      const guest = db.guests.find((g) => g.token === token);
      if (!guest)
        throw new HttpError(404, "RSVP link is invalid or has expired.");
      guest.response = response;
      guest.respondedAt = now();
      if (response === "no") {
        guest.numberOfGuests = 0;
        guest.foodPreference = null;
        guest.transportNeeded = false;
        guest.specialRequests = "";
      } else {
        if (typeof body.numberOfGuests === "number")
          guest.numberOfGuests = body.numberOfGuests;
        if (body.foodPreference !== undefined)
          guest.foodPreference = (body.foodPreference as string | null) || null;
        if (typeof body.transportNeeded === "boolean")
          guest.transportNeeded = body.transportNeeded;
        if (body.specialRequests !== undefined)
          guest.specialRequests = String(body.specialRequests ?? "");
      }
      guest.updatedAt = now();
      return {
        data: {
          success: true,
          message: "RSVP submitted successfully.",
          data: {
            name: guest.name,
            response: guest.response,
            numberOfGuests: guest.numberOfGuests,
          },
        },
      };
    },
  ],

  [
    "get",
    /^\/stats$/,
    () => {
      const count = (r: RSVPResponse) =>
        db.guests.filter((g) => g.response === r).length;
      const total = db.guests.length;
      const [yes, no, maybe] = [count("yes"), count("no"), count("maybe")];
      return {
        data: {
          success: true,
          data: {
            total,
            yes,
            no,
            maybe,
            pending: total - yes - no - maybe,
            messageSent: db.guests.filter((g) => g.messageSent).length,
            responseRate:
              total > 0 ? Math.round(((yes + no + maybe) / total) * 100) : 0,
            totalConfirmedGuests: db.guests
              .filter((g) => g.response === "yes")
              .reduce((sum, g) => sum + g.numberOfGuests, 0),
          },
        },
      };
    },
  ],

  [
    "get",
    /^\/tables$/,
    () => ({
      data: {
        success: true,
        data: [...db.tables]
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
          .map(populateTable),
      },
    }),
  ],
  [
    "post",
    /^\/tables$/,
    (_p, body) => {
      const name = String(body.name ?? "").trim();
      if (!name) throw new HttpError(400, "Table name is required");
      const table: StoredTable = {
        _id: newId(),
        name,
        type: String(body.type ?? "round"),
        capacity: Number(body.capacity ?? 8),
        x: Number(body.x ?? 10),
        y: Number(body.y ?? 10),
        size: Number(body.size ?? 1),
        rotation: Number(body.rotation ?? 0),
        seatedGuests: [],
        createdAt: now(),
        updatedAt: now(),
      };
      db.tables.push(table);
      return {
        status: 201,
        data: { success: true, data: populateTable(table) },
      };
    },
  ],
  [
    "put",
    /^\/tables\/([^/]+)$/,
    ([id], body) => {
      const table = findTable(id);
      Object.assign(table, body, {
        _id: table._id,
        seatedGuests: table.seatedGuests,
        updatedAt: now(),
      });
      return { data: { success: true, data: populateTable(table) } };
    },
  ],
  [
    "delete",
    /^\/tables\/([^/]+)$/,
    ([id]) => {
      findTable(id);
      db.tables = db.tables.filter((t) => t._id !== id);
      return { data: { success: true, message: "Table deleted" } };
    },
  ],
  [
    "post",
    /^\/tables\/([^/]+)\/seat\/([^/]+)$/,
    ([tableId, guestId]) => {
      const table = findTable(tableId);
      if (table.seatedGuests.length >= table.capacity)
        throw new HttpError(400, "Table is at full capacity");
      db.tables.forEach(
        (t) => (t.seatedGuests = t.seatedGuests.filter((g) => g !== guestId)),
      );
      table.seatedGuests.push(guestId);
      return { data: { success: true, data: populateTable(table) } };
    },
  ],
  [
    "delete",
    /^\/tables\/([^/]+)\/seat\/([^/]+)$/,
    ([tableId, guestId]) => {
      const table = findTable(tableId);
      table.seatedGuests = table.seatedGuests.filter((g) => g !== guestId);
      return { data: { success: true, data: populateTable(table) } };
    },
  ],

  [
    "get",
    /^\/settings$/,
    () => ({
      data: { success: true, data: db.settings },
    }),
  ],
  [
    "put",
    /^\/settings\/templates$/,
    (_p, body) => {
      for (const key of Object.keys(db.settings.templates)) {
        if (typeof body[key] === "string")
          db.settings.templates[key] = body[key] as string;
      }
      db.settings.updatedAt = now();
      return { data: { success: true, data: db.settings } };
    },
  ],
  [
    "post",
    /^\/settings\/lock$/,
    (_p, body) => {
      if (typeof body.locked !== "boolean")
        throw new HttpError(400, "`locked` must be a boolean.");
      db.settings.rsvpLocked = body.locked;
      db.settings.lockedAt = body.locked ? now() : null;
      return {
        data: {
          success: true,
          message: body.locked
            ? "RSVP forms are now locked."
            : "RSVP forms are now unlocked.",
          data: {
            rsvpLocked: db.settings.rsvpLocked,
            lockedAt: db.settings.lockedAt,
          },
        },
      };
    },
  ],
  [
    "post",
    /^\/settings\/trigger\/(reminder30|dayof)$/,
    () => ({
      status: 202,
      data: { success: true, message: "Job started." },
    }),
  ],
];

const parseBody = (data: unknown): Body => {
  if (typeof data === "string" && data) return JSON.parse(data) as Body;
  if (data && typeof data === "object") return data as Body;
  return {};
};

export const localAdapter = async (
  config: InternalAxiosRequestConfig,
): Promise<AxiosResponse> => {
  const [path, search = ""] = (config.url ?? "").split("?");
  const query = new URLSearchParams(search);
  for (const [key, value] of Object.entries(config.params ?? {})) {
    if (value !== undefined && value !== null && value !== "")
      query.set(key, String(value));
  }
  const method = (config.method ?? "get").toLowerCase();

  const respond = (status: number, data: unknown): AxiosResponse => ({
    data,
    status,
    statusText: String(status),
    headers: new AxiosHeaders(),
    config,
  });

  try {
    for (const [routeMethod, pattern, handler] of routes) {
      const match = routeMethod === method ? pattern.exec(path) : null;
      if (!match) continue;
      const result = handler(match.slice(1), parseBody(config.data), query);
      if (method !== "get") saveDb();
      return respond(result.status ?? 200, result.data);
    }
    throw new HttpError(404, "Route not found.");
  } catch (err) {
    if (!(err instanceof HttpError)) throw err;
    const response = respond(err.status, {
      success: false,
      message: err.message,
    });
    throw new AxiosError(
      err.message,
      AxiosError.ERR_BAD_REQUEST,
      config,
      null,
      response,
    );
  }
};

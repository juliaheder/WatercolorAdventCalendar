import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { openCountFor, type UnlockMode } from "./dates";

export type DayContent = {
  day: number;
  title: string;
  message: string;
  imagePath: string | null;
  /** Optional second picture. Only set when imagePath is. */
  imagePath2: string | null;
  /** Spotify item as "<type>/<id>", e.g. "track/4uLU6hMCjMI75M1A2tKUQC". */
  spotify: string | null;
};

export type CalendarMeta = {
  title: string;
  subtitle: string;
  /** The receiver's name, shown under the title. */
  recipient: string;
  unlockMode: UnlockMode;
};

export type EditableCalendar = CalendarMeta & { id: string; days: DayContent[] };

export type SharedCalendar = CalendarMeta & {
  id: string;
  /** How many windows (1..openCount) the receiver may open today. */
  openCount: number;
  /** Content of the unlocked windows only. Windows the creator left empty are absent. */
  days: DayContent[];
};

export interface Backend {
  /** "supabase" when connected, "local" for the in-browser demo. */
  kind: "supabase" | "local";
  createCalendar(title: string): Promise<{ id: string; editToken: string }>;
  loadForEdit(id: string, token: string): Promise<EditableCalendar>;
  updateCalendar(id: string, token: string, meta: CalendarMeta): Promise<void>;
  saveDay(id: string, token: string, day: DayContent): Promise<void>;
  uploadImage(id: string, image: Blob): Promise<string>;
  /** Deletes pictures no window uses any more. Best-effort: failures are ignored. */
  deleteUnusedImages(paths: string[]): Promise<void>;
  loadShared(id: string, today: string): Promise<SharedCalendar | null>;
  imageUrl(path: string): string;
}

type DayRow = {
  day: number;
  title: string;
  message: string;
  image_path: string | null;
  image_path_2?: string | null;
  spotify?: string | null;
};
type CalendarRow = {
  id: string;
  title: string;
  subtitle: string;
  recipient?: string;
  unlock_mode: UnlockMode;
  open_count?: number;
  days: DayRow[];
};

const fromRow = (row: DayRow): DayContent => ({
  day: row.day,
  title: row.title,
  message: row.message,
  imagePath: row.image_path,
  imagePath2: row.image_path_2 ?? null,
  spotify: row.spotify ?? null,
});

const BUCKET = "calendar-images";

function friendlyError(error: { message?: string } | null, fallback: string): Error {
  return new Error(error?.message || fallback);
}

function supabaseBackend(client: SupabaseClient): Backend {
  return {
    kind: "supabase",

    async createCalendar(title) {
      const { data, error } = await client.rpc("create_calendar", { p_title: title });
      if (error) throw friendlyError(error, "Could not create the calendar.");
      return { id: data.id, editToken: data.edit_token };
    },

    async loadForEdit(id, token) {
      const { data, error } = await client.rpc("get_calendar_for_edit", {
        p_id: id,
        p_token: token,
      });
      if (error) throw friendlyError(error, "Could not load the calendar.");
      if (!data) throw new Error("This calendar no longer exists.");
      const row = data as CalendarRow;
      return {
        id: row.id,
        title: row.title,
        subtitle: row.subtitle,
        recipient: row.recipient ?? "",
        unlockMode: row.unlock_mode,
        days: row.days.map(fromRow),
      };
    },

    async updateCalendar(id, token, meta) {
      const { error } = await client.rpc("update_calendar", {
        p_id: id,
        p_token: token,
        p_title: meta.title,
        p_subtitle: meta.subtitle,
        p_recipient: meta.recipient,
        p_unlock_mode: meta.unlockMode,
      });
      if (error) throw friendlyError(error, "Could not save the calendar.");
    },

    async saveDay(id, token, day) {
      const { error } = await client.rpc("save_day", {
        p_id: id,
        p_token: token,
        p_day: day.day,
        p_title: day.title,
        p_message: day.message,
        p_image_path: day.imagePath,
        p_spotify: day.spotify,
        p_image_path_2: day.imagePath2,
      });
      if (error) throw friendlyError(error, "Could not save this window.");
    },

    async uploadImage(id, image) {
      const ext = image.type === "image/png" ? "png" : image.type === "image/gif" ? "gif" : "jpg";
      const path = `${id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await client.storage.from(BUCKET).upload(path, image, {
        contentType: image.type,
        // Short cache, so a replaced or removed picture stops being served within an hour.
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw friendlyError(error, "Could not upload the picture.");
      return path;
    },

    async deleteUnusedImages(paths) {
      if (paths.length) await client.storage.from(BUCKET).remove(paths).catch(() => undefined);
    },

    async loadShared(id, today) {
      const { data, error } = await client.rpc("get_shared_calendar", {
        p_id: id,
        p_today: today,
      });
      if (error) throw friendlyError(error, "Could not load the calendar.");
      if (!data) return null;
      const row = data as CalendarRow;
      return {
        id: row.id,
        title: row.title,
        subtitle: row.subtitle,
        recipient: row.recipient ?? "",
        unlockMode: row.unlock_mode,
        openCount: row.open_count ?? 0,
        days: row.days.map(fromRow),
      };
    },

    imageUrl(path) {
      return client.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    },
  };
}

/**
 * Demo backend used when no Supabase project is configured. Everything lives in this
 * browser's localStorage (pictures as data URLs), so links only work on this device.
 */
/** Demo windows saved before second pictures existed have no imagePath2. */
const withSecondPicture = (day: DayContent): DayContent => ({ ...day, imagePath2: day.imagePath2 ?? null });

function localBackend(): Backend {
  type Stored = EditableCalendar & { token: string; images: Record<string, string> };
  const key = (id: string) => `advent-demo:${id}`;
  const read = (id: string): Stored | null => {
    try {
      return JSON.parse(localStorage.getItem(key(id)) || "null");
    } catch {
      return null;
    }
  };
  const write = (cal: Stored) => {
    try {
      localStorage.setItem(key(cal.id), JSON.stringify(cal));
    } catch {
      throw new Error("This browser is out of space for demo pictures. Connect Supabase to store more.");
    }
  };
  const requireEditor = (id: string, token: string) => {
    const cal = read(id);
    if (!cal || cal.token !== token) throw new Error("This edit link is not valid.");
    return cal;
  };
  const toDataUrl = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });

  return {
    kind: "local",

    async createCalendar(title) {
      const id = crypto.randomUUID();
      const token = crypto.randomUUID().replace(/-/g, "");
      write({ id, token, title, subtitle: "", recipient: "", unlockMode: "daily", days: [], images: {} });
      return { id, editToken: token };
    },

    async loadForEdit(id, token) {
      const { token: _t, images: _i, ...cal } = requireEditor(id, token);
      return { ...cal, recipient: cal.recipient ?? "", days: cal.days.map(withSecondPicture) };
    },

    async updateCalendar(id, token, meta) {
      write({ ...requireEditor(id, token), ...meta });
    },

    async saveDay(id, token, day) {
      const cal = requireEditor(id, token);
      const days = cal.days.filter((d) => d.day !== day.day);
      if (day.title.trim() || day.message.trim() || day.imagePath || day.spotify) days.push(day);
      days.sort((a, b) => a.day - b.day);
      write({ ...cal, days });
    },

    async uploadImage(id, image) {
      const cal = read(id);
      if (!cal) throw new Error("This calendar no longer exists.");
      const path = `${id}/${crypto.randomUUID()}`;
      write({ ...cal, images: { ...cal.images, [path]: await toDataUrl(image) } });
      return path;
    },

    async deleteUnusedImages(paths) {
      for (const path of paths) {
        const cal = read(path.split("/")[0]);
        if (!cal || cal.days.some((d) => d.imagePath === path || d.imagePath2 === path)) continue;
        const { [path]: _removed, ...images } = cal.images;
        write({ ...cal, images });
      }
    },

    async loadShared(id, today) {
      const cal = read(id);
      if (!cal) return null;
      const openCount = openCountFor(today, cal.unlockMode);
      return {
        id: cal.id,
        title: cal.title,
        subtitle: cal.subtitle,
        recipient: cal.recipient ?? "",
        unlockMode: cal.unlockMode,
        openCount,
        days: cal.days.filter((d) => d.day <= openCount).map(withSecondPicture),
      };
    },

    imageUrl(path) {
      const id = path.split("/")[0];
      return read(id)?.images[path] ?? "";
    },
  };
}

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const backend: Backend =
  url && anonKey
    ? supabaseBackend(createClient(url, anonKey, { auth: { persistSession: false } }))
    : localBackend();

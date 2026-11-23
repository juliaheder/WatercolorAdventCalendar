import { useEffect, useState } from "react";

/**
 * Hash routes, so the site works on any static host without rewrite rules, and the
 * edit token (after #) is never sent to the server in a request.
 *   #/                      home
 *   #/edit/<id>/<token>     creator's editor
 *   #/c/<id>                receiver's calendar
 */
export type Route =
  | { name: "home" }
  | { name: "edit"; id: string; token: string }
  | { name: "view"; id: string };

export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (parts[0] === "edit" && parts[1] && parts[2]) return { name: "edit", id: parts[1], token: parts[2] };
  if (parts[0] === "c" && parts[1]) return { name: "view", id: parts[1] };
  return { name: "home" };
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseRoute(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

const base = () => `${window.location.origin}${window.location.pathname}`;
export const shareLink = (id: string) => `${base()}#/c/${id}`;
export const editLink = (id: string, token: string) => `${base()}#/edit/${id}/${token}`;

/** Calendars this browser created, so the creator can find their edit links again. */
export type SavedCalendar = { id: string; token: string; title: string };
const SAVED_KEY = "advent-my-calendars";

export function loadSavedCalendars(): SavedCalendar[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
  } catch {
    return [];
  }
}

export function rememberCalendar(cal: SavedCalendar) {
  try {
    const others = loadSavedCalendars().filter((c) => c.id !== cal.id);
    localStorage.setItem(SAVED_KEY, JSON.stringify([cal, ...others]));
  } catch {
    // Private mode or storage blocked: the edit link still works, it just isn't remembered.
  }
}

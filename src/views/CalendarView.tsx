import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { backend, type SharedCalendar } from "../lib/backend";
import { getCountdown, localToday, nextUnlockAt } from "../lib/dates";
import { defaultDays, WinterIllustration } from "../components/winter";
import { Scene } from "../components/Scene";
import { SpotifyPlayer } from "../lib/spotify";
import { Bunny, ChalkDefs, HouseDoor, HouseRoof, Raccoon, SnowyBush } from "../components/House";

/** What the receiver sees: doors that open one by one. Read-only by design. */
export function CalendarView({ id }: { id: string }) {
  const [calendar, setCalendar] = useState<SharedCalendar | null | undefined>(undefined);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  // Where the clicked window was on screen, so the card can zoom out of it.
  const zoomFrom = useRef<DOMRect | null>(null);
  // The same window and page scroll, kept so closing can shrink back into it.
  const openedFrom = useRef<{ rect: DOMRect; scrollY: number } | null>(null);
  const closing = useRef(false);
  const cardRef = useRef<HTMLElement>(null);
  const today = localToday(new Date(now));

  const openedKey = `advent-opened:${id}`;
  const [opened, setOpened] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(openedKey) || "[]");
    } catch {
      return [];
    }
  });

  // Zoom the opened card out of the window that was clicked.
  useLayoutEffect(() => {
    const card = cardRef.current;
    const from = zoomFrom.current;
    zoomFrom.current = null;
    if (!selectedDay || !card || !from) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const to = card.getBoundingClientRect();
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    const scale = Math.max(from.width / to.width, 0.05);
    card.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 0.2 },
        { opacity: 1, offset: 0.35 },
        { transform: "translate(0, 0) scale(1) rotate(-0.2deg)", opacity: 1 },
      ],
      { duration: 650, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
    );
  }, [selectedDay]);

  // Back at the house: return to where the page was scrolled when the window was opened.
  useLayoutEffect(() => {
    if (selectedDay || !openedFrom.current) return;
    window.scrollTo(0, openedFrom.current.scrollY);
    openedFrom.current = null;
  }, [selectedDay]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Load on arrival, and again at midnight so the new window's content arrives.
  useEffect(() => {
    let cancelled = false;
    backend
      .loadShared(id, today)
      .then((cal) => !cancelled && setCalendar(cal))
      .catch((err: Error) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [id, today]);

  useEffect(() => {
    try {
      localStorage.setItem(openedKey, JSON.stringify(opened));
    } catch {
      // Opened-door memory is a nicety; ignore blocked storage.
    }
  }, [openedKey, opened]);

  if (error) {
    return (
      <Scene>
        <section className="home-view">
          <div className="paper-card center">
            <h2>Something went wrong</h2>
            <p>{error}</p>
            <button className="return-button" onClick={() => window.location.reload()}>
              Try again
            </button>
          </div>
        </section>
      </Scene>
    );
  }

  if (calendar === undefined) {
    return (
      <Scene>
        <section className="home-view">
          <p className="hint">Unwrapping your calendar…</p>
        </section>
      </Scene>
    );
  }

  if (calendar === null) {
    return (
      <Scene>
        <section className="home-view">
          <div className="paper-card center">
            <h2>Calendar not found</h2>
            <p>This link doesn't lead to a calendar. Check that you copied the whole link.</p>
          </div>
        </section>
      </Scene>
    );
  }

  const available = calendar.openCount;
  const countdown = getCountdown(nextUnlockAt(new Date(now), calendar.unlockMode), now);

  /** Shrinks the card back into its window, then shows the house again. */
  const closeDay = () => {
    if (closing.current) return;
    const card = cardRef.current;
    const origin = openedFrom.current;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!card || !origin || reduceMotion) {
      setSelectedDay(null);
      return;
    }
    // Where that window will be once the house is back at its old scroll position.
    const target = {
      x: origin.rect.left + origin.rect.width / 2,
      y: origin.rect.top + origin.scrollY - window.scrollY + origin.rect.height / 2,
    };
    const box = card.getBoundingClientRect();
    const dx = target.x - (box.left + box.width / 2);
    const dy = target.y - (box.top + box.height / 2);
    const scale = Math.max(origin.rect.width / box.width, 0.05);
    closing.current = true;
    const animation = card.animate(
      [
        { transform: "translate(0, 0) scale(1) rotate(-0.2deg)", opacity: 1 },
        { opacity: 1, offset: 0.65 },
        { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 0 },
      ],
      { duration: 480, easing: "cubic-bezier(0.5, 0, 0.75, 0)", fill: "forwards" },
    );
    animation.onfinish = () => {
      closing.current = false;
      setSelectedDay(null);
    };
  };

  const openDay = (day: number, from?: HTMLElement) => {
    if (day > available) return;
    zoomFrom.current = from?.getBoundingClientRect() ?? null;
    openedFrom.current = zoomFrom.current
      ? { rect: zoomFrom.current, scrollY: window.scrollY }
      : null;
    setSelectedDay(day);
    setOpened((current) => (current.includes(day) ? current : [...current, day]));
  };

  if (selectedDay) {
    const custom = calendar.days.find((d) => d.day === selectedDay);
    const fallback = defaultDays[selectedDay - 1];
    const imageUrl = custom?.imagePath ? backend.imageUrl(custom.imagePath) : "";
    const title = custom ? custom.title : fallback.title;
    const message = custom ? custom.message : fallback.message;

    return (
      <Scene>
        <section className={`day-view palette-${fallback.palette}`}>
          <button className="back-button" onClick={closeDay}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to the house
          </button>
          <article className="day-card" ref={cardRef}>
            <div className={`day-illustration ${imageUrl ? "has-photo" : ""}`}>
              <span className="detail-number">{selectedDay}</span>
              {imageUrl ? (
                <>
                  <img className="day-photo" src={imageUrl} alt={title || `December ${selectedDay}`} />
                </>
              ) : (
                <WinterIllustration type={fallback.illustration} />
              )}
            </div>
            <div className="day-copy">
              <p className="eyebrow">December {selectedDay}</p>
              {message && <p className="message">{message}</p>}
              {custom?.spotify && (
                <div className="day-song">
                  <SpotifyPlayer item={custom.spotify} />
                </div>
              )}
              {!custom && <p className="daily-note">{fallback.note}</p>}
              <button className="return-button" onClick={closeDay}>
                Return to the house
              </button>
            </div>
          </article>
        </section>
      </Scene>
    );
  }

  return (
    <Scene>
      <section className="home-view">
        <header className="scene-header">
          <h1>{calendar.title}</h1>
          {calendar.subtitle && <p className="subtitle">{calendar.subtitle}</p>}
        </header>

        <div className="house-wrap">
          <ChalkDefs />
          <HouseRoof />
          <div className="house">
            <div className="countdown-card" aria-live="polite">
              {countdown ? (
                <>
                  <span>{available === 0 ? "First window opens in" : "Next window opens in"}</span>
                  <strong>
                    {countdown.days > 0 && `${countdown.days}d `}
                    {String(countdown.hours).padStart(2, "0")}:
                    {String(countdown.minutes).padStart(2, "0")}:
                    {String(countdown.seconds).padStart(2, "0")}
                  </strong>
                  <small>(midnight, your time)</small>
                </>
              ) : (
                <>
                  <strong>All 25 are open</strong>
                  <small>Merry Christmas</small>
                </>
              )}
            </div>

            <div className="windows">
              {Array.from({ length: 25 }, (_, index) => {
                const number = index + 1;
                const isAvailable = number <= available;
                const isOpened = opened.includes(number);
                return (
                  <button
                    key={number}
                    className={`window ${isOpened ? "is-opened" : ""} ${!isAvailable ? "is-locked" : ""}`}
                    disabled={!isAvailable}
                    onClick={(e) => openDay(number, e.currentTarget)}
                    aria-label={
                      isAvailable
                        ? `Open December ${number}${isOpened ? " again" : ""}`
                        : `December ${number}, locked`
                    }
                    title={!isAvailable ? `Opens at midnight on ${number} December` : undefined}
                  >
                    <span className="window-frame">
                      <span className="window-glow" />
                      <span className="window-cross" />
                      <strong>{number}</strong>
                    </span>
                    <span className="window-sill" />
                  </button>
                );
              })}
            </div>
            <div className="house-foundation" />
            <HouseDoor />
          </div>
          <SnowyBush spot="back-left" />
          <SnowyBush spot="back-right" />
          <SnowyBush spot="left" />
          <SnowyBush spot="right" />
          <Bunny />
          <Raccoon />
          <div className="house-snow" />
        </div>

        <p className="hint">
          <span className="hint-star">✦</span>
          {available === 0
            ? "The first window opens on 1 December"
            : `${opened.filter((d) => d <= available).length} of ${available} available ${available === 1 ? "window" : "windows"} opened`}
        </p>
      </section>
    </Scene>
  );
}

import type { ReactNode } from "react";

const snowflakes = Array.from({ length: 34 }, (_, index) => ({
  id: index,
  left: (index * 37 + 7) % 100,
  delay: -((index * 1.7) % 14),
  duration: 10 + (index % 8),
  size: 3 + (index % 5),
}));

/** The watercolor sky and falling snow behind every page. */
export function Scene({ children, snow = true }: { children: ReactNode; snow?: boolean }) {
  return (
    <main className="winter-scene">
      <div className="watercolor wash-one" />
      <div className="watercolor wash-two" />
      {snow && (
        <div className="snow" aria-hidden="true">
          {snowflakes.map((flake) => (
            <i
              key={flake.id}
              style={{
                left: `${flake.left}%`,
                animationDelay: `${flake.delay}s`,
                animationDuration: `${flake.duration}s`,
                width: flake.size,
                height: flake.size,
              }}
            />
          ))}
        </div>
      )}
      {children}
    </main>
  );
}

export function DemoBanner() {
  return (
    <p className="demo-banner">
      <strong>Demo mode.</strong> Not connected to Supabase yet, so calendars are saved in this browser
      only and links won't work on other devices.
    </p>
  );
}

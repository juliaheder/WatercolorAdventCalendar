import { useEffect, useMemo, useState } from "react";

type AdventDay = {
  title: string;
  message: string;
  note: string;
  palette: string;
  illustration: "mittens" | "cocoa" | "tree" | "skates" | "gift";
};

const dayDetails: AdventDay[] = [
  [
    "A little beginning",
    "December has arrived. Take a quiet moment, make something warm, and let the season begin.",
    "Today’s tiny joy: light your favourite candle.",
    "rose",
    "mittens",
  ],
  [
    "Warm hands, warm heart",
    "Pull on your cosiest layers and take the long way home. Notice how the winter light changes everything.",
    "Today’s tiny joy: send a kind message.",
    "amber",
    "cocoa",
  ],
  [
    "Bring the outside in",
    "A sprig of evergreen, a fallen pinecone, a little branch—winter makes the loveliest decorations.",
    "Today’s tiny joy: gather something beautiful.",
    "pine",
    "tree",
  ],
  [
    "Glide into the season",
    "Put on a song that makes the kitchen feel like a dance floor. No special occasion needed.",
    "Today’s tiny joy: dance for one whole song.",
    "blue",
    "skates",
  ],
  [
    "A parcel of kindness",
    "The best gifts are often small: a shared biscuit, a handwritten note, or giving someone your full attention.",
    "Today’s tiny joy: wrap up a small surprise.",
    "cranberry",
    "gift",
  ],
  [
    "Mittens at the ready",
    "Step outside and feel the bright, cold air. Even ten minutes can make the return home feel extra cosy.",
    "Today’s tiny joy: take a winter walk.",
    "rose",
    "mittens",
  ],
  [
    "Something sweet",
    "Stir a little cinnamon into your drink and sit down while it is still hot. This moment is yours.",
    "Today’s tiny joy: savour a warm cup.",
    "amber",
    "cocoa",
  ],
  [
    "Evergreen wishes",
    "Write down one hope for the year ahead. Fold it small and tuck it somewhere safe.",
    "Today’s tiny joy: make one gentle wish.",
    "pine",
    "tree",
  ],
  [
    "Winter wonder",
    "Look for sparkle today: frost on a railing, lights in a window, or stars in a clear evening sky.",
    "Today’s tiny joy: find something that glimmers.",
    "blue",
    "skates",
  ],
  [
    "Made with care",
    "Make a gift of your time. Help with a task, listen without rushing, or share something you know.",
    "Today’s tiny joy: give thirty thoughtful minutes.",
    "cranberry",
    "gift",
  ],
  [
    "A cosy pause",
    "The season can be busy. Stop, breathe slowly, and remember that rest belongs on the list too.",
    "Today’s tiny joy: do absolutely nothing for five minutes.",
    "rose",
    "mittens",
  ],
  [
    "Marshmallow weather",
    "Invite someone to share a drink and a story. Ask them about a favourite winter memory.",
    "Today’s tiny joy: share a mug and a memory.",
    "amber",
    "cocoa",
  ],
  [
    "Trim the tree",
    "Add one handmade thing to your decorations. Paper chains and wonky stars are especially welcome.",
    "Today’s tiny joy: make a paper ornament.",
    "pine",
    "tree",
  ],
  [
    "A little adventure",
    "Go somewhere familiar and pretend you are seeing it for the first time. Wonder is good practice.",
    "Today’s tiny joy: take a different path.",
    "blue",
    "skates",
  ],
  [
    "Pass it on",
    "Choose something lovely you no longer need and find it a new home where it will be treasured.",
    "Today’s tiny joy: give something away.",
    "cranberry",
    "gift",
  ],
  [
    "Soft and slow",
    "Turn down the lights this evening. Read a few pages, play a record, and let the day end gently.",
    "Today’s tiny joy: have a screen-free hour.",
    "rose",
    "mittens",
  ],
  [
    "A kitchen full of cheer",
    "Bake, toast, stir, or simply arrange something delicious on a plate. It all counts as festive.",
    "Today’s tiny joy: make the room smell wonderful.",
    "amber",
    "cocoa",
  ],
  [
    "Under the branches",
    "Take a moment to appreciate all the growing and changing you have done this year.",
    "Today’s tiny joy: celebrate one thing you learned.",
    "pine",
    "tree",
  ],
  [
    "Cold nose, happy heart",
    "Bundle up and look at the moon. It is shining over everyone you love, wherever they may be.",
    "Today’s tiny joy: share the moon with someone.",
    "blue",
    "skates",
  ],
  [
    "Tied with a bow",
    "Write a note to your future self. Include one thing you hope you never forget about right now.",
    "Today’s tiny joy: leave yourself a kind letter.",
    "cranberry",
    "gift",
  ],
  [
    "The longest night",
    "Welcome the solstice with a pool of warm light and gratitude for brighter days returning.",
    "Today’s tiny joy: watch the sunset.",
    "rose",
    "mittens",
  ],
  [
    "Cup of comfort",
    "Make time for an old favourite today—a film, a recipe, a song, or a story you know by heart.",
    "Today’s tiny joy: revisit something beloved.",
    "amber",
    "cocoa",
  ],
  [
    "Nearly there",
    "There is magic in anticipation. Let today be imperfect, unhurried, and full of small delights.",
    "Today’s tiny joy: notice the excitement.",
    "pine",
    "tree",
  ],
  [
    "Christmas Eve",
    "Put everything down for a moment. Look around at the life happening between the plans.",
    "Today’s tiny joy: be fully present.",
    "blue",
    "skates",
  ],
  [
    "Merry Christmas",
    "The final window is open. May your day hold warmth, good company, and the kind of joy that lingers.",
    "Today’s tiny joy: keep a little magic for tomorrow.",
    "cranberry",
    "gift",
  ],
].map(([title, message, note, palette, illustration]) => ({
  title,
  message,
  note,
  palette,
  illustration,
})) as AdventDay[];

const snowflakes = Array.from({ length: 34 }, (_, index) => ({
  id: index,
  left: (index * 37 + 7) % 100,
  delay: -((index * 1.7) % 14),
  duration: 10 + (index % 8),
  size: 3 + (index % 5),
}));

function getLondonDate() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).formatToParts(new Date());

  return Object.fromEntries(parts.map((part) => [part.type, Number(part.value)])) as Record<
    string,
    number
  >;
}

function getCalendarState() {
  const london = getLondonDate();
  const month = london.month;
  const day = london.day;

  if (month < 12) return { available: 0, next: Date.UTC(london.year, 11, 1) };
  if (month === 12 && day <= 25) {
    return {
      available: day,
      next: day < 25 ? Date.UTC(london.year, 11, day + 1) : null,
    };
  }
  return { available: 25, next: null };
}

function getCountdown(target: number | null, now: number) {
  if (!target) return null;
  const remaining = Math.max(0, target - now);
  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining / 3_600_000) % 24);
  const minutes = Math.floor((remaining / 60_000) % 60);
  const seconds = Math.floor((remaining / 1_000) % 60);
  return { days, hours, minutes, seconds };
}

function WinterIllustration({ type }: { type: AdventDay["illustration"] }) {
  if (type === "cocoa") {
    return (
      <svg viewBox="0 0 240 190" role="img" aria-label="A warm cup of cocoa">
        <path
          d="M55 78c0 73 23 83 64 83s64-10 64-83H55Z"
          fill="#f8efe1"
          stroke="#4b5961"
          strokeWidth="3"
        />
        <path d="M183 91c35-3 34 49 1 48" fill="none" stroke="#4b5961" strokeWidth="7" />
        <ellipse cx="119" cy="78" rx="64" ry="18" fill="#7d4b37" stroke="#4b5961" strokeWidth="3" />
        <circle cx="97" cy="72" r="13" fill="#fff9ed" />
        <circle cx="123" cy="77" r="12" fill="#fff9ed" />
        <circle cx="143" cy="70" r="11" fill="#fff9ed" />
        <path
          d="M90 42c-12-13 10-19-2-32M122 43c-12-13 10-19-2-32M153 45c-12-13 10-19-2-32"
          fill="none"
          stroke="#fff"
          strokeWidth="5"
          strokeLinecap="round"
          opacity=".8"
        />
      </svg>
    );
  }
  if (type === "tree") {
    return (
      <svg viewBox="0 0 240 190" role="img" aria-label="A decorated evergreen tree">
        <path
          d="m120 16-16 36h10L83 94h18l-38 58h114l-38-58h18l-31-42h10l-16-36Z"
          fill="#315e50"
          stroke="#354f50"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M110 151h20v25h-20z" fill="#8f5c43" />
        <g fill="#f4c66b">
          <circle cx="101" cy="79" r="5" />
          <circle cx="139" cy="101" r="5" />
          <circle cx="93" cy="130" r="5" />
        </g>
        <g fill="#c96762">
          <circle cx="125" cy="58" r="5" />
          <circle cx="116" cy="116" r="5" />
          <circle cx="151" cy="136" r="5" />
        </g>
        <path
          d="m120 8 4 9 10 1-8 7 3 10-9-6-9 6 3-10-8-7 10-1 4-9Z"
          fill="#f4c66b"
          stroke="#5f604e"
          strokeWidth="2"
        />
      </svg>
    );
  }
  if (type === "skates") {
    return (
      <svg viewBox="0 0 240 190" role="img" aria-label="A pair of ice skates">
        <path
          d="M48 42c30 4 48 17 53 45l6 35-70 7c-14-15-4-32 14-37l-3-50Z"
          fill="#f8f0e4"
          stroke="#4d5a63"
          strokeWidth="3"
        />
        <path
          d="M45 131c17 19 66 7 73-2-5 28-71 37-86 15M137 51c28 5 44 19 47 46l3 35-70 2c-12-16-1-32 17-35l3-48Z"
          fill="#dceaf0"
          stroke="#4d5a63"
          strokeWidth="3"
        />
        <path
          d="M124 138c15 20 66 12 74 4-7 28-74 31-88 8"
          fill="none"
          stroke="#4d5a63"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="m56 61 35 32M51 76l44 30M145 70l35 27M139 84l43 27"
          stroke="#c26b68"
          strokeWidth="4"
        />
      </svg>
    );
  }
  if (type === "gift") {
    return (
      <svg viewBox="0 0 240 190" role="img" aria-label="A wrapped present">
        <path d="M51 72h138v99H51z" fill="#c86661" stroke="#4f5b5e" strokeWidth="3" />
        <path d="M42 58h156v32H42z" fill="#e37b70" stroke="#4f5b5e" strokeWidth="3" />
        <path d="M108 58h24v113h-24z" fill="#f2c66f" />
        <path
          d="M120 57C89 22 69 38 78 51c7 10 26 7 42 6Zm0 0c31-35 51-19 42-6-7 10-26 7-42 6Z"
          fill="#f2c66f"
          stroke="#4f5b5e"
          strokeWidth="3"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 240 190" role="img" aria-label="A pair of cosy mittens">
      <path
        d="M67 57c-2-22 25-25 30-5l7 29c5-14 22-7 18 7l-11 40c-6 23-46 26-54 3L40 82c-5-17 18-24 25-8l7 17-5-34Z"
        fill="#c96f6b"
        stroke="#4e5c61"
        strokeWidth="3"
      />
      <path
        d="M146 57c2-22 29-17 28 4l-2 34 9-16c9-15 30-5 22 11l-25 45c-12 21-51 12-53-12l-3-42c-1-15 17-18 20-4l4-20Z"
        fill="#e08a79"
        stroke="#4e5c61"
        strokeWidth="3"
      />
      <path
        d="M55 119c15 10 38 4 54-6M126 112c15 13 39 16 57 6"
        fill="none"
        stroke="#f7dfc6"
        strokeWidth="9"
      />
      <path
        d="M83 59c22-32 51-36 75-10"
        fill="none"
        stroke="#e9c2a8"
        strokeWidth="3"
        strokeDasharray="5 7"
      />
    </svg>
  );
}

function App() {
  const [now, setNow] = useState(Date.now());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [opened, setOpened] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("winter-house-opened") || "[]");
    } catch {
      return [];
    }
  });

  const calendar = useMemo(() => getCalendarState(), [now]);
  const countdown = getCountdown(calendar.next, now);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem("winter-house-opened", JSON.stringify(opened));
  }, [opened]);

  const openDay = (day: number) => {
    if (day > calendar.available) return;
    setSelectedDay(day);
    setOpened((current) => (current.includes(day) ? current : [...current, day]));
  };

  const selected = selectedDay ? dayDetails[selectedDay - 1] : null;

  return (
    <main className="winter-scene">
      <div className="watercolor wash-one" />
      <div className="watercolor wash-two" />
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

      {selectedDay && selected ? (
        <section className={`day-view palette-${selected.palette}`}>
          <button className="back-button" onClick={() => setSelectedDay(null)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to the house
          </button>
          <article className="day-card">
            <div className="day-illustration">
              <span className="detail-number">{selectedDay}</span>
              <WinterIllustration type={selected.illustration} />
            </div>
            <div className="day-copy">
              <p className="eyebrow">December {selectedDay}</p>
              <h1>{selected.title}</h1>
              <span className="pencil-rule" />
              <p className="message">{selected.message}</p>
              <p className="daily-note">{selected.note}</p>
              <button className="return-button" onClick={() => setSelectedDay(null)}>
                Return to Winter House
              </button>
            </div>
          </article>
        </section>
      ) : (
        <section className="home-view">
          <header className="scene-header">
            <p className="kicker">A little December tradition</p>
            <h1>Merry Christmas</h1>
            <p className="subtitle" />
          </header>

          <div className="house-wrap">
            <div className="chimney" />
            <div className="roof">
              <span className="roof-snow" />
            </div>
            <div className="house">
              <div className="countdown-card" aria-live="polite">
                {countdown ? (
                  <>
                    <span>Next window opens in</span>
                    <strong>
                      {countdown.days > 0 && `${countdown.days}d `}
                      {String(countdown.hours).padStart(2, "0")}:
                      {String(countdown.minutes).padStart(2, "0")}:
                      {String(countdown.seconds).padStart(2, "0")}
                    </strong>
                    <small>(midnight, UK time)</small>
                  </>
                ) : (
                  <>
                    <span>The whole house is glowing</span>
                    <strong>All 25 are open</strong>
                    <small>Merry Christmas</small>
                  </>
                )}
              </div>

              <div className="windows">
                {dayDetails.map((day, index) => {
                  const number = index + 1;
                  const isAvailable = number <= calendar.available;
                  const isOpened = opened.includes(number);
                  return (
                    <button
                      key={number}
                      className={`window ${isOpened ? "is-opened" : ""} ${!isAvailable ? "is-locked" : ""}`}
                      disabled={!isAvailable}
                      onClick={() => openDay(number)}
                      aria-label={
                        isAvailable
                          ? `Open December ${number}${isOpened ? " again" : ""}`
                          : `December ${number}, locked`
                      }
                      title={
                        !isAvailable ? `Opens 00:00 UK time on  ${number} December` : day.title
                      }
                    >
                      <span className="window-frame">
                        <span className="window-glow" />
                        <span className="window-cross" />
                        <strong>{number}</strong>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="front-door" aria-hidden="true">
                <span />
              </div>
              <div className="house-snow" />
            </div>
          </div>

          <p className="hint">
            <span className="hint-star">✦</span>
            {calendar.available === 0
              ? "The first window opens on 1 December"
              : `${opened.length} of ${calendar.available} available ${calendar.available === 1 ? "window" : "windows"} opened`}
          </p>
        </section>
      )}
    </main>
  );
}

export default App;

/**
 * Hand-drawn pieces of the advent house. They're SVG so they stay crisp at any size,
 * with a "chalk" filter that roughens outlines and gives white details a dusty grain.
 */

const BULB_COLORS = ["#e2574c", "#f4c66b", "#5fa37a", "#6fb3d9"];

// Bulbs hang in four sagging loops along the eave: [x, y] in roof coordinates.
const BULBS: [number, number][] = [
  [38, 167], [64, 172], [92, 167],
  [146, 167], [173, 172], [201, 167],
  [256, 167], [283, 172], [311, 167],
  [366, 167], [393, 172], [421, 167],
];

/** Filters shared by every chalky piece. Rendered once, invisible. */
export function ChalkDefs() {
  return (
    <svg className="chalk-defs" aria-hidden="true" focusable="false">
      <defs>
        {/* Wobbles edges slightly, like lines drawn by hand. */}
        <filter id="hand-drawn" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" result="wobble" />
          <feDisplacementMap in="SourceGraphic" in2="wobble" scale="3" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* Breaks strokes up into grainy chalk dust. */}
        <filter id="chalk" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="8" result="grain" />
          <feColorMatrix
            in="grain"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.55"
            result="holes"
          />
          <feComposite in="SourceGraphic" in2="holes" operator="in" result="dusty" />
          <feDisplacementMap in="dusty" in2="grain" scale="1.6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <pattern id="shingles" width="26" height="36" patternUnits="userSpaceOnUse">
          <rect width="26" height="36" fill="#405c60" />
          <path
            d="M0 18a13 13 0 0 0 26 0M-13 36a13 13 0 0 0 26 0M13 36a13 13 0 0 0 26 0"
            fill="none"
            stroke="#2d4447"
            strokeWidth="2.2"
          />
          <path d="M5 23q8 5 16 0M-8 41q8 5 16 0M18 41q8 5 16 0" fill="none" stroke="#6e8d90" strokeWidth="1.2" opacity=".55" />
        </pattern>
      </defs>
    </svg>
  );
}

export function HouseRoof() {
  return (
    <svg className="house-roof" viewBox="0 -44 460 226" aria-hidden="true" focusable="false">
      {/* Chimney sits behind the roof. */}
      <g filter="url(#hand-drawn)">
        <rect x="320" y="-28" width="44" height="120" fill="#a8483f" stroke="#2c3a3c" strokeWidth="4" />
        <path d="M320-12h44M320 4h44M320 20h44M342-28v16M331-12v16M353-12v16M342 4v16" stroke="#7f3029" strokeWidth="2" />
        <rect x="313" y="-36" width="58" height="14" rx="4" fill="#e9dcc3" stroke="#2c3a3c" strokeWidth="4" />
        <path d="M314-35q6-9 16-4 8-6 16 0 9-6 16 0 8-3 8 4" fill="#f8fbf8" stroke="#2c3a3c" strokeWidth="2.5" strokeLinejoin="round" />

        {/* Roof with scalloped shingles. */}
        <path d="M62 40H398L452 150H8Z" fill="url(#shingles)" stroke="#263437" strokeWidth="5" strokeLinejoin="round" />

        {/* Snow cap with drips. */}
        <path
          d="M52 46c-2-14 20-20 42-18h270c26-2 46 4 42 18c-3.6 11-14.4 11-18 0c-4.2 8-16.8 8-21 0c-3.8 13-15.2 13-19 0c-4.4 9-17.6 9-22 0c-4 12-16 12-20 0c-3.6 7-14.4 7-18 0c-4.6 11-18.4 11-23 0c-3.8 10-15.2 10-19 0c-4.2 13-16.8 13-21 0c-4 8-16 8-20 0c-3.6 12-14.4 12-18 0c-4.4 9-17.6 9-22 0c-3.8 11-15.2 11-19 0c-4.2 7-16.8 7-21 0c-4 12-16 12-20 0c-3.6 10-14.4 10-18 0c-4.2 9-16.8 9-21 0c-2.8 8-11.2 8-14 0z"
          fill="#f8fbf8"
          stroke="#263437"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Eave board. */}
        <rect x="2" y="142" width="456" height="16" rx="6" fill="#e9dcc3" stroke="#263437" strokeWidth="4" />
        <path d="M4 144q40-7 80-1t80 0 80-1 80 1 80-1 70 1" fill="none" stroke="#f8fbf8" strokeWidth="5" strokeLinecap="round" />


        {/* String of lights. */}
        <path
          d="M12 158q52 26 106 2 54 24 108 0 54 24 108 0 54 24 114-2"
          fill="none"
          stroke="#263437"
          strokeWidth="2.2"
        />
      </g>
      <g className="roof-lights">
        {BULBS.map(([x, y], i) => (
          <g key={i} style={{ animationDelay: `${(i % 4) * 0.45 + Math.floor(i / 4) * 0.2}s` }}>
            <rect x={x - 2.5} y={y - 9} width="5" height="4" rx="1" fill="#263437" />
            <ellipse cx={x} cy={y} rx="4.5" ry="6.5" fill={BULB_COLORS[i % 4]} stroke="#263437" strokeWidth="1.6" />
            <ellipse cx={x - 1.4} cy={y - 1.8} rx="1.2" ry="2" fill="#fff" opacity=".7" />
          </g>
        ))}
      </g>

      {/* Chalk highlights. */}
      <g filter="url(#chalk)" stroke="#fdfaf0" strokeWidth="3" strokeLinecap="round" fill="none" opacity=".85">
        <path d="M80 70l-12 30M72 108l-6 16" />
        <path d="M386 66l10 22M402 100l7 16" />
        <path d="M326-16v12M326 6v8" strokeWidth="2.4" />
        <path d="M150 64q6-4 12 0M260 92q6-4 12 0M110 118q6-4 12 0M318 124q6-4 12 0" strokeWidth="2.2" />
      </g>
    </svg>
  );
}

export function HouseDoor() {
  return (
    <svg className="house-door" viewBox="0 0 120 112" aria-hidden="true" focusable="false">
      <g className="lantern-glow">
        <circle cx="13" cy="44" r="13" />
        <circle cx="107" cy="44" r="13" />
      </g>
      <g filter="url(#hand-drawn)" stroke="#263437" strokeLinejoin="round">
        {/* Lanterns. */}
        {[13, 107].map((x) => (
          <g key={x}>
            <path d={`M${x - 6} 36h12l-2 16h-8z`} fill="#f6d78a" strokeWidth="2.5" />
            <path d={`M${x - 8} 36h16l-8-7z`} fill="#3b4a4c" strokeWidth="2.5" />
            <path d={`M${x - 5} 52h10`} strokeWidth="3" />
          </g>
        ))}
        {/* Steps. */}
        <rect x="16" y="98" width="88" height="13" rx="5" fill="#cfd3cb" strokeWidth="3" />
        <rect x="24" y="89" width="72" height="11" rx="4" fill="#e1e4dc" strokeWidth="3" />
        {/* Frame and door. */}
        <path d="M28 90V40a32 32 0 0 1 64 0v50z" fill="#e9dcc3" strokeWidth="3.5" />
        <path d="M35 90V42a25 25 0 0 1 50 0v48z" fill="#7d3a32" strokeWidth="3" />
        <path d="M48 20v70M60 17v73M72 20v70" stroke="#5e2a24" strokeWidth="2" />
        <circle cx="76" cy="66" r="3" fill="#f4c66b" strokeWidth="1.6" />
        {/* Wreath. */}
        <circle cx="60" cy="46" r="11" fill="none" stroke="#2f6b4c" strokeWidth="7" />
        <circle cx="60" cy="46" r="11" fill="none" stroke="#4f9168" strokeWidth="3" strokeDasharray="3 4" />
        <path d="M60 56l-7 6 2-9zM60 56l7 6-2-9z" fill="#d9534a" strokeWidth="1.6" />
        <circle cx="60" cy="56" r="2.6" fill="#d9534a" strokeWidth="1.4" />
      </g>
      <g fill="#d9534a">
        <circle cx="52" cy="40" r="1.6" />
        <circle cx="68" cy="43" r="1.6" />
        <circle cx="56" cy="51" r="1.6" />
      </g>
      {/* Snow on the steps. */}
      <path d="M20 99q10-6 20-1 12-5 22 0 12-5 22 0 10-4 16 1" fill="none" stroke="#fdfaf0" strokeWidth="3.5" strokeLinecap="round" filter="url(#chalk)" />
    </svg>
  );
}

export function SnowyBush({ spot }: { spot: "left" | "right" | "back-left" | "back-right" }) {
  return (
    <svg className={`house-bush is-${spot}`} viewBox="0 0 130 74" aria-hidden="true" focusable="false">
      <g filter="url(#hand-drawn)" stroke="#263437" strokeWidth="3.5" strokeLinejoin="round">
        <path d="M8 70c-8-18 6-32 22-28 2-18 26-24 36-10 10-14 34-10 36 8 18-2 28 16 20 30z" fill="#3f7a5a" />
        <path d="M14 46c4-8 14-9 18-4 4-12 20-15 30-6 8-10 26-8 32 2 10-3 20 3 20 10-6-5-14-2-16 2-6-6-16-6-22 0-6-7-20-7-26 0-6-6-16-5-20 1-6-5-12-5-16-5z" fill="#f8fbf8" strokeWidth="2.5" />
      </g>
      <g fill="#d9534a" stroke="#263437" strokeWidth="1.2">
        <circle cx="34" cy="60" r="3" />
        <circle cx="40" cy="56" r="3" />
        <circle cx="86" cy="62" r="3" />
        <circle cx="92" cy="58" r="3" />
      </g>
      <path d="M30 66q6 2 10-2M78 54q6 3 12-1" stroke="#cfe6d5" strokeWidth="2.4" fill="none" strokeLinecap="round" filter="url(#chalk)" />
    </svg>
  );
}

/** A little white bunny sitting in the snow, facing left. */
export function Bunny() {
  return (
    <svg className="house-bunny" viewBox="0 0 66 74" aria-hidden="true" focusable="false">
      <g filter="url(#hand-drawn)" stroke="#263437" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        {/* Ears */}
        <path d="M22 30C15 12 17 1 24 2c7 1 9 14 7 28z" fill="#f6f3ec" />
        <path d="M33 31c0-15 5-28 12-26 6 2 2 15-6 27z" fill="#f6f3ec" />
        <path d="M23 25c-3-10-2-17 1-18 3 1 4 9 3 18" fill="#e9cfc3" stroke="none" />
        <path d="M37 27c1-9 4-17 7-17 2 1-1 9-5 17" fill="#e9cfc3" stroke="none" />
        {/* Body, tail and head */}
        <ellipse cx="38" cy="56" rx="20" ry="15" fill="#f6f3ec" />
        <circle cx="57" cy="56" r="6" fill="#ffffff" />
        <circle cx="26" cy="40" r="13" fill="#f6f3ec" />
        <ellipse cx="22" cy="69" rx="8" ry="3.5" fill="#f6f3ec" />
        <ellipse cx="40" cy="70" rx="9" ry="3.5" fill="#f6f3ec" />
      </g>
      <circle cx="21" cy="38" r="2.4" fill="#263437" />
      <circle cx="20.2" cy="37.2" r="0.8" fill="#fff" />
      <path d="M13.5 42.5l3 0-1.5 2z" fill="#a7675c" stroke="#263437" strokeWidth="1" strokeLinejoin="round" />
      <path d="M15 45q1.5 2 3 0" fill="none" stroke="#263437" strokeWidth="1.2" strokeLinecap="round" />
      <ellipse cx="25" cy="45" rx="3" ry="1.8" fill="#e9b7a8" opacity=".55" />
    </svg>
  );
}

/** A raccoon sitting up, with its striped tail curled to the side. */
export function Raccoon() {
  return (
    <svg className="house-raccoon" viewBox="0 0 86 78" aria-hidden="true" focusable="false">
      <g filter="url(#hand-drawn)" stroke="#263437" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        {/* Tail */}
        <path d="M50 66c20 2 32-10 30-24-2-9-11-10-12-3 4 8-4 16-18 16z" fill="#8f938f" />
        <path d="M70 40l6-3M73 49l7 0M66 58l6 4" stroke="#3b4142" strokeWidth="4.5" />
        {/* Body */}
        <ellipse cx="38" cy="58" rx="19" ry="17" fill="#9da19c" />
        <ellipse cx="38" cy="62" rx="10" ry="11" fill="#d9d7cf" strokeWidth="2" />
        {/* Ears */}
        <path d="M20 24l3-14 12 8z" fill="#9da19c" />
        <path d="M56 24l-3-14-12 8z" fill="#9da19c" />
        {/* Head */}
        <ellipse cx="38" cy="32" rx="20" ry="16" fill="#a8aca7" />
        <ellipse cx="38" cy="39" rx="9" ry="7" fill="#f3f1ea" strokeWidth="2" />
        {/* Paws */}
        <ellipse cx="30" cy="74" rx="6" ry="3.2" fill="#3b4142" />
        <ellipse cx="46" cy="74" rx="6" ry="3.2" fill="#3b4142" />
      </g>
      {/* Mask, eyes, nose */}
      <path d="M21 31q8-8 17-1 9-7 17 1-2 6-10 5-7-3-14 0-8 1-10-5z" fill="#2f3536" />
      <path d="M24 24q6-4 11 1M41 25q5-5 11-1" fill="none" stroke="#f3f1ea" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="30.5" cy="31" r="2.6" fill="#f3f1ea" />
      <circle cx="45.5" cy="31" r="2.6" fill="#f3f1ea" />
      <circle cx="30.8" cy="31.3" r="1.4" fill="#263437" />
      <circle cx="45.2" cy="31.3" r="1.4" fill="#263437" />
      <ellipse cx="38" cy="37" rx="3" ry="2.2" fill="#263437" />
      <path d="M35 41q3 2.5 6 0" fill="none" stroke="#263437" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M23 16l3-3M53 16l-3-3" stroke="#3b4142" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

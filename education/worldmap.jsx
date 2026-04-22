// worldmap.jsx — reusable SVG world map.
// Exposed as window.WorldMap.
// Hand-built low-poly equirectangular projection (1000 x 500 viewBox).

const T = window.EduTokens;

function project(lat, lng) {
  const x = ((lng + 180) / 360) * 1000;
  const y = ((90 - lat) / 180) * 500;
  return { x, y };
}

const CONTINENTS = [
  // North America
  "M 70 80 L 110 60 L 170 50 L 240 50 L 310 55 L 360 60 L 395 60 L 420 75 L 415 105 L 395 125 L 375 145 L 365 175 L 360 210 L 340 235 L 310 245 L 285 245 L 270 225 L 280 205 L 260 195 L 240 185 L 215 175 L 190 170 L 165 160 L 140 145 L 120 125 L 100 105 L 85 90 Z",
  // Greenland
  "M 405 30 L 445 28 L 460 50 L 455 75 L 440 95 L 420 95 L 405 75 L 400 50 Z",
  // South America
  "M 290 250 L 325 245 L 350 260 L 365 290 L 375 320 L 375 360 L 360 400 L 335 435 L 305 450 L 285 435 L 275 405 L 270 365 L 275 320 L 280 285 Z",
  // Europe mainland
  "M 478 110 L 510 92 L 555 88 L 595 92 L 615 115 L 605 145 L 575 165 L 540 170 L 510 165 L 488 145 L 478 125 Z",
  // British Isles
  "M 458 115 L 478 105 L 480 135 L 467 148 L 458 138 Z",
  // Scandinavia tip
  "M 555 75 L 580 65 L 595 90 L 580 100 L 558 95 Z",
  // Africa
  "M 488 168 L 540 168 L 590 178 L 615 200 L 625 235 L 620 275 L 605 315 L 580 355 L 555 378 L 528 375 L 515 350 L 502 312 L 492 270 L 485 225 L 480 195 Z",
  // Madagascar
  "M 615 320 L 632 322 L 640 360 L 628 378 L 618 365 L 614 345 Z",
  // Arabia
  "M 605 195 L 640 200 L 655 225 L 640 245 L 615 240 L 605 220 Z",
  // Asia main mass
  "M 615 78 L 700 58 L 790 55 L 870 70 L 925 95 L 945 125 L 935 155 L 905 175 L 880 200 L 850 230 L 815 250 L 770 252 L 730 232 L 705 220 L 685 215 L 670 230 L 655 250 L 645 235 L 640 215 L 625 205 L 615 180 L 615 145 L 615 110 Z",
  // Indian peninsula tip
  "M 700 230 L 720 230 L 725 252 L 712 268 L 698 252 Z",
  // Indonesia / SE Asia island arc
  "M 770 270 L 800 272 L 815 285 L 798 295 L 778 290 Z",
  "M 825 280 L 858 282 L 870 295 L 848 305 L 828 295 Z",
  "M 875 282 L 900 285 L 905 300 L 885 308 L 875 295 Z",
  // Japan
  "M 905 165 L 920 158 L 930 180 L 920 195 L 908 188 Z",
  // Australia
  "M 800 330 L 878 322 L 905 348 L 900 380 L 870 395 L 825 395 L 800 372 L 793 348 Z",
  // New Zealand
  "M 925 388 L 940 388 L 945 405 L 935 415 L 925 405 Z",
];

function WorldMap({ entries, activeId, onSelect, accent = T.accent }) {
  return (
    <svg
      viewBox="0 0 1000 500"
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%", display: "block" }}
      role="img"
      aria-label="World map showing education locations"
    >
      <defs>
        <pattern id="dots" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.7" fill="rgba(148,163,184,0.18)" />
        </pattern>
        <radialGradient id="pinGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"  stopColor={accent} stopOpacity="0.55" />
          <stop offset="55%" stopColor={accent} stopOpacity="0.15" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="contFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgba(96,165,250,0.05)" />
          <stop offset="100%" stopColor="rgba(96,165,250,0.02)" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="1000" height="500" fill="url(#dots)" />
      <rect x="0.5" y="0.5" width="999" height="499" fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth="1" />

      <g style={{ pointerEvents: "none" }}>
        {CONTINENTS.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="url(#contFill)"
            stroke="rgba(148,163,184,0.28)"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
        ))}
      </g>

      <g style={{ pointerEvents: "none" }}>
        {entries.slice(0, -1).map((e, i) => {
          const a = project(e.lat, e.lng);
          const b = project(entries[i + 1].lat, entries[i + 1].lng);
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2 - Math.abs(b.x - a.x) * 0.15;
          return (
            <path
              key={i}
              d={`M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`}
              fill="none"
              stroke={accent}
              strokeOpacity="0.35"
              strokeWidth="1"
              strokeDasharray="3 4"
            />
          );
        })}
      </g>

      <g>
        {entries.map((e) => {
          const { x, y } = project(e.lat, e.lng);
          const active = e.id === activeId;
          return (
            <g
              key={e.id}
              transform={`translate(${x} ${y})`}
              style={{ cursor: "pointer" }}
              onClick={() => onSelect(e.id)}
            >
              {active && (
                <>
                  <circle r="38" fill="url(#pinGlow)">
                    <animate attributeName="r" values="32;46;32" dur="2.6s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.7;0.25;0.7" dur="2.6s" repeatCount="indefinite" />
                  </circle>
                  <circle r="14" fill="none" stroke={accent} strokeOpacity="0.45" strokeWidth="1">
                    <animate attributeName="r" values="10;22;10" dur="2.6s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.7;0;0.7" dur="2.6s" repeatCount="indefinite" />
                  </circle>
                </>
              )}

              <text
                x="0"
                y={active ? -20 : -14}
                textAnchor="middle"
                fontFamily={T.mono}
                fontSize={active ? 11 : 10}
                fontWeight="500"
                letterSpacing="2.5"
                fill={active ? T.accentSoft : T.textDim}
                style={{ textTransform: "uppercase" }}
              >
                {e.country}
              </text>

              <circle
                r={active ? 6 : 3.5}
                fill={active ? accent : "rgba(96,165,250,0.45)"}
                stroke={active ? "#0b1120" : "transparent"}
                strokeWidth="2"
              />
              {active && <circle r="2.2" fill="#fff" opacity="0.9" />}
              <circle r="22" fill="transparent" />
            </g>
          );
        })}
      </g>
    </svg>
  );
}

Object.assign(window, { WorldMap, eduProject: project });

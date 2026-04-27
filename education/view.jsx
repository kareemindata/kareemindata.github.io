// view.jsx — main Education / Journey section.
// Exposed as window.EducationJourney.

const { useState, useMemo, useEffect } = React;
const T  = window.EduTokens;
const ENTRIES = window.EduEntries;

// Viewport breakpoints. We can't use CSS media queries because the
// section is built with inline React styles, so we listen to window
// resize and re-render with the right grid template.
function useViewport() {
  const get = () => {
    if (typeof window === "undefined") return { mobile: false, tablet: false };
    const w = window.innerWidth;
    return { mobile: w < 640, tablet: w >= 640 && w < 1024 };
  };
  const [vp, setVp] = useState(get);
  useEffect(() => {
    const onResize = () => setVp(get());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return vp;
}

const mono = {
  fontFamily: T.mono,
  fontSize: 10.5,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: T.textDim,
};
const monoStat = { ...mono, fontSize: 10, letterSpacing: "0.18em" };

function Header({ vp }) {
  const stack = vp.mobile || vp.tablet;
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: stack ? "1fr" : "1fr 320px",
      gap: stack ? 20 : 48,
      alignItems: stack ? "start" : "end",
      marginBottom: vp.mobile ? 32 : 56,
    }}>
      <div>
        <div style={{ ...mono, color: T.textMuted, marginBottom: vp.mobile ? 14 : 24 }}>
          03 / Education — A Journey
        </div>
        <h1 style={{
          fontFamily: T.serif,
          fontWeight: 500,
          fontSize: vp.mobile ? "clamp(34px, 9vw, 56px)" : "clamp(48px, 7vw, 88px)",
          lineHeight: 1.02,
          letterSpacing: "-0.02em",
          color: T.text,
          margin: 0,
        }}>
          Three cities.<br/>
          <span style={{ color: T.accent, fontStyle: "italic", fontWeight: 400 }}>
            One trajectory.
          </span>
        </h1>
      </div>
      <p style={{
        fontFamily: T.sans,
        fontSize: 14,
        lineHeight: 1.7,
        color: T.textDim,
        textAlign: stack ? "left" : "right",
        margin: 0,
        paddingBottom: stack ? 0 : 8,
      }}>
        Formal training across <strong style={{ color: T.text }}>Cairo, Ottawa, and Zurich</strong>
        {" "}— each stop deepening a different dimension of applied AI.
      </p>
    </div>
  );
}

function MapHero({ entries, activeId, onSelect, vp }) {
  return (
    <div style={{
      border: `1px solid ${T.border}`,
      borderRadius: T.radius,
      background: `radial-gradient(ellipse at 50% 30%, rgba(96,165,250,0.06), transparent 60%), ${T.bgDeep}`,
      padding: vp.mobile ? "14px 14px 6px" : "20px 24px 8px",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        rowGap: 10,
        columnGap: 12,
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: vp.mobile ? 12 : 18,
        paddingBottom: vp.mobile ? 10 : 14,
        borderBottom: `1px dashed ${T.border}`,
      }}>
        <div style={{ ...mono }}>
          Interactive · click a pin
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", rowGap: 8, columnGap: vp.mobile ? 14 : 26 }}>
          {entries.map((e) => {
            const active = e.id === activeId;
            return (
              <button
                key={e.id}
                onClick={() => onSelect(e.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  ...mono,
                  color: active ? T.accent : T.textMuted,
                  transition: "color 200ms ease",
                }}
              >
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: active ? T.accent : "rgba(148,163,184,0.35)",
                  boxShadow: active ? `0 0 10px ${T.accent}` : "none",
                }} />
                {String(e.index).padStart(2, "0")} · {e.country}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ aspectRatio: "1000 / 500", width: "100%" }}>
        <window.WorldMap entries={entries} activeId={activeId} onSelect={onSelect} />
      </div>
    </div>
  );
}

function JourneyCards({ entries, activeId, onSelect, vp }) {
  const cols = vp.mobile ? "1fr" : vp.tablet ? "repeat(2, 1fr)" : "repeat(3, 1fr)";
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: cols,
      gap: vp.mobile ? 14 : 18,
      marginTop: vp.mobile ? 18 : 28,
    }}>
      {entries.map((e) => {
        const active = e.id === activeId;
        return (
          <button
            key={e.id}
            onClick={() => onSelect(e.id)}
            style={{
              position: "relative",
              textAlign: "left",
              cursor: "pointer",
              border: `1px solid ${active ? T.borderHot : T.border}`,
              borderRadius: T.radius,
              background: active
                ? `linear-gradient(180deg, rgba(96,165,250,0.08), rgba(96,165,250,0.02))`
                : T.panel,
              padding: "26px 22px 20px",
              color: T.text,
              fontFamily: T.sans,
              transition: "all 220ms ease",
              boxShadow: active ? `0 18px 60px -28px ${T.accentGlow}` : "none",
            }}
          >
            <div style={{
              position: "absolute",
              top: -10,
              left: 22,
              background: active ? T.accent : T.panelSolid,
              color: active ? "#0b1120" : T.textDim,
              border: `1px solid ${active ? T.accent : T.border}`,
              fontFamily: T.mono,
              fontSize: 10,
              letterSpacing: "0.2em",
              padding: "3px 9px",
              borderRadius: 4,
            }}>
              {String(e.index).padStart(2, "0")} / {entries.length}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36, height: 26,
                fontSize: 16,
                background: "rgba(15,23,42,0.6)",
                border: `1px solid ${T.border}`,
                borderRadius: 4,
                fontFamily: T.mono,
                fontWeight: 600,
                color: T.textDim,
                fontStyle: "normal",
              }}>
                {e.code}
              </span>
              <div style={{ ...monoStat, color: T.textDim }}>
                {e.city}, {e.country}
                <div style={{ ...monoStat, color: T.textMuted, marginTop: 4, letterSpacing: "0.18em" }}>
                  {e.dateRange}
                </div>
              </div>
            </div>

            <div style={{
              fontFamily: T.serif,
              fontSize: 19,
              fontWeight: 500,
              lineHeight: 1.25,
              letterSpacing: "-0.01em",
              color: T.text,
              marginBottom: 6,
            }}>
              {e.degree}
            </div>
            <div style={{ fontSize: 13, color: T.textDim, marginBottom: 22 }}>
              {e.institution}
            </div>

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: 14,
              borderTop: `1px dashed ${T.border}`,
            }}>
              <div style={{ ...monoStat }}>
                {e.standing.split("·")[0].trim()}
              </div>
              <div style={{
                ...monoStat,
                color: active ? T.accent : T.textDim,
                fontWeight: 600,
              }}>
                {active ? "Viewing ▸" : "View ▸"}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function DetailPanel({ entry, vp }) {
  const bodyCols = vp.mobile ? "1fr" : vp.tablet ? "1fr 1fr" : "1.4fr 1fr 1fr";
  return (
    <div style={{
      marginTop: vp.mobile ? 18 : 28,
      border: `1px solid ${T.border}`,
      borderRadius: T.radius,
      background: T.panel,
      padding: vp.mobile ? "20px 18px 22px" : "28px 32px 32px",
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 20,
        paddingBottom: 18,
        borderBottom: `1px dashed ${T.border}`,
      }}>
        <div style={{ ...mono, color: T.accent }}>
          Now Viewing · {entry.country} · {entry.dateRange}
        </div>
        <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
          <div>
            <div style={{ ...monoStat, color: T.textMuted }}>Standing</div>
            <div style={{ fontFamily: T.sans, fontSize: 13, color: T.text, marginTop: 4 }}>
              {entry.standing}
            </div>
          </div>
          <div>
            <div style={{ ...monoStat, color: T.textMuted }}>Advisor</div>
            <div style={{ fontFamily: T.sans, fontSize: 13, color: T.text, marginTop: 4 }}>
              {entry.advisors}
            </div>
          </div>
        </div>
      </div>

      <div style={{
        fontFamily: T.serif,
        fontSize: 28,
        fontWeight: 500,
        letterSpacing: "-0.015em",
        color: T.text,
        marginBottom: 4,
      }}>
        {entry.degree}
      </div>
      <div style={{ fontSize: 14, color: T.textDim, marginBottom: 28 }}>
        {entry.institution} · {entry.city}, {entry.country}
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: bodyCols,
        gap: vp.mobile ? 24 : 36,
      }}>
        <div>
          <div style={{ ...mono, color: T.textMuted, marginBottom: 12 }}>
            {entry.program === "Summer School" ? "Capstone" : "Capstone / Thesis"}
          </div>
          <div style={{
            fontFamily: T.serif,
            fontStyle: "italic",
            fontSize: 20,
            lineHeight: 1.3,
            color: T.text,
            marginBottom: 14,
          }}>
            "{entry.thesis.title}"
          </div>
          <p style={{
            fontFamily: T.sans,
            fontSize: 13.5,
            lineHeight: 1.75,
            color: T.textDim,
            margin: 0,
          }}>
            {entry.thesis.abstract}
          </p>

          <div style={{ ...mono, color: T.textMuted, marginTop: 32, marginBottom: 12 }}>
            Honors
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {entry.honors.map((h, i) => (
              <div key={i} style={{
                borderLeft: `2px solid ${T.accent}`,
                background: T.accentTint,
                padding: "10px 14px",
                borderRadius: "0 6px 6px 0",
                fontSize: 13,
                color: T.text,
                fontFamily: T.sans,
                lineHeight: 1.5,
              }}>
                {h}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ ...mono, color: T.textMuted, marginBottom: 12 }}>
            Coursebook
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {entry.coursebook.map((c, i) => (
              <div key={i} style={{
                display: "grid",
                gridTemplateColumns: "32px 1fr",
                alignItems: "center",
                background: "rgba(148,163,184,0.04)",
                border: `1px solid ${T.border}`,
                borderRadius: 6,
                padding: "8px 12px",
                fontFamily: T.mono,
                fontSize: 11,
                letterSpacing: "0.04em",
                color: T.textDim,
              }}>
                <span style={{ color: T.accent, fontWeight: 600 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ color: T.text }}>{c}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ ...mono, color: T.textMuted, marginBottom: 14 }}>
            Skills Acquired
          </div>
          <div style={{ display: "grid", gap: 14 }}>
            {entry.skills.map((s, i) => (
              <div key={i}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  marginBottom: 6,
                  fontFamily: T.sans,
                }}>
                  <span style={{ color: T.text }}>{s.name}</span>
                  <span style={{ ...monoStat, fontSize: 9.5, color: T.textMuted }}>
                    {s.level}/100
                  </span>
                </div>
                <div style={{
                  height: 4,
                  background: "rgba(148,163,184,0.1)",
                  borderRadius: 2,
                  overflow: "hidden",
                }}>
                  <div style={{
                    width: `${s.level}%`,
                    height: "100%",
                    background: `linear-gradient(90deg, ${T.accentSoft}, ${T.accent})`,
                    borderRadius: 2,
                    transition: "width 600ms cubic-bezier(.4,.0,.2,1)",
                  }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 28,
            background: T.accentTint,
            border: `1px solid rgba(96,165,250,0.18)`,
            borderRadius: 10,
            padding: "16px 18px",
          }}>
            <div style={{
              fontFamily: T.serif,
              fontStyle: "italic",
              fontSize: 14.5,
              lineHeight: 1.55,
              color: T.accentSoft,
            }}>
              — {entry.takeaway}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EducationJourney() {
  const [activeId, setActiveId] = useState(ENTRIES[0].id);
  const entry = useMemo(
    () => ENTRIES.find((e) => e.id === activeId) || ENTRIES[0],
    [activeId]
  );
  const vp = useViewport();

  const padY = vp.mobile ? 56 : vp.tablet ? 80 : 96;
  const padX = vp.mobile ? 16 : vp.tablet ? 32 : 56;

  return (
    <section style={{
      background: `radial-gradient(ellipse at 20% 0%, rgba(96,165,250,0.06), transparent 50%), ${T.bg}`,
      color: T.text,
      fontFamily: T.sans,
      padding: `${padY}px ${padX}px`,
      minHeight: vp.mobile ? "auto" : "100vh",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Header vp={vp} />
        <MapHero entries={ENTRIES} activeId={activeId} onSelect={setActiveId} vp={vp} />
        <JourneyCards entries={ENTRIES} activeId={activeId} onSelect={setActiveId} vp={vp} />
        <DetailPanel entry={entry} vp={vp} />
      </div>
    </section>
  );
}

Object.assign(window, { EducationJourney });

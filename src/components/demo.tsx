import { useState, useEffect, useRef, useCallback } from "react";

/* ============================================================
   GLOBAL STYLES
   ============================================================ */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800;900&family=Cabinet+Grotesk:wght@400;500;600;700;800;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --yellow: #FFE55C;
    --orange: #FF8B3E;
    --deep: #FF5C1A;
    --red: #FF2D55;
    --green: #30D158;
    --bg: #090912;
    --bg2: #0f0f1e;
    --bg3: #141428;
    --surface: rgba(255,255,255,0.04);
    --border: rgba(255,255,255,0.08);
    --border-bright: rgba(255,255,255,0.15);
    --text: #ffffff;
    --text-muted: rgba(255,255,255,0.55);
    --text-dim: rgba(255,255,255,0.3);
    --titanium: #c8c8c8;
    --titanium-dark: #7a7a7a;
    --radius-phone: 52px;
    --shadow-glow: 0 0 80px rgba(255,139,62,0.18);
  }

  html { scroll-behavior: smooth; }

  body {
    font-family: 'Cabinet Grotesk', -apple-system, sans-serif;
    background: var(--bg);
    color: var(--text);
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }

  /* ── Keyframes ── */
  @keyframes float-slow {
    0%,100% { transform: translateY(0px) rotate(0deg); }
    33%      { transform: translateY(-18px) rotate(1deg); }
    66%      { transform: translateY(-8px) rotate(-1deg); }
  }
  @keyframes orb-drift {
    0%,100% { transform: translate(0,0) scale(1); }
    25%      { transform: translate(60px,-40px) scale(1.08); }
    50%      { transform: translate(-30px,60px) scale(0.94); }
    75%      { transform: translate(40px,20px) scale(1.04); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes spin-rev { to { transform: rotate(-360deg); } }
  @keyframes pulse-ring {
    0%   { transform: translate(-50%,-50%) scale(0.9); opacity: 0.8; }
    100% { transform: translate(-50%,-50%) scale(1.6); opacity: 0; }
  }
  @keyframes shimmer {
    0%   { transform: translateX(-120%); }
    100% { transform: translateX(120%); }
  }
  @keyframes bounce-dot {
    0%,80%,100% { transform: scale(0); opacity: 0.5; }
    40%          { transform: scale(1); opacity: 1; }
  }
  @keyframes glow-badge {
    0%,100% { box-shadow: 0 0 12px rgba(255,139,62,0.4); }
    50%      { box-shadow: 0 0 28px rgba(255,139,62,0.8); }
  }
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(32px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes scale-in {
    from { opacity: 0; transform: scale(0.92); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes slide-up {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }
  @keyframes tick {
    0%,100% { transform: translateY(0); }
    50%      { transform: translateY(-6px); }
  }
  @keyframes grain {
    0%,100% { transform: translate(0,0); }
    10%      { transform: translate(-2%,-3%); }
    30%      { transform: translate(3%,-1%); }
    50%      { transform: translate(-1%,2%); }
    70%      { transform: translate(2%,3%); }
    90%      { transform: translate(-3%,1%); }
  }
  @keyframes marquee {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  @keyframes phone-hover {
    0%,100% { transform: translateY(0px) rotateX(0deg); }
    50%      { transform: translateY(-12px) rotateX(2deg); }
  }

  /* ── Utility classes ── */
  .animate-fade-up    { animation: fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both; }
  .animate-scale-in   { animation: scale-in 0.5s cubic-bezier(0.22,1,0.36,1) both; }
  .animate-phone-float { animation: float-slow 7s ease-in-out infinite; }

  .glass {
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(24px) saturate(1.4);
    border: 1px solid var(--border);
  }
  .glass-bright {
    background: rgba(255,255,255,0.07);
    backdrop-filter: blur(32px) saturate(1.6);
    border: 1px solid var(--border-bright);
  }

  .gradient-text {
    background: linear-gradient(135deg, #fff 0%, var(--yellow) 45%, var(--orange) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .gradient-text-warm {
    background: linear-gradient(135deg, var(--yellow) 0%, var(--orange) 60%, var(--deep) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* ── Phone scrollbar hide ── */
  .phone-scroll { overflow-y: auto; scrollbar-width: none; -ms-overflow-style: none; }
  .phone-scroll::-webkit-scrollbar { display: none; }

  /* ── Responsive grid ── */
  .screens-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 120px 60px;
    justify-items: center;
  }

  @media (max-width: 1200px) {
    .screens-grid { grid-template-columns: repeat(auto-fill, minmax(300px,1fr)); gap: 100px 40px; }
  }
  @media (max-width: 768px) {
    .screens-grid { grid-template-columns: 1fr; gap: 100px 0; }
  }

  /* ── Feature card hover ── */
  .feat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 28px;
    transition: transform 0.35s cubic-bezier(0.22,1,0.36,1),
                background 0.25s, border-color 0.25s,
                box-shadow 0.35s;
    cursor: default;
    position: relative;
    overflow: hidden;
  }
  .feat-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, var(--yellow), var(--orange));
    opacity: 0; transition: opacity 0.3s;
  }
  .feat-card:hover {
    transform: translateY(-6px);
    background: rgba(255,255,255,0.07);
    border-color: rgba(255,255,255,0.18);
    box-shadow: 0 24px 48px rgba(0,0,0,0.3), var(--shadow-glow);
  }
  .feat-card:hover::before { opacity: 1; }

  /* ── Tab buttons ── */
  .screen-tab {
    padding: 9px 18px;
    border-radius: 50px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text-muted);
    font-family: 'Cabinet Grotesk', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.22s;
    white-space: nowrap;
  }
  .screen-tab:hover { border-color: var(--border-bright); color: var(--text); }
  .screen-tab.active {
    background: linear-gradient(135deg, var(--yellow), var(--orange));
    border-color: transparent;
    color: #fff;
    box-shadow: 0 4px 16px rgba(255,139,62,0.4);
  }

  /* ── CTA button ── */
  .cta-btn {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 18px 36px;
    background: linear-gradient(135deg, var(--yellow), var(--orange));
    border: none; border-radius: 100px;
    color: #fff; font-family: 'Syne', sans-serif;
    font-size: 17px; font-weight: 800;
    cursor: pointer; letter-spacing: 0.3px;
    box-shadow: 0 8px 28px rgba(255,139,62,0.45);
    transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s;
    position: relative; overflow: hidden;
  }
  .cta-btn::after {
    content: '';
    position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent);
    transition: left 0.55s;
  }
  .cta-btn:hover { transform: translateY(-3px) scale(1.03); box-shadow: 0 16px 40px rgba(255,139,62,0.55); }
  .cta-btn:hover::after { left: 100%; }
  .cta-btn:active { transform: scale(0.98); }

  .cta-btn-ghost {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 17px 34px;
    background: transparent;
    border: 1px solid var(--border-bright); border-radius: 100px;
    color: var(--text); font-family: 'Syne', sans-serif;
    font-size: 16px; font-weight: 700;
    cursor: pointer;
    transition: all 0.25s;
  }
  .cta-btn-ghost:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.3); }

  /* ── Marquee ── */
  .marquee-track { animation: marquee 22s linear infinite; display: flex; gap: 32px; }

  /* ── Spec table ── */
  .spec-row { border-bottom: 1px solid var(--border); }
  .spec-row:last-child { border-bottom: none; }

  /* ── Number stat ── */
  .stat-num {
    font-family: 'Syne', sans-serif; font-size: clamp(44px,6vw,72px); font-weight: 900;
    background: linear-gradient(135deg, var(--yellow), var(--orange));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    line-height: 1; display: block;
  }

  /* ── Responsive phone scale ── */
  @media (max-width: 480px) {
    .phone-scaler { transform: scale(0.78); transform-origin: top center; }
  }
  @media (max-width: 360px) {
    .phone-scaler { transform: scale(0.68); transform-origin: top center; }
  }
`;

/* ============================================================
   TYPES
   ============================================================ */
interface ScreenDef {
  id: number;
  label: string;
  category: string;
  desc: string;
  tags: string[];
  accent: string;
  render: (time: string) => React.ReactNode;
}

/* ============================================================
   LIVE CLOCK HOOK
   ============================================================ */
function useLiveClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
  );
  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }));
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

/* ============================================================
   INTERSECTION OBSERVER HOOK
   ============================================================ */
function useInView(options = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold: 0.12, ...options });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}

/* ============================================================
   STATUS BAR
   ============================================================ */
const StatusBar = ({ time, dark = false }: { time: string; dark?: boolean }) => (
  <div style={{
    position: "absolute", top: 0, left: 0, right: 0, height: 52,
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "0 28px", zIndex: 200,
    color: dark ? "#1a1a1a" : "rgba(255,255,255,0.92)",
    fontSize: 13, fontWeight: 700, letterSpacing: 0.2,
    fontVariantNumeric: "tabular-nums",
  }}>
    <span>{time}</span>
    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
      {/* Signal bars */}
      {[6,9,12].map(h => (
        <div key={h} style={{ width: 3, height: h, background: dark ? "#1a1a1a" : "white", borderRadius: 1.5, opacity: 0.9 }} />
      ))}
      <span style={{ marginLeft: 4, fontSize: 11 }}>5G</span>
      {/* Battery */}
      <div style={{ marginLeft: 6, display: "flex", alignItems: "center", gap: 2 }}>
        <div style={{ width: 22, height: 11, border: `1.5px solid ${dark ? "#1a1a1a" : "rgba(255,255,255,0.8)"}`, borderRadius: 3, position: "relative", display: "flex", alignItems: "center", padding: "1.5px" }}>
          <div style={{ flex: 1, height: "100%", background: dark ? "#1a1a1a" : "white", borderRadius: 1.5 }} />
          <div style={{ position: "absolute", right: -4, top: "50%", transform: "translateY(-50%)", width: 2.5, height: 5, background: dark ? "#1a1a1a" : "rgba(255,255,255,0.7)", borderRadius: "0 1px 1px 0" }} />
        </div>
      </div>
    </div>
  </div>
);

/* ============================================================
   DYNAMIC ISLAND
   ============================================================ */
const DynamicIsland = ({ expanded = false }: { expanded?: boolean }) => (
  <div style={{
    position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)",
    width: expanded ? 220 : 88, height: expanded ? 38 : 26,
    background: "#000", borderRadius: 20,
    zIndex: 300, display: "flex", alignItems: "center",
    justifyContent: "space-between", padding: "0 10px",
    transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
    boxShadow: "0 2px 12px rgba(0,0,0,0.6)",
  }}>
    <div style={{ width: 8, height: 8, background: "#1c2a3a", borderRadius: "50%", position: "relative" }}>
      <div style={{ position: "absolute", inset: 2, background: "#0a4080", borderRadius: "50%", opacity: 0.8 }} />
    </div>
    {expanded && <div style={{ flex: 1, textAlign: "center", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: 0.5 }}>GlazeMe Active</div>}
    <div style={{ width: expanded ? 36 : 28, height: 3, background: "#2a2a2a", borderRadius: 2 }} />
  </div>
);

/* ============================================================
   IPHONE 17 PRO SHELL
   ============================================================ */
const IPhoneShell = ({ children, glowColor = "rgba(255,139,62,0.25)" }: { children: React.ReactNode; glowColor?: string }) => (
  <div style={{ position: "relative", display: "inline-block" }}>
    {/* Ambient glow under phone */}
    <div style={{
      position: "absolute", bottom: -30, left: "50%", transform: "translateX(-50%)",
      width: "85%", height: 40, background: glowColor,
      filter: "blur(30px)", borderRadius: "50%", zIndex: 0,
    }} />

    {/* Titanium outer frame */}
    <div style={{
      position: "absolute", inset: -2.5, borderRadius: 67, zIndex: 0,
      background: `linear-gradient(160deg,
        #e8e8e8 0%, #a0a0a0 15%, #d8d8d8 30%,
        #787878 45%, #c8c8c8 60%, #888 75%,
        #e0e0e0 90%, #aaa 100%)`,
      boxShadow: `
        0 0 0 0.5px rgba(0,0,0,0.6),
        0 30px 70px rgba(0,0,0,0.55),
        inset 0 1px 0 rgba(255,255,255,0.15)
      `,
    }} />

    {/* Phone body */}
    <div style={{
      width: 340, height: 736,
      background: "linear-gradient(170deg,#1e1e1e 0%,#0a0a0a 100%)",
      borderRadius: var_or(64),
      padding: 10, position: "relative", zIndex: 1,
    }}>
      {/* Subtle inner reflection */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: 64,
        background: "linear-gradient(145deg,rgba(255,255,255,0.06) 0%,transparent 50%)",
        pointerEvents: "none", zIndex: 10,
      }} />

      {/* Side buttons */}
      <SideButtons />

      {/* Screen */}
      <div style={{
        width: "100%", height: "100%",
        background: "#000", borderRadius: 56,
        overflow: "hidden", position: "relative",
      }}>
        {children}
      </div>
    </div>
  </div>
);

const var_or = (_n: number) => _n; // helper to avoid TS complaints with CSS vars in style

const SideButtons = () => (
  <>
    {/* Volume */}
    {[170, 232].map((top, i) => (
      <div key={i} style={{
        position: "absolute", left: -3.5, top,
        width: 3.5, height: 52, borderRadius: "2px 0 0 2px",
        background: "linear-gradient(180deg,#d0d0d0,#888,#c0c0c0)",
        boxShadow: "-1px 0 3px rgba(0,0,0,0.5)",
      }} />
    ))}
    {/* Action button */}
    <div style={{
      position: "absolute", right: -3.5, top: 168,
      width: 3.5, height: 66, borderRadius: "0 2px 2px 0",
      background: "linear-gradient(180deg,#d0d0d0,#888,#c0c0c0)",
      boxShadow: "1px 0 3px rgba(0,0,0,0.5)",
    }} />
    {/* Camera control */}
    <div style={{
      position: "absolute", right: -3.5, top: 260,
      width: 3.5, height: 52, borderRadius: "0 2px 2px 0",
      background: "linear-gradient(180deg,#d0d0d0,#888,#c0c0c0)",
      boxShadow: "1px 0 3px rgba(0,0,0,0.5)",
    }} />
  </>
);

/* ============================================================
   SCREEN WRAPPER (gradient bg)
   ============================================================ */
const AppScreen = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div className="phone-scroll" style={{
    width: "100%", height: "100%",
    background: "linear-gradient(175deg,#FFE55C 0%,#FF8B3E 45%,#FF5C1A 100%)",
    position: "relative", ...style
  }}>
    {children}
  </div>
);

/* ============================================================
   SCREEN 1 — SPLASH
   ============================================================ */
const Screen1Splash = ({ time }: { time: string }) => (
  <AppScreen>
    <StatusBar time={time} />
    <DynamicIsland />
    <div style={{
      height: "100%", display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center",
      textAlign: "center", padding: "60px 32px 40px",
      position: "relative", overflow: "hidden",
    }}>
      {/* Background rings */}
      {[120, 200, 280].map((s, i) => (
        <div key={i} style={{
          position: "absolute", left: "50%", top: "45%",
          width: s, height: s, borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.2)",
          transform: "translate(-50%,-50%)",
          animation: `pulse-ring 3s ${i * 1}s ease-out infinite`,
        }} />
      ))}
      {/* Sparkle float */}
      <div style={{ fontSize: 72, marginBottom: 16, filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.2))", position: "relative", zIndex: 2, animation: "tick 2.5s ease-in-out infinite" }}>✨</div>
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 44, fontWeight: 900, color: "white", marginBottom: 12, letterSpacing: -2, lineHeight: 1, position: "relative", zIndex: 2, textShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>GlazeMe</div>
      <div style={{ fontSize: 15, color: "rgba(255,255,255,0.88)", fontWeight: 500, marginBottom: 52, position: "relative", zIndex: 2, lineHeight: 1.5 }}>Make someone's day<br /><strong style={{ fontWeight: 800 }}>over the top</strong></div>
      {/* Loader */}
      <div style={{ position: "relative", width: 52, height: 52, zIndex: 2 }}>
        <div style={{ position: "absolute", inset: 0, border: "3px solid rgba(255,255,255,0.25)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.9s linear infinite" }} />
        <div style={{ position: "absolute", inset: 8, border: "2px solid rgba(255,255,255,0.15)", borderBottomColor: "rgba(255,255,255,0.6)", borderRadius: "50%", animation: "spin-rev 1.3s linear infinite" }} />
        <div style={{ position: "absolute", inset: "50%", width: 8, height: 8, background: "white", borderRadius: "50%", transform: "translate(-50%,-50%)", boxShadow: "0 0 10px white" }} />
      </div>
      <div style={{ position: "absolute", bottom: 28, fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>Version 3.0</div>
    </div>
  </AppScreen>
);

/* ============================================================
   SCREEN 2 — HOME DASHBOARD
   ============================================================ */
const Screen2Home = ({ time }: { time: string }) => (
  <AppScreen>
    <StatusBar time={time} />
    <DynamicIsland />
    <div className="phone-scroll" style={{ height: "100%", paddingTop: 56 }}>
      {/* Header */}
      <div style={{ padding: "10px 20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.65)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>Monday, Feb 23</div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 900, color: "white", letterSpacing: -0.8, lineHeight: 1 }}>GlazeMe 🔥</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["⌨️","🔔","⚙️"].map(ic => (
            <div key={ic} style={{ width: 36, height: 36, background: "rgba(255,255,255,0.18)", backdropFilter: "blur(12px)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, border: "1px solid rgba(255,255,255,0.22)", cursor: "pointer" }}>{ic}</div>
          ))}
        </div>
      </div>

      {/* Limit Card */}
      <div style={{ margin: "0 16px 16px", background: "rgba(0,0,0,0.22)", backdropFilter: "blur(20px)", borderRadius: 18, padding: "16px 18px", border: "1px solid rgba(255,255,255,0.18)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 18 }}>🌟</span>
            <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 900, color: "white" }}>9</span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>/9 glazes left</span>
          </div>
          <div style={{ background: "rgba(255,255,255,0.18)", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800, color: "white", letterSpacing: 0.5 }}>DAILY</div>
        </div>
        <div style={{ height: 6, background: "rgba(0,0,0,0.3)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: "100%", background: "linear-gradient(90deg,rgba(255,255,255,0.9),#FFE55C)", borderRadius: 3, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)", animation: "shimmer 2.5s infinite" }} />
          </div>
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Resets at midnight • Upgrade for unlimited</div>
      </div>

      {/* Section: Who deserves love */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 16px", marginBottom: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: "white" }}>Who deserves love? 💛</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.75)", background: "rgba(255,255,255,0.15)", padding: "5px 12px", borderRadius: 20, cursor: "pointer" }}>+ Add</div>
      </div>

      {/* Friends */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, padding: "0 16px", marginBottom: 16 }}>
        {[
          { init: "S", name: "Sarah", streak: 5, sent: 12, color: "#FF8B3E" },
          { init: "M", name: "Mike", streak: 2, sent: 7, color: "#FF5C1A" },
          { init: "+", name: "Add", streak: null, sent: null, color: "rgba(255,255,255,0.2)" },
        ].map(f => (
          <div key={f.name} style={{ background: f.streak === null ? "rgba(255,255,255,0.1)" : "white", borderRadius: 18, padding: "14px 6px", textAlign: "center", boxShadow: f.streak !== null ? "0 4px 20px rgba(0,0,0,0.12)" : "none", cursor: "pointer", border: f.streak === null ? "1.5px dashed rgba(255,255,255,0.35)" : "none" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", margin: "0 auto 8px", background: f.streak === null ? "rgba(255,255,255,0.18)" : `linear-gradient(135deg,#FFE55C,${f.color})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: f.streak === null ? 22 : 18, fontWeight: 900, color: "white", boxShadow: f.streak !== null ? `0 4px 12px ${f.color}55` : "none" }}>{f.init}</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: f.streak === null ? "white" : "#1a1a1a", marginBottom: 3 }}>{f.name}</div>
            {f.streak !== null && (
              <>
                <div style={{ fontSize: 11, color: "#FF8B3E", fontWeight: 800 }}>🔥 {f.streak} streak</div>
                <div style={{ fontSize: 10, color: "#999", fontWeight: 600, marginTop: 1 }}>{f.sent} sent</div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Recent Glazes */}
      <div style={{ background: "white", margin: "0 16px", borderRadius: 20, padding: "16px", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#1a1a1a" }}>Recent Glazes</div>
          <div style={{ fontSize: 12, color: "#FF8B3E", fontWeight: 700, cursor: "pointer" }}>See all →</div>
        </div>
        {[
          { emoji: "👑", text: '"You\'re absolutely legendary..."', meta: "Sarah • Legendary • 2m ago", dot: "#FF8B3E" },
          { emoji: "🔥", text: '"Main character energy fr fr..."', meta: "Mike • Hype • 1h ago", dot: "#FF5C1A" },
          { emoji: "💅", text: '"Built different, so iconic!!"', meta: "Emma • Bestie • 3h ago", dot: "#FFE55C" },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < 2 ? "1px solid rgba(0,0,0,0.06)" : "none", cursor: "pointer" }}>
            <div style={{ width: 38, height: 38, background: `linear-gradient(135deg,#FFE55C,#FF8B3E)`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{item.emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.text}</div>
              <div style={{ fontSize: 11, color: "#999", fontWeight: 500, marginTop: 2 }}>{item.meta}</div>
            </div>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: item.dot, flexShrink: 0 }} />
          </div>
        ))}
      </div>

      {/* Keyboard CTA */}
      <div style={{ margin: "12px 16px 24px", background: "linear-gradient(135deg,rgba(10,10,30,0.9),rgba(20,20,50,0.9))", backdropFilter: "blur(16px)", borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, border: "1px solid rgba(255,255,255,0.12)" }}>
        <div style={{ width: 44, height: 44, background: "rgba(255,255,255,0.1)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>⌨️</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: "#FFE55C", marginBottom: 2 }}>Add to Keyboard</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>Glaze anywhere, instantly</div>
        </div>
        <div style={{ fontSize: 18, color: "#FFE55C", animation: "tick 1.5s ease-in-out infinite" }}>→</div>
      </div>
    </div>
  </AppScreen>
);

/* ============================================================
   SCREEN 3 — ADD FRIEND
   ============================================================ */
const Screen3AddFriend = ({ time }: { time: string }) => (
  <AppScreen style={{ overflow: "hidden" }}>
    <StatusBar time={time} />
    <DynamicIsland />
    {/* Blurred background */}
    <div style={{ filter: "blur(5px) brightness(0.6)", padding: "56px 20px 0", pointerEvents: "none" }}>
      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 900, color: "white" }}>GlazeMe 🔥</div>
      <div style={{ height: 100, background: "rgba(255,255,255,0.15)", borderRadius: 18, marginTop: 16 }} />
    </div>
    {/* Modal */}
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)", display: "flex", alignItems: "flex-end", zIndex: 400 }}>
      <div style={{ background: "white", borderRadius: "32px 32px 0 0", padding: "0 24px 32px", width: "100%", animation: "slide-up 0.4s cubic-bezier(0.22,1,0.36,1)" }}>
        <div style={{ width: 36, height: 4, background: "rgba(0,0,0,0.15)", borderRadius: 2, margin: "12px auto 24px" }} />
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 900, color: "#0a0a0a", marginBottom: 6 }}>Add Friend ✨</div>
        <div style={{ fontSize: 13, color: "#888", fontWeight: 500, marginBottom: 22, lineHeight: 1.5 }}>Tell us about them and we'll personalize every glaze</div>

        {[
          { label: "Their Name", placeholder: "e.g., Jessica", icon: "👤" },
          { label: "What makes them special?", placeholder: "e.g., Always the life of the party", icon: "⭐" },
          { label: "Your nickname for them", placeholder: "e.g., Jess, Queen Jess", icon: "🏷️" },
        ].map(f => (
          <div key={f.label} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 800, color: "#333", textTransform: "uppercase", letterSpacing: 0.8, display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <span>{f.icon}</span> {f.label}
            </label>
            <div style={{ display: "flex", alignItems: "center", border: "1.5px solid rgba(0,0,0,0.1)", borderRadius: 14, overflow: "hidden", transition: "border-color 0.2s" }}>
              <input readOnly placeholder={f.placeholder} style={{ flex: 1, padding: "13px 14px", border: "none", fontSize: 14, fontFamily: "inherit", background: "#fafafa", color: "#888", outline: "none" }} />
            </div>
          </div>
        ))}

        <button style={{ width: "100%", padding: "16px", background: "linear-gradient(135deg,#FFE55C,#FF8B3E)", border: "none", borderRadius: 16, color: "white", fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: "0 6px 20px rgba(255,139,62,0.4)", marginTop: 4 }}>
          💛 Add Friend
        </button>
      </div>
    </div>
  </AppScreen>
);

/* ============================================================
   SCREEN 4 — AI GENERATOR
   ============================================================ */
const Screen4Generator = ({ time }: { time: string }) => {
  const [activeInt, setActiveInt] = useState(2);
  const [activeStyle, setActiveStyle] = useState(0);

  const intensities = [
    { e: "😊", n: "Nice", d: "Subtle warmth", col: "#34C759" },
    { e: "🚀", n: "Hype", d: "High energy", col: "#FF8B3E" },
    { e: "👑", n: "LEGENDARY", d: "All caps glory", col: "#FFE55C" },
    { e: "🤪", n: "UNHINGED", d: "Chaos mode", col: "#FF2D55" },
  ];
  const styles = ["👯 Bestie", "📜 Poetic", "💼 CEO Mode", "🌪️ Chaos", "🎭 Dramatic"];

  return (
    <AppScreen>
      <StatusBar time={time} />
      <DynamicIsland />
      <div className="phone-scroll" style={{ height: "100%", paddingTop: 56 }}>
        {/* Nav */}
        <div style={{ display: "flex", alignItems: "center", padding: "8px 16px 12px", gap: 10 }}>
          <div style={{ width: 34, height: 34, background: "rgba(255,255,255,0.18)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>←</div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 900, color: "white", flex: 1 }}>New Glaze</div>
          <div style={{ width: 34, height: 34, background: "rgba(255,255,255,0.18)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>ℹ️</div>
        </div>

        {/* Target */}
        <div style={{ background: "white", margin: "0 14px 12px", borderRadius: 20, padding: "18px 20px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#FFE55C,#FF8B3E,#FF5C1A)" }} />
          <div style={{ fontSize: 10, fontWeight: 800, color: "#aaa", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>Glazing Target</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, background: "linear-gradient(135deg,#FFE55C,#FF8B3E)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "white", fontSize: 18 }}>S</div>
            <div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 900, background: "linear-gradient(135deg,#FF8B3E,#FF5C1A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Sarah 💛</div>
              <div style={{ fontSize: 11, color: "#999", fontWeight: 600 }}>🔥 5 streak · 12 glazes sent</div>
            </div>
          </div>
        </div>

        {/* Intensity */}
        <div style={{ background: "white", margin: "0 14px 12px", borderRadius: 20, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#888", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>🔥 Intensity Level</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {intensities.map((btn, i) => (
              <div key={btn.n} onClick={() => setActiveInt(i)} style={{
                padding: "14px 10px", borderRadius: 14, textAlign: "center", cursor: "pointer",
                background: activeInt === i ? `linear-gradient(135deg,${btn.col}CC,${btn.col})` : "rgba(0,0,0,0.04)",
                border: `1.5px solid ${activeInt === i ? "transparent" : "rgba(0,0,0,0.08)"}`,
                transform: activeInt === i ? "scale(1.04)" : "none",
                boxShadow: activeInt === i ? `0 6px 20px ${btn.col}55` : "none",
                transition: "all 0.25s cubic-bezier(0.22,1,0.36,1)",
              }}>
                <div style={{ fontSize: 26, marginBottom: 4 }}>{btn.e}</div>
                <div style={{ fontSize: 12, fontWeight: 900, color: activeInt === i ? "white" : "#333", marginBottom: 2 }}>{btn.n}</div>
                <div style={{ fontSize: 10, color: activeInt === i ? "rgba(255,255,255,0.75)" : "#999" }}>{btn.d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Style */}
        <div style={{ background: "white", margin: "0 14px 12px", borderRadius: 20, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#888", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>🎨 Meme Vibe</div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
            {styles.map((s, i) => (
              <div key={s} onClick={() => setActiveStyle(i)} style={{ padding: "9px 14px", borderRadius: 20, whiteSpace: "nowrap", fontWeight: 700, fontSize: 12, cursor: "pointer", background: activeStyle === i ? "#1a1a1a" : "rgba(0,0,0,0.05)", color: activeStyle === i ? "white" : "#444", transition: "all 0.2s", flexShrink: 0 }}>{s}</div>
            ))}
          </div>
        </div>

        {/* Context */}
        <div style={{ background: "white", margin: "0 14px 12px", borderRadius: 20, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#888", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>📝 Context (optional)</div>
          <div style={{ padding: "12px 14px", background: "rgba(0,0,0,0.04)", borderRadius: 12, fontSize: 13, color: "#bbb", border: "1.5px dashed rgba(0,0,0,0.1)" }}>Why are you glazing them today?</div>
        </div>

        {/* Generate */}
        <div style={{ padding: "0 14px 24px" }}>
          <button style={{ width: "100%", padding: "18px", background: "linear-gradient(135deg,#FFE55C,#FF8B3E)", border: "none", borderRadius: 18, color: "white", fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 900, cursor: "pointer", boxShadow: "0 8px 28px rgba(255,139,62,0.45)", textTransform: "uppercase", letterSpacing: 1, position: "relative", overflow: "hidden" }}>
            <span style={{ position: "relative", zIndex: 1 }}>✨ Generate Glaze</span>
          </button>
          <div style={{ textAlign: "center", marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Uses 1 of your 9 daily glazes</div>
        </div>
      </div>
    </AppScreen>
  );
};

/* ============================================================
   SCREEN 5 — LOADING / AI PROCESSING
   ============================================================ */
const Screen5Loading = ({ time }: { time: string }) => (
  <AppScreen>
    <StatusBar time={time} />
    <DynamicIsland expanded />
    <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "60px 28px 40px" }}>
      {/* Animated icon */}
      <div style={{ position: "relative", marginBottom: 36 }}>
        <div style={{ fontSize: 80, animation: "float-slow 2s ease-in-out infinite", filter: "drop-shadow(0 12px 30px rgba(0,0,0,0.25))" }}>✨</div>
        <div style={{ position: "absolute", inset: "-20px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)", animation: "pulse-ring 2s 0s ease-out infinite" }} />
        <div style={{ position: "absolute", inset: "-40px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", animation: "pulse-ring 2s 0.5s ease-out infinite" }} />
      </div>

      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 900, color: "white", marginBottom: 10, letterSpacing: -1 }}>Crafting your glaze...</div>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 36, lineHeight: 1.6 }}>AI is cooking up something<br /><strong>absolutely legendary</strong> 🔥</div>

      {/* Progress steps */}
      <div style={{ background: "rgba(0,0,0,0.2)", backdropFilter: "blur(16px)", borderRadius: 18, padding: "16px 20px", width: "100%", marginBottom: 28, border: "1px solid rgba(255,255,255,0.15)" }}>
        {[
          { label: "Analyzing Sarah's vibe...", done: true },
          { label: "Applying LEGENDARY intensity...", done: true },
          { label: "Generating compliment...", done: false },
          { label: "Adding bestie energy...", done: false },
        ].map((step, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: step.done ? "rgba(52,199,89,0.9)" : "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0, border: step.done ? "none" : "1.5px solid rgba(255,255,255,0.3)" }}>
              {step.done ? "✓" : <div style={{ width: 8, height: 8, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.5)", borderTopColor: "white", animation: "spin 0.8s linear infinite" }} />}
            </div>
            <div style={{ fontSize: 12, color: step.done ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)", fontWeight: step.done ? 600 : 500 }}>{step.label}</div>
          </div>
        ))}
      </div>

      {/* Dots */}
      <div style={{ display: "flex", gap: 10 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: "white", animation: `bounce-dot 1.4s ${[-0.32, -0.16, 0][i]}s ease-in-out infinite` }} />
        ))}
      </div>
    </div>
  </AppScreen>
);

/* ============================================================
   SCREEN 6 — RESULT PREVIEW
   ============================================================ */
const Screen6Result = ({ time }: { time: string }) => (
  <AppScreen>
    <StatusBar time={time} />
    <DynamicIsland />
    <div className="phone-scroll" style={{ height: "100%", paddingTop: 56 }}>
      {/* Nav */}
      <div style={{ display: "flex", alignItems: "center", padding: "8px 16px 10px", gap: 10 }}>
        <div style={{ width: 34, height: 34, background: "rgba(255,255,255,0.18)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>←</div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 900, color: "white", flex: 1 }}>Your Glaze ✨</div>
        <div style={{ width: 34, height: 34, background: "rgba(255,255,255,0.18)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📤</div>
      </div>

      {/* Result Card */}
      <div style={{ background: "white", margin: "0 14px 12px", borderRadius: 22, padding: "22px 18px", position: "relative", overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg,#FFE55C,#FF8B3E,#FF5C1A,#FF2D55)" }} />

        {/* Badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "linear-gradient(135deg,#FFE55C,#FF8B3E)", borderRadius: 30, fontSize: 11, fontWeight: 900, color: "white", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 16, animation: "glow-badge 2s infinite" }}>✨ THE GLAZE ✨</div>

        {/* Quote */}
        <div style={{ position: "relative", background: "linear-gradient(135deg,rgba(255,229,92,0.12),rgba(255,139,62,0.1))", borderRadius: 16, padding: "18px 16px 18px 20px", marginBottom: 16, borderLeft: "4px solid #FF8B3E" }}>
          <div style={{ position: "absolute", top: 8, left: 12, fontSize: 60, color: "rgba(255,139,62,0.15)", fontFamily: "Georgia,serif", lineHeight: 1, pointerEvents: "none" }}>"</div>
          <div style={{ fontSize: 15, lineHeight: 1.7, color: "#1a1a1a", fontWeight: 700, position: "relative", zIndex: 1 }}>
            SARAH YOU ABSOLUTE LEGENDARY QUEEN!! 👑✨🔥 The way you just <em>exist</em> is absolutely ICONIC!! NO ONE is doing it like you!! MAIN CHARACTER ENERGY FR FR!! 💅
          </div>
        </div>

        {/* Meta tags */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          {["🔥 Legendary","👯 Bestie","🤖 GPT-4","✨ 98% Hype"].map(t => (
            <div key={t} style={{ padding: "5px 10px", background: "rgba(0,0,0,0.05)", borderRadius: 20, fontSize: 11, fontWeight: 700, color: "#555" }}>{t}</div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          {["🔄 Regenerate","⭐ Favorite","✏️ Edit","📋 Copy"].map(a => (
            <button key={a} style={{ padding: "12px", borderRadius: 12, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", background: "rgba(0,0,0,0.05)", color: "#333", fontFamily: "inherit" }}>{a}</button>
          ))}
        </div>
        <button style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg,#30D158,#25A244)", border: "none", borderRadius: 14, color: "white", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15, cursor: "pointer", boxShadow: "0 6px 20px rgba(48,209,88,0.4)" }}>
          📤 Send to Sarah
        </button>
      </div>

      {/* Keyboard preview snippet */}
      <div style={{ background: "rgba(0,0,0,0.18)", backdropFilter: "blur(16px)", margin: "0 14px 20px", borderRadius: 16, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.12)" }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>⌨️ Also available in keyboard</div>
        <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", borderLeft: "3px solid #FF8B3E" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>"SARAH YOU ABSOLUTE LEGENDARY..."</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 3 }}>Tap to insert · Just now</div>
        </div>
      </div>
    </div>
  </AppScreen>
);

/* ============================================================
   SCREEN 7 — SHARE SHEET
   ============================================================ */
const Screen7Share = ({ time }: { time: string }) => (
  <AppScreen style={{ overflow: "hidden" }}>
    <StatusBar time={time} />
    <DynamicIsland />
    {/* Blurred bg */}
    <div style={{ filter: "blur(5px) brightness(0.5) scale(0.97)", padding: "56px 14px 0" }}>
      <div style={{ background: "white", borderRadius: 22, padding: 22, height: 220 }}>
        <div style={{ height: 16, background: "#FFE55C", borderRadius: 8, marginBottom: 10, width: "80%" }} />
        <div style={{ height: 80, background: "rgba(255,139,62,0.15)", borderRadius: 12, borderLeft: "4px solid #FF8B3E" }} />
      </div>
    </div>
    {/* Sheet */}
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(14px)", display: "flex", alignItems: "flex-end", zIndex: 400 }}>
      <div style={{ background: "rgba(250,250,250,0.97)", backdropFilter: "blur(20px)", borderRadius: "30px 30px 0 0", padding: "0 22px 32px", width: "100%" }}>
        {/* Handle */}
        <div style={{ width: 34, height: 4, background: "rgba(0,0,0,0.15)", borderRadius: 2, margin: "12px auto 18px" }} />
        {/* Preview strip */}
        <div style={{ background: "linear-gradient(135deg,rgba(255,229,92,0.15),rgba(255,139,62,0.1))", borderRadius: 14, padding: "12px 14px", marginBottom: 18, borderLeft: "3px solid #FF8B3E" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#333", lineHeight: 1.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>"SARAH YOU ABSOLUTE LEGENDARY QUEEN!! 👑✨🔥"</div>
        </div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 900, color: "#0a0a0a", marginBottom: 16 }}>Share Glaze 🚀</div>
        {/* App grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
          {[
            { e: "💬", bg: "#34C759", name: "iMessage" },
            { e: "📱", bg: "#25D366", name: "WhatsApp" },
            { e: "📸", bg: "#E4405F", name: "Instagram" },
            { e: "𝕏", bg: "#000", name: "X (Twitter)" },
            { e: "💼", bg: "#0A66C2", name: "LinkedIn" },
            { e: "📧", bg: "#FF4500", name: "Email" },
            { e: "📋", bg: "#636E72", name: "Copy" },
            { e: "⋯", bg: "#8E8E93", name: "More" },
          ].map(app => (
            <div key={app.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: app.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, boxShadow: "0 3px 10px rgba(0,0,0,0.15)", cursor: "pointer" }}>{app.e}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#555", textAlign: "center" }}>{app.name.split(" ")[0]}</div>
            </div>
          ))}
        </div>
        <button style={{ width: "100%", padding: "15px", background: "rgba(0,0,0,0.06)", border: "none", borderRadius: 14, fontWeight: 700, fontSize: 15, color: "#0a0a0a", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
      </div>
    </div>
  </AppScreen>
);

/* ============================================================
   SCREEN 8 — KEYBOARD SETUP
   ============================================================ */
const Screen8KeyboardSetup = ({ time }: { time: string }) => (
  <AppScreen>
    <StatusBar time={time} />
    <DynamicIsland />
    <div className="phone-scroll" style={{ height: "100%", paddingTop: 56 }}>
      {/* Nav */}
      <div style={{ display: "flex", alignItems: "center", padding: "8px 16px 14px", gap: 10 }}>
        <div style={{ width: 34, height: 34, background: "rgba(255,255,255,0.18)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>←</div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 900, color: "white" }}>Keyboard Setup</div>
      </div>

      {/* Hero */}
      <div style={{ background: "white", margin: "0 14px 14px", borderRadius: 22, padding: "28px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 16, animation: "float-slow 3s ease-in-out infinite", display: "block" }}>⌨️</div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 900, color: "#0a0a0a", marginBottom: 8 }}>Glaze Anywhere</div>
        <div style={{ fontSize: 13, color: "#666", lineHeight: 1.6, marginBottom: 16 }}>Install the GlazeMe keyboard extension to drop compliments in any app — iMessage, WhatsApp, Instagram, anywhere!</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
          {["iMessage ✓","WhatsApp ✓","Instagram ✓","+20 more"].map(app => (
            <div key={app} style={{ padding: "4px 10px", background: "rgba(255,139,62,0.1)", borderRadius: 20, fontSize: 11, fontWeight: 700, color: "#FF8B3E" }}>{app}</div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div style={{ background: "white", margin: "0 14px 20px", borderRadius: 22, padding: "18px 18px 10px" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#0a0a0a", marginBottom: 16 }}>📱 5-Step Installation</div>
        {[
          { icon: "⚙️", text: "Open iPhone Settings", hint: "Gray gear icon on home screen" },
          { icon: "📋", text: "General → Keyboard", hint: "Scroll to find in General" },
          { icon: "➕", text: "Keyboards → Add New", hint: "Third-party keyboards section" },
          { icon: "🟡", text: 'Select "GlazeMe"', hint: "Look for the orange-yellow icon" },
          { icon: "🔓", text: "Allow Full Access", hint: "Required for AI generation" },
        ].map((step, i) => (
          <div key={i} style={{ display: "flex", gap: 12, marginBottom: 16, position: "relative" }}>
            {i < 4 && <div style={{ position: "absolute", left: 18, top: 42, width: 2, height: 18, background: "linear-gradient(180deg,#FF8B3E,rgba(255,139,62,0))" }} />}
            <div style={{ width: 38, height: 38, background: "linear-gradient(135deg,#FFE55C,#FF8B3E)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Syne',sans-serif", fontWeight: 900, color: "white", fontSize: 16, flexShrink: 0, boxShadow: "0 4px 12px rgba(255,139,62,0.3)" }}>
              {i + 1}
            </div>
            <div style={{ paddingTop: 6 }}>
              <div style={{ fontWeight: 700, color: "#0a0a0a", fontSize: 14 }}>{step.text}</div>
              <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{step.hint}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </AppScreen>
);

/* ============================================================
   SCREEN 9 — KEYBOARD ACTIVE (in iMessage)
   ============================================================ */
const Screen9KeyboardActive = ({ time }: { time: string }) => (
  <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "white", fontFamily: "'Cabinet Grotesk',sans-serif" }}>
    {/* iMessage Nav */}
    <div style={{ padding: "52px 16px 12px", background: "#F2F2F7", borderBottom: "0.5px solid rgba(0,0,0,0.15)", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ fontSize: 20, color: "#007AFF", fontWeight: 600 }}>‹</div>
      <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,#FFE55C,#FF8B3E)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "white", fontSize: 15 }}>S</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, color: "#0a0a0a", fontSize: 15 }}>Sarah</div>
        <div style={{ fontSize: 11, color: "#8E8E93" }}>iMessage</div>
      </div>
      <div style={{ fontSize: 20, color: "#007AFF" }}>📞</div>
    </div>

    {/* Messages */}
    <div style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
      <div style={{ alignSelf: "flex-start", background: "#E9E9EB", padding: "10px 14px", borderRadius: "18px 18px 18px 4px", maxWidth: "72%", fontSize: 14, color: "#0a0a0a", lineHeight: 1.4 }}>Hey!! How's it going today? 👋</div>
      <div style={{ alignSelf: "flex-end", background: "#007AFF", padding: "10px 14px", borderRadius: "18px 18px 4px 18px", maxWidth: "72%", fontSize: 14, color: "white", lineHeight: 1.4 }}>Good! Actually wanted to say something 👀</div>
      <div style={{ alignSelf: "flex-start", background: "#E9E9EB", padding: "10px 14px", borderRadius: "18px 18px 18px 4px", maxWidth: "72%", fontSize: 14, color: "#0a0a0a", lineHeight: 1.4 }}>Oooh tell me 👀✨</div>
      {/* Typing indicator */}
      <div style={{ alignSelf: "flex-end", display: "flex", alignItems: "center", gap: 4 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#007AFF", animation: `bounce-dot 1.4s -0.32s infinite` }} />
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#007AFF", animation: `bounce-dot 1.4s -0.16s infinite` }} />
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#007AFF", animation: `bounce-dot 1.4s 0s infinite` }} />
      </div>
    </div>

    {/* GlazeMe Keyboard */}
    <div style={{ background: "#F2F2F7", borderTop: "0.5px solid rgba(0,0,0,0.15)", padding: "10px 10px 6px" }}>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        {["Recent 🔥","⭐ Saved","⚡ Quick"].map((t, i) => (
          <div key={t} style={{ padding: "7px 12px", borderRadius: 16, fontSize: 12, fontWeight: 700, background: i === 0 ? "linear-gradient(135deg,#FFE55C,#FF8B3E)" : "white", color: i === 0 ? "white" : "#444", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", cursor: "pointer", flexShrink: 0 }}>{t}</div>
        ))}
        <div style={{ marginLeft: "auto", fontSize: 11, color: "#8E8E93", fontWeight: 600, display: "flex", alignItems: "center" }}>8/9 left</div>
      </div>
      {/* Glaze items */}
      {[
        { text: '"SARAH YOU ABSOLUTE LEGENDARY QUEEN!! 👑✨🔥"', time: "Just now", tag: "👑 Legendary" },
        { text: '"Main character energy fr fr!! 🔥 No cap!!"', time: "1h ago", tag: "🔥 Hype" },
      ].map((item, i) => (
        <div key={i} style={{ background: "white", borderRadius: 12, padding: "10px 12px", marginBottom: 6, borderLeft: "3px solid #FF8B3E", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", cursor: "pointer" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0a0a0a", lineHeight: 1.4, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.text}</div>
            <div style={{ padding: "2px 7px", background: "rgba(255,139,62,0.12)", borderRadius: 10, fontSize: 10, fontWeight: 700, color: "#FF8B3E", flexShrink: 0 }}>{item.tag}</div>
          </div>
          <div style={{ fontSize: 10, color: "#8E8E93", marginTop: 4 }}>{item.time} · Tap to insert</div>
        </div>
      ))}
      <button style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg,#FFE55C,#FF8B3E)", border: "none", borderRadius: 12, color: "white", fontWeight: 800, fontSize: 13, cursor: "pointer", marginBottom: 4 }}>✨ Generate New Glaze</button>
    </div>
    {/* System keyboard bar */}
    <div style={{ background: "#D1D5DB", padding: "6px 10px", display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ fontSize: 18 }}>🌍</div>
      <div style={{ flex: 1, background: "white", height: 36, borderRadius: 8, display: "flex", alignItems: "center", padding: "0 12px", color: "#8E8E93", fontSize: 13 }}>GlazeMe Keyboard ✨</div>
      <div style={{ fontSize: 18, color: "#007AFF" }}>⏎</div>
    </div>
  </div>
);

/* ============================================================
   SCREEN 10 — HISTORY & FAVORITES
   ============================================================ */
const Screen10History = ({ time }: { time: string }) => (
  <AppScreen>
    <StatusBar time={time} />
    <DynamicIsland />
    <div className="phone-scroll" style={{ height: "100%", paddingTop: 56 }}>
      {/* Nav */}
      <div style={{ display: "flex", alignItems: "center", padding: "8px 16px 12px", gap: 10 }}>
        <div style={{ width: 34, height: 34, background: "rgba(255,255,255,0.18)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>←</div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 900, color: "white", flex: 1 }}>History</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.15)", padding: "6px 12px", borderRadius: 20, cursor: "pointer" }}>Filter ▾</div>
      </div>

      {/* Stats bar */}
      <div style={{ display: "flex", gap: 8, padding: "0 14px", marginBottom: 14 }}>
        {[["34", "Total"], ["8", "Favs"], ["3", "Friends"]].map(([num, label]) => (
          <div key={label} style={{ flex: 1, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)", borderRadius: 14, padding: "10px 8px", textAlign: "center", border: "1px solid rgba(255,255,255,0.2)" }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 900, color: "white" }}>{num}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Favorites */}
      <div style={{ padding: "0 14px", marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.85)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>⭐ Favorites</div>
        <div style={{ background: "linear-gradient(135deg,rgba(255,229,92,0.18),rgba(255,139,62,0.14))", borderRadius: 18, padding: 16, border: "1.5px solid rgba(255,229,92,0.3)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "white", lineHeight: 1.6, marginBottom: 10 }}>"You're absolutely legendary and I'm genuinely not exaggerating one bit!!"</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#FFE55C" }}>Sarah · Legendary</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>Sent 3 days ago · 💛 She loved it</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["📋", "📤", "✏️"].map(b => (
                <div key={b} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, cursor: "pointer" }}>{b}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* All history */}
      <div style={{ padding: "0 14px", marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.85)", marginBottom: 8 }}>🕐 All History</div>
        {[
          { text: '"SARAH YOU ABSOLUTE LEGENDARY QUEEN!! 👑✨🔥"', friend: "Sarah", date: "Today", tag: "👑", react: "❤️‍🔥" },
          { text: '"Main character energy fr fr no cap!! You BUILT different!!"', friend: "Mike", date: "Yesterday", tag: "🔥", react: "🤯" },
          { text: '"Absolutely iconic, genuinely no one is doing it like you!! 💅"', friend: "Emma", date: "2 days ago", tag: "💅", react: "😭" },
          { text: '"You are the moment, the vibe, AND the bag. CEO behavior!!"', friend: "Alex", date: "3 days ago", tag: "💼", react: "💀" },
        ].map((item, i) => (
          <div key={i} style={{ background: "white", borderRadius: 16, padding: "14px 14px", marginBottom: 10, boxShadow: "0 4px 14px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ fontSize: 14, color: "#0a0a0a", fontWeight: 700, lineHeight: 1.5, flex: 1, marginRight: 8 }}>{item.text}</div>
              <div style={{ fontSize: 22, flexShrink: 0 }}>{item.react}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 22, height: 22, background: "linear-gradient(135deg,#FFE55C,#FF8B3E)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>{item.tag}</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#FF8B3E" }}>{item.friend}</div>
                <div style={{ fontSize: 11, color: "#bbb" }}>· {item.date}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {["⭐","📤"].map(b => (
                  <div key={b} style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, cursor: "pointer" }}>{b}</div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </AppScreen>
);

/* ============================================================
   SCREEN CARD WRAPPER
   ============================================================ */
const ScreenCard = ({ screen, time }: { screen: ScreenDef; time: string }) => {
  const [hovered, setHovered] = useState(false);
  const { ref, inView } = useInView();

  return (
    <div
      ref={ref}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(40px)",
        transition: `opacity 0.7s ${screen.id * 0.05}s ease, transform 0.7s ${screen.id * 0.05}s cubic-bezier(0.22,1,0.36,1)`,
      }}
    >
      <div style={{ position: "relative" }}>
        {/* Number badge */}
        <div style={{
          position: "absolute", top: -16, right: -8, zIndex: 20,
          width: 40, height: 40,
          background: `linear-gradient(135deg, var(--yellow), var(--orange))`,
          borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 18, color: "white",
          boxShadow: `0 4px 16px rgba(255,139,62,0.5)`,
        }}>{screen.id}</div>

        <div
          className="phone-scaler animate-phone-float"
          style={{ transition: "transform 0.5s cubic-bezier(0.22,1,0.36,1)", transform: hovered ? "translateY(-18px) scale(1.025)" : "" }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <IPhoneShell glowColor={screen.id % 2 === 0 ? "rgba(255,92,26,0.28)" : "rgba(255,229,92,0.22)"}>
            {screen.render(time)}
          </IPhoneShell>
        </div>
      </div>

      {/* Info */}
      <div style={{ textAlign: "center", marginTop: 28, maxWidth: 300 }}>
        <div style={{ display: "inline-block", fontSize: 10, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 2, marginBottom: 6, padding: "3px 10px", border: "1px solid var(--border)", borderRadius: 20 }}>{screen.category}</div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 900, color: "white", marginBottom: 6, letterSpacing: -0.5 }}>{screen.label}</div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 12 }}>{screen.desc}</div>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
          {screen.tags.map(t => (
            <span key={t} style={{ fontSize: 10, fontWeight: 700, color: "var(--orange)", background: "rgba(255,139,62,0.1)", border: "1px solid rgba(255,139,62,0.2)", borderRadius: 20, padding: "3px 10px" }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   MARQUEE TICKER
   ============================================================ */
const MarqueeTicker = () => {
  const items = ["✨ 4 Intensity Levels", "🔥 AI-Powered", "⌨️ Keyboard Extension", "👑 10 Screens", "💅 6 Meme Styles", "🚀 iCloud Sync", "💎 Zero Sign-In", "📤 8 Share Targets", "🤖 GPT-4 Engine", "⚡ <2s Generation"];
  return (
    <div style={{ overflow: "hidden", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "14px 0", marginBottom: 80 }}>
      <div className="marquee-track" style={{ display: "flex", gap: 48 }}>
        {[...items, ...items].map((item, i) => (
          <span key={i} style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{item}</span>
        ))}
      </div>
    </div>
  );
};

/* ============================================================
   SECTION HEADER
   ============================================================ */
const SectionHeader = ({ eyebrow, title, subtitle }: { eyebrow: string; title: React.ReactNode; subtitle: string }) => {
  const { ref, inView } = useInView();
  return (
    <div ref={ref} style={{ textAlign: "center", marginBottom: 56, opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(30px)", transition: "all 0.7s cubic-bezier(0.22,1,0.36,1)" }}>
      <div style={{ display: "inline-block", fontSize: 10, fontWeight: 800, color: "var(--orange)", textTransform: "uppercase", letterSpacing: 3, marginBottom: 14, padding: "5px 14px", border: "1px solid rgba(255,139,62,0.3)", borderRadius: 30, background: "rgba(255,139,62,0.08)" }}>{eyebrow}</div>
      <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(30px,5vw,52px)", fontWeight: 900, letterSpacing: -2, lineHeight: 1.05, marginBottom: 16 }}>{title}</h2>
      <p style={{ fontSize: "clamp(14px,2vw,18px)", color: "var(--text-muted)", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>{subtitle}</p>
    </div>
  );
};

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function GlazeMeAdvanced() {
  const time = useLiveClock();
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeScreen, setActiveScreen] = useState<number | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const screens: ScreenDef[] = [
    { id: 1, label: "Splash Screen", category: "Onboarding", desc: "Branded 3-second entry with physics-based loader, pulse rings, and dual-layer spinner.", tags: ["Animation", "Branding", "Physics"], accent: "#FFE55C", render: (t) => <Screen1Splash time={t} /> },
    { id: 2, label: "Home Dashboard", category: "Core", desc: "Glass-morphism UI with live streak tracking, friend grid, daily limit, and activity feed.", tags: ["Glass UI", "Streaks", "Live Data"], accent: "#FF8B3E", render: (t) => <Screen2Home time={t} /> },
    { id: 3, label: "Add Friend Modal", category: "Social", desc: "Context-aware friend onboarding with 3-field intake for personalized AI generation.", tags: ["Modal", "AI Context", "Personalization"], accent: "#FF5C1A", render: (t) => <Screen3AddFriend time={t} /> },
    { id: 4, label: "AI Generator", category: "Core", desc: "4-tier intensity selector, 5 meme styles, and context input — fully interactive controls.", tags: ["AI Engine", "4 Levels", "5 Styles"], accent: "#FFE55C", render: (t) => <Screen4Generator time={t} /> },
    { id: 5, label: "AI Processing", category: "Feedback", desc: "Step-by-step live processing UI with progress tracker, expanded Dynamic Island, and pulse rings.", tags: ["Loading UI", "Progress", "Haptics"], accent: "#FF8B3E", render: (t) => <Screen5Loading time={t} /> },
    { id: 6, label: "Result Preview", category: "Core", desc: "Polished result card with multi-action grid, meta tags, instant send, and keyboard snippet.", tags: ["Result", "Share", "Actions"], accent: "#FF5C1A", render: (t) => <Screen6Result time={t} /> },
    { id: 7, label: "iOS Share Sheet", category: "Sharing", desc: "Native share sheet overlay with 8 platform targets and glaze preview strip.", tags: ["Native Share", "8 Targets", "iOS"], accent: "#FFE55C", render: (t) => <Screen7Share time={t} /> },
    { id: 8, label: "Keyboard Setup", category: "Onboarding", desc: "5-step guided keyboard installation with compatibility badges and visual icons.", tags: ["Setup", "5 Steps", "Keyboard"], accent: "#FF8B3E", render: (t) => <Screen8KeyboardSetup time={t} /> },
    { id: 9, label: "Keyboard Active", category: "Extension", desc: "Full iMessage conversation view with GlazeMe keyboard showing recent glazes and quick-generate.", tags: ["iMessage", "Extension", "In-Context"], accent: "#FF5C1A", render: (t) => <Screen9KeyboardActive time={t} /> },
    { id: 10, label: "History & Favorites", category: "Data", desc: "Complete history view with stats bar, starred favorites, reaction tracking, and filter controls.", tags: ["History", "Favorites", "Analytics"], accent: "#FFE55C", render: (t) => <Screen10History time={t} /> },
  ];

  const categories = ["All", ...Array.from(new Set(screens.map(s => s.category)))];
  const filtered = activeFilter === "All" ? screens : screens.filter(s => s.category === activeFilter);

  const features = [
    { icon: "🎨", title: "Titanium Glass UI", desc: "Premium glass-morphism with iPhone 17 Pro titanium frame, Dynamic Island integration, real side buttons, and multi-layer reflections.", stats: "10 screens" },
    { icon: "🤖", title: "GPT-4 AI Engine", desc: "Advanced generative AI with context memory, friend profiling, and intensity-aware prompting. Sub-2-second generation with streaming UI.", stats: "4 modes" },
    { icon: "⌨️", title: "Universal Keyboard", desc: "iOS keyboard extension with full access, recent/favorites/quick tabs, and inline generation — works across every text field on iOS.", stats: "iOS system-wide" },
    { icon: "🔥", title: "4-Tier Intensity", desc: "Nice → Hype → Legendary → Unhinged. Each tier has its own tone, vocabulary, punctuation style, and personality fingerprint.", stats: "4 tiers" },
    { icon: "💎", title: "Daily Limit System", desc: "9 glazes/day on free tier with animated progress bar, midnight reset, and frictionless premium upgrade flow.", stats: "9 free / day" },
    { icon: "⚡", title: "Zero Sign-In", desc: "Tap and glaze immediately. No email, no password, no barrier. Local-first with optional iCloud sync for cross-device continuity.", stats: "0 friction" },
    { icon: "📤", title: "8-Target Share", desc: "Full native iOS share sheet with iMessage, WhatsApp, Instagram, X, LinkedIn, Email, clipboard copy, and extensible 'More' row.", stats: "8 platforms" },
    { icon: "👥", title: "Friend Context AI", desc: "Named profiles with trait context fields. AI references stored context to personalize every generated compliment uniquely.", stats: "Unlimited friends" },
    { icon: "💾", title: "Smart History + Reactions", desc: "Full history with emoji reaction capture, favorites starring, filter/search, copy, reshare, and edit controls.", stats: "Unlimited history" },
  ];

  const specs = [
    ["Platform", "iOS 17+", ""],
    ["Optimized For", "iPhone 17 Pro", ""],
    ["AI Model", "GPT-4 Turbo", ""],
    ["Generation Speed", "< 2 seconds", ""],
    ["Storage", "iCloud + Local", ""],
    ["Security", "End-to-End Encrypted", ""],
    ["Daily Free Limit", "9 Glazes", ""],
    ["Keyboard", "Full-Access Extension", ""],
    ["Share Targets", "8 Platforms", ""],
    ["Languages", "English (v1)", ""],
  ];

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--text)", overflowX: "hidden" }}>

        {/* ── Ambient orbs ── */}
        {[
          { w: 700, h: 700, c: "#FF8B3E", t: -200, l: -250, d: 0 },
          { w: 600, h: 600, c: "#FFE55C", b: -200, r: -200, d: -7 },
          { w: 500, h: 500, c: "#FF2D55", t: "42%", l: "48%", d: -14 },
        ].map((o, i) => (
          <div key={i} style={{
            position: "fixed", width: o.w, height: o.h, borderRadius: "50%",
            filter: "blur(100px)", opacity: 0.3 - i * 0.04, pointerEvents: "none", zIndex: 0,
            background: `radial-gradient(circle, ${o.c} 0%, transparent 70%)`,
            animation: `orb-drift ${22 + i * 4}s ${o.d}s ease-in-out infinite`,
            top: (o as any).t ?? "auto", left: (o as any).l ?? "auto",
            bottom: (o as any).b ?? "auto", right: (o as any).r ?? "auto",
            transform: i === 2 ? "translate(-50%,-50%)" : undefined,
          }} />
        ))}

        {/* ── Navbar ── */}
        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
          background: scrollY > 60 ? "rgba(9,9,18,0.88)" : "transparent",
          backdropFilter: scrollY > 60 ? "blur(20px) saturate(1.5)" : "none",
          borderBottom: scrollY > 60 ? "1px solid var(--border)" : "1px solid transparent",
          padding: "0 clamp(16px,4vw,48px)",
          height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
          transition: "all 0.3s",
        }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 900, letterSpacing: -0.5 }}>
            <span className="gradient-text-warm">GlazeMe</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ width: 8, height: 8, background: "#30D158", borderRadius: "50%", animation: "glow-badge 2s infinite" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>Client Preview</span>
          </div>
          <button className="cta-btn" style={{ padding: "10px 22px", fontSize: 14 }}>Start Dev →</button>
        </nav>

        {/* ── HERO ── */}
        <header ref={headerRef} style={{ position: "relative", zIndex: 10, paddingTop: "clamp(100px,14vw,140px)", paddingBottom: "clamp(60px,8vw,100px)", paddingLeft: "clamp(16px,4vw,48px)", paddingRight: "clamp(16px,4vw,48px)", maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          {/* Eyebrow */}
          <div className="animate-fade-up" style={{ display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid var(--border-bright)", borderRadius: 40, padding: "8px 20px", marginBottom: 28, backdropFilter: "blur(16px)", background: "rgba(255,255,255,0.04)" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#30D158", boxShadow: "0 0 8px #30D158", animation: "glow-badge 2s infinite" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", letterSpacing: 1.5, textTransform: "uppercase" }}>iPhone 17 Pro · Client Demo Ready</span>
          </div>

          {/* Title */}
          <h1 className="animate-fade-up" style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(42px,9vw,96px)", fontWeight: 900, letterSpacing: "clamp(-3px,-0.07em,-5px)", lineHeight: 1.0, marginBottom: 24, animationDelay: "0.1s" }}>
            <span className="gradient-text">GlazeMe</span>
            <br />
            <span style={{ color: "var(--text-muted)", fontWeight: 700, fontSize: "0.6em" }}>Premium</span>
          </h1>

          <p className="animate-fade-up" style={{ fontSize: "clamp(15px,2.2vw,20px)", color: "var(--text-muted)", maxWidth: 620, margin: "0 auto 44px", lineHeight: 1.7, animationDelay: "0.2s" }}>
            The ultimate <strong style={{ color: "var(--text)", fontWeight: 800 }}>over-the-top compliment app</strong> for iPhone 17 Pro. Titanium glass UI, Dynamic Island, GPT-4 AI, and a universal keyboard extension — all designed to make someone's day.
          </p>

          {/* CTAs */}
          <div className="animate-fade-up" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 60, animationDelay: "0.3s" }}>
            <button className="cta-btn">🚀 Start Development</button>
            <button className="cta-btn-ghost">📋 View Spec Sheet</button>
          </div>

          {/* Stats row */}
          <div className="animate-fade-up" style={{ display: "flex", justifyContent: "center", gap: "clamp(24px,5vw,72px)", flexWrap: "wrap", animationDelay: "0.4s" }}>
            {[["10", "App Screens"], ["50+", "UI Features"], ["4", "Intensity Levels"], ["< 2s", "AI Generation"], ["8", "Share Targets"]].map(([num, label]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <span className="stat-num">{num}</span>
                <div style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </header>

        {/* ── MARQUEE ── */}
        <MarqueeTicker />

        {/* ── SCREENS SECTION ── */}
        <section style={{ position: "relative", zIndex: 10, maxWidth: 1600, margin: "0 auto", padding: "0 clamp(16px,4vw,48px) 160px" }}>
          <SectionHeader
            eyebrow="10 screens · fully interactive"
            title={<><span className="gradient-text">Every Screen,</span><br />Polished to Detail</>}
            subtitle="Hover any phone to explore the UI. Each screen is independently crafted with production-ready interactions and animations."
          />

          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 72 }}>
            {categories.map(cat => (
              <button key={cat} className={`screen-tab ${activeFilter === cat ? "active" : ""}`} onClick={() => setActiveFilter(cat)}>{cat}</button>
            ))}
          </div>

          {/* Grid */}
          <div className="screens-grid">
            {filtered.map(screen => (
              <ScreenCard key={screen.id} screen={screen} time={time} />
            ))}
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section style={{ position: "relative", zIndex: 10, maxWidth: 1300, margin: "0 auto", padding: "0 clamp(16px,4vw,48px) 120px" }}>
          <SectionHeader
            eyebrow="Premium Features"
            title={<><span className="gradient-text">Built for</span> Greatness</>}
            subtitle="Every feature is intentional — from the AI engine to the UI physics. Nothing generic, nothing cookie-cutter."
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px,1fr))", gap: 20 }}>
            {features.map((f, i) => {
              const { ref, inView } = useInView();
              return (
                <div key={f.title} ref={ref} className="feat-card" style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(28px)", transition: `all 0.65s ${i * 0.06}s cubic-bezier(0.22,1,0.36,1)` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div style={{ width: 52, height: 52, background: "linear-gradient(135deg,var(--yellow),var(--orange))", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, boxShadow: "0 8px 20px rgba(255,139,62,0.3)" }}>{f.icon}</div>
                    <div style={{ padding: "4px 10px", background: "rgba(255,139,62,0.1)", border: "1px solid rgba(255,139,62,0.2)", borderRadius: 20, fontSize: 11, fontWeight: 800, color: "var(--orange)" }}>{f.stats}</div>
                  </div>
                  <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, color: "white", marginBottom: 10, letterSpacing: -0.3 }}>{f.title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--text-muted)" }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── TECH SPECS ── */}
        <section style={{ position: "relative", zIndex: 10, maxWidth: 900, margin: "0 auto", padding: "0 clamp(16px,4vw,48px) 120px" }}>
          <SectionHeader
            eyebrow="Technical Specifications"
            title={<>Built on a <span className="gradient-text">Solid Foundation</span></>}
            subtitle="Production-grade architecture with modern iOS standards and enterprise-level security."
          />

          <div style={{ background: "var(--bg2)", borderRadius: 24, border: "1px solid var(--border)", overflow: "hidden" }}>
            {/* Header row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "14px 24px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 2 }}>Specification</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 2 }}>Value</div>
            </div>
            {specs.map(([label, val], i) => (
              <div key={label} className="spec-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "14px 24px", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)" }}>
                <div style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 600 }}>{label}</div>
                <div style={{ fontSize: 14, color: "white", fontWeight: 700 }}>{val}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{ position: "relative", zIndex: 10, textAlign: "center", padding: "0 clamp(16px,4vw,48px) 100px" }}>
          <div style={{ maxWidth: 700, margin: "0 auto", background: "var(--bg2)", borderRadius: 32, border: "1px solid var(--border)", padding: "clamp(40px,6vw,72px) clamp(24px,6vw,64px)", position: "relative", overflow: "hidden" }}>
            {/* Corner glow */}
            <div style={{ position: "absolute", top: -80, right: -80, width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,139,62,0.25),transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -80, left: -80, width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,229,92,0.18),transparent 70%)", pointerEvents: "none" }} />

            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(28px,5vw,48px)", fontWeight: 900, letterSpacing: -2, marginBottom: 16, position: "relative" }}>
              Ready to <span className="gradient-text-warm">Glaze?</span>
            </div>
            <p style={{ fontSize: "clamp(14px,1.8vw,17px)", color: "var(--text-muted)", marginBottom: 32, lineHeight: 1.7 }}>
              This demo represents 10 screens, 50+ UI features, and a complete app architecture ready for development handoff.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button className="cta-btn" style={{ fontSize: 16 }}>🚀 Start Development</button>
              <button className="cta-btn-ghost">💬 Schedule Call</button>
            </div>
            <div style={{ marginTop: 24, display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
              {["✓ Figma source files", "✓ Dev handoff notes", "✓ Asset export pack"].map(item => (
                <div key={item} style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>{item}</div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{ borderTop: "1px solid var(--border)", padding: "28px clamp(16px,4vw,48px)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, position: "relative", zIndex: 10 }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16 }}><span className="gradient-text-warm">GlazeMe</span></div>
          <div style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 600 }}>iPhone 17 Pro Premium Client Demo · {new Date().getFullYear()}</div>
          <div style={{ display: "flex", gap: 16 }}>
            {["Design System", "Dev Spec", "Assets"].map(link => (
              <span key={link} style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700, cursor: "pointer" }}>{link}</span>
            ))}
          </div>
        </footer>
      </div>
    </>
  );
}
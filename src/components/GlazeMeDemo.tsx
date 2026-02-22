import React, { useState, useEffect } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────

interface ScreenProps {
  number: number;
  name: string;
  desc: string;
  tags: string[];
  children: React.ReactNode;
}

interface GlazeMeDemoProps {
  variant?: 'full' | 'minimal' | 'screens-only';
  showHeader?: boolean;
  showFeatures?: boolean;
  showCTA?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onScreenSelect?: (screenNumber: number) => void;
  selectedScreen?: number;
  embedded?: boolean;
}

// ─── Responsive Hook ────────────────────────────────────────────────────────

const useWindowWidth = () => {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
};

// ─── Reusable iPhone Shell ──────────────────────────────────────────────────

const IPhoneShell: React.FC<{ children: React.ReactNode; scale?: number }> = ({ children, scale = 1 }) => {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ position: "relative", transform: `scale(${scale})`, transformOrigin: "top center" }}>
      {/* Titanium frame */}
      <div style={{
        position: "absolute", inset: -2, borderRadius: 67, zIndex: 0,
        background: "linear-gradient(145deg,#d4d4d4 0%,#8b8b8b 20%,#d4d4d4 40%,#8b8b8b 60%,#d4d4d4 80%,#8b8b8b 100%)",
        boxShadow: "0 0 0 1px rgba(0,0,0,.5),0 20px 60px rgba(0,0,0,.4)"
      }} />

      {/* Body */}
      <div style={{
        width: 393, height: 852, borderRadius: 65,
        background: "linear-gradient(145deg,#1a1a1a,#0a0a0a)",
        padding: 12, position: "relative", zIndex: 1,
        boxShadow: "0 25px 50px -12px rgba(0,0,0,.5),inset 0 0 0 1px rgba(255,255,255,.1)",
        transition: "box-shadow .5s ease",
      }}>
        {/* Buttons */}
        {[
          { right: -3, top: 180, width: 4, height: 100, radius: "0 2px 2px 0" },
          { right: -3, top: 300, width: 4, height: 80, radius: "0 2px 2px 0" },
          { left: -3, top: 180, width: 4, height: 60, radius: "2px 0 0 2px" },
          { left: -3, top: 250, width: 4, height: 60, radius: "2px 0 0 2px" },
        ].map((b, i) => (
          <div key={i} style={{
            position: "absolute", ...b as any,
            borderRadius: b.radius,
            background: "linear-gradient(180deg,#d4d4d4,#8b8b8b)"
          }} />
        ))}

        {/* Dynamic Island */}
        <div style={{
          position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)",
          width: 90, height: 28, background: "#000", borderRadius: 20, zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px",
          transition: "all .3s ease"
        }}>
          <div style={{ width: 10, height: 10, background: "#1a1a2a", borderRadius: "50%", position: "relative" }}>
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%,-50%)", width: 4, height: 4,
              background: "#0d3b66", borderRadius: "50%"
            }} />
          </div>
          <div style={{ width: 40, height: 4, background: "#333", borderRadius: 2 }} />
        </div>

        {/* Screen */}
        <div style={{ width: "100%", height: "100%", background: "#000", borderRadius: 55, overflow: "hidden", position: "relative" }}>
          {children}
        </div>
      </div>
    </div>
  );
};

// ─── Status Bar ─────────────────────────────────────────────────────────────

const StatusBar: React.FC<{ time: string; light?: boolean }> = ({ time, light = true }) => (
  <div style={{
    position: "absolute", top: 0, left: 0, right: 0, height: 54,
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "0 35px", fontSize: 15, fontWeight: 700,
    color: light ? "white" : "#1a1a1a", zIndex: 100,
  }}>
    <span style={{ fontVariantNumeric: "tabular-nums" }}>{time}</span>
    <span style={{ fontVariantNumeric: "tabular-nums" }}>{time}</span>
    <span>5G 100%</span>
  </div>
);

// ─── Screen Wrapper Card ────────────────────────────────────────────────────

const ScreenCard: React.FC<ScreenProps & { 
  scale?: number; 
  onClick?: () => void;
  isSelected?: boolean;
  embedded?: boolean;
}> = ({ number, name, desc, tags, children, scale = 1, onClick, isSelected, embedded }) => {
  const [hovered, setHovered] = useState(false);
  const [time, setTime] = useState("");
  const scaledHeight = 852 * scale;

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        position: "relative",
        transition: "all .5s cubic-bezier(.34,1.56,.64,1)",
        transform: hovered && !embedded ? "translateY(-12px) scale(1.02)" : "none",
        zIndex: hovered ? 100 : 1,
        height: scaledHeight + (embedded ? 0 : 120),
        width: 393 * scale + 4,
        flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default',
        outline: isSelected ? '4px solid #FF8C42' : 'none',
        outlineOffset: '4px',
        borderRadius: '12px',
        margin: embedded ? '0 auto' : '0',
      }}
      onMouseEnter={() => !embedded && setHovered(true)}
      onMouseLeave={() => !embedded && setHovered(false)}
      onClick={onClick}
    >
      {/* Screen Number Badge - Hide in embedded mode */}
      {!embedded && (
        <div style={{
          position: "absolute", top: -16, right: 10, width: 38, height: 38, zIndex: 10,
          background: "linear-gradient(135deg,#FFE66D,#FF8C42)", borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 900, fontSize: 17, color: "white",
          boxShadow: "0 4px 15px rgba(0,0,0,.3)"
        }}>{number}</div>
      )}

      <IPhoneShell scale={scale}>
        <ScreenContent time={time}>{children}</ScreenContent>
      </IPhoneShell>

      {/* Label - Hide in embedded mode */}
      {!embedded && (
        <div style={{ position: "absolute", top: scaledHeight + 16, left: "50%", transform: "translateX(-50%)", textAlign: "center", width: "100%" }}>
          <div style={{ fontSize: scale < 0.7 ? 15 : 18, fontWeight: 800, marginBottom: 6, color: "white", whiteSpace: "nowrap" }}>{name}</div>
          <div style={{ fontSize: 12, opacity: 0.7, color: "rgba(255,255,255,.8)", padding: "0 8px" }}>{desc}</div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
            {tags.map(t => (
              <span key={t} style={{
                background: "rgba(255,255,255,.1)", padding: "4px 10px", borderRadius: 20,
                fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: .5,
                border: "1px solid rgba(255,255,255,.1)", color: "white"
              }}>{t}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ScreenContent: React.FC<{ time: string; children: React.ReactNode }> = ({ time, children }) => (
  <>{children}</>
);

// ─── App Gradient Wrapper ───────────────────────────────────────────────────

const AppGradient: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{
    width: "100%", height: "100%", overflowY: "auto", overflowX: "hidden",
    background: "linear-gradient(180deg,#FFE66D 0%,#FF8C42 50%,#FF6B35 100%)",
    position: "relative", paddingTop: 60,
    scrollbarWidth: "none",
    ...style
  }}>
    {children}
  </div>
);

// ─── Screen 1: Splash ───────────────────────────────────────────────────────

const SplashScreen: React.FC<{ time: string }> = ({ time }) => (
  <AppGradient>
    <StatusBar time={time} />
    <style>{`
      @keyframes glow-pulse { 0%,100%{transform:scale(1);opacity:.5} 50%{transform:scale(1.2);opacity:.8} }
      @keyframes sparkle-float { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-10px) rotate(10deg)} }
      @keyframes spin { to{transform:rotate(360deg)} }
      @keyframes core-pulse { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-50%,-50%) scale(1.2)} }
      @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
      @keyframes badge-glow { 0%,100%{box-shadow:0 4px 15px rgba(255,140,66,.3)} 50%{box-shadow:0 4px 30px rgba(255,140,66,.6)} }
      @keyframes bounce-right { 0%,100%{transform:translateX(0)} 50%{transform:translateX(5px)} }
      @keyframes dot-pulse { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
      @keyframes float-icon { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
      @keyframes loading-bounce { 0%,100%{transform:translateY(0) rotate(0deg) scale(1)} 25%{transform:translateY(-30px) rotate(10deg) scale(1.1)} 50%{transform:translateY(0) rotate(0deg) scale(1)} 75%{transform:translateY(-15px) rotate(-5deg) scale(1.05)} }
      @keyframes float-ambient { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(50px,-50px) scale(1.1)} 66%{transform:translate(-30px,30px) scale(.9)} }
      @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:.5} }
    `}</style>
    <div style={{
      height: "100%", display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center", textAlign: "center",
      color: "white", padding: 40, position: "relative", overflow: "hidden"
    }}>
      <div style={{
        position: "absolute", width: 300, height: 300,
        background: "radial-gradient(circle,rgba(255,255,255,.3),transparent 70%)",
        borderRadius: "50%", animation: "glow-pulse 3s infinite"
      }} />
      <div style={{
        fontSize: 52, fontWeight: 900, marginBottom: 20, position: "relative", zIndex: 1,
        textShadow: "0 4px 30px rgba(0,0,0,.2)"
      }}>
        GlazeMe
        <span style={{
          position: "absolute", top: -20, right: -40, fontSize: 40,
          animation: "sparkle-float 3s infinite"
        }}>✨</span>
      </div>
      <div style={{ fontSize: 18, opacity: .95, fontWeight: 500, marginBottom: 50, position: "relative", zIndex: 1 }}>
        Make someone's day,<br />over the top
      </div>
      <div style={{ width: 60, height: 60, position: "relative", zIndex: 1 }}>
        <div style={{ position: "absolute", inset: 0, border: "4px solid rgba(255,255,255,.2)", borderTopColor: "white", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", width: 20, height: 20, background: "white", borderRadius: "50%", animation: "core-pulse 1s infinite", transform: "translate(-50%,-50%)" }} />
      </div>
    </div>
  </AppGradient>
);

// ─── Screen 2: Home ─────────────────────────────────────────────────────────

const HomeScreen: React.FC<{ time: string }> = ({ time }) => (
  <AppGradient>
    <StatusBar time={time} />
    <div style={{ padding: "70px 24px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "white" }}>
      <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1 }}>GlazeMe 🔥</div>
      <div style={{ display: "flex", gap: 12 }}>
        {["⌨️", "⚙️"].map(icon => (
          <div key={icon} style={{
            width: 44, height: 44, background: "rgba(255,255,255,.15)", backdropFilter: "blur(20px)",
            borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, border: "1px solid rgba(255,255,255,.2)", cursor: "pointer"
          }}>{icon}</div>
        ))}
      </div>
    </div>
    <div style={{
      background: "rgba(255,255,255,.15)", backdropFilter: "blur(20px)", borderRadius: 24,
      padding: 20, margin: "0 24px 24px", border: "1px solid rgba(255,255,255,.2)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, color: "white" }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>🌟 <span style={{ fontSize: 28, fontWeight: 900 }}>9</span>/9 left</div>
        <div style={{ background: "rgba(255,255,255,.2)", padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, color: "white" }}>Daily</div>
      </div>
      <div style={{ height: 8, background: "rgba(0,0,0,.2)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", background: "linear-gradient(90deg,#fff,#FFE66D)", borderRadius: 4, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent)", animation: "shimmer 2s infinite" }} />
        </div>
      </div>
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0 24px 20px", color: "white" }}>
      <div style={{ fontSize: 22, fontWeight: 800 }}>Who deserves love?</div>
      <div style={{ fontSize: 14, fontWeight: 700, padding: "8px 16px", background: "rgba(255,255,255,.15)", borderRadius: 20 }}>+ Add</div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, padding: "0 24px", marginBottom: 24 }}>
      {[{ init: "S", name: "Sarah", streak: 5 }, { init: "M", name: "Mike", streak: 2 }, { init: "+", name: "Add", streak: null }].map((f) => (
        <div key={f.name} style={{
          background: f.streak === null ? "rgba(255,255,255,.1)" : "white",
          borderRadius: 24, padding: "20px 8px", textAlign: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,.1)", cursor: "pointer",
          border: f.streak === null ? "2px dashed rgba(255,255,255,.4)" : "none"
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%", margin: "0 auto 12px",
            background: "linear-gradient(135deg,#FFE66D,#FF8C42)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: f.streak === null ? 28 : 22, fontWeight: 800, color: "white",
            boxShadow: "0 4px 15px rgba(255,140,66,.3)"
          }}>{f.init}</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: f.streak === null ? "white" : "#1a1a1a", marginBottom: 6 }}>{f.name}</div>
          {f.streak && <div style={{ fontSize: 13, color: "#FF8C42", fontWeight: 800 }}>🔥 {f.streak}</div>}
        </div>
      ))}
    </div>
    <div style={{ background: "white", margin: "0 24px", borderRadius: 28, padding: 24, boxShadow: "0 8px 32px rgba(0,0,0,.1)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#1a1a1a" }}>Recent Glazes</div>
        <div style={{ fontSize: 13, color: "#666", fontWeight: 600 }}>See All →</div>
      </div>
      {[
        { text: '"You\'re absolutely legendary..."', meta: "Sarah • 2m ago" },
        { text: '"Main character energy fr fr..."', meta: "Mike • 1h ago" }
      ].map((item) => (
        <div key={item.meta} style={{
          padding: 16, background: "rgba(255,230,109,.1)", borderRadius: 16,
          display: "flex", alignItems: "center", gap: 12, marginBottom: 12,
          cursor: "pointer", border: "1px solid transparent"
        }}>
          <div style={{
            width: 44, height: 44, background: "linear-gradient(135deg,#FFE66D,#FF8C42)",
            borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0
          }}>💬</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, color: "#1a1a1a", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 4 }}>{item.text}</div>
            <div style={{ fontSize: 13, color: "#666", fontWeight: 500 }}>{item.meta}</div>
          </div>
        </div>
      ))}
    </div>
  </AppGradient>
);

// ─── Screen 3: Add Friend Modal ─────────────────────────────────────────────

const AddFriendScreen: React.FC<{ time: string }> = ({ time }) => (
  <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
  <AppGradient style={{ overflow: "hidden" }}>
    <StatusBar time={time} />
    <div style={{ filter: "blur(3px) brightness(0.7)", padding: "70px 24px 24px" }}>
      <div style={{ fontSize: 32, fontWeight: 900, color: "white", marginBottom: 20 }}>GlazeMe 🔥</div>
      <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 24, padding: 20, height: 80 }} />
    </div>
  </AppGradient>
  <div style={{
    position: "absolute", inset: 0, background: "rgba(0,0,0,.5)", backdropFilter: "blur(8px)",
    display: "flex", alignItems: "flex-end", zIndex: 1000
  }}>
    <div style={{
      background: "white", borderRadius: "40px 40px 0 0", padding: 32, width: "100%",
      animation: "modal-up .4s cubic-bezier(.34,1.56,.64,1)"
    }}>
        <div style={{ width: 40, height: 5, background: "rgba(0,0,0,.2)", borderRadius: 3, margin: "0 auto 28px" }} />
        <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 24, color: "#1a1a1a" }}>Add Friend</div>
        {[{ label: "Friend's Name", placeholder: "e.g., Jessica" }, { label: "What makes them awesome?", placeholder: "e.g., Always supportive" }].map(field => (
          <div key={field.label} style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 700, color: "#1a1a1a", fontSize: 14 }}>{field.label}</label>
            <input readOnly placeholder={field.placeholder} style={{
              width: "100%", padding: 16, border: "2px solid rgba(0,0,0,.08)",
              borderRadius: 16, fontSize: 16, fontFamily: "inherit", background: "white", color: "#999"
            }} />
          </div>
        ))}
        <button style={{
          width: "100%", padding: 20, background: "linear-gradient(135deg,#FFE66D,#FF8C42)",
          border: "none", borderRadius: 20, color: "white", fontSize: 18, fontWeight: 900, cursor: "pointer"
        }}>💛 Add Friend</button>
      </div>
    </div>
  </div>
);

// ─── Screen 4: Generator ─────────────────────────────────────────────────────

const GeneratorScreen: React.FC<{ time: string }> = ({ time }) => {
  const [activeIntensity, setActiveIntensity] = useState(2);
  const [activeStyle, setActiveStyle] = useState(0);

  const intensities = [
    { emoji: "😊", name: "Nice", desc: "Subtle" },
    { emoji: "🚀", name: "Hype", desc: "High energy" },
    { emoji: "👑", name: "LEGENDARY", desc: "All caps" },
    { emoji: "🤪", name: "UNHINGED", desc: "Chaos mode", wild: true },
  ];
  const styles = ["👯 Bestie", "📜 Poetic", "💼 CEO", "🌪️ Chaos"];

  return (
    <AppGradient>
      <StatusBar time={time} />
      <div style={{ display: "flex", alignItems: "center", padding: "70px 24px 24px", color: "white", gap: 16 }}>
        <div style={{ width: 40, height: 40, background: "rgba(255,255,255,.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, cursor: "pointer" }}>←</div>
        <div style={{ fontSize: 20, fontWeight: 800 }}>New Glaze</div>
        <div style={{ width: 40, height: 40, background: "rgba(255,255,255,.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "auto", fontSize: 18 }}>ℹ️</div>
      </div>
      <div style={{ padding: "0 24px 100px" }}>
        <div style={{ background: "white", borderRadius: 28, padding: 30, marginBottom: 24, textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,.1)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "linear-gradient(90deg,#FFE66D,#FF8C42)" }} />
          <div style={{ fontSize: 13, color: "#666", textTransform: "uppercase", letterSpacing: 2, fontWeight: 700, marginBottom: 8 }}>Glazing Target</div>
          <div style={{ fontSize: 32, fontWeight: 900, background: "linear-gradient(135deg,#FF8C42,#FF6B35)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Sarah 💛</div>
        </div>
        <div style={{ background: "white", borderRadius: 28, padding: 24, marginBottom: 20, boxShadow: "0 4px 20px rgba(0,0,0,.08)" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#666", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 16 }}>🔥 How "over the top"?</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {intensities.map((btn, i) => (
              <div key={btn.name} onClick={() => setActiveIntensity(i)} style={{
                padding: "20px 12px", border: `2px solid ${activeIntensity === i ? "transparent" : (btn as any).wild ? "#FF2D55" : "rgba(0,0,0,.08)"}`,
                borderRadius: 20, textAlign: "center", cursor: "pointer",
                background: activeIntensity === i ? ((btn as any).wild ? "linear-gradient(135deg,#FF2D55,#ff1a1a)" : "linear-gradient(135deg,#FFE66D,#FF8C42)") : "white",
                color: activeIntensity === i ? "white" : (btn as any).wild ? "#FF2D55" : "inherit",
                transform: activeIntensity === i ? "scale(1.05)" : "none",
                boxShadow: activeIntensity === i ? `0 8px 25px ${(btn as any).wild ? "rgba(255,45,85,.4)" : "rgba(255,140,66,.4)"}` : "none",
                transition: "all .3s cubic-bezier(.34,1.56,.64,1)"
              }}>
                <span style={{ fontSize: 32, display: "block", marginBottom: 8 }}>{btn.emoji}</span>
                <span style={{ fontSize: 14, fontWeight: 800, display: "block", marginBottom: 4 }}>{btn.name}</span>
                <span style={{ fontSize: 11, opacity: .8 }}>{btn.desc}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: "white", borderRadius: 28, padding: 24, marginBottom: 20, boxShadow: "0 4px 20px rgba(0,0,0,.08)" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#666", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 16 }}>🎨 Meme Vibe</div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 5, scrollbarWidth: "none" }}>
            {styles.map((s, i) => (
              <div key={s} onClick={() => setActiveStyle(i)} style={{
                padding: "14px 24px", border: `2px solid ${activeStyle === i ? "#1a1a1a" : "rgba(0,0,0,.08)"}`,
                borderRadius: 25, whiteSpace: "nowrap", fontWeight: 700, fontSize: 15, cursor: "pointer",
                background: activeStyle === i ? "#1a1a1a" : "white",
                color: activeStyle === i ? "white" : "inherit",
                transform: activeStyle === i ? "scale(1.05)" : "none",
                transition: "all .3s ease", flexShrink: 0
              }}>{s}</div>
            ))}
          </div>
        </div>
        <div style={{ background: "white", borderRadius: 28, padding: 24, marginBottom: 20, boxShadow: "0 4px 20px rgba(0,0,0,.08)" }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#666", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 16 }}>📝 Context</div>
          <textarea readOnly placeholder="Why are you glazing them?" rows={2} style={{
            width: "100%", padding: 18, border: "2px solid rgba(0,0,0,.08)", borderRadius: 20,
            fontSize: 16, resize: "none", fontFamily: "inherit", background: "white", color: "#999"
          }} />
        </div>
        <button style={{
          width: "100%", padding: 24, background: "linear-gradient(135deg,#FFE66D,#FF8C42)",
          border: "none", borderRadius: 24, color: "white", fontSize: 18, fontWeight: 900,
          cursor: "pointer", boxShadow: "0 8px 30px rgba(255,140,66,.4)",
          textTransform: "uppercase", letterSpacing: 1, position: "relative", overflow: "hidden"
        }}>✨ GENERATE GLAZE</button>
      </div>
    </AppGradient>
  );
};

// ─── Screen 5: Loading ───────────────────────────────────────────────────────

const LoadingScreen: React.FC<{ time: string }> = ({ time }) => (
  <AppGradient>
    <StatusBar time={time} />
    <div style={{
      height: "100%", display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center", color: "white", textAlign: "center", padding: 40
    }}>
      <div style={{ fontSize: 80, marginBottom: 40, animation: "loading-bounce 1.2s infinite", filter: "drop-shadow(0 10px 30px rgba(0,0,0,.2))" }}>✨🔥✨</div>
      <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 12 }}>Creating your glaze...</div>
      <div style={{ fontSize: 16, opacity: .9, marginBottom: 40 }}>AI is cooking up something legendary</div>
      <div style={{ display: "flex", gap: 12 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 14, height: 14, background: "white", borderRadius: "50%",
            animation: `dot-pulse 1.4s infinite ease-in-out both`,
            animationDelay: `${[-0.32, -0.16, 0][i]}s`
          }} />
        ))}
      </div>
    </div>
  </AppGradient>
);

// ─── Screen 6: Preview / Result ─────────────────────────────────────────────

const PreviewScreen: React.FC<{ time: string }> = ({ time }) => (
  <AppGradient>
    <StatusBar time={time} />
    <div style={{ display: "flex", alignItems: "center", padding: "70px 24px 24px", color: "white", gap: 16 }}>
      <div style={{ width: 40, height: 40, background: "rgba(255,255,255,.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>←</div>
      <div style={{ fontSize: 20, fontWeight: 800 }}>Your Glaze</div>
      <div style={{ width: 40, height: 40, background: "rgba(255,255,255,.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "auto" }}>📤</div>
    </div>
    <div style={{ padding: 24 }}>
      <div style={{ background: "white", borderRadius: 32, padding: "40px 30px", boxShadow: "0 20px 60px rgba(0,0,0,.2)", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: "linear-gradient(90deg,#FFE66D,#FF8C42,#FF6B35)" }} />
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 24px", background: "linear-gradient(135deg,#FFE66D,#FF8C42)", color: "white", borderRadius: 30, fontSize: 13, fontWeight: 900, textTransform: "uppercase", letterSpacing: 2, marginBottom: 30, animation: "badge-glow 2s infinite" }}>✨ THE GLAZE ✨</div>
        <div style={{ fontSize: 20, lineHeight: 1.6, color: "#1a1a1a", fontWeight: 800, margin: "30px 0", padding: 30, background: "linear-gradient(135deg,rgba(255,230,109,.15),rgba(255,140,66,.15))", borderRadius: 24, borderLeft: "5px solid #FF8C42", textAlign: "left", position: "relative" }}>
          <span style={{ position: "absolute", top: 10, left: 15, fontSize: 80, color: "rgba(255,140,66,.15)", fontFamily: "Georgia,serif", lineHeight: 1 }}>"</span>
          "SARAH YOU ABSOLUTE LEGENDARY QUEEN!! 👑✨🔥 The way you just exist is absolutely ICONIC!! MAIN CHARACTER ENERGY FR FR!! 💅"
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 30, flexWrap: "wrap" }}>
          {["🔥 Legendary", "👯 Bestie", "🤖 AI"].map(tag => (
            <div key={tag} style={{ padding: "8px 16px", background: "rgba(0,0,0,.05)", borderRadius: 20, fontSize: 13, fontWeight: 700, color: "#666" }}>{tag}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {["🔄 New", "⭐ Save"].map(a => (
            <button key={a} style={{ padding: 18, borderRadius: 20, border: "none", fontWeight: 800, fontSize: 15, cursor: "pointer", background: "rgba(0,0,0,.05)", color: "#1a1a1a" }}>{a}</button>
          ))}
          <button style={{ padding: 22, borderRadius: 20, border: "none", fontWeight: 800, fontSize: 17, cursor: "pointer", background: "linear-gradient(135deg,#34C759,#30D158)", color: "white", gridColumn: "span 2", boxShadow: "0 8px 25px rgba(52,199,89,.4)" }}>📤 SHARE TO MAKE THEM SMILE</button>
        </div>
      </div>
      <div style={{ marginTop: 24, background: "#F2F2F7", borderRadius: 24, padding: 20 }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          {["Recent", "⭐ Fav", "⚡ Quick"].map((t, i) => (
            <div key={t} style={{ padding: "10px 20px", borderRadius: 20, fontSize: 14, fontWeight: 700, background: i === 0 ? "linear-gradient(135deg,#FFE66D,#FF8C42)" : "white", color: i === 0 ? "white" : "#1a1a1a", boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>{t}</div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 12, fontWeight: 600 }}>🌟 8 of 9 left today</div>
        <div style={{ background: "white", padding: 16, borderRadius: 14, borderLeft: "4px solid #FF8C42", boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
          <div style={{ fontWeight: 700, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>"SARAH YOU ABSOLUTE LEGENDARY..."</div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Available in keyboard extension</div>
        </div>
      </div>
    </div>
  </AppGradient>
);

// ─── Screen 7: Share Sheet ───────────────────────────────────────────────────

const ShareSheetScreen: React.FC<{ time: string }> = ({ time }) => (
  <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
    <AppGradient style={{ overflow: "hidden" }}>
      <StatusBar time={time} />
      <div style={{ filter: "blur(4px) brightness(.6)", transform: "scale(.95)", padding: "70px 24px" }}>
        <div style={{ background: "white", borderRadius: 32, padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#1a1a1a" }}>"SARAH YOU ABSOLUTE..."</div>
        </div>
      </div>
    </AppGradient>
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)", backdropFilter: "blur(10px)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 20, zIndex: 1000 }}>
      <div style={{ background: "rgba(255,255,255,.95)", borderRadius: 28, padding: 28, width: "100%", maxWidth: 360 }}>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 24, textAlign: "center", color: "#1a1a1a" }}>Share Glaze</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
          {[
            { icon: "💬", bg: "#34C759", label: "iMessage" },
            { icon: "📱", bg: "#25D366", label: "WhatsApp" },
            { icon: "📸", bg: "#E4405F", label: "Instagram" },
            { icon: "𝕏", bg: "#000", label: "Twitter" },
            { icon: "💼", bg: "#0A66C2", label: "LinkedIn" },
            { icon: "📧", bg: "#FF4500", label: "Email" },
            { icon: "📋", bg: "#636E72", label: "Copy" },
            { icon: "⋯", bg: "#636E72", label: "More" },
          ].map(app => (
            <div key={app.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: app.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, boxShadow: "0 4px 12px rgba(0,0,0,.1)", cursor: "pointer" }}>{app.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#666" }}>{app.label}</div>
            </div>
          ))}
        </div>
        <button style={{ width: "100%", padding: 16, background: "rgba(0,0,0,.05)", border: "none", borderRadius: 16, fontWeight: 700, fontSize: 17, color: "#1a1a1a", cursor: "pointer" }}>Cancel</button>
      </div>
    </div>
  </div>
);

// ─── Screen 8: Keyboard Setup ────────────────────────────────────────────────

const KeyboardSetupScreen: React.FC<{ time: string }> = ({ time }) => (
  <AppGradient>
    <StatusBar time={time} />
    <div style={{ display: "flex", alignItems: "center", padding: "70px 24px 24px", color: "white", gap: 16 }}>
      <div style={{ width: 40, height: 40, background: "rgba(255,255,255,.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>←</div>
      <div style={{ fontSize: 20, fontWeight: 800 }}>Keyboard</div>
    </div>
    <div style={{ background: "white", borderRadius: 32, padding: 40, margin: "0 24px 24px", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,.1)" }}>
      <span style={{ fontSize: 80, display: "block", marginBottom: 24, animation: "float-icon 3s ease-in-out infinite" }}>⌨️</span>
      <div style={{ fontSize: 28, fontWeight: 900, color: "#1a1a1a", marginBottom: 12 }}>Glaze Anywhere</div>
      <div style={{ fontSize: 15, color: "#666", lineHeight: 1.6 }}>Add GlazeMe to your keyboard to bring joy to any conversation.</div>
    </div>
    <div style={{ background: "white", borderRadius: 28, padding: 30, margin: "0 24px 24px", boxShadow: "0 4px 16px rgba(0,0,0,.08)" }}>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 24, color: "#1a1a1a" }}>📱 Installation Steps</div>
      {[
        { text: "Open iPhone Settings", hint: "Look for the gray gear icon" },
        { text: "Go to General → Keyboard", hint: "Scroll down to find Keyboard settings" },
        { text: 'Tap "Keyboards" → "Add New"', hint: "You'll see third-party keyboards" },
        { text: 'Select "GlazeMe"', hint: "Look for our orange-yellow icon" },
        { text: 'Enable "Allow Full Access"', hint: "Required for AI generation" },
      ].map((step, i) => (
        <div key={i} style={{ display: "flex", gap: 16, marginBottom: 24, position: "relative" }}>
          {i < 4 && <div style={{ position: "absolute", left: 20, top: 48, width: 2, height: 24, background: "linear-gradient(180deg,#FF8C42,transparent)" }} />}
          <div style={{ width: 44, height: 44, background: "linear-gradient(135deg,#FFE66D,#FF8C42)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: 18, flexShrink: 0, boxShadow: "0 4px 12px rgba(255,140,66,.3)" }}>{i + 1}</div>
          <div style={{ flex: 1, paddingTop: 10 }}>
            <div style={{ fontWeight: 700, color: "#1a1a1a", fontSize: 16, lineHeight: 1.5 }}>{step.text}</div>
            <div style={{ fontSize: 13, color: "#666", marginTop: 6 }}>{step.hint}</div>
          </div>
        </div>
      ))}
    </div>
  </AppGradient>
);

// ─── Screen 9: Keyboard Active ───────────────────────────────────────────────

const KeyboardActiveScreen: React.FC<{ time: string }> = ({ time }) => (
  <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "white" }}>
    <div style={{ padding: "60px 20px 15px", background: "#F2F2F7", borderBottom: "1px solid rgba(0,0,0,.1)", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ fontSize: 22, color: "#007AFF" }}>←</div>
      <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#FFE66D,#FF8C42)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", fontSize: 16 }}>S</div>
      <div style={{ fontWeight: 700, flex: 1, color: "#1a1a1a" }}>Sarah</div>
    </div>
    <div style={{ flex: 1, background: "white", padding: 20 }}>
      <div style={{ background: "#E9E9EB", padding: "12px 16px", borderRadius: "20px 20px 20px 4px", display: "inline-block", maxWidth: "75%", marginBottom: 12, color: "#1a1a1a", fontSize: 15 }}>Hey! How's it going? 👋</div>
      <div style={{ background: "#34C759", padding: "12px 16px", borderRadius: "20px 20px 4px 20px", display: "inline-block", maxWidth: "75%", marginLeft: "auto", color: "white", float: "right", clear: "both", fontSize: 15 }}>Good! Just wanted to say...</div>
      <div style={{ clear: "both" }} />
    </div>
    <div style={{ background: "#F2F2F7", padding: 12, borderTop: "1px solid rgba(0,0,0,.1)" }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        {["Recent", "⭐ Fav", "⚡ Quick"].map((t, i) => (
          <div key={t} style={{ padding: "8px 16px", background: i === 0 ? "linear-gradient(135deg,#FFE66D,#FF8C42)" : "white", borderRadius: 18, fontSize: 13, fontWeight: 700, color: i === 0 ? "white" : "#1a1a1a", boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>{t}</div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: "#666", marginBottom: 10, fontWeight: 600 }}>🌟 8 of 9 left today</div>
      {['"SARAH YOU ABSOLUTE LEGENDARY QUEEN!! 👑"', '"Main character energy fr fr!! 🔥"'].map((text, i) => (
        <div key={i} style={{ background: "white", padding: 14, borderRadius: 12, marginBottom: 10, borderLeft: "3px solid #FF8C42", boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{text}</div>
          <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>{i === 0 ? "Just now • Tap to insert" : "1h ago"}</div>
        </div>
      ))}
      <button style={{ width: "100%", padding: 14, background: "linear-gradient(135deg,#FFE66D,#FF8C42)", border: "none", borderRadius: 12, color: "white", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>✨ Generate New</button>
    </div>
    <div style={{ background: "#D1D5DB", padding: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ fontSize: 22 }}>🌍</div>
      <div style={{ background: "white", flex: 1, margin: "0 10px", height: 40, borderRadius: 8, display: "flex", alignItems: "center", padding: "0 12px", color: "#666", fontSize: 15, fontWeight: 600 }}>GlazeMe Keyboard Active</div>
      <div style={{ fontSize: 22, color: "#007AFF" }}>⏎</div>
    </div>
  </div>
);

// ─── Screen 10: History ──────────────────────────────────────────────────────

const HistoryScreen: React.FC<{ time: string }> = ({ time }) => (
  <AppGradient>
    <StatusBar time={time} />
    <div style={{ display: "flex", alignItems: "center", padding: "70px 24px 24px", color: "white", gap: 16 }}>
      <div style={{ width: 40, height: 40, background: "rgba(255,255,255,.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>←</div>
      <div style={{ fontSize: 20, fontWeight: 800 }}>History</div>
    </div>
    <div style={{ padding: "0 24px" }}>
      <div style={{ background: "linear-gradient(135deg,rgba(255,230,109,.1),rgba(255,140,66,.1))", border: "2px solid rgba(255,140,66,.2)", borderRadius: 24, padding: 24, marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16, color: "#1a1a1a" }}>⭐ Favorites</div>
        <div style={{ fontSize: 16, color: "#1a1a1a", fontWeight: 700, lineHeight: 1.5, marginBottom: 12 }}>"You're absolutely legendary and I'm not even exaggerating!!"</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 14, color: "#FF8C42", fontWeight: 800 }}>Sarah • Legendary</span>
          <div style={{ display: "flex", gap: 8 }}>
            {["📋", "📤"].map(b => (
              <button key={b} style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "rgba(0,0,0,.05)", fontSize: 16, cursor: "pointer" }}>{b}</button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ fontWeight: 800, fontSize: 18, margin: "24px 0 16px", color: "white" }}>🕐 All History</div>
      {[
        { text: '"SARAH YOU ABSOLUTE LEGENDARY QUEEN!! 👑✨🔥"', meta: "Sarah • Today" },
        { text: '"Main character energy fr fr no cap!! 🔥"', meta: "Mike • Yesterday" },
        { text: '"Built different, absolutely iconic!! 💅"', meta: "Emma • 2 days ago" },
      ].map(item => (
        <div key={item.meta} style={{ background: "white", borderRadius: 24, padding: 24, marginBottom: 16, boxShadow: "0 4px 16px rgba(0,0,0,.08)" }}>
          <div style={{ fontSize: 16, color: "#1a1a1a", fontWeight: 700, lineHeight: 1.5, marginBottom: 12 }}>{item.text}</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, color: "#FF8C42", fontWeight: 800 }}>{item.meta}</span>
            <div style={{ display: "flex", gap: 8 }}>
              {["⭐", "📤"].map(b => (
                <button key={b} style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "rgba(0,0,0,.05)", fontSize: 16, cursor: "pointer" }}>{b}</button>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  </AppGradient>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const GlazeMeDemo: React.FC<GlazeMeDemoProps> = ({
  variant = 'full',
  showHeader = true,
  showFeatures = true,
  showCTA = true,
  className = '',
  style = {},
  onScreenSelect,
  selectedScreen,
  embedded = false
}) => {
  const [time, setTime] = useState("");
  const windowWidth = useWindowWidth();

  // Responsive phone scale with improved mobile handling
  const getPhoneScale = () => {
    if (embedded) {
      if (windowWidth < 380) return 0.35;
      if (windowWidth < 480) return 0.4;
      if (windowWidth < 640) return 0.45;
      return 0.5;
    }
    // Make phones smaller on mobile for better fit
    if (windowWidth < 380) return 0.35;
    if (windowWidth < 480) return 0.4;
    if (windowWidth < 640) return 0.45;
    if (windowWidth < 900) return 0.55;
    if (windowWidth < 1200) return 0.65;
    return 0.75;
  };

  const phoneScale = getPhoneScale();
  const phoneHeight = 852 * phoneScale;

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const screens: Array<Omit<ScreenProps, "children"> & { Screen: React.FC<{ time: string }> }> = [
    { number: 1, name: "Splash Screen", desc: "3-second branded entry with physics-based loader", tags: ["Animation", "Branding"], Screen: SplashScreen },
    { number: 2, name: "Home Dashboard", desc: "Glass-morphism UI with friend management", tags: ["Glass UI", "Streaks", "Limit System"], Screen: HomeScreen },
    { number: 3, name: "Add Friend Modal", desc: "Context-aware friend onboarding", tags: ["Modal UI", "Context AI"], Screen: AddFriendScreen },
    { number: 4, name: "AI Generator", desc: "4 intensity levels + meme styles", tags: ["AI Engine", "4 Levels", "Meme Styles"], Screen: GeneratorScreen },
    { number: 5, name: "AI Processing", desc: "2-3 second generation with haptics", tags: ["Loading UI", "Haptics"], Screen: LoadingScreen },
    { number: 6, name: "Result Preview", desc: "Share, save, or regenerate with one tap", tags: ["Share Sheet", "Favorites", "Keyboard"], Screen: PreviewScreen },
    { number: 7, name: "iOS Share Sheet", desc: "Native sharing to all platforms", tags: ["Native Share", "8 Apps"], Screen: ShareSheetScreen },
    { number: 8, name: "Keyboard Setup", desc: "5-step guided installation", tags: ["Onboarding", "iOS Keyboard"], Screen: KeyboardSetupScreen },
    { number: 9, name: "Keyboard Active", desc: "In Messages app with quick access", tags: ["iMessage", "Quick Gen", "Favorites"], Screen: KeyboardActiveScreen },
    { number: 10, name: "History & Favorites", desc: "Manage and reuse past glazes", tags: ["History", "Favorites", "Quick Share"], Screen: HistoryScreen },
  ];

  const features = [
    { icon: "🎨", title: "Titanium Glass UI", desc: "Premium glass-morphism design with iPhone 17 Pro titanium finish. Dynamic Island integration and fluid animations throughout." },
    { icon: "🤖", title: "GPT-4 AI Engine", desc: "Advanced AI generates personalized compliments based on intensity, style, and context. From subtle to absolutely unhinged." },
    { icon: "⌨️", title: "Universal Keyboard", desc: "iOS keyboard extension works in Messages, WhatsApp, Instagram, Twitter, and any app with a text field." },
    { icon: "🔥", title: "4-Tier Intensity", desc: "Nice, Hype, Legendary, and Unhinged modes. Each with distinct personality from gentle encouragement to chaotic energy." },
    { icon: "💎", title: "Daily Limit System", desc: "9 free generations per day with beautiful progress tracking. Resets at midnight. Premium upgrade for unlimited access." },
    { icon: "⚡", title: "Zero Sign-In", desc: "No authentication barriers. Open app and start glazing immediately. Local storage with optional iCloud sync." },
    { icon: "📤", title: "Native iOS Share", desc: "Full iOS share sheet integration. Send to Messages, WhatsApp, Instagram, Twitter, LinkedIn, Email, or copy to clipboard." },
    { icon: "👥", title: "Friend Context AI", desc: "Add friends with custom context. AI remembers what makes them special and personalizes every compliment." },
    { icon: "💾", title: "Smart History", desc: "Automatic history tracking with favorites. Reuse your best glazes with one tap from keyboard or app." },
  ];

  const specs = [
    ["Platform", "iOS 17+"], ["Device", "iPhones"], ["AI Model", "GPT-4 Turbo"],
    ["Storage", "Local Storage"], ["Security", "End-to-End"], ["Languages", "English"],
  ];

  const isMobile = windowWidth < 640;
  const isTablet = windowWidth < 1024;

  // Filter screens based on variant
  const getScreensToShow = () => {
    if (variant === 'screens-only') return screens;
    if (variant === 'minimal') return screens.slice(0, 5);
    return screens;
  };

  const screensToShow = getScreensToShow();

  // Embedded view (single screen preview)
  if (embedded && selectedScreen) {
    const screen = screens.find(s => s.number === selectedScreen);
    if (!screen) return null;

    const embeddedScale = isMobile ? 0.4 : 0.5;

    return (
      <div className={className} style={{
        background: "linear-gradient(135deg,#0f0f23 0%,#1a1a2e 50%,#16213e 100%)",
        padding: isMobile ? '8px' : '20px',
        borderRadius: '16px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: isMobile ? '350px' : '500px',
        width: '100%',
        overflow: 'hidden',
        ...style
      }}>
        <ScreenCard 
          {...screen} 
          scale={embeddedScale}
          embedded={true}
        >
          <screen.Screen time={time} />
        </ScreenCard>
      </div>
    );
  }

  return (
    <div className={className} style={{
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      background: "linear-gradient(135deg,#0f0f23 0%,#1a1a2e 50%,#16213e 100%)",
      minHeight: "100vh", 
      color: "white", 
      overflowX: "hidden",
      width: '100%',
      maxWidth: '100vw',
      ...style
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&display=swap');
        
        * { 
          box-sizing: border-box; 
          margin: 0; 
          padding: 0; 
          -webkit-tap-highlight-color: transparent;
        }

        /* Animation Keyframes */
        @keyframes glow-pulse { 0%,100%{transform:scale(1);opacity:.5} 50%{transform:scale(1.2);opacity:.8} }
        @keyframes sparkle-float { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-10px) rotate(10deg)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes core-pulse { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-50%,-50%) scale(1.2)} }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        @keyframes badge-glow { 0%,100%{box-shadow:0 4px 15px rgba(255,140,66,.3)} 50%{box-shadow:0 4px 30px rgba(255,140,66,.6)} }
        @keyframes bounce-right { 0%,100%{transform:translateX(0)} 50%{transform:translateX(5px)} }
        @keyframes dot-pulse { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
        @keyframes float-icon { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes loading-bounce { 0%,100%{transform:translateY(0) rotate(0deg) scale(1)} 25%{transform:translateY(-30px) rotate(10deg) scale(1.1)} 50%{transform:translateY(0) rotate(0deg) scale(1)} 75%{transform:translateY(-15px) rotate(-5deg) scale(1.05)} }
        @keyframes float-ambient { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(50px,-50px) scale(1.1)} 66%{transform:translate(-30px,30px) scale(.9)} }
        @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes modal-up { from{transform:translateY(100%)} to{transform:translateY(0)} }
        
        ::-webkit-scrollbar { 
          display: none; 
        }

        /* Main Container - Prevent horizontal overflow */
        .glazemedemo-container {
          width: 100%;
          max-width: 100vw;
          overflow-x: hidden;
        }

        /* Phone Scroll Container - Mobile Optimized */
        .phones-scroll {
          display: flex;
          overflow-x: auto;
          gap: 8px;
          padding: 12px 8px 80px;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          width: 100%;
          max-width: 100%;
        }

        .phones-scroll::-webkit-scrollbar { 
          display: none; 
        }

        .phone-snap-item {
          scroll-snap-align: center;
          flex-shrink: 0;
        }

        /* Phone Grid - Desktop Optimized */
        .phones-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 30px;
          justify-content: center;
          padding: 30px 15px 100px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }

        /* Mobile Responsive Styles */
        @media (max-width: 480px) {
          .phones-scroll {
            gap: 6px;
            padding: 10px 6px 70px;
          }
          
          .header-stats { 
            gap: 10px !important; 
          }
          
          .header-stats > div > span:first-child { 
            font-size: 20px !important; 
          }
          
          .features-grid { 
            grid-template-columns: 1fr !important; 
            gap: 10px !important;
          }
          
          .specs-grid { 
            grid-template-columns: repeat(2, 1fr) !important; 
            gap: 6px !important;
          }
          
          .section-pad { 
            padding: 0 6px !important; 
          }
          
          .cta-btn { 
            padding: 10px 16px !important; 
            font-size: 13px !important; 
            width: 90% !important;
          }

          h1 {
            font-size: 24px !important;
          }

          p {
            font-size: 12px !important;
          }
        }

        @media (min-width: 481px) and (max-width: 640px) {
          .phones-scroll {
            gap: 12px;
            padding: 16px 12px 90px;
          }
          
          .features-grid { 
            grid-template-columns: 1fr !important; 
          }
          
          .specs-grid { 
            grid-template-columns: repeat(2, 1fr) !important; 
          }
        }

        @media (min-width: 641px) and (max-width: 1023px) {
          .phones-scroll {
            gap: 16px;
            padding: 20px 16px 100px;
          }
          
          .features-grid { 
            grid-template-columns: repeat(2, 1fr) !important; 
          }
          
          .specs-grid { 
            grid-template-columns: repeat(3, 1fr) !important; 
          }
        }

        /* Touch Optimization */
        @media (hover: none) {
          .phones-scroll {
            -webkit-overflow-scrolling: touch;
          }
        }

        /* Safe Area Support */
        @supports (padding: max(0px)) {
          .phones-scroll {
            padding-left: max(8px, env(safe-area-inset-left));
            padding-right: max(8px, env(safe-area-inset-right));
          }
        }
      `}</style>

      {/* Ambient BG Orbs - Hidden on mobile for performance */}
      {variant === 'full' && !isMobile && [
        { w: 600, h: 600, color: "#FF8C42", top: -200, left: -200, delay: 0 },
        { w: 500, h: 500, color: "#FFE66D", bottom: -150, right: -150, delay: -5 },
        { w: 400, h: 400, color: "#FF2D55", top: "50%", left: "50%", delay: -10 },
      ].map((orb, i) => (
        <div key={i} style={{
          position: "fixed", 
          width: orb.w, 
          height: orb.h, 
          borderRadius: "50%",
          filter: "blur(80px)", 
          opacity: .3, 
          pointerEvents: "none", 
          zIndex: 0,
          background: `radial-gradient(circle,${orb.color},transparent 70%)`,
          animation: `float-ambient 20s ${orb.delay}s infinite ease-in-out`,
          top: (orb as any).top ?? "auto", 
          left: (orb as any).left ?? "auto",
          bottom: (orb as any).bottom ?? "auto", 
          right: (orb as any).right ?? "auto",
          transform: i === 2 ? "translate(-50%,-50%)" : undefined
        }} />
      ))}

      {/* Header - Mobile Optimized */}
      {showHeader && (
        <header style={{ 
          position: "relative", 
          zIndex: 10, 
          textAlign: "center", 
          padding: isMobile ? "16px 6px 12px" : "60px 20px 40px", 
          maxWidth: 1000, 
          margin: "0 auto",
          width: '100%'
        }}>
          <div style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: 4, 
            background: "rgba(255,255,255,.1)", 
            backdropFilter: "blur(20px)", 
            padding: isMobile ? "3px 10px" : "8px 20px", 
            borderRadius: 50, 
            fontSize: isMobile ? 8 : 13, 
            fontWeight: 600, 
            textTransform: "uppercase", 
            letterSpacing: 0.5, 
            marginBottom: isMobile ? 8 : 24, 
            border: "1px solid rgba(255,255,255,.1)" 
          }}>
            <div style={{ 
              width: 4, 
              height: 4, 
              background: "#34C759", 
              borderRadius: "50%", 
              animation: "pulse-dot 2s infinite" 
            }} />
            <span>Client Preview Ready</span>
          </div>
          
          <h1 style={{ 
            fontSize: isMobile ? "22px" : "clamp(42px,8vw,72px)", 
            fontWeight: 900, 
            marginBottom: isMobile ? 6 : 16, 
            background: "linear-gradient(135deg,#fff 0%,#FFE66D 50%,#FF8C42 100%)", 
            WebkitBackgroundClip: "text", 
            WebkitTextFillColor: "transparent", 
            letterSpacing: isMobile ? -0.3 : -2, 
            lineHeight: 1.1,
            padding: isMobile ? '0 4px' : 0
          }}>
            GlazeMe Premium
          </h1>
          
          <p style={{ 
            fontSize: isMobile ? 11 : 22, 
            opacity: .8, 
            maxWidth: 500, 
            margin: "0 auto 12px", 
            lineHeight: 1.4, 
            fontWeight: 400, 
            padding: isMobile ? "0 6px" : "0 8px" 
          }}>
            The ultimate "over the top" compliment experience. Designed for iPhone 17 Pro with titanium finish, Dynamic Island integration, and pro-grade animations.
          </p>
          
          <div className="header-stats" style={{ 
            display: "flex", 
            justifyContent: "center", 
            gap: isMobile ? 8 : 60, 
            marginTop: isMobile ? 8 : 32, 
            flexWrap: "wrap",
            padding: isMobile ? '0 4px' : 0
          }}>
            {[["10", "Screens"], ["20+", "Features"], ["4", "Intensity"], ["0s", "Load Time"]].map(([num, label]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <span style={{ 
                  fontSize: isMobile ? 18 : 48, 
                  fontWeight: 900, 
                  background: "linear-gradient(135deg,#FFE66D,#FF8C42)", 
                  WebkitBackgroundClip: "text", 
                  WebkitTextFillColor: "transparent", 
                  display: "block" 
                }}>{num}</span>
                <div style={{ 
                  fontSize: isMobile ? 8 : 14, 
                  opacity: .6, 
                  textTransform: "uppercase", 
                  letterSpacing: 0.3, 
                  marginTop: 1 
                }}>{label}</div>
              </div>
            ))}
          </div>
        </header>
      )}

      {/* Scroll hint on mobile */}
      {isMobile && variant === 'full' && (
        <div style={{ 
          textAlign: "center", 
          color: "rgba(255,255,255,.5)", 
          fontSize: 10, 
          marginBottom: 2, 
          letterSpacing: 0.3,
          padding: '0 6px'
        }}>
          ← Swipe to browse all screens →
        </div>
      )}

      {/* Phones — horizontal scroll on mobile/tablet, grid on desktop */}
      {isTablet ? (
        <div className="phones-scroll">
          {screensToShow.map(({ Screen, ...meta }) => (
            <div key={meta.number} className="phone-snap-item" style={{ height: phoneHeight + (isMobile ? 60 : 140) }}>
              <ScreenCard 
                {...meta} 
                scale={phoneScale}
                onClick={onScreenSelect ? () => onScreenSelect(meta.number) : undefined}
                isSelected={selectedScreen === meta.number}
                embedded={embedded}
              >
                <Screen time={time} />
              </ScreenCard>
            </div>
          ))}
        </div>
      ) : (
        <div className="phones-grid">
          {screensToShow.map(({ Screen, ...meta }) => (
            <ScreenCard 
              key={meta.number} 
              {...meta} 
              scale={phoneScale}
              onClick={onScreenSelect ? () => onScreenSelect(meta.number) : undefined}
              isSelected={selectedScreen === meta.number}
              embedded={embedded}
            >
              <Screen time={time} />
            </ScreenCard>
          ))}
        </div>
      )}

      {/* Features Section - Mobile Optimized */}
      {showFeatures && variant !== 'screens-only' && (
        <section className="section-pad" style={{ 
          position: "relative", 
          zIndex: 10, 
          maxWidth: 1200, 
          margin: isMobile ? "0 auto 20px" : "0 auto 80px", 
          padding: isMobile ? "0 6px" : "0 40px",
          width: '100%'
        }}>
          <div style={{ 
            textAlign: "center", 
            marginBottom: isMobile ? 16 : 60 
          }}>
            <h2 style={{ 
              fontSize: isMobile ? "18px" : "clamp(32px,5vw,48px)", 
              fontWeight: 900, 
              marginBottom: 6, 
              background: "linear-gradient(135deg,#fff,#FFE66D)", 
              WebkitBackgroundClip: "text", 
              WebkitTextFillColor: "transparent" 
            }}>Premium Features</h2>
            <p style={{ 
              fontSize: isMobile ? 11 : 20, 
              opacity: .8, 
              maxWidth: 500, 
              margin: "0 auto", 
              lineHeight: 1.4,
              padding: isMobile ? '0 6px' : 0
            }}>
              Every detail crafted for the ultimate compliment experience. From AI generation to keyboard integration.
            </p>
          </div>
          
          <div className="features-grid" style={{ 
            display: "grid", 
            gridTemplateColumns: isMobile ? "1fr" : isTablet ? "repeat(2,1fr)" : "repeat(auto-fit,minmax(280px,1fr))", 
            gap: isMobile ? 8 : 20 
          }}>
            {features.map(f => (
              <div key={f.title} style={{
                background: "rgba(255,255,255,.03)", 
                border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 16, 
                padding: isMobile ? 12 : 32, 
                backdropFilter: "blur(20px)",
                transition: "all .4s ease", 
                cursor: "default",
                position: "relative", 
                overflow: "hidden"
              }}>
                <div style={{ 
                  width: isMobile ? 32 : 52, 
                  height: isMobile ? 32 : 52, 
                  background: "linear-gradient(135deg,#FFE66D,#FF8C42)", 
                  borderRadius: 10, 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  fontSize: isMobile ? 14 : 24, 
                  marginBottom: 8, 
                  boxShadow: "0 8px 20px rgba(255,140,66,.3)" 
                }}>{f.icon}</div>
                <h3 style={{ 
                  fontSize: isMobile ? 13 : 18, 
                  fontWeight: 800, 
                  marginBottom: 4, 
                  color: "white" 
                }}>{f.title}</h3>
                <p style={{ 
                  fontSize: isMobile ? 10 : 14, 
                  lineHeight: 1.4, 
                  opacity: .7, 
                  color: "rgba(255,255,255,.8)" 
                }}>{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Tech Specs - Mobile Optimized */}
          <div style={{ 
            background: "rgba(0,0,0,.3)", 
            borderRadius: 16, 
            padding: isMobile ? 12 : 40, 
            marginTop: isMobile ? 16 : 48, 
            border: "1px solid rgba(255,255,255,.1)" 
          }}>
            <h3 style={{ 
              fontSize: isMobile ? 16 : 24, 
              fontWeight: 800, 
              marginBottom: 12, 
              textAlign: "center" 
            }}>Technical Specifications</h3>
            <div className="specs-grid" style={{ 
              display: "grid", 
              gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(auto-fit,minmax(150px,1fr))", 
              gap: isMobile ? 6 : 16 
            }}>
              {specs.map(([label, val]) => (
                <div key={label} style={{ 
                  textAlign: "center", 
                  padding: isMobile ? 8 : 20, 
                  background: "rgba(255,255,255,.05)", 
                  borderRadius: 10 
                }}>
                  <div style={{ 
                    fontSize: isMobile ? 8 : 11, 
                    textTransform: "uppercase", 
                    letterSpacing: 0.3, 
                    opacity: .6, 
                    marginBottom: 2 
                  }}>{label}</div>
                  <div style={{ 
                    fontSize: isMobile ? 11 : 20, 
                    fontWeight: 800, 
                    color: "#FFE66D" 
                  }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA - Mobile Optimized */}
      {showCTA && variant !== 'screens-only' && (
        <section style={{ 
          textAlign: "center", 
          padding: isMobile ? "16px 6px 30px" : "60px 20px 100px", 
          position: "relative", 
          zIndex: 10 
        }}>
          <h2 style={{ 
            fontSize: isMobile ? "18px" : "clamp(32px,5vw,48px)", 
            fontWeight: 900, 
            marginBottom: isMobile ? 8 : 24 
          }}>Ready to Glaze?</h2>
          <button
            className="cta-btn"
            style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: isMobile ? 4 : 12, 
              padding: isMobile ? "8px 16px" : "18px 36px", 
              background: "linear-gradient(135deg,#FFE66D,#FF8C42)", 
              color: "white", 
              fontSize: isMobile ? 12 : 18, 
              fontWeight: 800, 
              borderRadius: 30, 
              border: "none", 
              boxShadow: "0 10px 30px rgba(255,140,66,.4)", 
              cursor: "pointer", 
              transition: "all .4s",
              width: isMobile ? '80%' : 'auto',
              maxWidth: '250px',
              justifyContent: 'center'
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px) scale(1.05)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 40px rgba(255,140,66,.5)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.boxShadow = "0 10px 30px rgba(255,140,66,.4)"; }}
          >
            <span>🚀</span><span>Start Development</span>
          </button>
        </section>
      )}
    </div>
  );
};

export default GlazeMeDemo;
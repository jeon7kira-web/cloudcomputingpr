import { useState, useEffect, useRef } from "react";

const PARTICLE_COUNT = 60;

function useMouseGlow() {
  const [pos, setPos] = useState({ x: -999, y: -999 });
  useEffect(() => {
    const h = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);
  return pos;
}

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const h = () => setY(window.scrollY);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return y;
}

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function AnimatedSection({ children, className = "", delay = 0 }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} className={className} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(40px)",
      transition: `opacity 0.8s ease ${delay}s, transform 0.8s ease ${delay}s`
    }}>
      {children}
    </div>
  );
}

function ParticleField() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w = canvas.width = canvas.offsetWidth;
    let h = canvas.height = canvas.offsetHeight;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5, alpha: Math.random() * 0.5 + 0.1
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,0,30,${p.alpha})`;
        ctx.fill();
      });
      particles.forEach((a, i) => {
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(180,0,30,${0.08 * (1 - d / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    const ro = new ResizeObserver(() => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    });
    ro.observe(canvas);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}

function GridBackground() {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      <svg width="100%" height="100%" style={{ opacity: 0.07 }}>
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#cc0020" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

function GlowButton({ children, onClick, style = {} }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? "#cc0020" : "transparent",
        border: "1.5px solid #cc0020",
        color: "#fff",
        padding: "12px 32px",
        fontSize: 14,
        letterSpacing: "0.15em",
        cursor: "pointer",
        transition: "all 0.3s ease",
        boxShadow: hov ? "0 0 30px rgba(204,0,32,0.6), 0 0 60px rgba(204,0,32,0.2)" : "0 0 15px rgba(204,0,32,0.3)",
        textTransform: "uppercase",
        fontFamily: "'Courier New', monospace",
        ...style
      }}
    >
      {children}
    </button>
  );
}

const cloudTypes = [
  {
    title: "Public Cloud",
    icon: "🌐",
    desc: "Managed by third-party providers over the internet. Resources shared across multiple organizations.",
    detail: "AWS, Microsoft Azure, and Google Cloud Platform are the dominant players. Pay-as-you-go model, infinite scalability, zero upfront hardware cost.",
    color: "#cc0020"
  },
  {
    title: "Private Cloud",
    icon: "🔒",
    desc: "Dedicated infrastructure for a single organization, either on-premises or hosted.",
    detail: "Maximum control and security. Ideal for regulated industries like banking, healthcare, and government.",
    color: "#990018"
  },
  {
    title: "Hybrid Cloud",
    icon: "⚡",
    desc: "Combines public and private clouds, allowing data and apps to flow between them seamlessly.",
    detail: "Best of both worlds. Run sensitive workloads privately while scaling burst capacity on public cloud.",
    color: "#cc0020"
  }
];

function CloudTypeCard({ cloud, i }) {
  const [hov, setHov] = useState(false);
  const [ref, inView] = useInView();
  return (
    <div ref={ref} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      background: hov ? "rgba(204,0,32,0.08)" : "rgba(255,255,255,0.02)",
      border: `1px solid ${hov ? "rgba(204,0,32,0.6)" : "rgba(204,0,32,0.2)"}`,
      borderRadius: 4,
      padding: "32px 24px",
      cursor: "pointer",
      transition: "all 0.4s ease",
      boxShadow: hov ? "0 0 40px rgba(204,0,32,0.15)" : "none",
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(30px)",
      transitionDelay: `${i * 0.15}s`
    }}>
      <div style={{ fontSize: 36, marginBottom: 16 }}>{cloud.icon}</div>
      <h3 style={{ color: "#cc0020", fontSize: 18, marginBottom: 12, fontFamily: "'Courier New', monospace", letterSpacing: "0.1em" }}>{cloud.title}</h3>
      <p style={{ color: "#aaa", fontSize: 14, lineHeight: 1.7, marginBottom: hov ? 16 : 0 }}>{cloud.desc}</p>
      <div style={{
        maxHeight: hov ? 120 : 0, overflow: "hidden", transition: "max-height 0.4s ease",
        color: "#888", fontSize: 13, lineHeight: 1.6, borderTop: hov ? "1px solid rgba(204,0,32,0.2)" : "none",
        paddingTop: hov ? 12 : 0
      }}>
        {cloud.detail}
      </div>
    </div>
  );
}

const serviceModels = {
  SaaS: {
    label: "Software as a Service",
    color: "#cc0020",
    examples: ["Gmail", "Netflix", "Salesforce", "Slack", "Google Drive"],
    definition: "Fully managed applications delivered over the internet. Users access software through browsers with no installation required.",
    useCases: ["Email & collaboration", "CRM systems", "Entertainment streaming", "Project management"]
  },
  PaaS: {
    label: "Platform as a Service",
    color: "#990018",
    examples: ["Firebase", "Heroku", "Google App Engine", "Azure App Service"],
    definition: "A platform for developers to build, run, and manage applications without dealing with infrastructure complexity.",
    useCases: ["App development", "API deployment", "Database management", "Testing environments"]
  },
  IaaS: {
    label: "Infrastructure as a Service",
    color: "#660010",
    examples: ["AWS EC2", "Azure VMs", "Google Compute Engine", "DigitalOcean"],
    definition: "Virtualized computing infrastructure provisioned over the internet. Full control over OS, storage, and networking.",
    useCases: ["Virtual machines", "Storage solutions", "Networking", "Data center replacement"]
  }
};

function ServiceTriangle() {
  const [active, setActive] = useState(null);
  const [ref, inView] = useInView(0.1);
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setPulse(p => (p + 1) % 100), 50);
    return () => clearInterval(t);
  }, []);

  const corners = [
    { key: "SaaS", x: 300, y: 30 },
    { key: "IaaS", x: 60, y: 460 },
    { key: "PaaS", x: 540, y: 460 }
  ];
  const glowIntensity = (Math.sin(pulse * 0.063) + 1) / 2;

  return (
    <div ref={ref} style={{ opacity: inView ? 1 : 0, transition: "opacity 1s ease" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 32, alignItems: "flex-start", justifyContent: "center" }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <svg width={600} height={520} viewBox="0 0 600 520" style={{ display: "block", maxWidth: "100%", filter: `drop-shadow(0 0 ${10 + glowIntensity * 20}px rgba(204,0,32,0.3))` }}>
            <defs>
              <radialGradient id="triGlow" cx="50%" cy="50%">
                <stop offset="0%" stopColor="rgba(204,0,32,0.15)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </radialGradient>
            </defs>
            <polygon points="300,50 60,460 540,460" fill="url(#triGlow)" stroke="rgba(204,0,32,0.4)" strokeWidth="1.5" />
            {/* animated edge dashes */}
            <polygon points="300,50 60,460 540,460" fill="none" stroke="rgba(204,0,32,0.8)" strokeWidth="1"
              strokeDasharray="8 6" strokeDashoffset={-pulse * 2} />
            {/* floating clouds inside */}
            {[
              { cx: 200, cy: 250, r: 18 }, { cx: 300, cy: 200, r: 12 }, { cx: 380, cy: 300, r: 15 },
              { cx: 250, cy: 340, r: 10 }, { cx: 340, cy: 380, r: 8 }
            ].map((c, i) => (
              <circle key={i} cx={c.cx + Math.sin(pulse * 0.063 + i) * 4}
                cy={c.cy + Math.cos(pulse * 0.05 + i) * 3}
                r={c.r} fill="rgba(204,0,32,0.06)" stroke="rgba(204,0,32,0.15)" strokeWidth="0.5" />
            ))}
            {/* corners */}
            {corners.map(({ key, x, y }) => (
              <g key={key} onClick={() => setActive(active === key ? null : key)} style={{ cursor: "pointer" }}>
                <circle cx={x} cy={y} r={active === key ? 44 : 38}
                  fill={active === key ? "rgba(204,0,32,0.25)" : "rgba(204,0,32,0.1)"}
                  stroke={active === key ? "#cc0020" : "rgba(204,0,32,0.5)"}
                  strokeWidth={active === key ? 2 : 1}
                  style={{ transition: "all 0.3s ease", filter: active === key ? `drop-shadow(0 0 12px rgba(204,0,32,0.8))` : "none" }}
                />
                <text x={x} y={y - 8} textAnchor="middle" fill="#ff4060" fontSize="13" fontWeight="bold" fontFamily="'Courier New', monospace">{key}</text>
                <text x={x} y={y + 10} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9" fontFamily="'Courier New', monospace">CLICK</text>
              </g>
            ))}
            <text x={300} y={265} textAnchor="middle" fill="rgba(204,0,32,0.3)" fontSize="10" fontFamily="'Courier New', monospace" letterSpacing="3">CLOUD SERVICES</text>
          </svg>
        </div>

        {/* Info panel */}
        <div style={{ flex: "1 1 280px", minWidth: 260 }}>
          {active ? (
            <div style={{
              background: "rgba(204,0,32,0.05)", border: "1px solid rgba(204,0,32,0.4)",
              borderRadius: 4, padding: 28, animation: "fadeIn 0.3s ease"
            }}>
              <div style={{ color: "#cc0020", fontSize: 11, letterSpacing: "0.2em", marginBottom: 8, fontFamily: "'Courier New', monospace" }}>SELECTED</div>
              <h3 style={{ color: "#fff", fontSize: 22, marginBottom: 6, fontFamily: "'Courier New', monospace" }}>{active}</h3>
              <div style={{ color: "#cc0020", fontSize: 13, marginBottom: 16 }}>{serviceModels[active].label}</div>
              <p style={{ color: "#aaa", fontSize: 13, lineHeight: 1.7, marginBottom: 20 }}>{serviceModels[active].definition}</p>
              <div style={{ marginBottom: 16 }}>
                <div style={{ color: "#666", fontSize: 11, letterSpacing: "0.15em", marginBottom: 8, fontFamily: "'Courier New', monospace" }}>EXAMPLES</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {serviceModels[active].examples.map(ex => (
                    <span key={ex} style={{ background: "rgba(204,0,32,0.15)", border: "1px solid rgba(204,0,32,0.3)", color: "#ff6080", fontSize: 11, padding: "3px 10px", borderRadius: 2, fontFamily: "'Courier New', monospace" }}>{ex}</span>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ color: "#666", fontSize: 11, letterSpacing: "0.15em", marginBottom: 8, fontFamily: "'Courier New', monospace" }}>USE CASES</div>
                {serviceModels[active].useCases.map(uc => (
                  <div key={uc} style={{ color: "#888", fontSize: 12, padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#cc0020" }}>→</span> {uc}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ color: "#444", fontSize: 13, fontFamily: "'Courier New', monospace", lineHeight: 2 }}>
              <div style={{ marginBottom: 12, color: "#666" }}>// SELECT A NODE</div>
              <div>Click SaaS, PaaS, or IaaS</div>
              <div>on the triangle to explore</div>
              <div>each service model.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HowItWorks() {
  const nodes = [
    { label: "USER", icon: "👤", desc: "Sends request" },
    { label: "INTERNET", icon: "🌐", desc: "Data transmission" },
    { label: "CLOUD", icon: "☁️", desc: "Processing layer" },
    { label: "SERVERS", icon: "🖥️", desc: "Compute & storage" },
    { label: "DATA", icon: "💾", desc: "Returned response" }
  ];
  const [active, setActive] = useState(0);
  const [ref, inView] = useInView();
  useEffect(() => {
    if (!inView) return;
    const t = setInterval(() => setActive(a => (a + 1) % nodes.length), 1200);
    return () => clearInterval(t);
  }, [inView]);

  return (
    <div ref={ref} style={{ opacity: inView ? 1 : 0, transition: "opacity 0.8s ease" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 0 }}>
        {nodes.map((n, i) => (
          <div key={n.label} style={{ display: "flex", alignItems: "center" }}>
            <div style={{
              textAlign: "center", padding: "20px 16px", cursor: "pointer",
              background: active === i ? "rgba(204,0,32,0.15)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${active === i ? "rgba(204,0,32,0.8)" : "rgba(204,0,32,0.15)"}`,
              borderRadius: 4, minWidth: 90, transition: "all 0.4s ease",
              boxShadow: active === i ? "0 0 30px rgba(204,0,32,0.3)" : "none",
              transform: active === i ? "scale(1.08)" : "scale(1)"
            }} onClick={() => setActive(i)}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{n.icon}</div>
              <div style={{ color: active === i ? "#ff4060" : "#666", fontSize: 10, letterSpacing: "0.15em", fontFamily: "'Courier New', monospace" }}>{n.label}</div>
              <div style={{ color: "#555", fontSize: 10, marginTop: 4 }}>{n.desc}</div>
            </div>
            {i < nodes.length - 1 && (
              <div style={{ position: "relative", width: 40, height: 2 }}>
                <div style={{ position: "absolute", inset: 0, background: "rgba(204,0,32,0.2)" }} />
                <div style={{
                  position: "absolute", top: -3, width: 8, height: 8,
                  background: "#cc0020", borderRadius: "50%",
                  animation: active > i ? "slideRight 0.6s ease forwards" : "none",
                  boxShadow: "0 0 10px rgba(204,0,32,0.8)"
                }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const apps = [
  { name: "Netflix", icon: "🎬", cloud: "AWS", stat: "250M+ streams/day", desc: "Content delivery, encoding, and recommendation AI all run on cloud infrastructure." },
  { name: "Spotify", icon: "🎵", cloud: "Google Cloud", stat: "100PB of audio", desc: "Music streaming, playlist generation, and Wrapped analytics are cloud-powered." },
  { name: "Google Drive", icon: "📂", cloud: "GCP", stat: "1B+ users", desc: "Real-time collaboration, version history, and search are native cloud capabilities." },
  { name: "AI Tools", icon: "🤖", cloud: "Multi-cloud", stat: "GPT-4, Claude, Gemini", desc: "Large language models require massive distributed GPU clusters — only possible in the cloud." },
  { name: "Gaming", icon: "🎮", cloud: "Azure / AWS", stat: "Xbox Cloud Gaming", desc: "Game streaming, matchmaking, and save states are all processed in cloud data centers." },
  { name: "Banking", icon: "🏦", cloud: "Hybrid Cloud", stat: "99.999% uptime", desc: "Fraud detection, transactions, and compliance all leverage cloud scale with private security." }
];

function AppCard({ app, i }) {
  const [flipped, setFlipped] = useState(false);
  const [ref, inView] = useInView();
  return (
    <div ref={ref} onClick={() => setFlipped(!flipped)} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(30px)",
      transition: `opacity 0.6s ease ${i * 0.1}s, transform 0.6s ease ${i * 0.1}s`,
      perspective: 600, cursor: "pointer", height: 180
    }}>
      <div style={{
        position: "relative", width: "100%", height: "100%",
        transformStyle: "preserve-3d",
        transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        transition: "transform 0.6s ease"
      }}>
        <div style={{
          position: "absolute", inset: 0, backfaceVisibility: "hidden",
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(204,0,32,0.2)",
          borderRadius: 4, padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between"
        }}>
          <div style={{ fontSize: 32 }}>{app.icon}</div>
          <div>
            <div style={{ color: "#fff", fontSize: 16, fontWeight: 500, marginBottom: 4 }}>{app.name}</div>
            <div style={{ color: "#cc0020", fontSize: 11, fontFamily: "'Courier New', monospace" }}>{app.stat}</div>
          </div>
          <div style={{ color: "#444", fontSize: 10, fontFamily: "'Courier New', monospace" }}>CLICK TO REVEAL</div>
        </div>
        <div style={{
          position: "absolute", inset: 0, backfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
          background: "rgba(204,0,32,0.08)", border: "1px solid rgba(204,0,32,0.5)",
          borderRadius: 4, padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between",
          boxShadow: "0 0 30px rgba(204,0,32,0.15)"
        }}>
          <div style={{ color: "#cc0020", fontSize: 11, fontFamily: "'Courier New', monospace" }}>CLOUD: {app.cloud}</div>
          <p style={{ color: "#aaa", fontSize: 12, lineHeight: 1.6 }}>{app.desc}</p>
          <div style={{ color: "#ff4060", fontSize: 10, fontFamily: "'Courier New', monospace" }}>← TAP TO FLIP</div>
        </div>
      </div>
    </div>
  );
}

function CloudSimulator() {
  const [state, setState] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [servers, setServers] = useState([false, false, false]);
  const [ref, inView] = useInView();

  const simulate = () => {
    if (state !== "idle") return;
    setState("uploading");
    setProgress(0);
    setServers([false, false, false]);
    let p = 0;
    const t1 = setInterval(() => {
      p += 2;
      setProgress(p);
      if (p >= 100) {
        clearInterval(t1);
        setState("distributing");
        setTimeout(() => setServers([true, false, false]), 400);
        setTimeout(() => setServers([true, true, false]), 800);
        setTimeout(() => setServers([true, true, true]), 1200);
        setTimeout(() => setState("done"), 1600);
      }
    }, 30);
  };

  const reset = () => { setState("idle"); setProgress(0); setServers([false, false, false]); };

  return (
    <div ref={ref} style={{ opacity: inView ? 1 : 0, transition: "opacity 0.8s ease" }}>
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(204,0,32,0.2)", borderRadius: 4, padding: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", flexWrap: "wrap", gap: 24, marginBottom: 32 }}>
          {/* file */}
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 60, height: 70, background: "rgba(204,0,32,0.1)", border: "1px solid rgba(204,0,32,0.4)",
              margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
              borderRadius: 4, transition: "all 0.5s ease",
              transform: state === "uploading" ? "translateX(20px) scale(0.9)" : "none",
              opacity: state === "done" ? 0.3 : 1
            }}>📄</div>
            <div style={{ color: "#666", fontSize: 10, fontFamily: "'Courier New', monospace" }}>FILE.DAT</div>
          </div>
          {/* arrow */}
          <div style={{ color: "#cc0020", fontSize: 20, opacity: state !== "idle" ? 1 : 0.3 }}>→</div>
          {/* cloud */}
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontSize: 48, transition: "all 0.5s ease",
              filter: state === "distributing" || state === "done" ? "drop-shadow(0 0 20px rgba(204,0,32,0.8))" : "none",
              transform: state !== "idle" ? "scale(1.1)" : "scale(1)"
            }}>☁️</div>
            <div style={{ color: "#666", fontSize: 10, fontFamily: "'Courier New', monospace" }}>CLOUD</div>
          </div>
          {/* arrow */}
          <div style={{ color: "#cc0020", fontSize: 20, opacity: state === "distributing" || state === "done" ? 1 : 0.3 }}>→</div>
          {/* servers */}
          <div style={{ display: "flex", gap: 8 }}>
            {servers.map((active, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{
                  width: 36, height: 48, background: active ? "rgba(204,0,32,0.2)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${active ? "rgba(204,0,32,0.8)" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                  transition: "all 0.4s ease", boxShadow: active ? "0 0 20px rgba(204,0,32,0.4)" : "none"
                }}>🖥️</div>
                <div style={{ color: "#666", fontSize: 8, fontFamily: "'Courier New', monospace", marginTop: 4 }}>SRV{i + 1}</div>
              </div>
            ))}
          </div>
        </div>
        {/* progress bar */}
        {state === "uploading" && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ height: 2, background: "rgba(255,255,255,0.05)", borderRadius: 1, marginBottom: 6 }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "#cc0020", transition: "width 0.03s linear", boxShadow: "0 0 10px rgba(204,0,32,0.6)" }} />
            </div>
            <div style={{ color: "#666", fontSize: 10, fontFamily: "'Courier New', monospace" }}>UPLOADING... {progress}%</div>
          </div>
        )}
        {state === "done" && (
          <div style={{ color: "#cc0020", fontSize: 12, fontFamily: "'Courier New', monospace", marginBottom: 16 }}>
            ✓ FILE DISTRIBUTED ACROSS 3 SERVERS — REDUNDANT & SECURE
          </div>
        )}
        <div style={{ display: "flex", gap: 12 }}>
          {state === "idle" && <GlowButton onClick={simulate}>SIMULATE UPLOAD</GlowButton>}
          {state === "done" && <GlowButton onClick={reset}>RESET</GlowButton>}
        </div>
      </div>
    </div>
  );
}

const myths = [
  { myth: "Cloud is always more secure than on-premise", fact: "Security depends on configuration and practices. Both can be equally secure when managed correctly." },
  { myth: "Cloud = Internet", fact: "Cloud uses the internet for access, but it's a managed infrastructure of servers, storage, and services." },
  { myth: "Once in the cloud, data is lost if provider shuts down", fact: "Reputable providers offer data export, redundancy, and SLA guarantees. Contracts protect your data." },
  { myth: "Cloud is only for big companies", fact: "Cloud services scale from individual developers to enterprises — with pricing to match every size." }
];

function MythCard({ item, i }) {
  const [flipped, setFlipped] = useState(false);
  const [ref, inView] = useInView();
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(20px)",
      transition: `all 0.5s ease ${i * 0.15}s`, perspective: 500, height: 150, cursor: "pointer"
    }} onClick={() => setFlipped(!flipped)}>
      <div style={{
        position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d",
        transform: flipped ? "rotateY(180deg)" : "none", transition: "transform 0.5s ease"
      }}>
        <div style={{
          position: "absolute", inset: 0, backfaceVisibility: "hidden",
          background: "rgba(204,0,32,0.06)", border: "1px solid rgba(204,0,32,0.35)",
          borderRadius: 4, padding: 16, display: "flex", flexDirection: "column", justifyContent: "space-between"
        }}>
          <div style={{ color: "#cc0020", fontSize: 10, letterSpacing: "0.15em", fontFamily: "'Courier New', monospace" }}>⚠ MYTH</div>
          <p style={{ color: "#ccc", fontSize: 13, lineHeight: 1.5 }}>{item.myth}</p>
          <div style={{ color: "#444", fontSize: 9, fontFamily: "'Courier New', monospace" }}>CLICK FOR FACT</div>
        </div>
        <div style={{
          position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)",
          background: "rgba(0,180,80,0.05)", border: "1px solid rgba(0,200,100,0.3)",
          borderRadius: 4, padding: 16, display: "flex", flexDirection: "column", justifyContent: "space-between"
        }}>
          <div style={{ color: "#00c864", fontSize: 10, letterSpacing: "0.15em", fontFamily: "'Courier New', monospace" }}>✓ FACT</div>
          <p style={{ color: "#aaa", fontSize: 12, lineHeight: 1.5 }}>{item.fact}</p>
        </div>
      </div>
    </div>
  );
}

const questions = [
  { q: "What does 'cloud computing' primarily refer to?", opts: ["Using clouds as antennas", "Delivering computing services over the internet", "Storing files on your local drive", "A new operating system"], ans: 1 },
  { q: "Which service model gives users the most control over infrastructure?", opts: ["SaaS", "PaaS", "IaaS", "All are equal"], ans: 2 },
  { q: "Netflix primarily uses which cloud provider?", opts: ["Google Cloud", "Microsoft Azure", "Amazon Web Services", "IBM Cloud"], ans: 2 },
  { q: "What type of cloud is dedicated to a single organization?", opts: ["Public Cloud", "Hybrid Cloud", "Private Cloud", "Community Cloud"], ans: 2 },
  { q: "Gmail is an example of which service model?", opts: ["IaaS", "PaaS", "SaaS", "DaaS"], ans: 2 },
  { q: "Which cloud type combines public and private clouds?", opts: ["Multi-Cloud", "Hybrid Cloud", "Community Cloud", "Edge Cloud"], ans: 1 },
  { q: "Firebase by Google is an example of:", opts: ["IaaS", "SaaS", "PaaS", "BaaS only"], ans: 2 },
  { q: "What is a key advantage of cloud computing?", opts: ["Requires expensive hardware", "No internet needed", "Elastic scalability", "Limited to enterprises"], ans: 2 }
];

function Quiz() {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [ref, inView] = useInView();

  const choose = (i) => {
    if (selected !== null) return;
    setSelected(i);
    const correct = i === questions[idx].ans;
    if (correct) setScore(s => s + 1);
    setTimeout(() => {
      if (idx < questions.length - 1) { setIdx(idx + 1); setSelected(null); }
      else {
        setDone(true);
        const finalScore = score + (correct ? 1 : 0);
        if (finalScore >= 6) setShowConfetti(true);
      }
    }, 900);
  };

  const reset = () => { setIdx(0); setSelected(null); setScore(0); setDone(false); setShowConfetti(false); };

  return (
    <div ref={ref} style={{ opacity: inView ? 1 : 0, transition: "opacity 0.8s ease" }}>
      {showConfetti && (
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999 }}>
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} style={{
              position: "absolute",
              left: `${Math.random() * 100}%`,
              top: "-10px",
              width: 8, height: 8,
              background: ["#cc0020", "#ff4060", "#fff", "#ff8090"][i % 4],
              animation: `confettiFall ${1.5 + Math.random() * 2}s ease-in ${Math.random() * 0.5}s forwards`,
              borderRadius: Math.random() > 0.5 ? "50%" : 0,
              transform: `rotate(${Math.random() * 360}deg)`
            }} />
          ))}
        </div>
      )}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(204,0,32,0.2)", borderRadius: 4, padding: 32, maxWidth: 600, margin: "0 auto" }}>
        {!done ? (
          <>
            {/* progress */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#666", fontSize: 10, fontFamily: "'Courier New', monospace" }}>Q {idx + 1}/{questions.length}</span>
              <span style={{ color: "#cc0020", fontSize: 10, fontFamily: "'Courier New', monospace" }}>SCORE: {score}</span>
            </div>
            <div style={{ height: 2, background: "rgba(255,255,255,0.05)", marginBottom: 24, borderRadius: 1 }}>
              <div style={{ height: "100%", width: `${((idx) / questions.length) * 100}%`, background: "#cc0020", transition: "width 0.4s ease" }} />
            </div>
            <p style={{ color: "#fff", fontSize: 16, lineHeight: 1.6, marginBottom: 24 }}>{questions[idx].q}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {questions[idx].opts.map((opt, i) => {
                const isCorrect = i === questions[idx].ans;
                const isSelected = selected === i;
                let bg = "rgba(255,255,255,0.03)";
                let border = "rgba(255,255,255,0.1)";
                let color = "#aaa";
                if (selected !== null) {
                  if (isCorrect) { bg = "rgba(0,200,100,0.1)"; border = "rgba(0,200,100,0.6)"; color = "#00c864"; }
                  else if (isSelected) { bg = "rgba(204,0,32,0.15)"; border = "rgba(204,0,32,0.6)"; color = "#ff4060"; }
                }
                return (
                  <button key={i} onClick={() => choose(i)} style={{
                    background: bg, border: `1px solid ${border}`, color,
                    padding: "12px 16px", textAlign: "left", cursor: selected !== null ? "default" : "pointer",
                    borderRadius: 3, fontSize: 13, transition: "all 0.3s ease", fontFamily: "inherit"
                  }}>
                    <span style={{ color: "#666", fontFamily: "'Courier New', monospace", marginRight: 10 }}>{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{score >= 6 ? "🏆" : score >= 4 ? "⭐" : "📚"}</div>
            <div style={{ color: "#cc0020", fontSize: 11, letterSpacing: "0.2em", marginBottom: 8, fontFamily: "'Courier New', monospace" }}>RESULTS</div>
            <div style={{ color: "#fff", fontSize: 36, fontWeight: 300, marginBottom: 8, fontFamily: "'Courier New', monospace" }}>{score}/{questions.length}</div>
            <div style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>
              {score >= 6 ? "Outstanding! You're a cloud expert." : score >= 4 ? "Good job! Keep learning." : "Review the sections above and try again."}
            </div>
            <GlowButton onClick={reset}>RETRY</GlowButton>
          </div>
        )}
      </div>
    </div>
  );
}

const advantages = [
  { text: "Cost Efficiency", detail: "No upfront hardware investment. Pay only for what you use." },
  { text: "Elastic Scalability", detail: "Scale resources up or down in seconds, globally." },
  { text: "High Availability", detail: "99.99% uptime SLAs with geographic redundancy." },
  { text: "Collaboration", detail: "Real-time access from any device, anywhere on Earth." },
  { text: "Automatic Updates", detail: "Software and security patches deployed by providers." },
  { text: "Disaster Recovery", detail: "Built-in backup and failover across multiple regions." }
];

const disadvantages = [
  { text: "Internet Dependency", detail: "Offline access is limited or nonexistent for most services." },
  { text: "Vendor Lock-in", detail: "Migrating between providers can be complex and costly." },
  { text: "Security Concerns", detail: "Shared infrastructure raises data privacy considerations." },
  { text: "Ongoing Costs", detail: "Subscription fees accumulate — can exceed on-prem in some cases." }
];

export default function App() {
  const mouse = useMouseGlow();
  const scrollY = useScrollY();
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div style={{ background: "#080808", minHeight: "100vh", fontFamily: "'Helvetica Neue', sans-serif", color: "#fff", overflowX: "hidden" }}>
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes confettiFall { to{transform:translateY(100vh) rotate(720deg);opacity:0} }
        @keyframes scanline { 0%{top:-10%} 100%{top:110%} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #080808; }
        ::-webkit-scrollbar-thumb { background: #cc0020; }
      `}</style>

      {/* Mouse glow */}
      <div style={{
        position: "fixed", pointerEvents: "none", zIndex: 0,
        width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(204,0,32,0.06) 0%, transparent 70%)",
        left: mouse.x - 200, top: mouse.y - 200, transition: "left 0.1s, top 0.1s"
      }} />

      {/* NAV */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(8,8,8,0.9)", borderBottom: "1px solid rgba(204,0,32,0.15)",
        backdropFilter: "blur(20px)", padding: "0 32px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ color: "#cc0020", fontFamily: "'Courier New', monospace", fontSize: 13, letterSpacing: "0.2em" }}>
          ◈ CLOUD COMPUTING
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {["what", "how", "types", "triangle", "quiz"].map(id => (
            <button key={id} onClick={() => scrollTo(id)} style={{
              background: "none", border: "none", color: "#555", fontSize: 10,
              letterSpacing: "0.15em", cursor: "pointer", textTransform: "uppercase",
              fontFamily: "'Courier New', monospace", transition: "color 0.2s",
              ":hover": { color: "#cc0020" }
            }} onMouseEnter={e => e.target.style.color = "#cc0020"} onMouseLeave={e => e.target.style.color = "#555"}>
              {id}
            </button>
          ))}
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position: "relative", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <GridBackground />
        <ParticleField />
        {/* scanline effect */}
        <div style={{
          position: "absolute", left: 0, right: 0, height: "2px",
          background: "linear-gradient(90deg, transparent, rgba(204,0,32,0.3), transparent)",
          animation: "scanline 4s linear infinite", zIndex: 1
        }} />
        <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "0 24px" }}>
          <div style={{
            opacity: heroVisible ? 1 : 0, transition: "opacity 0.8s ease 0.2s",
            color: "#cc0020", fontSize: 10, letterSpacing: "0.4em", marginBottom: 24,
            fontFamily: "'Courier New', monospace"
          }}>
            ▸ THE TECHNOLOGY POWERING THE DIGITAL HORIZON
          </div>
          <h1 style={{
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(30px)",
            transition: "all 1s ease 0.4s",
            fontSize: "clamp(48px, 10vw, 110px)", fontWeight: 100, letterSpacing: "0.08em",
            lineHeight: 1.1, marginBottom: 8
          }}>
            <span style={{ display: "block", color: "#fff" }}>CLOUD</span>
            <span style={{ display: "block", color: "#cc0020", textShadow: "0 0 60px rgba(204,0,32,0.5)" }}>COMPUTING</span>
          </h1>
          <div style={{
            opacity: heroVisible ? 1 : 0, transition: "opacity 0.8s ease 0.9s",
            color: "#555", fontSize: 12, letterSpacing: "0.25em", margin: "24px 0 40px",
            fontFamily: "'Courier New', monospace"
          }}>
            SCALABLE · DISTRIBUTED · INFINITE
          </div>
          <div style={{ opacity: heroVisible ? 1 : 0, transition: "opacity 0.8s ease 1.1s" }}>
            <GlowButton onClick={() => scrollTo("what")}>START EXPLORING ↓</GlowButton>
          </div>
        </div>
        {/* scroll indicator */}
        <div style={{
          position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)",
          animation: "float 2s ease infinite", color: "#cc0020", fontSize: 18
        }}>⌄</div>
      </section>

      {/* WHAT IS CLOUD */}
      <section id="what" style={{ padding: "100px 32px", maxWidth: 1100, margin: "0 auto" }}>
        <AnimatedSection>
          <div style={{ color: "#cc0020", fontSize: 10, letterSpacing: "0.3em", fontFamily: "'Courier New', monospace", marginBottom: 16 }}>01 // DEFINITION_PROTOCOL</div>
          <h2 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 100, marginBottom: 48, letterSpacing: "0.05em" }}>
            What is <span style={{ color: "#cc0020" }}>Cloud Computing?</span>
          </h2>
        </AnimatedSection>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          {[
            { icon: "⚡", title: "On-Demand", desc: "Access computing resources instantly without upfront provisioning or contracts. Pay for what you consume." },
            { icon: "♾️", title: "Scalability", desc: "Expand hardware resources allocation from 4 VMs to 4,000 in real-time based on demand." },
            { icon: "🔒", title: "Security", desc: "Enterprise data centers with military-grade encryption and protocol infrastructure." },
            { icon: "🌍", title: "Availability", desc: "Global distribution ensuring 99.99% uptime across multiple geographical nodes." }
          ].map((card, i) => (
            <AnimatedSection key={card.title} delay={i * 0.1}>
              <div style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(204,0,32,0.15)",
                borderRadius: 4, padding: 28, height: "100%", transition: "all 0.3s ease",
                cursor: "default"
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = "rgba(204,0,32,0.5)";
                  e.currentTarget.style.background = "rgba(204,0,32,0.05)";
                  e.currentTarget.style.boxShadow = "0 0 30px rgba(204,0,32,0.1)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = "rgba(204,0,32,0.15)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                  e.currentTarget.style.boxShadow = "none";
                }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{card.icon}</div>
                <h3 style={{ color: "#cc0020", fontSize: 14, letterSpacing: "0.1em", marginBottom: 12, fontFamily: "'Courier New', monospace" }}>{card.title}</h3>
                <p style={{ color: "#777", fontSize: 13, lineHeight: 1.7 }}>{card.desc}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ padding: "100px 32px", background: "rgba(204,0,32,0.02)", borderTop: "1px solid rgba(204,0,32,0.08)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <AnimatedSection>
            <div style={{ color: "#cc0020", fontSize: 10, letterSpacing: "0.3em", fontFamily: "'Courier New', monospace", marginBottom: 16 }}>02 // DATA_TRANSMISSION_PATH</div>
            <h2 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 100, marginBottom: 48, letterSpacing: "0.05em" }}>
              How It <span style={{ color: "#cc0020" }}>Works</span>
            </h2>
          </AnimatedSection>
          <HowItWorks />
          <AnimatedSection delay={0.4}>
            <div style={{ marginTop: 48, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              {[
                { label: "SERVICE ARCHITECTURE", desc: "Retrieve the layers of cloud infrastructure" },
                { label: "PAAS", desc: "Platform layer" },
                { label: "IAAS", desc: "Combines as a service providing shared applications via cloud across the org without local infrastructure required." }
              ].map(item => (
                <div key={item.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(204,0,32,0.12)", borderRadius: 3, padding: 16 }}>
                  <div style={{ color: "#cc0020", fontSize: 9, letterSpacing: "0.2em", fontFamily: "'Courier New', monospace", marginBottom: 8 }}>{item.label}</div>
                  <p style={{ color: "#666", fontSize: 12, lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CLOUD TYPES */}
      <section id="types" style={{ padding: "100px 32px", maxWidth: 1100, margin: "0 auto" }}>
        <AnimatedSection>
          <div style={{ color: "#cc0020", fontSize: 10, letterSpacing: "0.3em", fontFamily: "'Courier New', monospace", marginBottom: 16 }}>03 // DEPLOYMENT_TYPES</div>
          <h2 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 100, marginBottom: 48, letterSpacing: "0.05em" }}>
            Cloud <span style={{ color: "#cc0020" }}>Deployment Models</span>
          </h2>
        </AnimatedSection>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {cloudTypes.map((c, i) => <CloudTypeCard key={c.title} cloud={c} i={i} />)}
        </div>
      </section>

      {/* TRIANGLE */}
      <section id="triangle" style={{ padding: "100px 32px", background: "rgba(204,0,32,0.02)", borderTop: "1px solid rgba(204,0,32,0.08)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <AnimatedSection>
            <div style={{ color: "#cc0020", fontSize: 10, letterSpacing: "0.3em", fontFamily: "'Courier New', monospace", marginBottom: 16 }}>04 // NATIVE_LAYER_SAAS</div>
            <h2 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 100, marginBottom: 16, letterSpacing: "0.05em" }}>
              SaaS · PaaS · <span style={{ color: "#cc0020" }}>IaaS</span>
            </h2>
            <p style={{ color: "#555", fontSize: 14, marginBottom: 48, maxWidth: 500, lineHeight: 1.7 }}>
              The three pillars of cloud service delivery. Each level abstracts more infrastructure complexity from the user.
            </p>
          </AnimatedSection>
          <ServiceTriangle />
        </div>
      </section>

      {/* COMPARISON */}
      <section style={{ padding: "100px 32px", maxWidth: 1100, margin: "0 auto" }}>
        <AnimatedSection>
          <div style={{ color: "#cc0020", fontSize: 10, letterSpacing: "0.3em", fontFamily: "'Courier New', monospace", marginBottom: 16 }}>05 // ADVANTAGES & DISADVANTAGES</div>
          <h2 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 100, marginBottom: 48, letterSpacing: "0.05em" }}>
            The <span style={{ color: "#cc0020" }}>Full Picture</span>
          </h2>
        </AnimatedSection>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>
          <div>
            <div style={{ color: "#cc0020", fontSize: 11, letterSpacing: "0.2em", fontFamily: "'Courier New', monospace", marginBottom: 20, paddingBottom: 12, borderBottom: "1px solid rgba(204,0,32,0.2)" }}>
              ✓ ADVANTAGES
            </div>
            {advantages.map((a, i) => (
              <AnimatedSection key={a.text} delay={i * 0.08}>
                <div
                  onMouseEnter={e => e.currentTarget.style.paddingLeft = "8px"}
                  onMouseLeave={e => e.currentTarget.style.paddingLeft = "0"}
                  style={{ transition: "padding 0.3s ease", padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ color: "#fff", fontSize: 14, marginBottom: 4 }}>{a.text}</div>
                  <div style={{ color: "#555", fontSize: 12, lineHeight: 1.5 }}>{a.detail}</div>
                </div>
              </AnimatedSection>
            ))}
          </div>
          <div>
            <div style={{ color: "#ff4060", fontSize: 11, letterSpacing: "0.2em", fontFamily: "'Courier New', monospace", marginBottom: 20, paddingBottom: 12, borderBottom: "1px solid rgba(204,0,32,0.2)" }}>
              ✗ CONSIDERATIONS
            </div>
            {disadvantages.map((d, i) => (
              <AnimatedSection key={d.text} delay={i * 0.08}>
                <div style={{ padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ color: "#ff6080", fontSize: 14, marginBottom: 4 }}>{d.text}</div>
                  <div style={{ color: "#555", fontSize: 12, lineHeight: 1.5 }}>{d.detail}</div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* REAL WORLD APPS */}
      <section style={{ padding: "100px 32px", background: "rgba(204,0,32,0.02)", borderTop: "1px solid rgba(204,0,32,0.08)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <AnimatedSection>
            <div style={{ color: "#cc0020", fontSize: 10, letterSpacing: "0.3em", fontFamily: "'Courier New', monospace", marginBottom: 16 }}>06 // REAL-WORLD APPLICATIONS</div>
            <h2 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 100, marginBottom: 12, letterSpacing: "0.05em" }}>
              Powered by <span style={{ color: "#cc0020" }}>Cloud</span>
            </h2>
            <p style={{ color: "#555", fontSize: 13, marginBottom: 48, fontFamily: "'Courier New', monospace" }}>CLICK EACH CARD TO REVEAL CLOUD DETAILS</p>
          </AnimatedSection>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
            {apps.map((app, i) => <AppCard key={app.name} app={app} i={i} />)}
          </div>
        </div>
      </section>

      {/* SIMULATOR */}
      <section style={{ padding: "100px 32px", maxWidth: 1100, margin: "0 auto" }}>
        <AnimatedSection>
          <div style={{ color: "#cc0020", fontSize: 10, letterSpacing: "0.3em", fontFamily: "'Courier New', monospace", marginBottom: 16 }}>07 // MINI CLOUD SIMULATOR</div>
          <h2 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 100, marginBottom: 16, letterSpacing: "0.05em" }}>
            Experience the <span style={{ color: "#cc0020" }}>Upload</span>
          </h2>
          <p style={{ color: "#555", fontSize: 14, marginBottom: 48, lineHeight: 1.7, maxWidth: 500 }}>Watch a file travel from your device through the internet, into the cloud, and distribute across redundant servers.</p>
        </AnimatedSection>
        <CloudSimulator />
      </section>

      {/* MYTH VS FACT */}
      <section style={{ padding: "100px 32px", background: "rgba(204,0,32,0.02)", borderTop: "1px solid rgba(204,0,32,0.08)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <AnimatedSection>
            <div style={{ color: "#cc0020", fontSize: 10, letterSpacing: "0.3em", fontFamily: "'Courier New', monospace", marginBottom: 16 }}>08 // MYTH VS FACT</div>
            <h2 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 100, marginBottom: 12, letterSpacing: "0.05em" }}>
              Bust the <span style={{ color: "#cc0020" }}>Myths</span>
            </h2>
            <p style={{ color: "#555", fontSize: 13, marginBottom: 48, fontFamily: "'Courier New', monospace" }}>CLICK EACH CARD TO REVEAL THE TRUTH</p>
          </AnimatedSection>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {myths.map((m, i) => <MythCard key={i} item={m} i={i} />)}
          </div>
        </div>
      </section>

      {/* QUIZ */}
      <section id="quiz" style={{ padding: "100px 32px", maxWidth: 1100, margin: "0 auto" }}>
        <AnimatedSection>
          <div style={{ color: "#cc0020", fontSize: 10, letterSpacing: "0.3em", fontFamily: "'Courier New', monospace", marginBottom: 16 }}>09 // ACHIEVEMENT_QUALIFICATION</div>
          <h2 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 100, marginBottom: 12, letterSpacing: "0.05em" }}>
            Prove Your <span style={{ color: "#cc0020" }}>Knowledge</span>
          </h2>
          <p style={{ color: "#555", fontSize: 14, marginBottom: 48, lineHeight: 1.7, maxWidth: 500 }}>8 questions. Score 6+ to unlock confetti. Test your cloud computing expertise.</p>
        </AnimatedSection>
        <Quiz />
      </section>

      {/* FINAL */}
      <section style={{
        position: "relative", padding: "140px 32px", textAlign: "center",
        borderTop: "1px solid rgba(204,0,32,0.15)", overflow: "hidden"
      }}>
        <GridBackground />
        <ParticleField />
        <div style={{ position: "relative", zIndex: 2 }}>
          <AnimatedSection>
            <div style={{ color: "#cc0020", fontSize: 10, letterSpacing: "0.3em", marginBottom: 24, fontFamily: "'Courier New', monospace" }}>// TRANSMISSION COMPLETE</div>
            <h2 style={{ fontSize: "clamp(32px, 8vw, 88px)", fontWeight: 100, lineHeight: 1.1, marginBottom: 32, letterSpacing: "0.05em" }}>
              THE FUTURE<br />
              <span style={{ color: "#cc0020", textShadow: "0 0 60px rgba(204,0,32,0.6)" }}>RUNS ON THE CLOUD</span>
            </h2>
            <p style={{ color: "#555", maxWidth: 480, margin: "0 auto 40px", lineHeight: 1.7, fontSize: 14 }}>
              From the apps you use daily to the AI that powers intelligence — everything lives in the cloud. The infrastructure of tomorrow is already here.
            </p>
            <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
              <GlowButton onClick={() => scrollTo("what")}>EXPLORE AGAIN</GlowButton>
            </div>
          </AnimatedSection>
          <div style={{ marginTop: 80, display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
            {["SCALABLE", "DISTRIBUTED", "RESILIENT", "GLOBAL"].map(word => (
              <div key={word} style={{ color: "#333", fontSize: 10, letterSpacing: "0.3em", fontFamily: "'Courier New', monospace" }}>{word}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <div style={{ borderTop: "1px solid rgba(204,0,32,0.15)", padding: "28px 32px", background: "#060606" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ color: "#cc0020", fontFamily: "'Courier New', monospace", fontSize: 13, letterSpacing: "0.2em" }}>◈ CLOUD COMPUTING</div>
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap", justifyContent: "center" }}>
            {["ARESMOUK MOHAMED", "ANOUAR HASSINE"].map(name => (
              <div key={name} style={{ textAlign: "center" }}>
                <div style={{ color: "#cc0020", fontSize: 9, letterSpacing: "0.25em", fontFamily: "'Courier New', monospace", marginBottom: 4 }}>PRESENTED BY</div>
                <div style={{ color: "#fff", fontSize: 12, letterSpacing: "0.15em", fontFamily: "'Courier New', monospace" }}>{name}</div>
              </div>
            ))}
          </div>
          <div style={{ color: "#333", fontSize: 10, fontFamily: "'Courier New', monospace" }}>Thanks, y'all :)</div>
        </div>
      </div>
    </div>
  );
}
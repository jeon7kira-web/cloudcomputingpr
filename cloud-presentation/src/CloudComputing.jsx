import { useState, useEffect, useRef, useMemo } from "react";
import React from "react";
const Ctx = React.createContext("dark");

const SERVICES = {
  SaaS: { label:"Software as a Service", examples:["Gmail","Netflix","Salesforce","Slack","Google Drive"], definition:"Fully managed apps delivered over the internet. Access via browser — no installation required.", useCases:["Email & collaboration","CRM systems","Streaming platforms","Project management"], control:10 },
  PaaS: { label:"Platform as a Service", examples:["Firebase","Heroku","Google App Engine","Azure App Service"], definition:"A managed platform for developers to build and deploy apps without handling infrastructure.", useCases:["App development","API deployment","Database management","Testing environments"], control:45 },
  IaaS: { label:"Infrastructure as a Service", examples:["AWS EC2","Azure VMs","Google Compute Engine","DigitalOcean"], definition:"Virtualised compute provisioned over the internet. Full control over OS, storage, and networking.", useCases:["Virtual machines","Storage solutions","Networking","Data centre replacement"], control:82 },
};

const CLOUD_TYPES = [
  { title:"Public Cloud", icon:"🌐", desc:"Managed by third-party providers over the internet. Resources shared across multiple organisations.", detail:"AWS, Azure, and Google Cloud Platform dominate. Pay-as-you-go, infinite scalability, zero upfront hardware." },
  { title:"Private Cloud", icon:"🔒", desc:"Dedicated infrastructure for a single organisation, either on-premises or hosted.", detail:"Maximum control and security. Ideal for regulated industries like banking, healthcare, and government." },
  { title:"Hybrid Cloud", icon:"⚡", desc:"Combines public and private clouds, letting data and apps flow between them seamlessly.", detail:"Best of both worlds. Run sensitive workloads privately while bursting to public cloud on demand." },
];

const FLOW_NODES = [
  { label:"USER", icon:"👤", desc:"Sends request" },
  { label:"INTERNET", icon:"🌐", desc:"Data transmission" },
  { label:"CLOUD", icon:"☁️", desc:"Processing layer" },
  { label:"SERVERS", icon:"🖥️", desc:"Compute & storage" },
  { label:"DATA", icon:"💾", desc:"Returned response" },
];

const APPS = [
  { name:"Netflix", icon:"🎬", cloud:"AWS", stat:"250M+ streams/day", desc:"Content delivery, encoding, and recommendation AI all run on AWS infrastructure." },
  { name:"Spotify", icon:"🎵", cloud:"Google Cloud", stat:"100 PB of audio", desc:"Music streaming, playlist generation, and Wrapped analytics are fully cloud-powered." },
  { name:"Google Drive", icon:"📂", cloud:"GCP", stat:"1B+ users", desc:"Real-time collaboration, version history, and search are native cloud capabilities." },
  { name:"AI Tools", icon:"🤖", cloud:"Multi-cloud", stat:"GPT-4, Claude, Gemini", desc:"LLMs require massive distributed GPU clusters — only feasible in the cloud." },
  { name:"Gaming", icon:"🎮", cloud:"Azure / AWS", stat:"Xbox Cloud Gaming", desc:"Game streaming, matchmaking, and save states all run in cloud data centres." },
  { name:"Banking", icon:"🏦", cloud:"Hybrid Cloud", stat:"99.999% uptime", desc:"Fraud detection and compliance leverage cloud scale with private-cloud security." },
];

const MYTHS = [
  { myth:"Cloud is always more secure than on-premise", fact:"Security depends on configuration. Both can be equally hardened when managed correctly." },
  { myth:"Cloud = Internet", fact:"Cloud uses the internet for access, but it's a managed infrastructure of servers and services." },
  { myth:"Data is lost if a cloud provider shuts down", fact:"Reputable providers offer export tools, redundancy, and SLA guarantees that protect your data." },
  { myth:"Cloud is only for big companies", fact:"Cloud scales from solo developers to global enterprises — pricing adjusts to every size." },
];

const QUESTIONS = [
  { q:"What does 'cloud computing' primarily refer to?", opts:["Using clouds as antennas","Delivering computing services over the internet","Storing files locally","A new OS"], ans:1 },
  { q:"Which service model gives users the most infrastructure control?", opts:["SaaS","PaaS","IaaS","All equal"], ans:2 },
  { q:"Netflix primarily uses which cloud provider?", opts:["Google Cloud","Microsoft Azure","Amazon Web Services","IBM Cloud"], ans:2 },
  { q:"What cloud type is dedicated to a single organisation?", opts:["Public Cloud","Hybrid Cloud","Private Cloud","Community Cloud"], ans:2 },
  { q:"Gmail is an example of which service model?", opts:["IaaS","PaaS","SaaS","DaaS"], ans:2 },
  { q:"Which cloud type combines public and private clouds?", opts:["Multi-Cloud","Hybrid Cloud","Community Cloud","Edge Cloud"], ans:1 },
  { q:"Firebase by Google is primarily an example of:", opts:["IaaS","SaaS","PaaS","BaaS only"], ans:2 },
  { q:"What is a core advantage of cloud computing?", opts:["Requires expensive hardware","No internet needed","Elastic scalability","Limited to enterprises"], ans:2 },
];

const ADVANTAGES = [
  { text:"Cost Efficiency", detail:"No upfront hardware investment. Pay only for what you use." },
  { text:"Elastic Scalability", detail:"Scale resources up or down in seconds, globally." },
  { text:"High Availability", detail:"99.99% uptime SLAs with geographic redundancy." },
  { text:"Collaboration", detail:"Real-time access from any device, anywhere on Earth." },
  { text:"Automatic Updates", detail:"Software and security patches deployed by providers." },
  { text:"Disaster Recovery", detail:"Built-in backup and failover across multiple regions." },
];

const DISADVANTAGES = [
  { text:"Internet Dependency", detail:"Offline access is limited or nonexistent for most services." },
  { text:"Vendor Lock-in", detail:"Migrating between providers can be complex and costly." },
  { text:"Security Concerns", detail:"Shared infrastructure raises data privacy considerations." },
  { text:"Ongoing Costs", detail:"Subscription fees accumulate — can exceed on-prem in some cases." },
];

function getThemeVars(theme) {
  if (theme === "light") return { bg:"#f4f0eb", bg2:"#ebe6df", surface:"rgba(0,0,0,0.03)", border:"rgba(160,0,18,0.18)", borderH:"rgba(160,0,18,0.45)", red:"#b50019", red2:"#d42030", redGlow:"rgba(160,0,18,0.18)", text:"#1a1a1a", text2:"#444", text3:"#777", text4:"#aaa", green:"#007a38", gridStroke:"rgba(160,0,18,0.12)" };
  return { bg:"#080808", bg2:"#111", surface:"rgba(255,255,255,0.03)", border:"rgba(204,0,32,0.2)", borderH:"rgba(204,0,32,0.55)", red:"#cc0020", red2:"#ff4060", redGlow:"rgba(204,0,32,0.3)", text:"#ffffff", text2:"#aaaaaa", text3:"#666", text4:"#444", green:"#00c864", gridStroke:"rgba(204,0,32,0.07)" };
}

function useInView(threshold=0.1) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

function Reveal({ children, delay=0 }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} style={{ opacity: inView?1:0, transform: inView?"translateY(0)":"translateY(30px)", transition:`opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s` }}>
      {children}
    </div>
  );
}

function GlowBtn({ children, onClick, style: s={} }) {
  const [hov, setHov] = useState(false);
  const theme = React.useContext(Ctx);
  const v = getThemeVars(theme);
  return (
    <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{ background: hov?v.red:"transparent", border:`1.5px solid ${v.red}`, color:v.text, padding:"11px 28px", fontSize:12, letterSpacing:"0.15em", cursor:"pointer", transition:"all 0.25s", textTransform:"uppercase", fontFamily:"'Courier New', monospace", borderRadius:2, boxShadow: hov?`0 0 26px ${v.redGlow}`:`0 0 10px ${v.redGlow}`, ...s }}>
      {children}
    </button>
  );
}

function GridBg() {
  const theme = React.useContext(Ctx);
  const v = getThemeVars(theme);
  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden" }}>
      <svg width="100%" height="100%">
        <defs><pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M 60 0 L 0 0 0 60" fill="none" stroke={v.gridStroke} strokeWidth="0.5"/></pattern></defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
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
    const pts = Array.from({length:55}, ()=>({ x:Math.random()*w, y:Math.random()*h, vx:(Math.random()-.5)*.28, vy:(Math.random()-.5)*.28, r:Math.random()*1.3+.4, a:Math.random()*.4+.07 }));
    let raf;
    const draw = () => {
      ctx.clearRect(0,0,w,h);
      pts.forEach(p => { p.x=(p.x+p.vx+w)%w; p.y=(p.y+p.vy+h)%h; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle=`rgba(204,0,32,${p.a})`; ctx.fill(); });
      pts.forEach((a,i) => { for (let j=i+1;j<pts.length;j++) { const b=pts[j]; const d=Math.hypot(a.x-b.x,a.y-b.y); if(d<95){ ctx.beginPath(); ctx.strokeStyle=`rgba(204,0,32,${.07*(1-d/95)})`; ctx.lineWidth=.5; ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); } } });
      raf = requestAnimationFrame(draw);
    };
    draw();
    const ro = new ResizeObserver(()=>{ w=canvas.width=canvas.offsetWidth; h=canvas.height=canvas.offsetHeight; });
    ro.observe(canvas);
    return ()=>{ cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return <canvas ref={canvasRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }}/>;
}

function Nav({ theme, toggleTheme }) {
  const v = getThemeVars(theme);
  const mono = "'Courier New', monospace";
  const links = ["what","how","types","services","apps","quiz"];
  const scrollTo = id => document.getElementById(id)?.scrollIntoView({behavior:"smooth"});
  return (
    <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, background: theme==="dark"?"rgba(8,8,8,0.93)":"rgba(244,240,235,0.95)", borderBottom:`1px solid ${v.border}`, backdropFilter:"blur(18px)", padding:"0 28px", height:54, display:"flex", alignItems:"center", justifyContent:"space-between", transition:"background 0.3s" }}>
      <div style={{ color:v.red, fontFamily:mono, fontSize:12, letterSpacing:"0.2em" }}>◈ CLOUD COMPUTING</div>
      <div style={{ display:"flex", gap:2, alignItems:"center" }}>
        {links.map(id => (
          <button key={id} onClick={()=>scrollTo(id)} onMouseEnter={e=>e.target.style.color=v.red} onMouseLeave={e=>e.target.style.color=v.text3} style={{ background:"none", border:"none", color:v.text3, fontSize:10, letterSpacing:"0.13em", cursor:"pointer", textTransform:"uppercase", fontFamily:mono, padding:"5px 9px", borderRadius:3, transition:"color 0.18s" }}>{id}</button>
        ))}
        <button onClick={toggleTheme} onMouseEnter={e=>{ e.currentTarget.style.borderColor=v.red; e.currentTarget.style.color=v.red; }} onMouseLeave={e=>{ e.currentTarget.style.borderColor=v.border; e.currentTarget.style.color=v.text3; }} style={{ background:"none", border:`1.5px solid ${v.border}`, color:v.text3, fontFamily:mono, fontSize:9, letterSpacing:"0.12em", cursor:"pointer", padding:"4px 10px", borderRadius:3, marginLeft:10, transition:"all 0.22s" }}>
          {theme==="dark"?"☀ LIGHT":"☾ DARK"}
        </button>
      </div>
    </nav>
  );
}

function Eyebrow({ n, label }) {
  const theme = React.useContext(Ctx);
  const v = getThemeVars(theme);
  return <div style={{ color:v.red, fontSize:10, letterSpacing:"0.3em", fontFamily:"'Courier New', monospace", marginBottom:14, textTransform:"uppercase" }}>{String(n).padStart(2,"0")} // {label}</div>;
}

function SectionH2({ text, accent }) {
  const theme = React.useContext(Ctx);
  const v = getThemeVars(theme);
  return <h2 style={{ fontSize:"clamp(24px,5vw,48px)", fontWeight:100, letterSpacing:"0.04em", marginBottom:"2rem", color:v.text }}>{text} <span style={{color:v.red}}>{accent}</span></h2>;
}

const SEC = { padding:"88px 36px", maxWidth:1060, margin:"0 auto" };

function HowItWorks() {
  const [active, setActive] = useState(0);
  const [ref, inView] = useInView();
  const theme = React.useContext(Ctx);
  const v = getThemeVars(theme);
  useEffect(() => {
    if (!inView) return;
    const t = setInterval(()=>setActive(a=>(a+1)%FLOW_NODES.length), 1300);
    return ()=>clearInterval(t);
  }, [inView]);
  return (
    <div ref={ref} style={{ opacity:inView?1:0, transition:"opacity 0.8s" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", flexWrap:"wrap", gap:0 }}>
        {FLOW_NODES.map((n,i) => (
          <div key={n.label} style={{ display:"flex", alignItems:"center" }}>
            <div onClick={()=>setActive(i)} style={{ textAlign:"center", padding:"16px 12px", cursor:"pointer", background: active===i?"rgba(204,0,32,0.13)":v.surface, border:`1px solid ${active===i?"rgba(204,0,32,0.75)":v.border}`, borderRadius:5, minWidth:84, transition:"all 0.3s", boxShadow: active===i?"0 0 22px rgba(204,0,32,0.22)":"none", transform: active===i?"scale(1.07)":"scale(1)" }}>
              <div style={{fontSize:24,marginBottom:6}}>{n.icon}</div>
              <div style={{ color:active===i?v.red2:v.text3, fontSize:9, letterSpacing:"0.13em", fontFamily:"'Courier New', monospace" }}>{n.label}</div>
              <div style={{ color:v.text4, fontSize:9, marginTop:2 }}>{n.desc}</div>
            </div>
            {i<FLOW_NODES.length-1 && (
              <div style={{ position:"relative", width:32, height:2, flexShrink:0, background:"rgba(204,0,32,0.18)" }}>
                {i<active && <div style={{ position:"absolute", top:-3, right:4, width:8, height:8, background:v.red, borderRadius:"50%", boxShadow:"0 0 8px rgba(204,0,32,0.8)" }}/>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ServiceTriangle() {
  const [active, setActive] = useState(null);
  const theme = React.useContext(Ctx);
  const v = getThemeVars(theme);
  const mono = "'Courier New', monospace";

  const layers = [
    { key:"SaaS", label:"SaaS", sub:"Software as a Service", color:"rgba(204,0,32,0.75)", fill:"rgba(204,0,32,0.13)", h:90, clip:"polygon(10% 0%, 90% 0%, 80% 100%, 20% 100%)" },
    { key:"PaaS", label:"PaaS", sub:"Platform as a Service", color:"rgba(204,0,32,0.5)", fill:"rgba(204,0,32,0.07)", h:100, clip:"polygon(20% 0%, 80% 0%, 73% 100%, 27% 100%)" },
    { key:"IaaS", label:"IaaS", sub:"Infrastructure as a Service", color:"rgba(204,0,32,0.3)", fill:"rgba(204,0,32,0.04)", h:110, clip:"polygon(27% 0%, 73% 0%, 68% 100%, 32% 100%)" },
  ];

  const s = active ? SERVICES[active] : null;

  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:32, alignItems:"start" }}>
      <div>
        <div style={{ position:"relative", width:"100%", maxWidth:320, margin:"0 auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8, fontFamily:mono, fontSize:9, letterSpacing:"0.14em", color:v.text4 }}>
            <span>MORE MANAGED</span>
            <span>MORE CONTROL</span>
          </div>
          {layers.map((l) => {
            const isActive = active === l.key;
            return (
              <div key={l.key} onClick={()=>setActive(active===l.key?null:l.key)} style={{ cursor:"pointer", marginBottom:3, padding:"0 16px", clipPath:l.clip, height:l.h, display:"flex", alignItems:"center", justifyContent:"center", background: isActive?"rgba(204,0,32,0.2)":l.fill, border:"none", transition:"background 0.25s", position:"relative", boxSizing:"border-box" }}>
                <div style={{ textAlign:"center", pointerEvents:"none" }}>
                  <div style={{ color: isActive?v.red2:l.color, fontFamily:mono, fontSize:15, letterSpacing:"0.14em", fontWeight:700, transition:"color 0.2s" }}>{l.label}</div>
                  <div style={{ color: isActive?v.text2:v.text4, fontSize:10, letterSpacing:"0.09em", marginTop:2, transition:"color 0.2s" }}>{l.sub}</div>
                </div>
                <div style={{ position:"absolute", inset:0, clipPath:l.clip, border:`1px solid ${isActive?"rgba(204,0,32,0.7)":v.border}`, pointerEvents:"none", transition:"border-color 0.2s" }}/>
              </div>
            );
          })}
          <div style={{ marginTop:16, fontFamily:mono }}>
            <div style={{ fontSize:9, color:v.text4, letterSpacing:"0.12em", marginBottom:6 }}>PROVIDER MANAGES ←———————→ YOU MANAGE</div>
            <div style={{ display:"flex", gap:3 }}>
              {["SaaS","PaaS","IaaS"].map(k=>(
                <div key={k} onClick={()=>setActive(active===k?null:k)} style={{ flex:1, height:4, borderRadius:2, background: active===k?v.red:"rgba(204,0,32,0.22)", cursor:"pointer", transition:"background 0.2s" }}/>
              ))}
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:8, color:v.text4, marginTop:4 }}>
              <span>SaaS</span><span>PaaS</span><span>IaaS</span>
            </div>
          </div>
          <div style={{ marginTop:12, color:v.text4, fontFamily:mono, fontSize:9, letterSpacing:"0.1em", textAlign:"center" }}>CLICK A LAYER TO EXPLORE</div>
        </div>
      </div>

      <div style={{ minHeight:280 }}>
        {!s ? (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {["SaaS","PaaS","IaaS"].map(k=>{
              const svc = SERVICES[k];
              return (
                <div key={k} onClick={()=>setActive(k)} style={{ background:v.surface, border:`1px solid ${v.border}`, borderRadius:5, padding:"14px 18px", cursor:"pointer", transition:"border-color 0.2s" }} onMouseEnter={e=>e.currentTarget.style.borderColor=v.borderH} onMouseLeave={e=>e.currentTarget.style.borderColor=v.border}>
                  <div style={{ display:"flex", alignItems:"baseline", gap:10, marginBottom:4 }}>
                    <span style={{ color:v.red, fontFamily:mono, fontSize:13, letterSpacing:"0.1em" }}>{k}</span>
                    <span style={{ color:v.text3, fontSize:11 }}>{svc.label}</span>
                  </div>
                  <p style={{ color:v.text3, fontSize:12, lineHeight:1.6 }}>{svc.definition}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ background:v.surface, border:`1px solid rgba(204,0,32,0.35)`, borderRadius:6, padding:24 }}>
            <div style={{ display:"flex", alignItems:"baseline", gap:12, marginBottom:6 }}>
              <span style={{ color:v.text, fontSize:22, fontFamily:mono }}>{active}</span>
              <span style={{ color:v.red, fontSize:12 }}>{s.label}</span>
            </div>
            <p style={{ color:v.text2, fontSize:13, lineHeight:1.75, marginBottom:20, maxWidth:380 }}>{s.definition}</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
              <div>
                <div style={{ color:v.text4, fontSize:10, letterSpacing:"0.15em", fontFamily:mono, marginBottom:8 }}>EXAMPLES</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {s.examples.map(ex=>(
                    <span key={ex} style={{ background:"rgba(204,0,32,0.12)", border:"1px solid rgba(204,0,32,0.28)", color:v.red2, fontSize:10, padding:"2px 9px", borderRadius:100, fontFamily:mono }}>{ex}</span>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ color:v.text4, fontSize:10, letterSpacing:"0.15em", fontFamily:mono, marginBottom:8 }}>USE CASES</div>
                {s.useCases.map(uc=>(
                  <div key={uc} style={{ color:v.text3, fontSize:12, padding:"4px 0", borderBottom:"1px solid rgba(255,255,255,0.04)", display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{color:v.red}}>→</span>{uc}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop:18, background:"rgba(204,0,32,0.06)", border:`1px solid ${v.border}`, borderRadius:4, padding:"12px 16px" }}>
              <div style={{ color:v.text3, fontSize:12, marginBottom:6 }}>Infrastructure abstraction — how much <em>you</em> manage</div>
              <div style={{ height:4, borderRadius:2, background:`linear-gradient(90deg,${v.red} ${s.control}%,rgba(204,0,32,0.12) ${s.control}%)`, marginBottom:6, transition:"background 0.4s" }}/>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, fontFamily:mono, color:v.text4 }}>
                <span>Fully managed by provider</span><span>Fully managed by you</span>
              </div>
            </div>
            <button onClick={()=>setActive(null)} style={{ marginTop:14, background:"none", border:"none", color:v.text4, fontSize:10, letterSpacing:"0.12em", fontFamily:mono, cursor:"pointer", textDecoration:"underline" }}>← BACK</button>
          </div>
        )}
      </div>
    </div>
  );
}

function CloudTypeCard({ cloud, delay }) {
  const [hov, setHov] = useState(false);
  const [ref, inView] = useInView();
  const theme = React.useContext(Ctx);
  const v = getThemeVars(theme);
  return (
    <div ref={ref} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{ background: hov?"rgba(204,0,32,0.07)":v.surface, border:`1px solid ${hov?v.borderH:v.border}`, borderRadius:6, padding:"26px 20px", cursor:"default", transition:"all 0.3s", boxShadow: hov?"0 0 34px rgba(204,0,32,0.1)":"none", opacity: inView?1:0, transform: inView?"translateY(0)":"translateY(28px)", transitionDelay:`${delay}s` }}>
      <div style={{fontSize:32,marginBottom:12}}>{cloud.icon}</div>
      <h3 style={{ color:v.red, fontSize:16, marginBottom:9, fontFamily:"'Courier New', monospace", letterSpacing:"0.07em" }}>{cloud.title}</h3>
      <p style={{ color:v.text2, fontSize:13, lineHeight:1.7 }}>{cloud.desc}</p>
      <div style={{ maxHeight:hov?90:0, overflow:"hidden", transition:"max-height 0.35s ease", color:v.text3, fontSize:12, lineHeight:1.6, borderTop: hov?"1px solid rgba(204,0,32,0.16)":"none", paddingTop: hov?10:0, marginTop: hov?10:0 }}>{cloud.detail}</div>
    </div>
  );
}

function FlipCard({ front, back, height=174 }) {
  const [flipped, setFlipped] = useState(false);
  const theme = React.useContext(Ctx);
  const v = getThemeVars(theme);
  const faceBase = { position:"absolute", inset:0, backfaceVisibility:"hidden", WebkitBackfaceVisibility:"hidden", borderRadius:6, padding:16, display:"flex", flexDirection:"column", justifyContent:"space-between" };
  return (
    <div onClick={()=>setFlipped(f=>!f)} style={{ perspective:600, cursor:"pointer", height }}>
      <div style={{ position:"relative", width:"100%", height:"100%", transformStyle:"preserve-3d", transform: flipped?"rotateY(180deg)":"rotateY(0deg)", transition:"transform 0.5s ease" }}>
        <div style={{ ...faceBase, background:v.surface, border:`1px solid ${v.border}` }}>{front}</div>
        <div style={{ ...faceBase, transform:"rotateY(180deg)", background:"rgba(204,0,32,0.07)", border:"1px solid rgba(204,0,32,0.44)" }}>{back}</div>
      </div>
    </div>
  );
}

function AppCards() {
  const [ref, inView] = useInView();
  const theme = React.useContext(Ctx);
  const v = getThemeVars(theme);
  return (
    <div ref={ref} style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(168px,1fr))", gap:13 }}>
      {APPS.map((app,i) => (
        <div key={app.name} style={{ opacity:inView?1:0, transform:inView?"translateY(0)":"translateY(26px)", transition:`opacity 0.55s ease ${i*.09}s, transform 0.55s ease ${i*.09}s` }}>
          <FlipCard height={178}
            front={<><div style={{fontSize:28}}>{app.icon}</div><div><div style={{ color:v.text, fontSize:14, fontWeight:500, marginBottom:3 }}>{app.name}</div><div style={{ color:v.red, fontSize:10, fontFamily:"'Courier New', monospace" }}>{app.stat}</div></div><div style={{ color:v.text4, fontSize:9, fontFamily:"'Courier New', monospace" }}>CLICK TO REVEAL</div></>}
            back={<><div style={{ color:v.red, fontSize:10, fontFamily:"'Courier New', monospace" }}>CLOUD: {app.cloud}</div><p style={{ color:v.text2, fontSize:12, lineHeight:1.6 }}>{app.desc}</p><div style={{ color:v.red2, fontSize:9, fontFamily:"'Courier New', monospace" }}>← TAP TO FLIP</div></>}
          />
        </div>
      ))}
    </div>
  );
}

function CloudSimulator() {
  const [state, setState] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [servers, setServers] = useState([false,false,false]);
  const theme = React.useContext(Ctx);
  const v = getThemeVars(theme);

  const simulate = () => {
    if (state!=="idle") return;
    setState("uploading"); setProgress(0); setServers([false,false,false]);
    let p=0;
    const t = setInterval(()=>{ p+=2; setProgress(p); if(p>=100){ clearInterval(t); setState("distributing"); setTimeout(()=>setServers([true,false,false]),400); setTimeout(()=>setServers([true,true,false]),800); setTimeout(()=>setServers([true,true,true]),1200); setTimeout(()=>setState("done"),1600); } },30);
  };
  const reset = () => { setState("idle"); setProgress(0); setServers([false,false,false]); };

  return (
    <div style={{ background:v.surface, border:`1px solid ${v.border}`, borderRadius:6, padding:26 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-around", flexWrap:"wrap", gap:18, marginBottom:22 }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ width:54, height:62, background:"rgba(204,0,32,0.09)", border:"1px solid rgba(204,0,32,0.35)", margin:"0 auto 6px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, borderRadius:4, transition:"all 0.45s", transform: state==="uploading"?"translateX(14px) scale(0.9)":"none", opacity: state==="done"?0.3:1 }}>📄</div>
          <div style={{ color:v.text4, fontSize:9, fontFamily:"'Courier New', monospace" }}>FILE.DAT</div>
        </div>
        <div style={{ color:v.red, fontSize:17, opacity: state!=="idle"?1:0.28 }}>→</div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:44, transition:"all 0.45s", filter: state==="distributing"||state==="done"?"drop-shadow(0 0 14px rgba(204,0,32,0.7))":"none", transform: state!=="idle"?"scale(1.1)":"scale(1)" }}>☁️</div>
          <div style={{ color:v.text4, fontSize:9, fontFamily:"'Courier New', monospace", marginTop:4 }}>CLOUD</div>
        </div>
        <div style={{ color:v.red, fontSize:17, opacity: state==="distributing"||state==="done"?1:0.28 }}>→</div>
        <div style={{ display:"flex", gap:8 }}>
          {servers.map((on,i)=>(
            <div key={i} style={{ textAlign:"center" }}>
              <div style={{ width:34, height:44, borderRadius:4, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, background: on?"rgba(204,0,32,0.17)":v.surface, border:`1px solid ${on?"rgba(204,0,32,0.75)":v.border}`, transition:"all 0.35s", boxShadow: on?"0 0 14px rgba(204,0,32,0.3)":"none" }}>🖥️</div>
              <div style={{ color:v.text4, fontSize:8, marginTop:3, fontFamily:"'Courier New', monospace" }}>SRV{i+1}</div>
            </div>
          ))}
        </div>
      </div>
      {state==="uploading" && <div style={{ marginBottom:16 }}>
        <div style={{ height:2, background:"rgba(255,255,255,0.05)", borderRadius:1, marginBottom:5 }}>
          <div style={{ height:"100%", width:`${progress}%`, background:v.red, transition:"width 0.03s linear", borderRadius:1, boxShadow:"0 0 8px rgba(204,0,32,0.5)" }}/>
        </div>
        <div style={{ color:v.text4, fontSize:10, fontFamily:"'Courier New', monospace" }}>UPLOADING... {progress}%</div>
      </div>}
      {state==="done" && <div style={{ color:v.red, fontSize:11, fontFamily:"'Courier New', monospace", marginBottom:14 }}>✓ FILE DISTRIBUTED ACROSS 3 SERVERS — REDUNDANT & SECURE</div>}
      <div style={{ marginTop:4 }}>
        {state==="idle" && <GlowBtn onClick={simulate}>SIMULATE UPLOAD</GlowBtn>}
        {state==="done" && <GlowBtn onClick={reset}>RESET</GlowBtn>}
      </div>
    </div>
  );
}

function MythCards() {
  const theme = React.useContext(Ctx);
  const v = getThemeVars(theme);
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))", gap:13 }}>
      {MYTHS.map((m,i)=>(
        <Reveal key={i} delay={i*.1}>
          <FlipCard height={148}
            front={<><div style={{ color:v.red, fontSize:9, letterSpacing:"0.15em", fontFamily:"'Courier New', monospace" }}>⚠ MYTH</div><p style={{ color:v.text2, fontSize:13, lineHeight:1.5 }}>{m.myth}</p><div style={{ color:v.text4, fontSize:9, fontFamily:"'Courier New', monospace" }}>CLICK FOR FACT</div></>}
            back={<><div style={{ color:v.green, fontSize:9, letterSpacing:"0.15em", fontFamily:"'Courier New', monospace" }}>✓ FACT</div><p style={{ color:v.text2, fontSize:12, lineHeight:1.5 }}>{m.fact}</p></>}
          />
        </Reveal>
      ))}
    </div>
  );
}

function Quiz() {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const theme = React.useContext(Ctx);
  const v = getThemeVars(theme);

  const confetti = useMemo(()=>Array.from({length:42},(_,k)=>({ id:k, left:Math.random()*100, delay:Math.random()*.5, dur:1.6+Math.random()*1.8, color:["#cc0020","#ff4060","#fff","#ff8090"][k%4], round:Math.random()>.5 })),[]);

  const choose = (i) => {
    if (selected!==null) return;
    setSelected(i);
    const correct = i===QUESTIONS[idx].ans;
    const ns = score+(correct?1:0);
    if (correct) setScore(ns);
    setTimeout(()=>{ if(idx<QUESTIONS.length-1){ setIdx(idx+1); setSelected(null); } else { setDone(true); if(ns>=6) setShowConfetti(true); } }, 950);
  };
  const reset = ()=>{ setIdx(0); setSelected(null); setScore(0); setDone(false); setShowConfetti(false); };

  const optStyle = (i) => {
    const base = { background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.09)", color:v.text2, padding:"11px 14px", textAlign:"left", cursor: selected!==null?"default":"pointer", borderRadius:4, fontSize:13, transition:"all 0.22s", fontFamily:"inherit", width:"100%" };
    if (selected===null) return base;
    if (i===QUESTIONS[idx].ans) return { ...base, background:"rgba(0,200,100,0.09)", border:"1px solid rgba(0,200,100,0.55)", color:v.green };
    if (i===selected) return { ...base, background:"rgba(204,0,32,0.11)", border:"1px solid rgba(204,0,32,0.55)", color:v.red2 };
    return base;
  };

  return (
    <div>
      {showConfetti && (
        <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:9999 }}>
          {confetti.map(p=>(
            <div key={p.id} style={{ position:"absolute", left:`${p.left}%`, top:-10, width:8, height:8, background:p.color, borderRadius:p.round?"50%":0, animation:`confettiFall ${p.dur}s ease-in ${p.delay}s forwards` }}/>
          ))}
        </div>
      )}
      <div style={{ background:v.surface, border:`1px solid ${v.border}`, borderRadius:6, padding:26, maxWidth:580 }}>
        {!done ? (
          <>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7, fontSize:10, fontFamily:"'Courier New', monospace", color:v.text4 }}>
              <span>Q {idx+1} / {QUESTIONS.length}</span>
              <span style={{color:v.red}}>SCORE: {score}</span>
            </div>
            <div style={{ height:2, background:"rgba(255,255,255,0.05)", marginBottom:22, borderRadius:1, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${(idx/QUESTIONS.length)*100}%`, background:v.red, transition:"width 0.4s ease" }}/>
            </div>
            <p style={{ color:v.text, fontSize:15, lineHeight:1.65, marginBottom:18 }}>{QUESTIONS[idx].q}</p>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {QUESTIONS[idx].opts.map((opt,i)=>(
                <button key={i} onClick={()=>choose(i)} disabled={selected!==null} style={optStyle(i)}>
                  <span style={{ color:v.text4, fontFamily:"'Courier New', monospace", marginRight:9 }}>{String.fromCharCode(65+i)}.</span>{opt}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:44,marginBottom:12}}>{score>=6?"🏆":score>=4?"⭐":"📚"}</div>
            <div style={{ color:v.red, fontSize:10, letterSpacing:"0.2em", marginBottom:7, fontFamily:"'Courier New', monospace" }}>RESULTS</div>
            <div style={{ color:v.text, fontSize:34, fontWeight:300, marginBottom:7, fontFamily:"'Courier New', monospace" }}>{score}/{QUESTIONS.length}</div>
            <div style={{ color:v.text3, fontSize:14, marginBottom:22 }}>{score>=6?"Outstanding! You are a cloud expert.":score>=4?"Good job! Keep learning.":"Review the sections above and retry."}</div>
            <GlowBtn onClick={reset}>RETRY</GlowBtn>
          </div>
        )}
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  const [hov, setHov] = useState(false);
  const theme = React.useContext(Ctx);
  const v = getThemeVars(theme);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{ background: hov?"rgba(204,0,32,0.06)":v.surface, border:`1px solid ${hov?v.borderH:v.border}`, borderRadius:6, padding:22, transition:"all 0.25s", cursor:"default", boxShadow: hov?"0 0 26px rgba(204,0,32,0.08)":"none" }}>
      <div style={{fontSize:28,marginBottom:12}}>{icon}</div>
      <h3 style={{ color:v.red, fontSize:13, letterSpacing:"0.09em", marginBottom:8, fontFamily:"'Courier New', monospace" }}>{title}</h3>
      <p style={{ color:v.text3, fontSize:13, lineHeight:1.7 }}>{desc}</p>
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState("dark");
  const [heroIn, setHeroIn] = useState(false);
  const v = getThemeVars(theme);
  const mono = "'Courier New', monospace";

  useEffect(()=>{ const t=setTimeout(()=>setHeroIn(true),80); return ()=>clearTimeout(t); },[]);
  const scrollTo = id => document.getElementById(id)?.scrollIntoView({behavior:"smooth"});
  const altWrap = { background:"rgba(204,0,32,0.025)", borderTop:"1px solid rgba(204,0,32,0.1)", borderBottom:"1px solid rgba(204,0,32,0.1)" };

  return (
    <Ctx.Provider value={theme}>
      <div style={{ background:v.bg, minHeight:"100vh", fontFamily:"'Helvetica Neue', Helvetica, Arial, sans-serif", color:v.text, overflowX:"hidden", transition:"background 0.3s, color 0.3s" }}>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          ::-webkit-scrollbar { width: 3px; }
          ::-webkit-scrollbar-track { background: ${v.bg}; }
          ::-webkit-scrollbar-thumb { background: ${v.red}; border-radius: 2px; }
          @keyframes float { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(-10px)} }
          @keyframes scanline { 0%{top:-4%} 100%{top:104%} }
          @keyframes confettiFall { to{transform:translateY(100vh) rotate(600deg);opacity:0} }
        `}</style>

        <Nav theme={theme} toggleTheme={()=>setTheme(t=>t==="dark"?"light":"dark")}/>

        {/* HERO */}
        <section style={{ position:"relative", height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", paddingTop:54 }}>
          <GridBg/><ParticleField/>
          <div style={{ position:"absolute", left:0, right:0, height:2, background:"linear-gradient(90deg,transparent,rgba(204,0,32,0.25),transparent)", animation:"scanline 5s linear infinite", zIndex:1, pointerEvents:"none" }}/>
          <div style={{ position:"relative", zIndex:2, textAlign:"center", padding:"0 20px" }}>
            <div style={{ opacity:heroIn?1:0, transition:"opacity 0.8s 0.15s", color:v.red, fontSize:10, letterSpacing:"0.35em", marginBottom:20, fontFamily:mono, textTransform:"uppercase" }}>▸ The technology powering the digital horizon</div>
            <h1 style={{ opacity:heroIn?1:0, transform:heroIn?"translateY(0)":"translateY(28px)", transition:"opacity 1s 0.35s, transform 1s 0.35s", fontSize:"clamp(48px,11vw,110px)", fontWeight:100, letterSpacing:"0.07em", lineHeight:1.04 }}>
              <span style={{ display:"block", color:v.text }}>CLOUD</span>
              <span style={{ display:"block", color:v.red, textShadow:"0 0 50px rgba(204,0,32,0.4)" }}>COMPUTING</span>
            </h1>
            <div style={{ opacity:heroIn?1:0, transition:"opacity 0.8s 0.85s", color:v.text4, fontSize:11, letterSpacing:"0.28em", margin:"18px 0 30px", fontFamily:mono, textTransform:"uppercase" }}>Scalable · Distributed · Infinite</div>
            <div style={{ opacity:heroIn?1:0, transition:"opacity 0.8s 1.05s", display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
              <GlowBtn onClick={()=>scrollTo("what")}>Start exploring ↓</GlowBtn>
              <GlowBtn onClick={()=>scrollTo("quiz")} style={{opacity:0.7}}>Jump to quiz</GlowBtn>
            </div>
          </div>
          <div style={{ position:"absolute", bottom:26, left:"50%", animation:"float 2.2s ease infinite", color:v.red, fontSize:18, pointerEvents:"none" }}>⌄</div>
        </section>

        {/* WHAT */}
        <section id="what" style={SEC}>
          <Reveal><Eyebrow n={1} label="Definition"/></Reveal>
          <Reveal delay={0.06}><SectionH2 text="What is" accent="Cloud Computing?"/></Reveal>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))", gap:14 }}>
            {[
              { icon:"⚡", title:"On-Demand", desc:"Access computing resources instantly with no upfront provisioning. Pay only for what you consume." },
              { icon:"♾️", title:"Scalability", desc:"Expand from 4 VMs to 4,000 in real-time based on actual demand spikes." },
              { icon:"🔐", title:"Security", desc:"Enterprise data centres with hardened encryption and protocol infrastructure." },
              { icon:"🌍", title:"Availability", desc:"Global distribution ensuring 99.99% uptime across multiple geographic nodes." },
            ].map((c,i)=>(<Reveal key={c.title} delay={i*.09}><FeatureCard {...c}/></Reveal>))}
          </div>
        </section>

        {/* HOW */}
        <div style={altWrap}>
          <section id="how" style={SEC}>
            <Reveal><Eyebrow n={2} label="Data Transmission Path"/></Reveal>
            <Reveal delay={0.06}><SectionH2 text="How It" accent="Works"/></Reveal>
            <HowItWorks/>
          </section>
        </div>

        {/* TYPES */}
        <section id="types" style={SEC}>
          <Reveal><Eyebrow n={3} label="Deployment Models"/></Reveal>
          <Reveal delay={0.06}><SectionH2 text="Cloud" accent="Deployment Types"/></Reveal>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:16 }}>
            {CLOUD_TYPES.map((c,i)=><CloudTypeCard key={c.title} cloud={c} delay={i*.12}/>)}
          </div>
        </section>

        {/* SERVICES */}
        <div style={altWrap}>
          <section id="services" style={SEC}>
            <Reveal><Eyebrow n={4} label="Service Layers"/></Reveal>
            <Reveal delay={0.06}>
              <h2 style={{ fontSize:"clamp(24px,5vw,48px)", fontWeight:100, letterSpacing:"0.04em", marginBottom:"0.6rem", color:v.text }}>
                SaaS · PaaS · <span style={{color:v.red}}>IaaS</span>
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p style={{ color:v.text3, fontSize:13, marginBottom:"2.5rem", maxWidth:500, lineHeight:1.7 }}>
                The three pillars of cloud service delivery. Each level abstracts more infrastructure complexity from the user.
              </p>
            </Reveal>
            <Reveal delay={0.14}><ServiceTriangle/></Reveal>
          </section>
        </div>

        {/* PROS / CONS */}
        <section style={SEC}>
          <Reveal><Eyebrow n={5} label="Advantages & Considerations"/></Reveal>
          <Reveal delay={0.06}><SectionH2 text="The" accent="Full Picture"/></Reveal>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(270px,1fr))", gap:32 }}>
            <div>
              <div style={{ color:v.green, fontSize:10, letterSpacing:"0.2em", fontFamily:mono, marginBottom:16, paddingBottom:9, borderBottom:"1px solid rgba(204,0,32,0.2)" }}>✓ ADVANTAGES</div>
              {ADVANTAGES.map((a,i)=>(<Reveal key={a.text} delay={i*.07}><div style={{ padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}><div style={{ color:v.text, fontSize:13, marginBottom:3 }}>{a.text}</div><div style={{ color:v.text3, fontSize:12, lineHeight:1.5 }}>{a.detail}</div></div></Reveal>))}
            </div>
            <div>
              <div style={{ color:v.red2, fontSize:10, letterSpacing:"0.2em", fontFamily:mono, marginBottom:16, paddingBottom:9, borderBottom:"1px solid rgba(204,0,32,0.2)" }}>✗ CONSIDERATIONS</div>
              {DISADVANTAGES.map((d,i)=>(<Reveal key={d.text} delay={i*.07}><div style={{ padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}><div style={{ color:v.red2, fontSize:13, marginBottom:3 }}>{d.text}</div><div style={{ color:v.text3, fontSize:12, lineHeight:1.5 }}>{d.detail}</div></div></Reveal>))}
            </div>
          </div>
        </section>

        {/* APPS */}
        <div style={altWrap}>
          <section id="apps" style={SEC}>
            <Reveal><Eyebrow n={6} label="Real-World Applications"/></Reveal>
            <Reveal delay={0.06}><SectionH2 text="Powered by" accent="Cloud"/></Reveal>
            <Reveal delay={0.1}><p style={{ color:v.text4, fontSize:12, marginBottom:"1.8rem", fontFamily:mono }}>CLICK EACH CARD TO REVEAL CLOUD DETAILS</p></Reveal>
            <AppCards/>
          </section>
        </div>

        {/* SIMULATOR */}
        <section style={SEC}>
          <Reveal><Eyebrow n={7} label="Mini Cloud Simulator"/></Reveal>
          <Reveal delay={0.06}><SectionH2 text="Experience the" accent="Upload"/></Reveal>
          <Reveal delay={0.1}><p style={{ color:v.text3, fontSize:13, marginBottom:"2rem", maxWidth:480, lineHeight:1.7 }}>Watch a file travel from your device through the internet, into the cloud, and distribute across redundant servers.</p></Reveal>
          <Reveal delay={0.14}><CloudSimulator/></Reveal>
        </section>

        {/* MYTHS */}
        <div style={altWrap}>
          <section style={SEC}>
            <Reveal><Eyebrow n={8} label="Myth vs Fact"/></Reveal>
            <Reveal delay={0.06}><SectionH2 text="Bust the" accent="Myths"/></Reveal>
            <Reveal delay={0.1}><p style={{ color:v.text4, fontSize:12, marginBottom:"1.8rem", fontFamily:mono }}>CLICK EACH CARD TO REVEAL THE TRUTH</p></Reveal>
            <MythCards/>
          </section>
        </div>

        {/* QUIZ */}
        <section id="quiz" style={SEC}>
          <Reveal><Eyebrow n={9} label="Knowledge Check"/></Reveal>
          <Reveal delay={0.06}><SectionH2 text="Prove Your" accent="Knowledge"/></Reveal>
          <Reveal delay={0.1}><p style={{ color:v.text3, fontSize:13, marginBottom:"2rem", maxWidth:460, lineHeight:1.7 }}>8 questions. Score 6+ to unlock confetti. Test your cloud computing expertise.</p></Reveal>
          <Reveal delay={0.14}><Quiz/></Reveal>
        </section>

        {/* CLOSING */}
        <section style={{ position:"relative", padding:"120px 36px", textAlign:"center", borderTop:"1px solid rgba(204,0,32,0.15)", overflow:"hidden" }}>
          <GridBg/><ParticleField/>
          <div style={{ position:"relative", zIndex:2 }}>
            <Reveal><div style={{ color:v.red, fontSize:10, letterSpacing:"0.3em", marginBottom:20, fontFamily:mono }}>// TRANSMISSION COMPLETE</div></Reveal>
            <Reveal delay={0.08}>
              <h2 style={{ fontSize:"clamp(28px,8vw,84px)", fontWeight:100, lineHeight:1.1, marginBottom:24, letterSpacing:"0.04em", color:v.text }}>
                THE FUTURE<br/><span style={{ color:v.red, textShadow:"0 0 50px rgba(204,0,32,0.45)" }}>RUNS ON THE CLOUD</span>
              </h2>
            </Reveal>
            <Reveal delay={0.16}><p style={{ color:v.text3, maxWidth:440, margin:"0 auto 30px", lineHeight:1.75, fontSize:14 }}>From the apps you use daily to the AI that powers intelligence — everything lives in the cloud.</p></Reveal>
            <Reveal delay={0.24}><GlowBtn onClick={()=>scrollTo("what")}>EXPLORE AGAIN</GlowBtn></Reveal>
            <div style={{ marginTop:64, display:"flex", justifyContent:"center", gap:28, flexWrap:"wrap" }}>
              {["SCALABLE","DISTRIBUTED","RESILIENT","GLOBAL"].map(w=>(<div key={w} style={{ color:v.text4, fontSize:10, letterSpacing:"0.3em", fontFamily:mono }}>{w}</div>))}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ borderTop:"1px solid rgba(204,0,32,0.15)", padding:"24px 36px", background:v.bg2 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12, maxWidth:1060, margin:"0 auto" }}>
            <div style={{ color:v.red, fontFamily:mono, fontSize:12, letterSpacing:"0.2em" }}>◈ CLOUD COMPUTING</div>
            <div style={{ display:"flex", gap:26, flexWrap:"wrap", justifyContent:"center" }}>
              {["ARESMOUK MOHAMED","ANOUAR HASSINE"].map(name=>(<div key={name} style={{ textAlign:"center" }}><div style={{ color:v.red, fontSize:9, letterSpacing:"0.22em", fontFamily:mono, marginBottom:2 }}>PRESENTED BY</div><div style={{ color:v.text, fontSize:11, letterSpacing:"0.14em", fontFamily:mono }}>{name}</div></div>))}
            </div>
            <div style={{ color:v.text4, fontSize:10, fontFamily:mono }}>Thanks, y'all :)</div>
          </div>
        </footer>
      </div>
    </Ctx.Provider>
  );
}
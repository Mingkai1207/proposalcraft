/**
 * Design E — "ProposAI Warm"
 * Inspired by:
 * - Golf club site: warm cream/ivory background, photo-rich, elegant serif headings
 * - Sapforce SaaS: giant morphing 3D AI orb animation in hero, orbital rings, particles
 * - Colorful, interactive, modern B2B SaaS
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Sparkles, FileText, Mail, Shield,
  Check, X, ChevronDown, ArrowRight,
  Layers, Menu, XIcon, Clock, TrendingUp,
  Wrench, Zap, Star, Play, BarChart3,
  Building2, Send, CheckCircle2
} from "lucide-react";

const GUARANTEE_BADGE_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663464819175/TxoyTEEFMfksnn9C3wscL4/proposai-guarantee-badge-iVr29Hp4v4FN5DhPsDtUwF.webp";

// Unsplash contractor photos
const PHOTOS = {
  hvac: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80&auto=format",
  electrical: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800&q=80&auto=format",
  plumbing: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&auto=format",
  roofing: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80&auto=format",
  team: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80&auto=format",
  proposal: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80&auto=format",
};

// ── Animated counter ──────────────────────────────────────────────────────────
function useCounter(target: number, duration = 1.8, trigger = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let start: number | null = null;
    const raf = (t: number) => {
      if (!start) start = t;
      const p = Math.min((t - start) / (duration * 1000), 1);
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(raf);
      else setVal(target);
    };
    requestAnimationFrame(raf);
  }, [trigger, target, duration]);
  return val;
}

// ── Fade up ───────────────────────────────────────────────────────────────────
function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px", amount: 0.1 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Giant AI Orb Animation (Sapforce-inspired) ───────────────────────────────
function AIOrb() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;

    // Orbiting particles
    const particles = Array.from({ length: 80 }, (_, i) => ({
      angle: (i / 80) * Math.PI * 2 + Math.random() * 0.5,
      orbitRx: 155 + Math.random() * 70,
      orbitRy: 50 + Math.random() * 35,
      orbitTilt: Math.random() * Math.PI,
      speed: (0.004 + Math.random() * 0.006) * (Math.random() > 0.5 ? 1 : -1),
      size: 1.5 + Math.random() * 3,
      opacity: 0.5 + Math.random() * 0.5,
      color: Math.random() > 0.5 ? "255,170,50" : "234,88,12",
    }));

    // Smooth morphing shape using sinusoidal deformation
    function morphBlob(ctx: CanvasRenderingContext2D, cx: number, cy: number, baseR: number, t: number) {
      const points = 120;
      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const noise =
          Math.sin(angle * 3 + t * 0.8) * 12 +
          Math.sin(angle * 5 - t * 1.1) * 8 +
          Math.sin(angle * 7 + t * 0.5) * 5 +
          Math.sin(angle * 2 - t * 0.3) * 10;
        const r = baseR + noise;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
    }

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      ctx.clearRect(0, 0, w, h);

      // --- Background stage: subtle light circle to anchor the orb ---
      const stageBg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 230);
      stageBg.addColorStop(0, "rgba(255,237,213,0.6)");
      stageBg.addColorStop(0.6, "rgba(255,237,213,0.2)");
      stageBg.addColorStop(1, "rgba(255,237,213,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, 230, 0, Math.PI * 2);
      ctx.fillStyle = stageBg;
      ctx.fill();

      // --- Deep drop shadow under blob ---
      ctx.save();
      ctx.shadowColor = "rgba(180, 60, 0, 0.35)";
      ctx.shadowBlur = 60;
      ctx.shadowOffsetY = 20;
      morphBlob(ctx, cx, cy + 20, 118, t);
      ctx.fillStyle = "rgba(180,60,0,0.15)";
      ctx.fill();
      ctx.restore();

      // --- Animated elliptical orbit rings (more visible) ---
      const orbits = [
        { rx: 185, ry: 60, rot: t * 0.35, color: "rgba(234,88,12,0.55)", lw: 1.5 },
        { rx: 215, ry: 75, rot: -t * 0.22 + 0.8, color: "rgba(251,146,60,0.4)", lw: 1 },
        { rx: 155, ry: 45, rot: t * 0.55 + 1.2, color: "rgba(245,158,11,0.5)", lw: 1.5 },
        { rx: 240, ry: 88, rot: t * 0.18 + 2.1, color: "rgba(234,88,12,0.2)", lw: 0.8 },
      ];
      orbits.forEach(({ rx, ry, rot, color, lw }) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        ctx.stroke();
        ctx.restore();
      });

      // --- Orbiting particles ---
      particles.forEach((p) => {
        p.angle += p.speed;
        const cosT = Math.cos(p.orbitTilt);
        const sinT = Math.sin(p.orbitTilt);
        const px_local = Math.cos(p.angle) * p.orbitRx;
        const py_local = Math.sin(p.angle) * p.orbitRy;
        const x = cx + px_local * cosT - py_local * sinT * 0.3;
        const y = cy + px_local * sinT * 0.2 + py_local * cosT;
        const depth = (Math.sin(p.angle) + 1) / 2;
        const alpha = (0.3 + depth * 0.7) * p.opacity;
        const sz = p.size * (0.5 + depth * 0.8);
        ctx.beginPath();
        ctx.arc(x, y, sz, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${alpha})`;
        ctx.shadowColor = `rgba(${p.color},0.6)`;
        ctx.shadowBlur = sz * 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // --- Main blob: deep orange core ---
      ctx.save();
      morphBlob(ctx, cx, cy, 118, t);

      // Outer glow
      ctx.shadowColor = "rgba(220, 80, 10, 0.7)";
      ctx.shadowBlur = 50;

      const blobGrad = ctx.createRadialGradient(cx - 30, cy - 30, 0, cx, cy, 130);
      blobGrad.addColorStop(0,   "rgba(255, 200, 50, 1)");    // bright amber center
      blobGrad.addColorStop(0.3, "rgba(245, 130, 20, 1)");    // orange
      blobGrad.addColorStop(0.6, "rgba(200, 60, 10, 1)");     // deep orange
      blobGrad.addColorStop(0.85,"rgba(150, 30, 0, 0.95)");   // burnt
      blobGrad.addColorStop(1,   "rgba(100, 15, 0, 0.3)");    // dark edge
      ctx.fillStyle = blobGrad;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Gloss highlight (top-left white sheen like metallic surface)
      const sheen = ctx.createRadialGradient(cx - 45, cy - 50, 0, cx - 20, cy - 25, 75);
      sheen.addColorStop(0, "rgba(255, 255, 255, 0.55)");
      sheen.addColorStop(0.5, "rgba(255, 255, 255, 0.15)");
      sheen.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = sheen;
      ctx.fill();

      ctx.restore();

      // --- Inner specular dot ---
      ctx.beginPath();
      ctx.arc(cx - 38, cy - 42, 18, 0, Math.PI * 2);
      const specular = ctx.createRadialGradient(cx - 42, cy - 46, 0, cx - 38, cy - 42, 18);
      specular.addColorStop(0, "rgba(255,255,255,0.7)");
      specular.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = specular;
      ctx.fill();

      t += 0.014;
      animId = requestAnimationFrame(draw);
    };

    // Resize handler
    const resize = () => {
      const size = Math.min(canvas.parentElement?.offsetWidth ?? 500, 520);
      canvas.width = size;
      canvas.height = size;
    };
    resize();
    window.addEventListener("resize", resize);

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full max-w-[520px] aspect-square"
      style={{ filter: "drop-shadow(0 0 60px rgba(245,120,20,0.25))" }}
    />
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────
function NavBar({ onCTA }: { onCTA: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? "bg-[#faf7f2]/90 backdrop-blur-xl border-b border-stone-200/80 shadow-sm shadow-stone-100" : "bg-transparent"
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setLocation("/")}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-orange-500/20">
            <span className="text-white font-black text-lg">P</span>
          </div>
          <span className="text-stone-900 font-bold text-xl tracking-tight">ProposAI</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {[["Features","features"],["How it works","howitworks"],["Pricing","pricing"],["FAQ","faq"]].map(([l,h]) => (
            <button key={l}
              onClick={() => document.getElementById(h)?.scrollIntoView({ behavior: "smooth" })}
              className="text-stone-500 hover:text-stone-900 text-sm font-medium transition-colors">{l}</button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <button onClick={() => setLocation("/dashboard")}
              className="px-5 py-2.5 rounded-full bg-stone-900 text-white font-semibold text-sm hover:bg-stone-800 transition-colors shadow-sm">
              Dashboard →
            </button>
          ) : (
            <>
              <button onClick={() => setLocation("/login")} className="text-stone-500 hover:text-stone-900 text-sm font-medium transition-colors">Sign in</button>
              <button onClick={onCTA}
                className="px-5 py-2.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-all shadow-md shadow-orange-500/20 hover:scale-105">
                Start free →
              </button>
            </>
          )}
        </div>

        <button onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"} className="md:hidden text-stone-700 p-2">
          {open ? <XIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-[#faf7f2] border-b border-stone-200 px-6 pb-5">
            {[["Features","features"],["How it works","howitworks"],["Pricing","pricing"],["FAQ","faq"]].map(([l,h]) => (
              <button key={l} onClick={() => { document.getElementById(h)?.scrollIntoView({ behavior: "smooth" }); setOpen(false); }}
                className="block w-full text-left text-stone-600 py-3 text-sm border-b border-stone-100">{l}</button>
            ))}
            <button onClick={() => { onCTA(); setOpen(false); }}
              className="w-full mt-4 py-3 rounded-full bg-orange-500 text-white font-bold text-sm">Start free →</button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
const TYPEWRITER_WORDS = ["HVAC", "Plumbing", "Electrical", "Roofing"];

function HeroSection({ onCTA }: { onCTA: () => void }) {
  const [wordIdx, setWordIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = TYPEWRITER_WORDS[wordIdx];
    let timeout: ReturnType<typeof setTimeout>;
    if (!deleting && displayed.length < word.length) {
      timeout = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 90);
    } else if (!deleting && displayed.length === word.length) {
      timeout = setTimeout(() => setDeleting(true), 2000);
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 50);
    } else {
      setDeleting(false);
      setWordIdx((i) => (i + 1) % TYPEWRITER_WORDS.length);
    }
    return () => clearTimeout(timeout);
  }, [displayed, deleting, wordIdx]);

  return (
    <section className="relative min-h-screen bg-[#faf7f2] overflow-hidden flex items-center">
      {/* Soft background radials */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full opacity-40"
          style={{ background: "radial-gradient(circle, rgba(251,191,36,0.2) 0%, transparent 65%)" }} />
        <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, rgba(234,88,12,0.15) 0%, transparent 65%)" }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-10 w-full grid lg:grid-cols-2 gap-10 lg:gap-20 items-center">
        {/* Left text */}
        <div className="hero-content">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-xs font-bold uppercase tracking-wider mb-8">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            Powered by ProposAI · Free during launch
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] font-black text-stone-900 leading-[1.05] tracking-tight mb-6">
            Win more jobs<br />
            with AI proposals<br />
            for{" "}
            <span className="text-orange-500">
              {displayed}<span className="animate-pulse">|</span>
            </span>
          </h1>

          <p className="text-stone-500 text-lg md:text-xl leading-relaxed mb-10 max-w-lg">
            Stop spending evenings writing proposals. ProposAI generates professional, client-ready proposals in under 60 seconds — tailored to your trade.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <button onClick={onCTA}
              className="group relative inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-base transition-all hover:scale-105 shadow-xl shadow-stone-900/20">
              <Sparkles className="w-5 h-5" />
              Generate your first proposal
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border-2 border-stone-200 hover:border-orange-300 text-stone-700 hover:bg-orange-50 font-semibold text-base transition-all hover:scale-105">
              <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center">
                <Play className="w-3 h-3 fill-orange-500 ml-0.5 text-orange-500" />
              </div>
              See how it works
            </button>
          </div>

          {/* Trust bar */}
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex -space-x-2">
              {["🔧","⚡","🪠","🏠"].map((e, i) => (
                <div key={i} className="w-9 h-9 rounded-full bg-white border-2 border-stone-100 shadow-sm flex items-center justify-center text-base">{e}</div>
              ))}
            </div>
            <div>
              <div className="flex gap-0.5 mb-0.5">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-stone-500 text-xs"><span className="text-stone-900 font-semibold">500+</span> contractors winning more bids</p>
            </div>
          </div>
        </div>

        {/* Right — Giant AI Orb */}
        <div className="flex items-center justify-center relative">
          {/* Label ring */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-[520px] h-[520px]">
              {/* Floating labels orbiting the orb */}
              {[
                { label: "AI Generation", top: "8%", left: "50%", transform: "translateX(-50%)", color: "amber" },
                { label: "60s proposal", top: "50%", right: "2%", transform: "translateY(-50%)", color: "orange" },
                { label: "PDF export", bottom: "10%", left: "50%", transform: "translateX(-50%)", color: "rose" },
                { label: "Email tracking", top: "50%", left: "2%", transform: "translateY(-50%)", color: "violet" },
              ].map(({ label, color, ...pos }) => (
                <motion.div key={label}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, ease: "easeInOut", delay: Math.random() * 2 }}
                  className={`absolute bg-white rounded-full px-3 py-1.5 text-xs font-bold shadow-lg border border-stone-100 text-stone-700 whitespace-nowrap z-20`}
                  style={pos as React.CSSProperties}>
                  {label}
                </motion.div>
              ))}
            </div>
          </div>
          <AIOrb />
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={() => document.getElementById("howitworks")?.scrollIntoView({ behavior: "smooth" })}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 cursor-pointer hover:opacity-70 transition-opacity"
        aria-label="Scroll to how it works">
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-5 h-8 rounded-full border-2 border-stone-300 flex justify-center pt-1.5">
          <div className="w-1 h-2 bg-stone-400 rounded-full" />
        </motion.div>
      </button>
    </section>
  );
}

// ── Stats ─────────────────────────────────────────────────────────────────────
function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const c1 = useCounter(60, 1.5, inView);
  const c2 = useCounter(65, 1.8, inView);
  const c3 = useCounter(3, 1.2, inView);
  const c4 = useCounter(500, 2, inView);

  return (
    <section ref={ref} className="bg-stone-900 py-16">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {[
          { val: c1, suf: "s", label: "Average generation time", color: "text-amber-400" },
          { val: c2, suf: "%", label: "Higher close rate", color: "text-orange-400" },
          { val: c3, suf: " hrs", label: "Saved per proposal", color: "text-rose-400" },
          { val: c4, suf: "+", label: "Active contractors", color: "text-violet-400" },
        ].map(({ val, suf, label, color }) => (
          <div key={label}>
            <div className={`text-5xl font-black mb-1 ${color}`}>{val}{suf}</div>
            <p className="text-stone-400 text-sm">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Interactive Demo ─────────────────────────────────────────────────────────
const GEN_MESSAGES = [
  "Reading job details...",
  "Applying HVAC trade language...",
  "Writing scope of work...",
  "Calculating materials & specs...",
  "Formatting your proposal...",
];

function InteractiveDemoSection() {
  // Stage 1: fill details | Stage 2: AI generates | Stage 3: review & send | Stage 4: track opens
  type Stage = 1 | 2 | 3 | 4;
  const [stage, setStage] = useState<Stage>(1);
  const [form, setForm] = useState({
    trade: "HVAC",
    client: "Johnson Residence",
    scope: "Replace 4-ton AC unit + install 92% AFUE furnace",
    estimate: "8500",
  });
  const [genMsgIdx, setGenMsgIdx] = useState(0);
  const [visibleSections, setVisibleSections] = useState(0);
  const [emailSent, setEmailSent] = useState(false);
  const [trackingPing, setTrackingPing] = useState(false);

  const estimateNum = Number(form.estimate.replace(/,/g, "")) || 0;

  const reset = () => {
    setStage(1);
    setGenMsgIdx(0);
    setVisibleSections(0);
    setEmailSent(false);
    setTrackingPing(false);
  };

  // Stage 2: cycle status messages → move to stage 3
  useEffect(() => {
    if (stage !== 2) return;
    if (genMsgIdx < GEN_MESSAGES.length - 1) {
      const t = setTimeout(() => setGenMsgIdx((m) => m + 1), 650);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => { setStage(3); setVisibleSections(0); }, 700);
      return () => clearTimeout(t);
    }
  }, [stage, genMsgIdx]);

  // Stage 3: reveal proposal sections one by one
  useEffect(() => {
    if (stage !== 3) return;
    if (visibleSections < 4) {
      const t = setTimeout(() => setVisibleSections((v) => v + 1), 380);
      return () => clearTimeout(t);
    }
  }, [stage, visibleSections]);

  // Stage 4: email sent → tracking notification
  useEffect(() => {
    if (stage !== 4) return;
    const t1 = setTimeout(() => setEmailSent(true), 1400);
    const t2 = setTimeout(() => setTrackingPing(true), 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [stage]);

  const STAGES = [
    { label: "Fill details", num: 1 },
    { label: "AI generates", num: 2 },
    { label: "Review & send", num: 3 },
    { label: "Track opens", num: 4 },
  ];

  const tradeMsgs: Record<string, string> = {
    HVAC: "Applying HVAC trade language & specs...",
    Plumbing: "Applying plumbing codes & terminology...",
    Electrical: "Applying NEC electrical standards...",
    Roofing: "Applying roofing materials & warranty terms...",
  };
  const tradeScopes: Record<string, string[]> = {
    HVAC:       ["Remove and dispose of existing HVAC equipment", form.scope, "Replace refrigerant line set (25 linear ft)", "Test, charge, and commission complete system", "Register equipment warranties in homeowner's name"],
    Plumbing:   ["Shut off and drain affected supply lines", form.scope, "Replace all deteriorated fittings and valves", "Pressure-test system to 150 PSI", "Restore water service and verify all fixtures"],
    Electrical: ["De-energize affected circuits and verify lockout", form.scope, "Pull permit and schedule inspection", "Update panel directory and label all breakers", "Final inspection and certificate of completion"],
    Roofing:    ["Remove existing roofing material to decking", form.scope, "Install new ice-and-water shield along eaves", "Flash all penetrations and valleys", "Final inspection and manufacturer warranty registration"],
  };

  return (
    <section id="demo" className="py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <FadeUp className="text-center mb-14">
          <p className="text-orange-500 text-xs font-bold uppercase tracking-[0.3em] mb-4">Interactive demo</p>
          <h2 className="text-4xl md:text-5xl font-black text-stone-900 tracking-tight mb-4">
            Try the full process yourself
          </h2>
          <p className="text-stone-400 text-lg max-w-xl mx-auto">
            Edit the job details below, hit Generate, then see how tracking works — the complete ProposAI workflow.
          </p>
        </FadeUp>

        <FadeUp>
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-stone-200">
            {/* ── Browser title bar ── */}
            <div className="bg-stone-100 border-b border-stone-200 px-4 py-3 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-white rounded-lg px-4 py-1 text-xs text-stone-400 font-mono border border-stone-200 w-60 text-center truncate">
                  app.proposai.org/proposals/new
                </div>
              </div>
              <div className="w-16 flex justify-end">
                {stage > 1 && (
                  <button onClick={reset}
                    className="text-xs text-stone-500 hover:text-stone-800 font-semibold px-2.5 py-1 rounded-lg hover:bg-white transition-colors">
                    ↺ Restart
                  </button>
                )}
              </div>
            </div>

            {/* ── Stage progress bar ── */}
            <div className="bg-white border-b border-stone-100 px-6 py-3">
              <div className="flex items-center justify-center gap-1.5 sm:gap-3">
                {STAGES.map(({ label, num }, i) => {
                  const active = stage === num;
                  const done = stage > num;
                  return (
                    <div key={num} className="flex items-center gap-1.5 sm:gap-3">
                      <div className={`flex items-center gap-1.5 text-xs font-semibold transition-all ${active ? "text-orange-500" : done ? "text-emerald-600" : "text-stone-300"}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 transition-all ${active ? "bg-orange-500 text-white shadow-md shadow-orange-200" : done ? "bg-emerald-500 text-white" : "bg-stone-200 text-stone-400"}`}>
                          {done ? "✓" : num}
                        </div>
                        <span className="hidden sm:inline whitespace-nowrap">{label}</span>
                      </div>
                      {i < STAGES.length - 1 && (
                        <div className={`w-6 sm:w-10 h-px transition-colors ${stage > num ? "bg-emerald-400" : "bg-stone-200"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Main content: left + right ── */}
            <div className="grid lg:grid-cols-[1fr_1.4fr] min-h-[540px]">

              {/* ── LEFT PANEL ── */}
              <div className="p-7 border-r border-stone-100 bg-white flex flex-col">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                    <span className="text-white font-black text-sm">P</span>
                  </div>
                  <span className="font-bold text-stone-800 text-sm">ProposAI</span>
                </div>

                {/* Stage 1: Interactive form */}
                {stage === 1 && (
                  <div className="flex-1 flex flex-col">
                    <p className="text-stone-400 text-xs mb-5 leading-relaxed">
                      Edit any field — use your own job details or keep the example.
                    </p>
                    <div className="space-y-3.5 flex-1">
                      <div>
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5 block">Trade type</label>
                        <select
                          value={form.trade}
                          onChange={(e) => setForm((f) => ({ ...f, trade: e.target.value }))}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-800 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all cursor-pointer">
                          {["HVAC", "Plumbing", "Electrical", "Roofing"].map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5 block">Client name</label>
                        <input
                          value={form.client}
                          onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))}
                          placeholder="e.g. Johnson Residence"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-800 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5 block">Scope of work</label>
                        <textarea
                          value={form.scope}
                          onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))}
                          rows={2}
                          placeholder="Describe the main work..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-800 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all resize-none" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5 block">Your estimate</label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-semibold">$</span>
                          <input
                            value={form.estimate}
                            onChange={(e) => setForm((f) => ({ ...f, estimate: e.target.value.replace(/\D/g, "") }))}
                            placeholder="e.g. 8,500"
                            className="w-full pl-7 pr-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-800 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all" />
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => { setStage(2); setGenMsgIdx(0); }}
                      disabled={!form.client.trim() || !form.scope.trim() || !form.estimate}
                      className={`mt-5 w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                        form.client && form.scope && form.estimate
                          ? "bg-stone-900 hover:bg-stone-800 text-white shadow-md hover:scale-[1.02]"
                          : "bg-stone-100 text-stone-400 cursor-not-allowed"
                      }`}>
                      <Sparkles className="w-4 h-4" /> Generate Proposal
                    </button>
                  </div>
                )}

                {/* Stages 2–4: locked summary + actions */}
                {stage > 1 && (
                  <div className="flex-1 flex flex-col">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-4">Job summary</p>
                    <div className="space-y-3 flex-1">
                      {[
                        { label: "Trade", val: form.trade },
                        { label: "Client", val: form.client },
                        { label: "Scope", val: form.scope },
                        { label: "Estimate", val: `$${estimateNum.toLocaleString()}` },
                      ].map((row) => (
                        <div key={row.label} className="flex gap-3 items-start">
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider w-14 flex-shrink-0 pt-0.5">{row.label}</span>
                          <span className="text-stone-700 text-xs leading-relaxed">{row.val}</span>
                        </div>
                      ))}
                    </div>

                    {/* Stage 3: Send + PDF actions */}
                    {stage === 3 && visibleSections >= 4 && (
                      <div className="mt-6 space-y-2.5">
                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Actions</p>
                        <button
                          onClick={() => { setStage(4); setEmailSent(false); setTrackingPing(false); }}
                          className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-md shadow-orange-500/20">
                          <Send className="w-4 h-4" /> Send to Client
                        </button>
                        <button className="w-full py-3 rounded-xl bg-white border border-stone-200 text-stone-700 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-stone-50 transition-colors">
                          <FileText className="w-4 h-4" /> Download PDF
                        </button>
                      </div>
                    )}

                    {/* Stage 4: sending status */}
                    {stage === 4 && (
                      <div className="mt-6">
                        {!emailSent ? (
                          <div className="flex items-center gap-2.5 text-orange-500 text-sm font-medium">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                              className="w-4 h-4 border-2 border-orange-200 border-t-orange-500 rounded-full flex-shrink-0" />
                            Sending proposal...
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">
                              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                              Sent to {form.client}
                            </div>
                            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 leading-relaxed">
                              📧 Open tracking is active. You'll get a real-time notification the moment they open it.
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── RIGHT PANEL ── */}
              <div className="p-7 bg-stone-50/60 flex flex-col relative overflow-hidden">

                {/* Stage 1: empty state */}
                {stage === 1 && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-white border border-stone-200 flex items-center justify-center shadow-sm">
                      <FileText className="w-7 h-7 text-stone-300" />
                    </div>
                    <p className="text-stone-400 text-sm font-medium">Your proposal appears here</p>
                    <p className="text-stone-300 text-xs">Fill in the details and click Generate</p>
                  </div>
                )}

                {/* Stage 2: generating animation */}
                {stage === 2 && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl shadow-orange-500/30">
                        <Sparkles className="w-9 h-9 text-white" />
                      </div>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute -inset-1.5 rounded-2xl border-2 border-orange-300/50 border-t-orange-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-stone-800 font-bold text-base mb-2">ProposAI is writing your proposal</p>
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={genMsgIdx}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.3 }}
                          className="text-stone-400 text-sm">
                          {genMsgIdx === 1 ? (tradeMsgs[form.trade] || GEN_MESSAGES[1]) : GEN_MESSAGES[genMsgIdx]}
                        </motion.p>
                      </AnimatePresence>
                    </div>
                    <div className="w-56 h-1.5 rounded-full bg-stone-200 overflow-hidden">
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: `${Math.min(((genMsgIdx + 1) / GEN_MESSAGES.length) * 100, 92)}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full" />
                    </div>
                  </div>
                )}

                {/* Stages 3 & 4: formatted proposal document */}
                {(stage === 3 || stage === 4) && (
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-semibold text-emerald-600">
                        Generated in 47 seconds
                      </span>
                    </div>

                    {/* Document */}
                    <div className="bg-white rounded-xl border border-stone-200 shadow-sm flex-1 overflow-auto p-6 space-y-5">

                      {/* Section 1: Header */}
                      {visibleSections >= 1 && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="border-b border-stone-100 pb-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-black text-stone-900 text-sm">Mike's {form.trade} Services</p>
                              <p className="text-stone-400 text-[11px] mt-0.5">License #HV-2847 · (555) 847-2910 · mike@hvacpro.com</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black text-stone-500 uppercase tracking-wider">Proposal</p>
                              <p className="text-stone-400 text-[11px] mt-0.5">
                                {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 flex gap-6 text-[11px]">
                            <div><span className="text-stone-400">Prepared for: </span><span className="font-semibold text-stone-800">{form.client}</span></div>
                          </div>
                        </motion.div>
                      )}

                      {/* Section 2: Scope of work */}
                      {visibleSections >= 2 && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2.5">Scope of Work</p>
                          <ul className="space-y-2">
                            {(tradeScopes[form.trade] || tradeScopes["HVAC"]).map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-[11px] text-stone-700 leading-relaxed">
                                <span className="text-orange-400 mt-0.5 flex-shrink-0 font-bold">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}

                      {/* Section 3: Pricing */}
                      {visibleSections >= 3 && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2.5">Investment</p>
                          <div className="rounded-lg border border-stone-100 overflow-hidden text-[11px]">
                            {[
                              { label: "Equipment & Materials", pct: 0.61 },
                              { label: "Labor", pct: 0.33 },
                              { label: "Permits & Inspection", pct: 0.06 },
                            ].map((row, i) => (
                              <div key={i} className={`flex justify-between px-3 py-2 ${i % 2 === 0 ? "bg-stone-50" : "bg-white"}`}>
                                <span className="text-stone-600">{row.label}</span>
                                <span className="font-semibold text-stone-800">${Math.round(estimateNum * row.pct).toLocaleString()}</span>
                              </div>
                            ))}
                            <div className="flex justify-between px-3 py-2.5 bg-stone-900">
                              <span className="text-white font-bold">Total Investment</span>
                              <span className="text-amber-400 font-black">${estimateNum.toLocaleString()}</span>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Section 4: Terms + signature */}
                      {visibleSections >= 4 && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2.5">Terms</p>
                          <div className="space-y-1.5 text-[11px] text-stone-500">
                            <p>💳 50% deposit (${(estimateNum / 2).toLocaleString()}) required to schedule · balance on completion</p>
                            <p>🛡 1-year workmanship warranty · manufacturer warranty on all equipment</p>
                            <p>📅 Proposal valid for 30 days from date above</p>
                          </div>
                          <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-2 gap-4">
                            <div>
                              <div className="h-7 border-b border-dashed border-stone-300" />
                              <p className="text-[9px] text-stone-400 mt-1">Client signature</p>
                            </div>
                            <div>
                              <div className="h-7 border-b border-dashed border-stone-300" />
                              <p className="text-[9px] text-stone-400 mt-1">Date accepted</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                )}

                {/* Stage 4: tracking notification toast */}
                <AnimatePresence>
                  {stage === 4 && trackingPing && (
                    <motion.div
                      initial={{ opacity: 0, y: 24, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute bottom-5 left-5 right-5 bg-stone-900 rounded-2xl p-4 shadow-2xl border border-stone-700 z-20">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 text-xl">
                          📬
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-sm">{form.client} opened your proposal</p>
                          <p className="text-stone-400 text-xs mt-0.5">Just now · viewed for 2 min 14 sec</p>
                        </div>
                        <button className="text-orange-400 text-xs font-bold hover:text-orange-300 whitespace-nowrap transition-colors">
                          Follow up →
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ── Photo Feature Strip ───────────────────────────────────────────────────────
function PhotoStrip() {
  const trades = [
    { photo: PHOTOS.hvac, trade: "HVAC", color: "from-amber-500", desc: "Heating & cooling specialists" },
    { photo: PHOTOS.electrical, trade: "Electrical", color: "from-yellow-500", desc: "Licensed electricians" },
    { photo: PHOTOS.plumbing, trade: "Plumbing", color: "from-blue-500", desc: "Plumbing pros" },
    { photo: PHOTOS.roofing, trade: "Roofing", color: "from-rose-500", desc: "Roofing contractors" },
  ];

  return (
    <section id="trades" className="py-20 bg-[#faf7f2]">
      <div className="max-w-7xl mx-auto px-6">
        <FadeUp className="text-center mb-12">
          <p className="text-orange-500 text-xs font-bold uppercase tracking-[0.3em] mb-3">Built for tradespeople</p>
          <h2 className="text-4xl md:text-5xl font-black text-stone-900 tracking-tight">
            Designed for your trade
          </h2>
        </FadeUp>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {trades.map(({ photo, trade, color, desc }, i) => (
            <FadeUp key={trade} delay={i * 0.08}>
              <motion.div whileHover={{ y: -6, scale: 1.02 }} className="group relative rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                <div className="aspect-[3/4] overflow-hidden">
                  <img src={photo} alt={trade}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/400/533?random=${i}`; }} />
                </div>
                <div className={`absolute inset-0 bg-gradient-to-t ${color}/60 via-transparent to-transparent opacity-70`} />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wide mb-1">{trade}</span>
                  <p className="text-white/80 text-xs">{desc}</p>
                </div>
              </motion.div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How It Works (Scrolling steps) ────────────────────────────────────────────
function HowItWorksSection({ onCTA }: { onCTA: () => void }) {
  const steps = [
    {
      num: "01",
      title: "Enter job details",
      desc: "Tell ProposAI the trade type, client name, address, cost estimate, and a quick scope. Takes about 30 seconds — no templates, no forms.",
      accent: "bg-amber-500",
      light: "bg-amber-50",
      border: "border-amber-200",
      text: "text-amber-600",
      side: { type: "badge" as const, icon: "⏱", label: "Avg. 30 seconds" },
    },
    {
      num: "02",
      title: "AI writes it instantly",
      desc: "ProposAI generates a complete, professional proposal with trade-specific language, scope breakdown, material specs, and payment terms. Done in under 60 seconds.",
      accent: "bg-orange-500",
      light: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-600",
      side: { type: "link" as const, label: "See an example", scrollTo: "features" },
    },
    {
      num: "03",
      title: "Send & win the job",
      desc: "Export as PDF or send directly from ProposAI. Know the instant your client opens it. Send automatic follow-ups if they go quiet.",
      accent: "bg-rose-500",
      light: "bg-rose-50",
      border: "border-rose-200",
      text: "text-rose-600",
      side: { type: "badge" as const, icon: "📬", label: "Real-time open alerts" },
    },
  ];

  return (
    <section id="howitworks" className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <FadeUp className="text-center mb-20">
          <p className="text-orange-500 text-xs font-bold uppercase tracking-[0.3em] mb-4">How it works</p>
          <h2 className="text-4xl md:text-5xl font-black text-stone-900 tracking-tight mb-4">
            Three steps to winning proposals
          </h2>
          <p className="text-stone-400 text-lg max-w-xl mx-auto">No learning curve. If you can describe a job, you can use ProposAI.</p>
        </FadeUp>

        <div className="space-y-6 mb-16">
          {steps.map((step, i) => (
            <FadeUp key={i} delay={i * 0.12}>
              <motion.div whileHover={{ x: 6 }}
                className={`flex items-start gap-8 p-8 rounded-3xl border ${step.border} ${step.light} transition-all`}>
                <div className={`${step.accent} text-white font-black text-2xl w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                  {step.num}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-stone-900 mb-2">{step.title}</h3>
                  <p className="text-stone-500 text-base leading-relaxed max-w-2xl">{step.desc}</p>
                </div>
                {step.side.type === "badge" ? (
                  <div className={`hidden md:flex items-center gap-2 ${step.text} text-sm font-medium px-4 py-2 rounded-xl bg-white/50 border border-white whitespace-nowrap`}>
                    <span>{step.side.icon}</span>
                    {step.side.label}
                  </div>
                ) : (
                  <button
                    onClick={() => document.getElementById(step.side.scrollTo!)?.scrollIntoView({ behavior: "smooth" })}
                    className={`hidden md:flex items-center gap-2 ${step.text} font-semibold text-sm whitespace-nowrap px-4 py-2 rounded-xl hover:bg-white/60 transition-all hover:scale-105 group/btn`}>
                    {step.side.label} <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                )}
              </motion.div>
            </FadeUp>
          ))}
        </div>

        <FadeUp className="text-center">
          <button onClick={onCTA}
            className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-base shadow-xl shadow-stone-900/20 hover:scale-105 transition-all">
            <Sparkles className="w-5 h-5" />
            Try it free — no card needed
          </button>
        </FadeUp>
      </div>
    </section>
  );
}

// ── Features Bento ────────────────────────────────────────────────────────────
function FeaturesSection() {
  const cards = [
    {
      icon: Sparkles, title: "AI Generation", size: "large",
      desc: "ProposAI writes your complete proposal — scope, materials, pricing, professional language — from just a few details you provide.",
      accent: "from-amber-50 to-orange-50", border: "border-amber-200", icon_bg: "bg-amber-500", tag: "Core",
      extra: (
        <div className="mt-5 bg-stone-900 rounded-xl p-4 font-mono text-xs text-emerald-400 leading-relaxed">
          <span className="text-stone-500">// Generated in 47 seconds</span><br />
          <span className="text-amber-300">Scope of Work:</span><br />
          {'> '}Install Carrier 4-ton 16 SEER condenser<br />
          {'> '}92.1% AFUE furnace installation<br />
          <span className="text-emerald-400">✓ Proposal ready to send</span>
        </div>
      ),
    },
    {
      icon: FileText, title: "PDF Export", size: "small",
      desc: "Beautiful, branded PDFs with your logo and license — ready to send instantly.",
      accent: "from-violet-50 to-blue-50", border: "border-violet-200", icon_bg: "bg-violet-500", tag: "Delivery",
    },
    {
      icon: Mail, title: "Email Tracking", size: "small",
      desc: "Know the exact moment your client opens the proposal.",
      accent: "from-emerald-50 to-teal-50", border: "border-emerald-200", icon_bg: "bg-emerald-500", tag: "Intelligence",
    },
    {
      icon: Layers, title: "Template Library", size: "small",
      desc: "Save your best proposals as reusable templates for repeat job types.",
      accent: "from-blue-50 to-indigo-50", border: "border-blue-200", icon_bg: "bg-blue-500", tag: "Efficiency",
    },
    {
      icon: Shield, title: "Your Brand", size: "small",
      desc: "Logo, license number, colors — every proposal looks like it came from a professional.",
      accent: "from-rose-50 to-pink-50", border: "border-rose-200", icon_bg: "bg-rose-500", tag: "Branding",
    },
    {
      icon: Zap, title: "Instant Revisions", size: "small",
      desc: "Ask the AI to revise any section. Done in seconds, not hours.",
      accent: "from-orange-50 to-amber-50", border: "border-orange-200", icon_bg: "bg-orange-500", tag: "Flexible",
    },
  ];

  return (
    <section id="features" className="py-28 bg-[#faf7f2]">
      <div className="max-w-7xl mx-auto px-6">
        <FadeUp className="text-center mb-16">
          <p className="text-orange-500 text-xs font-bold uppercase tracking-[0.3em] mb-4">Features</p>
          <h2 className="text-4xl md:text-5xl font-black text-stone-900 tracking-tight mb-4">
            Everything you need to close more deals
          </h2>
        </FadeUp>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Large card */}
          {cards.filter(c => c.size === "large").map((card, i) => (
            <FadeUp key={i} delay={0.05} className="md:col-span-2">
              <motion.div whileHover={{ y: -4 }}
                className={`rounded-3xl border ${card.border} bg-gradient-to-br ${card.accent} p-8 h-full`}>
                <div className="flex items-start gap-4 mb-2">
                  <div className={`${card.icon_bg} w-12 h-12 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0`}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-white/70 text-stone-600 text-xs font-bold border border-stone-200">{card.tag}</span>
                </div>
                <h3 className="text-2xl font-bold text-stone-900 mb-3 mt-4">{card.title}</h3>
                <p className="text-stone-600 leading-relaxed">{card.desc}</p>
                {card.extra}
              </motion.div>
            </FadeUp>
          ))}

          {/* Small cards */}
          {cards.filter(c => c.size === "small").map((card, i) => (
            <FadeUp key={i} delay={0.05 + (i + 1) * 0.07}>
              <motion.div whileHover={{ y: -4, boxShadow: "0 12px 40px -8px rgba(0,0,0,0.1)" }}
                className={`rounded-3xl border ${card.border} bg-gradient-to-br ${card.accent} p-6 h-full transition-all`}>
                <div className={`${card.icon_bg} w-10 h-10 rounded-xl flex items-center justify-center shadow-md mb-4`}>
                  <card.icon className="w-5 h-5 text-white" />
                </div>
                <span className="px-3 py-1 rounded-full bg-white/70 text-stone-600 text-xs font-bold border border-stone-200 mb-3 inline-block">{card.tag}</span>
                <h3 className="text-lg font-bold text-stone-900 mb-2">{card.title}</h3>
                <p className="text-stone-600 text-sm leading-relaxed">{card.desc}</p>
              </motion.div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Split Photo Section ───────────────────────────────────────────────────────
function SplitSection({ onCTA }: { onCTA: () => void }) {
  return (
    <section className="bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 min-h-[600px]">
          {/* Left photo */}
          <FadeUp className="relative overflow-hidden">
            <img src={PHOTOS.team} alt="Contractors"
              className="w-full h-full object-cover min-h-[400px]"
              onError={(e) => { (e.target as HTMLImageElement).src = "https://picsum.photos/800/600?random=10"; }} />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
            {/* Floating stat card */}
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute bottom-8 left-8 bg-white rounded-2xl shadow-2xl p-5 border border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-stone-900 font-black text-xl">+65%</p>
                  <p className="text-stone-500 text-xs">Higher close rate</p>
                </div>
              </div>
            </motion.div>
          </FadeUp>

          {/* Right content */}
          <FadeUp className="flex flex-col justify-center px-12 py-16">
            <p className="text-orange-500 text-xs font-bold uppercase tracking-[0.3em] mb-4">The difference</p>
            <h2 className="text-4xl font-black text-stone-900 tracking-tight mb-6">
              Proposals that look as professional as the work you do
            </h2>
            <p className="text-stone-500 text-lg leading-relaxed mb-8">
              Your craftsmanship is top-notch. Now your proposals can match. ProposAI generates polished, professional proposals that give clients confidence in choosing you — even before they've seen your work.
            </p>
            <ul className="space-y-3 mb-10">
              {[
                "Professional language tailored to your trade",
                "Branded with your logo and company details",
                "Clear scope, materials, and payment terms",
                "Delivered in seconds, not hours",
              ].map(item => (
                <li key={item} className="flex items-center gap-3 text-stone-700">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
            <button onClick={onCTA}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-base shadow-lg shadow-orange-500/25 hover:scale-105 transition-all self-start">
              <Sparkles className="w-5 h-5" />
              Start winning more bids
            </button>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

// ── Pricing ───────────────────────────────────────────────────────────────────
function PricingSection({ onCTA }: { onCTA: () => void }) {
  const [annual, setAnnual] = useState(false);
  const plans = [
    { name: "Free", price: 0, desc: "No credit card needed", features: ["3 proposals/month","PDF export","AI generation","Email delivery"], cta: "Start for free", highlight: false },
    { name: "Starter", price: 19, desc: "For active contractors", features: ["20 proposals/month","Templates library","Email open tracking","Auto follow-ups","Priority support"], cta: "Get Starter", highlight: true },
    { name: "Pro", price: 49, desc: "For growing teams", features: ["Unlimited proposals","Custom SMTP","Advanced AI model","White-label PDFs","Custom branding"], cta: "Get Pro", highlight: false },
  ];

  return (
    <section id="pricing" className="py-28 bg-stone-900 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(245,158,11,0.4) 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <FadeUp className="text-center mb-12">
          <p className="text-amber-400 text-xs font-bold uppercase tracking-[0.3em] mb-4">Pricing</p>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6">
            Simple, honest pricing
          </h2>

          {/* Toggle */}
          <div className="inline-flex items-center gap-1 p-1 rounded-full bg-stone-800 border border-stone-700 mb-5">
            {["Monthly","Annual"].map((label, i) => (
              <button key={label} onClick={() => setAnnual(i === 1)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  annual === (i === 1) ? "bg-white text-stone-900" : "text-stone-400"
                }`}>
                {label} {i === 1 && <span className="ml-1 bg-emerald-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">-20%</span>}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-semibold">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            All plans free during our launch period
          </div>
        </FadeUp>

        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((plan, i) => (
            <FadeUp key={plan.name} delay={i * 0.1}>
              <motion.div whileHover={{ y: -5 }}
                className={`rounded-3xl p-8 h-full flex flex-col relative overflow-hidden ${
                  plan.highlight ? "bg-gradient-to-b from-amber-500 to-orange-600" : "bg-stone-800 border border-stone-700"
                }`}>
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-white text-orange-600 text-xs font-black px-4 py-1.5 rounded-full shadow-lg">
                    MOST POPULAR
                  </div>
                )}
                <div className="mb-6">
                  <p className={`text-sm font-semibold mb-2 ${plan.highlight ? "text-amber-100" : "text-stone-400"}`}>{plan.name}</p>
                  <div className="flex items-end gap-1 mb-1">
                    <motion.span key={`${plan.price}-${annual}`}
                      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                      className={`text-5xl font-black ${plan.highlight ? "text-white" : "text-white"}`}>
                      ${plan.price === 0 ? 0 : annual ? Math.round(plan.price * 0.8) : plan.price}
                    </motion.span>
                    {plan.price > 0 && <span className={`text-lg mb-1.5 ${plan.highlight ? "text-amber-200" : "text-stone-400"}`}>/mo</span>}
                  </div>
                  <p className={`text-sm ${plan.highlight ? "text-amber-200" : "text-stone-400"}`}>{plan.desc}</p>
                </div>
                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <Check className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? "text-white" : "text-amber-400"}`} />
                      <span className={plan.highlight ? "text-amber-50" : "text-stone-300"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={onCTA}
                  className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] ${
                    plan.highlight ? "bg-white text-orange-600 hover:bg-orange-50 shadow-lg" : "bg-stone-700 hover:bg-stone-600 text-white border border-stone-600"
                  }`}>
                  {plan.cta}
                </button>
              </motion.div>
            </FadeUp>
          ))}
        </div>

        <FadeUp className="text-center mt-10">
          <div className="flex items-center justify-center gap-3">
            <img src={GUARANTEE_BADGE_URL} alt="Guarantee" className="w-12 h-12 opacity-70" />
            <p className="text-stone-400 text-sm">30-day money-back guarantee · Cancel anytime · No hidden fees</p>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ── Testimonials ──────────────────────────────────────────────────────────────
function TestimonialsSection() {
  const testimonials = [
    { name: "Mike D.", trade: "HVAC Contractor", text: "I used to spend 2 hours writing proposals. Now it takes me 60 seconds and they look WAY more professional. Signed 3 new clients last week alone.", stars: 5 },
    { name: "Sarah L.", trade: "Licensed Electrician", text: "My proposals look like they came from a huge firm. Clients keep commenting on how professional they are. My close rate has gone through the roof.", stars: 5 },
    { name: "Tony R.", trade: "Plumbing Services", text: "I was skeptical but ProposAI paid for itself on the first job. The AI actually understands plumbing terminology — it's not just generic text.", stars: 5 },
  ];

  return (
    <section id="testimonials" className="py-28 bg-[#faf7f2]">
      <div className="max-w-7xl mx-auto px-6">
        <FadeUp className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-stone-900 tracking-tight mb-4">
            Contractors love it
          </h2>
          <p className="text-stone-400 text-lg">Real results from real tradespeople.</p>
        </FadeUp>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <FadeUp key={i} delay={i * 0.1}>
              <motion.div whileHover={{ y: -5 }}
                className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all">
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-stone-700 leading-relaxed mb-6 text-sm">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-stone-900 font-semibold text-sm">{t.name}</p>
                    <p className="text-stone-400 text-xs">{t.trade}</p>
                  </div>
                </div>
              </motion.div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FAQ ───────────────────────────────────────────────────────────────────────
function FAQSection() {
  const faqs = [
    { q: "How does ProposAI generate proposals?", a: "You provide basic job details — trade type, client name, scope, and your estimate — and ProposAI writes a complete, professional proposal tailored to your specific trade in under 60 seconds." },
    { q: "What trades are supported?", a: "HVAC, plumbing, electrical, and roofing — with more trades being added. Each trade has specialized language, scope templates, and industry-standard sections." },
    { q: "Can I customize the proposals?", a: "Absolutely. After generation, edit any section, add your company branding, adjust pricing, add custom terms, and save as a template for future similar jobs." },
    { q: "How does email open tracking work?", a: "When you send a proposal from ProposAI, we embed an invisible tracking pixel. The moment your client opens it, you get a real-time notification so you know exactly when to follow up." },
    { q: "Is my data secure?", a: "All data is encrypted in transit and at rest. We never share your client data or proposal content with third parties. Your business data stays yours." },
    { q: "What happens when free proposals run out?", a: "Upgrade to a paid plan to continue. We'll never delete your existing proposals, and your data is always safe. Paid plans start at $19/month." },
  ];

  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section id="faq" className="py-28 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        <FadeUp className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-stone-900 tracking-tight mb-4">
            Common questions
          </h2>
        </FadeUp>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <FadeUp key={i} delay={i * 0.04}>
              <motion.div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setOpenIdx(openIdx === i ? null : i); }}
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className={`rounded-2xl border cursor-pointer transition-all overflow-hidden focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 ${
                  openIdx === i ? "border-orange-200 bg-orange-50" : "border-stone-200 bg-white hover:bg-stone-50 hover:border-stone-300"
                }`}>
                <div className="flex items-center justify-between p-6">
                  <span className="text-stone-900 font-semibold text-sm md:text-base pr-4">{faq.q}</span>
                  <motion.div animate={{ rotate: openIdx === i ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className={`w-5 h-5 flex-shrink-0 ${openIdx === i ? "text-orange-500" : "text-stone-400"}`} />
                  </motion.div>
                </div>
                <AnimatePresence>
                  {openIdx === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
                      className="px-6 pb-6">
                      <p className="text-stone-600 text-sm leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Final CTA ─────────────────────────────────────────────────────────────────
function CTASection({ onCTA }: { onCTA: () => void }) {
  return (
    <section className="py-32 bg-[#faf7f2] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-40"
          style={{ background: "radial-gradient(circle, rgba(251,191,36,0.3) 0%, rgba(234,88,12,0.1) 50%, transparent 70%)" }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <FadeUp>
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white border border-stone-200 text-stone-500 text-sm shadow-sm mb-8">
            🎉 All plans free during launch
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-stone-900 tracking-tight leading-[0.95] mb-6">
            Start winning<br />
            <span className="text-orange-500">more jobs today</span>
          </h2>
          <p className="text-stone-500 text-xl mb-12 max-w-xl mx-auto leading-relaxed">
            Your first professional proposal in under a minute. No setup, no credit card, no BS.
          </p>

          <motion.button onClick={onCTA}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-black text-lg shadow-2xl shadow-stone-900/25">
            <Sparkles className="w-6 h-6" />
            Generate your first proposal
          </motion.button>

          <div className="flex items-center justify-center gap-8 mt-10 text-stone-400 text-sm">
            {["Free forever plan", "No credit card", "Cancel anytime"].map((t, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                {t}
              </div>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function HomeE() {
  const [, setLocation] = useLocation();
  const handleCTA = () => setLocation("/register");

  return (
    <div className="min-h-screen bg-[#faf7f2]">
      <NavBar onCTA={handleCTA} />
      <HeroSection onCTA={handleCTA} />
      <StatsSection />
      <InteractiveDemoSection />
      <PhotoStrip />
      <HowItWorksSection onCTA={handleCTA} />
      <FeaturesSection />
      <SplitSection onCTA={handleCTA} />
      <TestimonialsSection />
      <PricingSection onCTA={handleCTA} />
      <FAQSection />
      <CTASection onCTA={handleCTA} />

      <footer className="border-t border-stone-200 py-10 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <span className="text-white font-black text-sm">P</span>
            </div>
            <span className="text-stone-400 text-sm">© {new Date().getFullYear()} ProposAI · AI proposals for trade contractors</span>
          </div>
          <div className="flex items-center gap-6">
            {[["Pricing","/pricing"],["Terms","/terms"],["Privacy","/privacy"]].map(([l,h]) => (
              <a key={l} href={h} className="text-stone-400 hover:text-stone-700 text-sm transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

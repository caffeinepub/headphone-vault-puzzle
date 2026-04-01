import { useCallback, useEffect, useRef, useState } from "react";

// ── Audio helpers ─────────────────────────────────────────────────────────────
interface AudioState {
  ctx: AudioContext | null;
  ambientGain: GainNode | null;
  osc1: OscillatorNode | null;
  osc2: OscillatorNode | null;
  started: boolean;
}

function createAmbience(ctx: AudioContext): {
  gain: GainNode;
  osc1: OscillatorNode;
  osc2: OscillatorNode;
} {
  const gain = ctx.createGain();
  gain.gain.value = 0.04;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 200;
  const osc1 = ctx.createOscillator();
  osc1.type = "sine";
  osc1.frequency.value = 60;
  const osc2 = ctx.createOscillator();
  osc2.type = "sine";
  osc2.frequency.value = 83;
  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  osc1.start();
  osc2.start();
  return { gain, osc1, osc2 };
}

function playUnlockSound(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.3);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.36);

  const res = ctx.createOscillator();
  const resGain = ctx.createGain();
  res.type = "sine";
  res.frequency.value = 440;
  resGain.gain.setValueAtTime(0, ctx.currentTime + 0.1);
  resGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.4);
  resGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
  res.connect(resGain);
  resGain.connect(ctx.destination);
  res.start(ctx.currentTime + 0.1);
  res.stop(ctx.currentTime + 2.6);
}

function playLockSound(ctx: AudioContext) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 300;
  gain.gain.setValueAtTime(0.25, ctx.currentTime);
  gain.gain.setValueAtTime(0, ctx.currentTime + 0.12);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.13);

  const thud = ctx.createOscillator();
  const tGain = ctx.createGain();
  thud.type = "sine";
  thud.frequency.setValueAtTime(120, ctx.currentTime + 0.05);
  thud.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.25);
  tGain.gain.setValueAtTime(0.3, ctx.currentTime + 0.05);
  tGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  thud.connect(tGain);
  tGain.connect(ctx.destination);
  thud.start(ctx.currentTime + 0.05);
  thud.stop(ctx.currentTime + 0.31);
}

// ── Headphone detection ───────────────────────────────────────────────────────
async function detectHeadphones(): Promise<boolean> {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices)
      return false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      for (const t of stream.getTracks()) t.stop();
    } catch (_) {
      // Permission denied – use count heuristic
    }
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioOutputs = devices.filter((d) => d.kind === "audiooutput");
    const headphoneKeywords = [
      "headphone",
      "headset",
      "earphone",
      "earbud",
      "airpods",
      "earbuds",
    ];
    const hasLabelMatch = audioOutputs.some((d) =>
      headphoneKeywords.some((kw) => d.label.toLowerCase().includes(kw)),
    );
    const hasExtraDevice = audioOutputs.length > 1;
    return hasLabelMatch || hasExtraDevice;
  } catch (_) {
    return false;
  }
}

// ── Particles component ───────────────────────────────────────────────────────
const PARTICLE_DATA = Array.from({ length: 18 }, (_, i) => ({
  id: `p${i}`,
  left: `${5 + ((i * 5.2) % 90)}%`,
  size: `${1 + (i % 3)}px`,
  duration: `${7 + (i % 6)}s`,
  delay: `${(i * 0.7) % 8}s`,
  drift: `${-20 + (i % 5) * 10}px`,
  opacity: 0.3 + (i % 4) * 0.15,
}));

function BackgroundParticles() {
  return (
    <>
      {PARTICLE_DATA.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            bottom: "-5px",
            width: p.size,
            height: p.size,
            ["--duration" as string]: p.duration,
            ["--delay" as string]: p.delay,
            ["--drift" as string]: p.drift,
            opacity: p.opacity,
          }}
        />
      ))}
    </>
  );
}

// ── Rune columns ─────────────────────────────────────────────────────────────
const RUNE_LIST = [
  { r: "ᚠ", dur: "2s", del: "0s" },
  { r: "ᚢ", dur: "2.8s", del: "0.3s" },
  { r: "ᚦ", dur: "3.6s", del: "0.6s" },
  { r: "ᚨ", dur: "4.4s", del: "0.9s" },
  { r: "ᚱ", dur: "2s", del: "1.2s" },
  { r: "ᚲ", dur: "2.8s", del: "1.5s" },
  { r: "ᚷ", dur: "3.6s", del: "1.8s" },
  { r: "ᚹ", dur: "4.4s", del: "2.1s" },
  { r: "ᚺ", dur: "2s", del: "2.4s" },
  { r: "ᚾ", dur: "2.8s", del: "0s" },
  { r: "ᛁ", dur: "3.6s", del: "0.3s" },
  { r: "ᛃ", dur: "4.4s", del: "0.9s" },
];

function RuneColumn({ side }: { side: "left" | "right" }) {
  return (
    <div
      className={`fixed top-0 ${side === "left" ? "left-4" : "right-4"} h-full flex flex-col justify-center gap-3 pointer-events-none`}
    >
      {RUNE_LIST.map(({ r, dur, del }) => (
        <span
          key={`${side}-${r}`}
          className="rune-flicker text-sm font-mono"
          style={{
            color: "var(--teal)",
            textShadow:
              "0 0 8px var(--teal), 0 0 16px oklch(0.65 0.08 192 / 0.4)",
            ["--rune-duration" as string]: dur,
            ["--rune-delay" as string]: del,
          }}
        >
          {r}
        </span>
      ))}
    </div>
  );
}

// ── Interior particles ────────────────────────────────────────────────────────
const INTERIOR_PARTICLES = Array.from({ length: 8 }, (_, i) => ({
  id: `ip${i}`,
  left: `${15 + i * 10}%`,
  size: `${1 + (i % 2)}px`,
  duration: `${2.5 + (i % 3) * 0.8}s`,
  delay: `${i * 0.4}s`,
  drift: `${-10 + (i % 3) * 10}px`,
}));

function InteriorParticles() {
  return (
    <>
      {INTERIOR_PARTICLES.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            bottom: "10%",
            left: p.left,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: "var(--brass-light)",
            animation: `interior-particle ${p.duration} ${p.delay} ease-in-out infinite`,
            ["--drift" as string]: p.drift,
          }}
        />
      ))}
    </>
  );
}

// ── Corner rivet positions ────────────────────────────────────────────────────
const CORNER_RIVETS = [
  { cx: 20, cy: 20 },
  { cx: 280, cy: 20 },
  { cx: 20, cy: 340 },
  { cx: 280, cy: 340 },
];
const EDGE_RIVET_X = [80, 150, 220];
const TEXTURE_LINES = [0, 1, 2];
const HINGE_Y = [80, 280];
const HANDLE_GRIPS = [0, 1, 2, 3];
const DIAL_TICKS = Array.from({ length: 40 }, (_, i) => i);
const DIAL_NUMBERS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];
const DIAL_SPOKES = [0, 90, 180, 270];

// ── Vault SVG door ─────────────────────────────────────────────────────────────
function VaultDoor({
  isOpen,
  isAnimating,
  dialClass,
}: { isOpen: boolean; isAnimating: boolean; dialClass: string }) {
  const W = 300;
  const H = 360;
  const barLength = 54;

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Vault door"
      style={{
        filter:
          "drop-shadow(-8px 0 30px rgba(0,0,0,0.9)) drop-shadow(0 0 40px rgba(0,0,0,0.6))",
      }}
    >
      <title>Vault door</title>
      <defs>
        <radialGradient id="doorGrad" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#3a4a52" />
          <stop offset="60%" stopColor="#1e2c32" />
          <stop offset="100%" stopColor="#111a1f" />
        </radialGradient>
        <radialGradient id="frameGrad" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#2a363d" />
          <stop offset="100%" stopColor="#0d181c" />
        </radialGradient>
        <radialGradient id="dialGrad" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#d4b870" />
          <stop offset="50%" stopColor="#b8924f" />
          <stop offset="100%" stopColor="#7a5c2a" />
        </radialGradient>
        <radialGradient id="dialInner" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#c8a86a" />
          <stop offset="100%" stopColor="#8a6830" />
        </radialGradient>
        <linearGradient id="hingeGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#444e55" />
          <stop offset="40%" stopColor="#6a7a82" />
          <stop offset="100%" stopColor="#2a3338" />
        </linearGradient>
        <linearGradient id="handleGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#556068" />
          <stop offset="50%" stopColor="#7a8e98" />
          <stop offset="100%" stopColor="#3a4a50" />
        </linearGradient>
        <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#a0b0b8" />
          <stop offset="50%" stopColor="#ccd8de" />
          <stop offset="100%" stopColor="#708088" />
        </linearGradient>
        <filter id="dialGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer frame */}
      <rect
        x="2"
        y="2"
        width="296"
        height="356"
        rx="6"
        ry="6"
        fill="url(#frameGrad)"
        stroke="#1a2428"
        strokeWidth="2"
      />
      <rect
        x="3"
        y="3"
        width="294"
        height="354"
        rx="5"
        ry="5"
        fill="none"
        stroke="#3a4e56"
        strokeWidth="1"
        opacity="0.5"
      />

      {/* Corner rivets */}
      {CORNER_RIVETS.map(({ cx, cy }) => (
        <g key={`cr-${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r="7" fill="#1a2428" />
          <circle cx={cx} cy={cy} r="5" fill="url(#hingeGrad)" />
          <circle cx={cx - 1} cy={cy - 1} r="2" fill="rgba(255,255,255,0.3)" />
        </g>
      ))}

      {/* Edge rivets */}
      {EDGE_RIVET_X.map((x) => (
        <g key={`er-${x}`}>
          <circle cx={x} cy={16} r="4" fill="#1a2428" />
          <circle cx={x} cy={16} r="3" fill="url(#hingeGrad)" />
          <circle cx={x} cy={344} r="4" fill="#1a2428" />
          <circle cx={x} cy={344} r="3" fill="url(#hingeGrad)" />
        </g>
      ))}

      {/* Door panel */}
      <rect
        x="12"
        y="12"
        width="276"
        height="336"
        rx="4"
        ry="4"
        fill="url(#doorGrad)"
      />
      <rect
        x="28"
        y="28"
        width="244"
        height="304"
        rx="3"
        ry="3"
        fill="none"
        stroke="#2a3a42"
        strokeWidth="2"
      />
      <rect
        x="29"
        y="29"
        width="244"
        height="304"
        rx="3"
        ry="3"
        fill="none"
        stroke="#4a5e66"
        strokeWidth="0.5"
        opacity="0.4"
      />

      {/* Texture lines */}
      {TEXTURE_LINES.map((i) => (
        <line
          key={`tl-${i}`}
          x1="40"
          y1={80 + i * 80}
          x2="260"
          y2={80 + i * 80}
          stroke="#2a3a42"
          strokeWidth="0.5"
          opacity="0.6"
        />
      ))}

      {/* Hinges */}
      {HINGE_Y.map((y) => (
        <g key={`hinge-${y}`}>
          <rect
            x="12"
            y={y - 20}
            width="22"
            height="40"
            rx="2"
            fill="url(#hingeGrad)"
            stroke="#1a2428"
            strokeWidth="1"
          />
          <rect
            x="14"
            y={y - 16}
            width="18"
            height="32"
            rx="1"
            fill="none"
            stroke="#4a5a62"
            strokeWidth="0.5"
          />
          <circle cx="23" cy={y - 10} r="2.5" fill="#1a2428" />
          <circle cx="23" cy={y} r="2.5" fill="#1a2428" />
          <circle cx="23" cy={y + 10} r="2.5" fill="#1a2428" />
          <rect
            x="33"
            y={y - 14}
            width="12"
            height="28"
            rx="2"
            fill="url(#hingeGrad)"
            stroke="#1a2428"
            strokeWidth="1"
          />
        </g>
      ))}

      {/* Locking bars */}
      {/* Top bar */}
      <rect
        x={150 - 8}
        y={132 - barLength}
        width="16"
        height={barLength}
        rx="3"
        fill="url(#barGrad)"
        stroke="#808e96"
        strokeWidth="0.5"
        style={{
          transformOrigin: "150px 132px",
          transform: isOpen ? "scaleY(0)" : "scaleY(1)",
          opacity: isOpen ? 0 : 1,
          transition: isAnimating
            ? "transform 0.6s ease-in-out, opacity 0.6s ease-in-out"
            : "none",
        }}
      />
      {/* Bottom bar */}
      <rect
        x={150 - 8}
        y={188}
        width="16"
        height={barLength}
        rx="3"
        fill="url(#barGrad)"
        stroke="#808e96"
        strokeWidth="0.5"
        style={{
          transformOrigin: "150px 188px",
          transform: isOpen ? "scaleY(0)" : "scaleY(1)",
          opacity: isOpen ? 0 : 1,
          transition: isAnimating
            ? "transform 0.6s ease-in-out, opacity 0.6s ease-in-out"
            : "none",
        }}
      />
      {/* Left bar */}
      <rect
        x={150 - barLength - 8}
        y={180 - 8}
        width={barLength}
        height="16"
        rx="3"
        fill="url(#barGrad)"
        stroke="#808e96"
        strokeWidth="0.5"
        style={{
          transformOrigin: "150px 180px",
          transform: isOpen ? "scaleX(0)" : "scaleX(1)",
          opacity: isOpen ? 0 : 1,
          transition: isAnimating
            ? "transform 0.6s ease-in-out, opacity 0.6s ease-in-out"
            : "none",
        }}
      />
      {/* Right bar */}
      <rect
        x={158}
        y={180 - 8}
        width={barLength}
        height="16"
        rx="3"
        fill="url(#barGrad)"
        stroke="#808e96"
        strokeWidth="0.5"
        style={{
          transformOrigin: "150px 180px",
          transform: isOpen ? "scaleX(0)" : "scaleX(1)",
          opacity: isOpen ? 0 : 1,
          transition: isAnimating
            ? "transform 0.6s ease-in-out, opacity 0.6s ease-in-out"
            : "none",
        }}
      />

      {/* Combination dial */}
      <g className={dialClass} style={{ transformOrigin: "150px 160px" }}>
        <circle
          cx="150"
          cy="160"
          r="58"
          fill="url(#dialGrad)"
          stroke="#7a5c2a"
          strokeWidth="2"
          filter="url(#dialGlow)"
        />
        <circle
          cx="150"
          cy="160"
          r="55"
          fill="none"
          stroke="rgba(255,220,120,0.3)"
          strokeWidth="2"
        />
        <circle
          cx="150"
          cy="160"
          r="52"
          fill="none"
          stroke="rgba(0,0,0,0.4)"
          strokeWidth="1"
        />

        {/* Tick marks */}
        {DIAL_TICKS.map((i) => {
          const angle = (i / 40) * Math.PI * 2 - Math.PI / 2;
          const isMajor = i % 5 === 0;
          const r1 = 46;
          const r2 = isMajor ? 38 : 42;
          return (
            <line
              key={`tick-${i}`}
              x1={150 + Math.cos(angle) * r1}
              y1={160 + Math.sin(angle) * r1}
              x2={150 + Math.cos(angle) * r2}
              y2={160 + Math.sin(angle) * r2}
              stroke={isMajor ? "rgba(255,200,80,0.8)" : "rgba(180,140,60,0.5)"}
              strokeWidth={isMajor ? 1.5 : 0.8}
            />
          );
        })}

        {/* Numbers */}
        {DIAL_NUMBERS.map((num, i) => {
          const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
          const r = 32;
          return (
            <text
              key={`num-${num}`}
              x={150 + Math.cos(angle) * r}
              y={160 + Math.sin(angle) * r + 3}
              textAnchor="middle"
              fontSize="6"
              fill="rgba(255,200,80,0.9)"
              fontFamily="monospace"
            >
              {num}
            </text>
          );
        })}

        <circle
          cx="150"
          cy="160"
          r="22"
          fill="url(#dialInner)"
          stroke="rgba(0,0,0,0.5)"
          strokeWidth="1"
        />
        <circle
          cx="150"
          cy="160"
          r="19"
          fill="#6a4a20"
          stroke="rgba(255,180,60,0.3)"
          strokeWidth="0.5"
        />
        <circle
          cx="150"
          cy="160"
          r="5"
          fill="#3a2810"
          stroke="rgba(255,160,40,0.5)"
          strokeWidth="1"
        />
        <circle cx="150" cy="160" r="2" fill="rgba(255,200,100,0.7)" />

        {/* Spokes */}
        {DIAL_SPOKES.map((deg) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <line
              key={`spoke-${deg}`}
              x1={150 + Math.cos(rad) * 6}
              y1={160 + Math.sin(rad) * 6}
              x2={150 + Math.cos(rad) * 18}
              y2={160 + Math.sin(rad) * 18}
              stroke="rgba(255,180,60,0.5)"
              strokeWidth="1.5"
            />
          );
        })}
      </g>

      {/* Dial pointer (fixed) */}
      <polygon
        points="150,98 146,110 154,110"
        fill="#e0c060"
        stroke="#7a5c2a"
        strokeWidth="0.5"
      />

      {/* Handle */}
      <g>
        <rect
          x="234"
          y="152"
          width="28"
          height="56"
          rx="6"
          fill="url(#handleGrad)"
          stroke="#1a2a30"
          strokeWidth="1"
        />
        <rect
          x="236"
          y="154"
          width="24"
          height="52"
          rx="5"
          fill="none"
          stroke="#4a6070"
          strokeWidth="0.5"
          opacity="0.6"
        />
        <rect
          x="238"
          y="168"
          width="14"
          height="30"
          rx="4"
          fill="url(#hingeGrad)"
          stroke="#1a2a30"
          strokeWidth="1"
        />
        {HANDLE_GRIPS.map((i) => (
          <line
            key={`grip-${i}`}
            x1="239"
            y1={172 + i * 7}
            x2="251"
            y2={172 + i * 7}
            stroke="#2a3a42"
            strokeWidth="1"
            opacity="0.8"
          />
        ))}
        <circle cx="248" cy="158" r="3" fill="#1a2a30" />
        <circle cx="248" cy="158" r="2" fill="url(#hingeGrad)" />
        <circle cx="248" cy="198" r="3" fill="#1a2a30" />
        <circle cx="248" cy="198" r="2" fill="url(#hingeGrad)" />
      </g>

      {/* Lock indicator badge */}
      <g>
        <rect
          x="100"
          y="312"
          width="100"
          height="24"
          rx="4"
          fill="rgba(0,0,0,0.5)"
          stroke={isOpen ? "#49b6b1" : "#e05050"}
          strokeWidth="1"
        />
        <circle cx="116" cy="324" r="5" fill={isOpen ? "#49b6b1" : "#e05050"} />
        <circle
          cx="116"
          cy="324"
          r="3"
          fill={isOpen ? "#6ce0da" : "#ff6060"}
          opacity="0.8"
        />
        <text
          x="128"
          y="329"
          fontSize="8"
          fill={isOpen ? "#49b6b1" : "#e05050"}
          fontFamily="monospace"
          fontWeight="bold"
          letterSpacing="1"
        >
          {isOpen ? "UNLOCKED" : "SECURED"}
        </text>
      </g>
    </svg>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showInterior, setShowInterior] = useState(false);
  const [dialClass, setDialClass] = useState("dial-idle");
  const audioRef = useRef<AudioState>({
    ctx: null,
    ambientGain: null,
    osc1: null,
    osc2: null,
    started: false,
  });
  const animTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimeouts = useCallback(() => {
    for (const t of animTimeoutsRef.current) clearTimeout(t);
    animTimeoutsRef.current = [];
  }, []);

  const ensureAudio = useCallback(() => {
    if (audioRef.current.started) return;
    const ctx = new AudioContext();
    const { gain, osc1, osc2 } = createAmbience(ctx);
    audioRef.current = { ctx, ambientGain: gain, osc1, osc2, started: true };
  }, []);

  const handleUnlock = useCallback(() => {
    if (isUnlocked) return;
    setIsAnimating(true);
    setDialClass("dial-fast");
    if (audioRef.current.ctx) playUnlockSound(audioRef.current.ctx);

    const t1 = setTimeout(() => {
      setIsUnlocked(true);
      setDialClass("");
    }, 800);
    const t2 = setTimeout(() => {
      setShowInterior(true);
      setIsAnimating(false);
    }, 2100);
    animTimeoutsRef.current = [t1, t2];
  }, [isUnlocked]);

  const handleLock = useCallback(() => {
    if (!isUnlocked) return;
    setIsAnimating(true);
    setShowInterior(false);
    if (audioRef.current.ctx) playLockSound(audioRef.current.ctx);

    const t1 = setTimeout(() => {
      setIsUnlocked(false);
      setDialClass("dial-idle");
    }, 700);
    const t2 = setTimeout(() => {
      setIsAnimating(false);
    }, 1900);
    animTimeoutsRef.current = [t1, t2];
  }, [isUnlocked]);

  // Headphone detection
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      const hasHeadphones = await detectHeadphones();
      if (!mounted) return;
      if (hasHeadphones && !isUnlocked) handleUnlock();
      else if (!hasHeadphones && isUnlocked) handleLock();
    };
    check();
    const onChange = () => check();
    navigator.mediaDevices?.addEventListener("devicechange", onChange);
    return () => {
      mounted = false;
      navigator.mediaDevices?.removeEventListener("devicechange", onChange);
    };
  }, [isUnlocked, handleUnlock, handleLock]);

  // Start audio on first interaction
  useEffect(() => {
    const handler = () => ensureAudio();
    window.addEventListener("click", handler, { once: true });
    return () => window.removeEventListener("click", handler);
  }, [ensureAudio]);

  useEffect(() => () => clearTimeouts(), [clearTimeouts]);

  return (
    <div
      className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "oklch(0.12 0.02 196)" }}
    >
      {/* Background radial gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, oklch(0.17 0.025 196) 0%, oklch(0.08 0.015 196) 100%)",
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      {/* Light shaft */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "120px",
          height: "100%",
          background:
            "linear-gradient(to bottom, transparent, oklch(0.65 0.08 192 / 0.04) 20%, oklch(0.65 0.08 192 / 0.07) 50%, oklch(0.65 0.08 192 / 0.03) 80%, transparent)",
          filter: "blur(30px)",
        }}
      />

      <BackgroundParticles />
      <RuneColumn side="left" />
      <RuneColumn side="right" />

      {/* Title */}
      <header className="relative z-10 text-center mb-8">
        <h1
          className="font-display font-bold text-4xl md:text-5xl tracking-[0.2em] uppercase mb-2"
          style={{
            color: "var(--teal)",
            textShadow:
              "0 0 20px oklch(0.65 0.08 192 / 0.7), 0 0 40px oklch(0.65 0.08 192 / 0.3)",
          }}
        >
          THE PARADOX VAULT
        </h1>
        <p
          className="font-body text-xs tracking-[0.3em] uppercase"
          style={{ color: "var(--muted-text)" }}
        >
          A PUZZLE AWAITS THE WORTHY
        </p>
      </header>

      {/* Vault area */}
      <main className="relative z-10 flex items-center justify-center">
        <div
          className="relative"
          style={{
            padding: "24px",
            background:
              "radial-gradient(ellipse at center, oklch(0.16 0.02 210) 0%, oklch(0.09 0.015 210) 100%)",
            borderRadius: "8px",
            boxShadow:
              "0 0 80px rgba(0,0,0,0.9), inset 0 0 40px rgba(0,0,0,0.5), 0 0 0 1px oklch(0.25 0.02 196)",
          }}
        >
          {/* Stone texture */}
          <div
            className="absolute inset-0 rounded-lg pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 28px, oklch(0.14 0.015 210) 28px, oklch(0.14 0.015 210) 30px), repeating-linear-gradient(90deg, transparent, transparent 58px, oklch(0.14 0.015 210) 58px, oklch(0.14 0.015 210) 60px)",
              opacity: 0.3,
            }}
          />

          <div className="relative" style={{ width: "300px", height: "360px" }}>
            {/* Interior */}
            <div
              className="absolute inset-0 rounded-sm overflow-hidden"
              style={{
                background:
                  "radial-gradient(ellipse at center, oklch(0.35 0.08 60) 0%, oklch(0.18 0.04 50) 40%, oklch(0.06 0.01 0) 100%)",
                boxShadow: "inset 0 0 40px rgba(0,0,0,0.8)",
              }}
            >
              <div
                className="interior-content absolute inset-0 flex flex-col items-center justify-center gap-4"
                style={{ opacity: showInterior ? 1 : 0 }}
              >
                <InteriorParticles />
                <div className="text-center px-4">
                  <p
                    className="glow-text font-display font-bold text-xl md:text-2xl uppercase tracking-widest mb-3"
                    style={{ color: "var(--teal-bright)" }}
                  >
                    You beat the puzzle!
                  </p>
                  <p
                    className="font-body text-xs tracking-wider"
                    style={{ color: "var(--muted-text)", lineHeight: 1.6 }}
                  >
                    The vault yields its secrets
                    <br />
                    to the worthy.
                  </p>
                </div>
              </div>
            </div>

            {/* 3D door */}
            <div className="vault-door-container absolute inset-0">
              <div
                className={`vault-door absolute inset-0 ${isUnlocked ? "open" : "closed"}`}
              >
                <VaultDoor
                  isOpen={isUnlocked}
                  isAnimating={isAnimating}
                  dialClass={dialClass}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Status badge */}
      <div
        className="relative z-10 mt-6 flex items-center gap-2 px-4 py-2 rounded-full"
        style={{
          background: "oklch(0.14 0.02 196 / 0.8)",
          border: `1px solid ${isUnlocked ? "oklch(0.65 0.08 192 / 0.5)" : "oklch(0.55 0.18 27 / 0.5)"}`,
          backdropFilter: "blur(8px)",
        }}
        data-ocid="vault.status_panel"
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{
            background: isUnlocked
              ? "oklch(0.65 0.08 192)"
              : "oklch(0.55 0.18 27)",
            boxShadow: isUnlocked
              ? "0 0 8px oklch(0.65 0.08 192)"
              : "0 0 8px oklch(0.55 0.18 27)",
          }}
        />
        <span
          className="font-body text-xs tracking-[0.2em] uppercase"
          style={{ color: isUnlocked ? "var(--teal)" : "oklch(0.55 0.18 27)" }}
          data-ocid={isUnlocked ? "vault.success_state" : "vault.error_state"}
        >
          {isUnlocked ? "VAULT UNLOCKED" : "VAULT SECURED"}
        </span>
      </div>

      {/* Hint */}
      {!isUnlocked && (
        <div
          className="hint-pulse relative z-10 mt-5 flex flex-col items-center gap-2"
          data-ocid="vault.hint_panel"
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--teal)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            role="img"
            aria-label="Headphones"
          >
            <title>Headphones</title>
            <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
          </svg>
          <p
            className="font-body text-xs tracking-[0.2em] uppercase text-center"
            style={{ color: "var(--muted-text)" }}
          >
            PLUG IN YOUR HEADPHONES
            <br />
            TO UNLOCK THE VAULT
          </p>
        </div>
      )}

      {/* Footer */}
      <footer className="fixed bottom-4 left-0 right-0 text-center z-10">
        <p
          className="font-body text-xs tracking-[0.15em]"
          style={{ color: "oklch(0.4 0.015 196)" }}
        >
          Listen closely. The vault hears all.
        </p>
        <p
          className="font-body text-xs mt-1"
          style={{ color: "oklch(0.35 0.015 196)" }}
        >
          © {new Date().getFullYear()}. Built with ♥ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:opacity-80"
            style={{ color: "oklch(0.45 0.03 196)" }}
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}

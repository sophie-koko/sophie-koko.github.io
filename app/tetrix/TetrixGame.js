'use client';
import { useRef, useEffect, useState, useCallback } from 'react';
import './tetrix.css';

// ── Constants ──────────────────────────────────────────────────
const CW         = 700, CH = 520;
const BH         = 54;          // block height
const FALL_SPEED = 75;          // px/sec vertical
const LATERAL_V  = 220;         // px/sec horizontal (arrow keys)
const CHAR_PX    = 9.8;         // px width per char at bold 16px monospace
const BLOCK_PAD  = 28;          // total horizontal padding inside block
const BUCKET_W   = 10;          // px per collision bucket
const N_BUCKETS  = Math.ceil(CW / BUCKET_W);
const FADE       = 'rgba(0,0,0,0.18)';
const TRAIL_LEN  = 6;
const CHAR_STEP  = 28;
const CHARS      = 'アカサタナハマヤラワガザダバパイキシチニヒミリ0123456789';

let _uid = 0;
function ri(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }

function mkProblem(level) {
  const ops = level <= 2 ? ['+', '-'] : level <= 4 ? ['+', '-', '×'] : ['+', '-', '×', '÷'];
  const op  = ops[ri(0, ops.length - 1)];
  let a, b;
  if (op === '+')      { a = ri(2, 10 + level * 2); b = ri(1, 10 + level); }
  else if (op === '-') { a = ri(6, 20 + level);     b = ri(1, a - 1); }
  else if (op === '×') { a = ri(2, 4 + Math.min(level, 5)); b = ri(2, 9); }
  else                 { b = ri(2, 9); a = b * ri(2, 9); }
  const ans  = op === '+' ? a + b : op === '-' ? a - b : op === '×' ? a * b : a / b;
  const text = `${a} ${op} ${b} = ?`;
  const bw   = Math.round(text.length * CHAR_PX + BLOCK_PAD);
  const x    = ri(0, Math.max(0, CW - bw));
  return { id: _uid++, x, y: -BH - ri(0, 60), w: bw, h: BH, ans, label: `${a} ${op} ${b}` };
}

function mkDrop(i) {
  const slots = TRAIL_LEN + 1;
  return {
    x:      i * 22,
    y:      ri(-CH, CH),
    speed:  Math.random() < 0.2 ? ri(20, 55) : Math.random() < 0.75 ? ri(80, 170) : ri(220, 380),
    chars:  Array.from({ length: slots }, () => CHARS[ri(0, CHARS.length - 1)]),
    timers: Array.from({ length: slots }, () => Math.random() * 0.67 + 0.33),
  };
}

function mkRain(w) {
  return Array.from({ length: Math.floor(w / 22) }, (_, i) => mkDrop(i));
}

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arc(x + w - r, y + r,     r, -Math.PI / 2, 0);
  ctx.lineTo(x + w,   y + h - r);
  ctx.arc(x + w - r, y + h - r, r, 0,            Math.PI / 2);
  ctx.lineTo(x + r,   y + h);
  ctx.arc(x + r,     y + h - r, r, Math.PI / 2,  Math.PI);
  ctx.lineTo(x,       y + r);
  ctx.arc(x + r,     y + r,     r, Math.PI,       3 * Math.PI / 2);
  ctx.closePath();
}

// ── Component ──────────────────────────────────────────────────
export default function TetrixGame() {
  const canvasRef = useRef(null);
  const gRef      = useRef(null);
  const rafRef    = useRef(null);
  const lastTRef  = useRef(null);
  const inputRef  = useRef(null);

  const [screen, setScreen] = useState('start');
  const [hud,    setHud]    = useState({ score: 0, level: 1 });
  const [input,  setInput]  = useState('');
  const [flash,  setFlash]  = useState(null);

  // ── arrow key listeners ────────────────────────────────────
  useEffect(() => {
    if (screen !== 'playing') return;
    function onDown(e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      if (gRef.current) gRef.current.keys[e.key === 'ArrowLeft' ? 'left' : 'right'] = true;
    }
    function onUp(e) {
      if (gRef.current) gRef.current.keys[e.key === 'ArrowLeft' ? 'left' : 'right'] = false;
    }
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup',   onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup',   onUp);
    };
  }, [screen]);

  const startGame = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CW, CH);

    const g = {
      problems:   [],
      settled:    [],
      colHeights: new Array(N_BUCKETS).fill(0),
      keys:       { left: false, right: false },
      score:      0, level: 1, gameOver: false,
      rain:       mkRain(CW),
      exploding:  [],
    };
    gRef.current = g;

    const first = mkProblem(1);
    first.y = -first.h;
    g.problems.push(first);

    lastTRef.current = null;
    setScreen('playing');
    setHud({ score: 0, level: 1 });
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 100);

    // ── collision helpers ──────────────────────────────────────

    function getFloor(x, w) {
      const sb = Math.floor(x / BUCKET_W);
      const eb = Math.min(Math.floor((x + w - 1) / BUCKET_W), N_BUCKETS - 1);
      let maxH = 0;
      for (let b = sb; b <= eb; b++) maxH = Math.max(maxH, g.colHeights[b]);
      return CH - maxH;
    }

    function spawn() {
      const target = Math.min(g.level, 5);
      let stagger  = 0;
      while (g.problems.length < target) {
        const p = mkProblem(g.level);
        p.y = -p.h - stagger * (p.h + ri(20, 50));
        g.problems.push(p);
        stagger++;
      }
    }

    function settle() {
      let changed = true;
      while (changed) {
        changed = false;
        for (let i = 0; i < g.problems.length; i++) {
          const p     = g.problems[i];
          const floor = getFloor(p.x, p.w);
          if (p.y + p.h >= floor) {
            const sy  = floor - p.h;
            const sb  = Math.floor(p.x / BUCKET_W);
            const eb  = Math.min(Math.floor((p.x + p.w - 1) / BUCKET_W), N_BUCKETS - 1);
            const hfb = CH - sy;
            for (let b = sb; b <= eb; b++) g.colHeights[b] = Math.max(g.colHeights[b], hfb);
            g.settled.push({ x: p.x, y: sy, w: p.w, h: p.h, label: p.label });
            g.problems.splice(i, 1);
            changed = true;
            break;
          }
        }
      }
    }

    // ── update ─────────────────────────────────────────────────
    function update(dt) {
      // rain + char switching
      for (const d of g.rain) {
        d.y += d.speed * dt;
        if (d.y > CH + 20) Object.assign(d, mkDrop(Math.round(d.x / 22)));
        for (let t = 0; t <= TRAIL_LEN; t++) {
          d.timers[t] -= dt;
          if (d.timers[t] <= 0) {
            d.chars[t]  = CHARS[ri(0, CHARS.length - 1)];
            d.timers[t] = Math.random() * 0.67 + 0.33;
          }
        }
      }

      // arrow key: move lowest (most urgent) problem sideways
      if (g.problems.length > 0) {
        const active = g.problems.reduce((a, b) => b.y > a.y ? b : a);
        if (g.keys.left)  active.x = Math.max(0,            active.x - LATERAL_V * dt);
        if (g.keys.right) active.x = Math.min(CW - active.w, active.x + LATERAL_V * dt);
      }

      // fall
      for (const p of g.problems) p.y += FALL_SPEED * dt;

      settle();

      // game over: any bucket stack fills the canvas
      if (Math.max(...g.colHeights) >= CH) { g.gameOver = true; return; }

      // level up every 120 pts
      const newLevel = Math.max(1, Math.floor(g.score / 120) + 1);
      if (newLevel > g.level) {
        g.level = newLevel;
        setHud(h => ({ ...h, level: newLevel }));
      }

      spawn();

      for (const e of g.exploding) e.t += dt;
      g.exploding = g.exploding.filter(e => e.t < e.dur);
    }

    // ── draw ───────────────────────────────────────────────────
    function draw() {
      ctx.fillStyle = FADE;
      ctx.fillRect(0, 0, CW, CH);

      // rain
      ctx.font = '15px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      for (const d of g.rain) {
        for (let t = 1; t <= TRAIL_LEN; t++) {
          const ty = d.y - t * CHAR_STEP;
          if (ty < -20 || ty > CH + 20) continue;
          const v = Math.floor(200 * (1 - t / (TRAIL_LEN + 1)));
          ctx.fillStyle = `rgb(0,${v},${Math.floor(v * 0.25)})`;
          ctx.fillText(d.chars[t], d.x, ty);
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillText(d.chars[0], d.x, d.y);
      }

      // settled blocks
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const s of g.settled) {
        const sg = ctx.createLinearGradient(s.x, s.y, s.x, s.y + s.h - 4);
        sg.addColorStop(0, 'rgba(0,50,15,0.28)');
        sg.addColorStop(1, 'rgba(0,15,5,0.12)');
        ctx.fillStyle = sg;
        ctx.fillRect(s.x, s.y, s.w, s.h - 4);
        ctx.strokeStyle = 'rgba(0,160,55,0.30)';
        ctx.lineWidth   = 0.5;
        ctx.strokeRect(s.x, s.y, s.w, s.h - 4);
        ctx.fillStyle = '#007722';
        ctx.font      = 'bold 13px monospace';
        ctx.fillText(s.label, s.x + s.w / 2, s.y + (s.h - 4) / 2);
      }

      // active = lowest falling problem (the one arrows control)
      const active = g.problems.length > 0
        ? g.problems.reduce((a, b) => b.y > a.y ? b : a)
        : null;

      // falling problems
      for (const p of g.problems) {
        if (p.y + p.h < 0) continue;
        const isActive = p === active;
        ctx.save();
        ctx.shadowColor = '#00ff65';
        ctx.shadowBlur  = 4;
        const pg = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h - 2);
        pg.addColorStop(0, 'rgba(0,70,20,0.30)');
        pg.addColorStop(1, 'rgba(0,20,5,0.14)');
        ctx.fillStyle   = pg;
        ctx.fillRect(p.x, p.y, p.w, p.h - 2);
        ctx.strokeStyle = isActive ? 'rgba(180,255,220,0.55)' : 'rgba(0,220,80,0.35)';
        ctx.lineWidth   = isActive ? 1 : 0.5;
        ctx.strokeRect(p.x, p.y, p.w, p.h - 2);
        ctx.restore();
        ctx.fillStyle    = '#ccffcc';
        ctx.font         = 'bold 16px monospace';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.label + ' = ?', p.x + p.w / 2, p.y + (p.h - 2) / 2);
      }

      // cursor arrow above active block
      if (active && active.y + active.h > 0) {
        ctx.fillStyle    = '#ccffff';
        ctx.font         = '12px monospace';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('▼', active.x + active.w / 2, Math.max(14, active.y - 4));
      }

      // explosions
      for (const e of g.exploding) {
        const prog  = e.t / e.dur;
        const alpha = 1 - prog;
        const r     = 55 * prog;
        ctx.beginPath();
        ctx.arc(e.x, e.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,255,100,${alpha * 0.18})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(0,255,100,${alpha})`;
        ctx.lineWidth   = 2;
        ctx.stroke();
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 + prog * Math.PI;
          ctx.beginPath();
          ctx.arc(
            e.x + Math.cos(angle) * r * 1.4,
            e.y + Math.sin(angle) * r * 1.4,
            3 * alpha, 0, Math.PI * 2
          );
          ctx.fillStyle = `rgba(0,255,100,${alpha})`;
          ctx.fill();
        }
      }
    }

    // ── loop ───────────────────────────────────────────────────
    function loop(t) {
      if (!lastTRef.current) lastTRef.current = t;
      const dt = Math.min((t - lastTRef.current) / 1000, 0.1);
      lastTRef.current = t;

      update(dt);
      draw();

      if (g.gameOver) {
        setScreen('over');
        setHud({ score: g.score, level: g.level });
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  function handleAnswer(e) {
    e.preventDefault();
    const val = parseInt(input.trim(), 10);
    setInput('');
    if (isNaN(val)) return;

    const g = gRef.current;
    if (!g || g.gameOver) return;

    const matches = g.problems
      .filter(p => p.ans === val)
      .sort((a, b) => b.y - a.y);

    if (matches.length > 0) {
      const p = matches[0];
      g.exploding.push({ x: p.x + p.w / 2, y: p.y + p.h / 2, t: 0, dur: 0.45 });
      g.problems = g.problems.filter(x => x.id !== p.id);
      g.score   += 10 * g.level;
      setHud(h => ({ ...h, score: g.score }));
      setFlash({ ok: true, text: `+${10 * g.level}` });
    } else {
      setFlash({ ok: false, text: '✗' });
    }
    setTimeout(() => setFlash(null), 700);
  }

  return (
    <div className="tetrix-wrap">
      <div className="tetrix-game-area">
        <canvas ref={canvasRef} width={CW} height={CH} className="tetrix-canvas" />

        {screen === 'start' && (
          <div className="tetrix-overlay">
            <div className="tetrix-title-big">TETRIX</div>
            <p className="tetrix-sub">
              Beat the Matrix — type the answer to destroy a falling math block!
            </p>
            <div className="tetrix-legend">
              Level 1–2 &nbsp;→&nbsp; + and −<br />
              Level 3–4 &nbsp;→&nbsp; + − ×<br />
              Level 5+ &nbsp;&nbsp;→&nbsp; + − × ÷<br />
              <span style={{ color: '#00ff65', marginTop: '6px', display: 'block' }}>
                ← → arrows steer the highlighted block
              </span>
            </div>
            <button className="tetrix-btn" onClick={startGame}>▶&nbsp;&nbsp;START</button>
          </div>
        )}

        {screen === 'over' && (
          <div className="tetrix-overlay">
            <div className="tetrix-title-big tetrix-over">GAME OVER</div>
            <p className="tetrix-sub">The Matrix won this round.</p>
            <p className="tetrix-score-display">Score: {hud.score}</p>
            <p className="tetrix-score-display">Level reached: {hud.level}</p>
            <button className="tetrix-btn" onClick={startGame}>↺&nbsp;&nbsp;TRY AGAIN</button>
          </div>
        )}

        {screen === 'playing' && (
          <div className="tetrix-hud">
            <span>Score: <strong>{hud.score}</strong></span>
            <span className="tetrix-hud-level">Lv {hud.level}</span>
          </div>
        )}
      </div>

      {screen === 'playing' && (
        <div className="tetrix-bottom">
          <div className="tetrix-flash-area">
            {flash && (
              <span className={`tetrix-flash ${flash.ok ? 'flash-ok' : 'flash-err'}`}>
                {flash.text}
              </span>
            )}
          </div>
          <form onSubmit={handleAnswer} className="tetrix-form">
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="type answer + Enter"
              className="tetrix-input"
              autoComplete="off"
            />
            <button type="submit" className="tetrix-submit-btn">✓</button>
          </form>
        </div>
      )}
    </div>
  );
}

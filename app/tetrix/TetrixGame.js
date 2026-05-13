'use client';
import { useRef, useEffect, useState, useCallback } from 'react';
import './tetrix.css';

// ── Constants ──────────────────────────────────────────────────
const CW = 700, CH = 520;
const LANES = 3;
const LX = [0.20, 0.50, 0.80]; // lane center x as fraction of CW
const BW = 160, BH = 54;       // block width / height
const FALL_SPEED = 75;          // px/sec
const FADE = 'rgba(0,0,0,0.04)';
const CHARS = 'アカサタナハマヤラワガザダバパイキシチニヒミリ0123456789';

let _uid = 0;
function ri(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }

function mkProblem(level) {
  const ops = level <= 2 ? ['+', '-'] : level <= 4 ? ['+', '-', '×'] : ['+', '-', '×', '÷'];
  const op = ops[ri(0, ops.length - 1)];
  let a, b;
  if (op === '+')      { a = ri(2, 10 + level * 2); b = ri(1, 10 + level); }
  else if (op === '-') { a = ri(6, 20 + level);     b = ri(1, a - 1); }
  else if (op === '×') { a = ri(2, 4 + Math.min(level, 5)); b = ri(2, 9); }
  else                 { b = ri(2, 9); a = b * ri(2, 9); }
  const ans = op === '+' ? a + b : op === '-' ? a - b : op === '×' ? a * b : a / b;
  return { id: _uid++, lane: ri(0, 2), y: -BH - ri(0, 60), ans, label: `${a} ${op} ${b}` };
}

function mkRain(w) {
  const n = Math.floor(w / 18);
  return Array.from({ length: n }, (_, i) => ({
    x: i * 18, y: ri(-CH, CH), speed: ri(80, 180),
  }));
}

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arc(x + w - r, y + r, r, -Math.PI / 2, 0);
  ctx.lineTo(x + w, y + h - r);
  ctx.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
  ctx.lineTo(x + r, y + h);
  ctx.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
  ctx.lineTo(x, y + r);
  ctx.arc(x + r, y + r, r, Math.PI, 3 * Math.PI / 2);
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

  const startGame = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CW, CH);

    const g = {
      problems: [],
      stacks:   [[], [], []],
      score:    0,
      level:    1,
      gameOver: false,
      rain:     mkRain(CW),
      exploding: [],
    };
    gRef.current = g;

    // initial single problem
    const first = mkProblem(1);
    first.y = -BH;
    g.problems.push(first);

    lastTRef.current = null;
    setScreen('playing');
    setHud({ score: 0, level: 1 });
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 100);

    // ── spawn: fill up to min(level, 5) falling problems ──────
    function spawn() {
      const target = Math.min(g.level, 5);
      let stagger  = 0;
      while (g.problems.length < target) {
        const p = mkProblem(g.level);
        // stagger new problems so they arrive at different times
        p.y = -BH - stagger * (BH + ri(20, 50));
        // prefer a lane not already occupied by a falling problem
        const used = new Set(g.problems.map(x => x.lane));
        if (used.size < LANES) {
          const free = [0, 1, 2].filter(l => !used.has(l));
          p.lane = free[ri(0, free.length - 1)];
        }
        g.problems.push(p);
        stagger++;
      }
    }

    // ── settle: snap any problem that hit its lane floor ──────
    function settle() {
      let changed = true;
      while (changed) {
        changed = false;
        for (let i = 0; i < g.problems.length; i++) {
          const p     = g.problems[i];
          const floor = CH - g.stacks[p.lane].length * BH;
          if (p.y + BH >= floor) {
            g.stacks[p.lane].push({ label: p.label });
            g.problems.splice(i, 1);
            changed = true;
            break;
          }
        }
      }
    }

    // ── update ─────────────────────────────────────────────────
    function update(dt) {
      // rain drift
      for (const d of g.rain) {
        d.y += d.speed * dt;
        if (d.y > CH + 20) d.y = ri(-200, -20);
      }

      // move problems
      for (const p of g.problems) p.y += FALL_SPEED * dt;

      settle();

      // game over: any lane stack fills the canvas height
      for (const stack of g.stacks) {
        if (stack.length * BH >= CH) { g.gameOver = true; return; }
      }

      // level up every 120 points
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
      // fade-trail: semi-transparent black creates the rain afterglow
      ctx.fillStyle = FADE;
      ctx.fillRect(0, 0, CW, CH);

      // Matrix rain heads
      ctx.font         = '14px monospace';
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'alphabetic';
      for (const d of g.rain) {
        ctx.fillStyle = '#00ff65';
        ctx.fillText(CHARS[ri(0, CHARS.length - 1)], d.x, d.y);
      }

      // settled blocks (dim, part of the matrix)
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      for (let lane = 0; lane < LANES; lane++) {
        const cx    = CW * LX[lane];
        const stack = g.stacks[lane];
        for (let i = 0; i < stack.length; i++) {
          const sy = CH - (i + 1) * BH + 2;
          ctx.fillStyle = 'rgba(0,20,0,0.92)';
          rrect(ctx, cx - BW / 2, sy, BW, BH - 4, 8);
          ctx.fill();
          ctx.strokeStyle = '#003300';
          ctx.lineWidth   = 1.5;
          rrect(ctx, cx - BW / 2, sy, BW, BH - 4, 8);
          ctx.stroke();
          ctx.fillStyle = '#007722';
          ctx.font      = 'bold 13px monospace';
          ctx.fillText(stack[i].label, cx, sy + (BH - 4) / 2);
        }
      }

      // falling problems (bright, glowing)
      for (const p of g.problems) {
        if (p.y + BH < 0) continue;
        const cx = CW * LX[p.lane];
        ctx.save();
        ctx.shadowColor = '#00ff65';
        ctx.shadowBlur  = 18;
        ctx.fillStyle   = 'rgba(0,35,0,0.94)';
        rrect(ctx, cx - BW / 2, p.y, BW, BH - 2, 10);
        ctx.fill();
        ctx.strokeStyle = '#00ff65';
        ctx.lineWidth   = 2;
        rrect(ctx, cx - BW / 2, p.y, BW, BH - 2, 10);
        ctx.stroke();
        ctx.restore();
        ctx.fillStyle    = '#ccffcc';
        ctx.font         = 'bold 16px monospace';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.label + ' = ?', cx, p.y + (BH - 2) / 2);
      }

      // explosion rings + sparkles
      for (const e of g.exploding) {
        const prog   = e.t / e.dur;
        const alpha  = 1 - prog;
        const radius = 55 * prog;
        ctx.beginPath();
        ctx.arc(e.x, e.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,255,100,${alpha * 0.18})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(0,255,100,${alpha})`;
        ctx.lineWidth   = 2;
        ctx.stroke();
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 + prog * Math.PI;
          ctx.beginPath();
          ctx.arc(
            e.x + Math.cos(angle) * radius * 1.4,
            e.y + Math.sin(angle) * radius * 1.4,
            3 * alpha, 0, Math.PI * 2
          );
          ctx.fillStyle = `rgba(0,255,100,${alpha})`;
          ctx.fill();
        }
      }
    }

    // ── main loop ──────────────────────────────────────────────
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

    // find matching problems; eliminate the lowest one first (most urgent)
    const matches = g.problems
      .filter(p => p.ans === val)
      .sort((a, b) => b.y - a.y);

    if (matches.length > 0) {
      const p  = matches[0];
      const cx = CW * LX[p.lane];
      g.exploding.push({ x: cx, y: p.y + BH / 2, t: 0, dur: 0.45 });
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
              Level 5+ &nbsp;&nbsp;→&nbsp; + − × ÷
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

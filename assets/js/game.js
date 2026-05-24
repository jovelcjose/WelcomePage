/* ============================================================
   GAME.JS — Pi Defender
   Space Invaders-style game for joveljose.com/index.html
   ============================================================ */

(function () {
  'use strict';

  /* ─── Constants ─── */
  const CW = 600, CH = 500;
  const PW = 50,  PH = 30;
  const PLAYER_SPD  = 5.5;   /* px per logical frame */
  const BULLET_SPD  = 12;
  const BW = 2, BH = 14;
  const SHOOT_COOL  = 280;   /* ms */

  const TYPES = {
    lambda: { label: 'λ timeout', w: 42, h: 25, pts: 10,  fill: '#7a3800', stroke: '#ff8c00' },
    s3:     { label: 'S3 ☁️',       w: 42, h: 25, pts: 15,  fill: '#7a6000', stroke: '#ffd700' },
    dynamo: { label: 'DynamoDB ⚡', w: 62, h: 25, pts: 25,  fill: '#6b0000', stroke: '#ff3333' },
  };
  const TYPE_KEYS = Object.keys(TYPES);

  /* ─── State ─── */
  let canvas, ctx;
  let phase = 'idle'; // idle | crawl | instructions | playing | gameover
  let raf;
  let lastTs = 0;

  let px, py;
  let lastShot = 0;
  let bullets    = [];
  let enemies    = [];
  let explosions = [];
  let score      = 0;
  let gameTime   = 0;
  let lastWave   = 0;
  let baseSpd    = 55;  /* enemy px/s */
  let waveSize   = 3;

  const keys = {};

  /* ─── Inject CSS (called once) ─── */
  function injectCSS() {
    if (document.getElementById('pi-game-css')) return;
    const s = document.createElement('style');
    s.id = 'pi-game-css';
    s.textContent = `
      #pi-defender-overlay {
        display: none;
        position: fixed;
        inset: 0;
        background: #0a0f1e;
        z-index: 100000;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }

      .game-close-btn {
        position: absolute;
        top: 14px;
        right: 18px;
        background: none;
        border: none;
        color: #8899bb;
        font-size: 30px;
        line-height: 1;
        cursor: pointer !important;
        z-index: 100001;
        transition: color 0.2s;
        padding: 4px 8px;
      }
      .game-close-btn:hover { color: #00d4ff; }

      /* ── Crawl ── */
      #crawl-screen {
        display: none;
        position: absolute;
        inset: 0;
        background: #000;
        overflow: hidden;
        flex-direction: column;
        align-items: center;
      }
      .crawl-fade-top {
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 28%;
        background: linear-gradient(to bottom, #000 40%, transparent);
        z-index: 2;
        pointer-events: none;
      }
      .crawl-viewport {
        width: 100%;
        max-width: 580px;
        flex: 1;
        perspective: 280px;
        overflow: hidden;
        position: relative;
        display: flex;
        align-items: flex-end;
      }
      #crawl-inner {
        position: relative;
        width: 100%;
        padding: 0 36px 60px;
        color: #ffe81f;
        font-family: 'IBM Plex Sans', sans-serif;
        font-size: 1.1rem;
        line-height: 2;
        text-align: center;
        transform: rotateX(22deg);
        transform-origin: 50% 100%;
        animation: sw-crawl 38s linear forwards;
      }
      #crawl-inner p { margin: 0 0 0.6em; }
      @keyframes sw-crawl {
        0%   { transform: rotateX(22deg) translateY(100%); }
        100% { transform: rotateX(22deg) translateY(-320%); }
      }
      .crawl-skip {
        position: absolute;
        bottom: 20px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.72rem;
        color: rgba(255,255,255,0.28);
        letter-spacing: 0.12em;
        z-index: 3;
        animation: blink-hint 1.6s ease-in-out infinite;
      }
      @keyframes blink-hint {
        0%, 100% { opacity: 0.28; }
        50%       { opacity: 0.65; }
      }

      /* ── Instructions ── */
      #instructions-screen {
        display: none;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 24px;
        font-family: 'JetBrains Mono', monospace;
        color: #00d4ff;
        text-align: center;
        padding: 24px;
      }
      #instructions-screen .inst-line  { font-size: 0.95rem; letter-spacing: 0.05em; }
      #instructions-screen .press-start {
        font-size: 1.15rem;
        animation: blink-hint 1s ease-in-out infinite;
      }

      /* ── Canvas ── */
      #game-canvas-wrap {
        display: none;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }
      #game-canvas {
        border: 1px solid rgba(0,212,255,0.18);
        display: block;
        max-width: min(600px, 96vw);
        height: auto;
      }
      #game-score-bar {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.75rem;
        color: rgba(0,212,255,0.5);
        letter-spacing: 0.08em;
      }
    `;
    document.head.appendChild(s);
  }

  /* ─── Open / Close ─── */
  window.openGame = function () {
    const ov = document.getElementById('pi-defender-overlay');
    if (!ov) return;
    ov.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    showCrawl();
  };

  window.closeGame = function () {
    const ov = document.getElementById('pi-defender-overlay');
    if (!ov) return;
    ov.style.display = 'none';
    document.body.style.overflow = '';
    resetAll();
  };

  /* ─── Crawl ─── */
  function showCrawl() {
    phase = 'crawl';
    el('crawl-screen').style.display        = 'flex';
    el('instructions-screen').style.display = 'none';
    el('game-canvas-wrap').style.display    = 'none';

    /* Restart CSS animation */
    const inner = el('crawl-inner');
    if (inner) {
      inner.style.animation = 'none';
      void inner.offsetHeight;
      inner.style.animation = '';
    }

    clearTimeout(window._gCrawlTimer);
    window._gCrawlTimer = setTimeout(showInstructions, 38500);
  }

  /* ─── Instructions ─── */
  function showInstructions() {
    clearTimeout(window._gCrawlTimer);
    phase = 'instructions';
    el('crawl-screen').style.display        = 'none';
    el('instructions-screen').style.display = 'flex';
    el('game-canvas-wrap').style.display    = 'none';
  }

  /* ─── Start Game ─── */
  function startGame() {
    phase = 'playing';
    el('instructions-screen').style.display = 'none';
    el('game-canvas-wrap').style.display    = 'flex';

    canvas = el('game-canvas');
    ctx    = canvas.getContext('2d');

    px = CW / 2; py = CH - 42;
    bullets = []; enemies = []; explosions = [];
    score = 0; gameTime = 0; lastTs = 0;
    lastWave = 0; lastShot = 0;
    baseSpd = 55; waveSize = 3;

    spawnWave();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  /* ─── Game Loop ─── */
  function loop(ts) {
    if (phase !== 'playing') return;
    const dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.05) : 0.016;
    lastTs = ts;
    gameTime += dt;
    update(dt, ts);
    render();
    raf = requestAnimationFrame(loop);
  }

  /* ─── Update ─── */
  function update(dt, ts) {
    /* Player movement */
    if (keys['ArrowLeft'] || keys['KeyA']) px -= PLAYER_SPD * dt * 60;
    if (keys['ArrowRight'] || keys['KeyD']) px += PLAYER_SPD * dt * 60;
    px = Math.max(PW / 2, Math.min(CW - PW / 2, px));

    /* Shoot (hold space) */
    if (keys['Space'] && ts - lastShot > SHOOT_COOL) {
      bullets.push({ x: px, y: py - PH / 2 });
      lastShot = ts;
    }

    /* Move bullets */
    bullets = bullets.filter(b => { b.y -= BULLET_SPD * dt * 60; return b.y > -BH; });

    /* Scale speed every 10 s */
    baseSpd = 55 + Math.floor(gameTime / 10) * 16;

    /* New wave every 8 s */
    if (gameTime - lastWave >= 8) {
      lastWave = gameTime;
      waveSize = Math.min(waveSize + 1, 9);
      spawnWave();
    }

    /* Move enemies */
    for (const e of enemies) e.y += e.spd * dt;

    /* Collisions */
    collide();

    /* Explosions age */
    explosions = explosions.filter(x => { x.age += dt; return x.age < 0.35; });

    /* Game over if any enemy reaches bottom */
    if (enemies.some(e => e.y + e.h / 2 >= CH)) endGame();
  }

  function spawnWave() {
    for (let i = 0; i < waveSize; i++) {
      const tk = TYPE_KEYS[Math.floor(Math.random() * TYPE_KEYS.length)];
      const t  = TYPES[tk];
      enemies.push({
        x: t.w / 2 + Math.random() * (CW - t.w),
        y: -28 - i * 55,
        w: t.w, h: t.h, tk,
        spd: baseSpd * (0.65 + Math.random() * 0.7),
      });
    }
  }

  function collide() {
    const dead = new Set();
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
      const b = bullets[bi];
      for (let ei = enemies.length - 1; ei >= 0; ei--) {
        if (dead.has(ei)) continue;
        const e = enemies[ei];
        if (b.x > e.x - e.w / 2 && b.x < e.x + e.w / 2 &&
            b.y > e.y - e.h / 2 && b.y < e.y + e.h / 2) {
          score += TYPES[e.tk].pts;
          explosions.push({ x: e.x, y: e.y, age: 0, color: TYPES[e.tk].stroke });
          dead.add(ei);
          bullets.splice(bi, 1);
          break;
        }
      }
    }
    enemies = enemies.filter((_, i) => !dead.has(i));
  }

  function endGame() {
    phase = 'gameover';
    cancelAnimationFrame(raf);
    render();
    drawGameOver();
  }

  /* ─── Render ─── */
  function render() {
    if (!ctx) return;
    ctx.clearRect(0, 0, CW, CH);
    drawBg();
    drawEnemies();
    drawBullets();
    drawExplosions();
    drawPlayer();
    drawHUD();
  }

  function drawBg() {
    ctx.fillStyle = '#0a0f1e';
    ctx.fillRect(0, 0, CW, CH);
    ctx.strokeStyle = 'rgba(0,212,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= CW; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CH); ctx.stroke(); }
    for (let y = 0; y <= CH; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CW, y); ctx.stroke(); }
  }

  function drawPlayer() {
    const lx = px - PW / 2, ty = py - PH / 2;
    /* Board */
    ctx.fillStyle = '#0c2b0c';
    ctx.fillRect(lx, ty, PW, PH);
    ctx.strokeStyle = '#44ff44';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(lx, ty, PW, PH);
    /* Circuit corner pads */
    ctx.fillStyle = '#44ff44';
    [[lx + 6, ty + 6],[lx + PW - 6, ty + 6],[lx + 6, ty + PH - 6],[lx + PW - 6, ty + PH - 6]].forEach(([cx, cy]) => {
      ctx.beginPath(); ctx.arc(cx, cy, 2.2, 0, Math.PI * 2); ctx.fill();
    });
    /* Label */
    ctx.font = 'bold 11px JetBrains Mono, monospace';
    ctx.fillStyle = '#44ff44';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Pi', px, py);
    /* Cannon tip */
    ctx.fillStyle = '#00d4ff';
    ctx.fillRect(px - 1, ty - 6, 2, 6);
  }

  function drawBullets() {
    ctx.fillStyle = '#00d4ff';
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 8;
    bullets.forEach(b => ctx.fillRect(b.x - BW / 2, b.y, BW, BH));
    ctx.shadowBlur = 0;
  }

  function drawEnemies() {
    enemies.forEach(e => {
      const t = TYPES[e.tk];
      ctx.fillStyle = t.fill;
      ctx.strokeStyle = t.stroke;
      ctx.lineWidth = 1.5;
      ctx.fillRect(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h);
      ctx.strokeRect(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = '8px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.label, e.x, e.y);
    });
  }

  function drawExplosions() {
    explosions.forEach(x => {
      const p = x.age / 0.35;
      const r = 6 + p * 30;
      const a = 1 - p;
      ctx.beginPath();
      ctx.arc(x.x, x.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0,212,255,${a})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x.x, x.y, r * 0.45, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${a * 0.5})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }

  function drawHUD() {
    ctx.font = '13px JetBrains Mono, monospace';
    ctx.fillStyle = '#00d4ff';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('SCORE ' + score, CW - 10, 10);
  }

  function drawGameOver() {
    if (!ctx) return;
    ctx.fillStyle = 'rgba(0,0,0,0.78)';
    ctx.fillRect(0, 0, CW, CH);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    ctx.font = 'bold 30px JetBrains Mono, monospace';
    ctx.fillStyle = '#ff2222';
    ctx.fillText('SYSTEM FAILURE', CW / 2, CH / 2 - 54);

    ctx.font = '18px JetBrains Mono, monospace';
    ctx.fillStyle = '#00d4ff';
    ctx.fillText('Score: ' + score, CW / 2, CH / 2 - 6);

    ctx.font = '13px JetBrains Mono, monospace';
    ctx.fillStyle = '#8899bb';
    ctx.fillText('The Pi fought bravely.', CW / 2, CH / 2 + 28);

    ctx.font = '11px JetBrains Mono, monospace';
    ctx.fillStyle = 'rgba(0,212,255,0.55)';
    ctx.fillText('[ Press R to restart ]', CW / 2, CH / 2 + 64);
  }

  /* ─── Reset ─── */
  function resetAll() {
    phase = 'idle';
    cancelAnimationFrame(raf);
    clearTimeout(window._gCrawlTimer);
    bullets = []; enemies = []; explosions = [];
    ['crawl-screen','instructions-screen','game-canvas-wrap'].forEach(id => {
      const e = el(id); if (e) e.style.display = 'none';
    });
  }

  /* ─── Input ─── */
  document.addEventListener('keydown', (e) => {
    keys[e.code] = true;

    const ov = el('pi-defender-overlay');
    const open = ov && ov.style.display !== 'none';

    if (e.code === 'Escape' && open) { closeGame(); return; }
    if (!open) return;

    if (e.code === 'Space' && phase === 'crawl')        { e.preventDefault(); showInstructions(); return; }
    if (e.code === 'Space' && phase === 'instructions') { e.preventDefault(); startGame(); return; }
    if (e.code === 'KeyR'  && phase === 'gameover')     { startGame(); return; }

    if (phase === 'playing' && ['Space','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
  });

  document.addEventListener('keyup', (e) => { keys[e.code] = false; });

  /* Click on canvas to shoot */
  document.addEventListener('click', (e) => {
    if (phase !== 'playing') return;
    const c = el('game-canvas');
    if (!c) return;
    const r = c.getBoundingClientRect();
    if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
      const now = performance.now();
      if (now - lastShot > SHOOT_COOL) { bullets.push({ x: px, y: py - PH / 2 }); lastShot = now; }
    }
  });

  /* ─── Helpers ─── */
  function el(id) { return document.getElementById(id); }

  /* ─── Boot ─── */
  injectCSS();

})();

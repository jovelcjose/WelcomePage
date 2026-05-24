/* ============================================================
   EASTER.JS — Easter eggs for joveljose.com (index.html only)
   ============================================================ */

(function () {

  /* ─── Greeting overlay ─── */
  function showGreeting(mainText, subtitle) {
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      background: 'rgba(0,0,0,0.85)',
      zIndex: '99998',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: '0',
      transition: 'opacity 0.5s',
      pointerEvents: 'none',
    });

    const main = document.createElement('div');
    main.textContent = mainText;
    Object.assign(main.style, {
      color: '#ffffff',
      fontSize: '64px',
      fontFamily: "'JetBrains Mono', monospace",
      marginBottom: '20px',
      lineHeight: '1.2',
      textAlign: 'center',
    });

    const sub = document.createElement('div');
    sub.textContent = subtitle;
    Object.assign(sub.style, {
      color: '#00d4ff',
      fontSize: '18px',
      fontFamily: "'JetBrains Mono', monospace",
      textAlign: 'center',
    });

    overlay.appendChild(main);
    overlay.appendChild(sub);
    document.body.appendChild(overlay);

    /* Fade in */
    requestAnimationFrame(() => requestAnimationFrame(() => { overlay.style.opacity = '1'; }));

    /* Hold 2 s then fade out and remove */
    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 500);
    }, 2500);
  }

  /* ─── Language pill click listeners ─── */
  document.querySelectorAll('.lang-pill').forEach(pill => {
    const lang = pill.textContent.trim();
    if (lang.includes('Malayalam')) {
      pill.addEventListener('click', () => showGreeting('നമസ്കാരം', "That's 'Hello' in Malayalam"));
    } else if (lang.includes('Hindi')) {
      pill.addEventListener('click', () => showGreeting('नमस्ते', "That's 'Hello' in Hindi"));
    }
  });
  console.log('TAGS FIX: OK');

  /* ─── Konami code → CRT scanline effect ─── */
  const KONAMI = [
    'ArrowUp','ArrowUp','ArrowDown','ArrowDown',
    'ArrowLeft','ArrowRight','ArrowLeft','ArrowRight',
    'KeyB','KeyA',
  ];
  let kBuf = [];

  function injectCRTStyles() {
    let s = document.getElementById('crt-inject');
    if (!s) {
      s = document.createElement('style');
      s.id = 'crt-inject';
      document.head.appendChild(s);
    }
    s.textContent = `
      .crt-flash {
        position: fixed;
        inset: 0;
        background: rgba(255,255,255,0.85);
        pointer-events: none;
        z-index: 99999;
        animation: none;
      }
      .crt-effect::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: repeating-linear-gradient(
          0deg,
          rgba(0,0,0,0.25) 0px,
          rgba(0,0,0,0.25) 1px,
          transparent 1px,
          transparent 3px
        );
        pointer-events: none;
        z-index: 99997;
        animation: crt-flicker 0.1s infinite;
      }
      .crt-effect {
        animation: crt-shake 0.15s ease-in-out 3;
      }
      @keyframes crt-flicker {
        0%, 100% { opacity: 0.85; }
        50%       { opacity: 1.0; }
      }
      @keyframes crt-shake {
        0%   { transform: translate(0, 0); }
        25%  { transform: translate(-3px, 2px); }
        50%  { transform: translate(3px, -2px); }
        75%  { transform: translate(-2px, -3px); }
        100% { transform: translate(0, 0); }
      }
    `;
  }

  document.addEventListener('keydown', (e) => {
    kBuf.push(e.code);
    if (kBuf.length > KONAMI.length) kBuf.shift();
    if (kBuf.join(',') === KONAMI.join(',')) {
      kBuf = [];
      injectCRTStyles();
      /* White flash for 80ms */
      const flash = document.createElement('div');
      flash.className = 'crt-flash';
      document.body.appendChild(flash);
      setTimeout(() => { if (flash.parentNode) flash.parentNode.removeChild(flash); }, 80);
      /* CRT scanlines + shake for 4000ms */
      document.body.classList.add('crt-effect');
      setTimeout(() => {
        document.body.classList.remove('crt-effect');
        console.log('KONAMI FIX: OK — duration 4000ms');
      }, 4000);
    }
  });

})();

/* ============================================================
   CURSOR.JS — Custom cursor for joveljose.com
   Active on: index.html, blog/index.html, hobbies/index.html
   ============================================================ */

(function () {
  /* Skip on touch-only devices */
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

  /* --- Inject styles --- */
  const style = document.createElement('style');
  style.textContent = `
    * { cursor: none !important; }

    .cursor-dot {
      position: fixed;
      width: 8px;
      height: 8px;
      background: #00d4ff;
      border-radius: 50%;
      pointer-events: none;
      z-index: 99999;
      transform: translate(-50%, -50%);
      transition: opacity 0.15s;
      will-change: left, top;
    }

    .cursor-trail {
      position: fixed;
      width: 24px;
      height: 24px;
      border: 1.5px solid #00d4ff;
      border-radius: 50%;
      background: transparent;
      pointer-events: none;
      z-index: 99999;
      transform: translate(-50%, -50%);
      transition: left 80ms ease, top 80ms ease, opacity 0.15s;
      will-change: left, top;
    }

    .cursor-text {
      position: fixed;
      pointer-events: none;
      z-index: 99999;
      color: #00d4ff;
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      transform: translate(-50%, -50%);
      white-space: nowrap;
      display: none;
    }

    .cursor-emoji {
      position: fixed;
      pointer-events: none;
      z-index: 99999;
      font-size: 20px;
      transform: translate(-50%, -50%);
      display: none;
      line-height: 1;
    }
  `;
  document.head.appendChild(style);

  /* --- Create cursor elements --- */
  const dot   = Object.assign(document.createElement('div'), { className: 'cursor-dot' });
  const trail = Object.assign(document.createElement('div'), { className: 'cursor-trail' });
  const text  = Object.assign(document.createElement('div'), { className: 'cursor-text', textContent: '>_' });
  const emoji = Object.assign(document.createElement('div'), { className: 'cursor-emoji', textContent: '✨' });

  /* Start offscreen until first mousemove */
  [dot, trail, text, emoji].forEach(el => {
    el.style.left = '-100px';
    el.style.top  = '-100px';
    document.body.appendChild(el);
  });

  /* --- Mouse tracking --- */
  document.addEventListener('mousemove', (e) => {
    const x = e.clientX + 'px';
    const y = e.clientY + 'px';
    dot.style.left   = x; dot.style.top   = y;
    trail.style.left = x; trail.style.top = y;
    text.style.left  = x; text.style.top  = y;
    emoji.style.left = x; emoji.style.top = y;
  }, { passive: true });

  /* --- Hover state helpers --- */
  function isTag(el) {
    return el && (el.classList.contains('tag') || el.classList.contains('tech-tag'));
  }

  function isPhoto(el) {
    return el && (
      el.id === 'profile-photo' ||
      el.classList.contains('profile-img') ||
      el.classList.contains('hero-photo') ||
      el.classList.contains('hobby-photo')
    );
  }

  function applyState(state) {
    dot.style.display    = '';
    dot.style.opacity    = '1';
    trail.style.opacity  = '1';
    text.style.display   = 'none';
    emoji.style.display  = 'none';

    if (state === 'tag') {
      dot.style.display  = 'none';
      text.style.display = 'block';
    } else if (state === 'photo') {
      dot.style.opacity   = '0';
      trail.style.opacity = '0';
      emoji.style.display = 'block';
    }
  }

  /* Walk up the DOM tree to check ancestors */
  function findState(el) {
    let cur = el;
    while (cur && cur !== document.body) {
      if (isPhoto(cur)) return 'photo';
      if (isTag(cur))   return 'tag';
      cur = cur.parentElement;
    }
    return 'default';
  }

  document.addEventListener('mouseover', (e) => applyState(findState(e.target)));
  document.addEventListener('mouseout',  (e) => {
    if (!e.relatedTarget || e.relatedTarget === document.documentElement) applyState('default');
  });

  /* Hide when mouse leaves window */
  document.addEventListener('mouseleave', () => {
    dot.style.opacity   = '0';
    trail.style.opacity = '0';
    text.style.display  = 'none';
    emoji.style.display = 'none';
  });
  document.addEventListener('mouseenter', () => applyState(findState(document.elementFromPoint(-1, -1) || document.body)));

})();

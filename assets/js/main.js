/* ============================================================
   MAIN.JS — joveljose.com
   ============================================================ */

/* ---------- Nav: transparent → frosted on scroll ---------- */
(function () {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ---------- Hamburger menu ---------- */
(function () {
  const btn  = document.getElementById('hamburger');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const open = btn.classList.toggle('open');
    menu.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  menu.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
      btn.classList.remove('open');
      menu.classList.remove('open');
      document.body.style.overflow = '';
    })
  );
})();

/* ---------- Dot-grid parallax canvas ---------- */
(function () {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const COLS = 28;
  const DOT  = 1.4;
  const COLOR = 'rgba(0, 212, 255, 0.55)';

  let W, H, spacing, dots = [];
  let mouseX = 0, mouseY = 0;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    spacing = Math.ceil(W / COLS);
    buildDots();
  }

  function buildDots() {
    dots = [];
    const rows = Math.ceil(H / spacing) + 1;
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= COLS; c++) {
        dots.push({
          x0: c * spacing,
          y0: r * spacing,
          ox: (Math.random() - 0.5) * 20,
          oy: (Math.random() - 0.5) * 20,
          speed: 0.4 + Math.random() * 0.6,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }
  }

  let raf, t = 0;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = COLOR;
    const time = t * 0.0006;
    for (const d of dots) {
      const wave = Math.sin(time * d.speed + d.phase);
      const px = mouseX - (W / 2);
      const py = mouseY - (H / 2);
      const fx = d.x0 + d.ox * wave + px * 0.012;
      const fy = d.y0 + d.oy * wave + py * 0.012;
      ctx.beginPath();
      ctx.arc(fx, fy, DOT, 0, Math.PI * 2);
      ctx.fill();
    }
    t++;
    raf = requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });

  resize();
  draw();
})();

/* ---------- GSAP: hero text stagger + fade-ins ---------- */
(function () {
  if (typeof gsap === 'undefined') return;

  const nameEl    = document.querySelector('.hero-name');
  const roleEl    = document.querySelector('.hero-role');
  const tagEl     = document.querySelector('.hero-tagline');
  const ctaEl     = document.querySelector('.hero-ctas');

  if (!nameEl) return;

  /* Split .hero-name text into .char spans */
  const text = nameEl.textContent.trim();
  nameEl.innerHTML = text.split('').map(ch =>
    ch === ' '
      ? '<span class="char">&nbsp;</span>'
      : `<span class="char">${ch}</span>`
  ).join('');

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl.from('.hero-name .char', {
      opacity: 0,
      y: 40,
      stagger: 0.04,
      duration: 0.7,
    })
    .to(roleEl, { opacity: 1, y: 0, duration: 0.6 }, '-=0.2')
    .to(tagEl,  { opacity: 1, y: 0, duration: 0.6 }, '-=0.3')
    .to(ctaEl,  { opacity: 1, y: 0, duration: 0.6 }, '-=0.3');
})();

/* ---------- Intersection Observer: generic .reveal ---------- */
(function () {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  els.forEach(el => io.observe(el));
})();

/* ---------- Timeline: line draw + entry reveals ---------- */
(function () {
  const line    = document.querySelector('.timeline-line');
  const entries = document.querySelectorAll('.timeline-entry');
  if (!line || !entries.length) return;

  const lineObs = new IntersectionObserver((ents) => {
    ents.forEach(e => {
      if (e.isIntersecting) { line.classList.add('drawn'); lineObs.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  lineObs.observe(line.parentElement);

  const entryObs = new IntersectionObserver((ents) => {
    ents.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        entryObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  entries.forEach(en => entryObs.observe(en));
})();

/* ---------- Timeline: expand / collapse bullets ---------- */
(function () {
  document.querySelectorAll('.entry-header').forEach(header => {
    header.addEventListener('click', () => {
      const bullets = header.nextElementSibling;
      const roleEl  = header.querySelector('.entry-role');
      const label   = header.querySelector('.expand-label');
      if (!bullets) return;
      const isOpen = bullets.classList.toggle('open');
      if (roleEl) roleEl.classList.toggle('open', isOpen);
      if (label) {
        const lang = localStorage.getItem('lang') || 'en';
        if (isOpen) {
          label.setAttribute('data-en', 'Hide details');
          label.setAttribute('data-de', 'Details ausblenden');
          label.innerHTML = lang === 'de' ? 'Details ausblenden' : 'Hide details';
        } else {
          label.setAttribute('data-en', 'Show details');
          label.setAttribute('data-de', 'Details anzeigen');
          label.innerHTML = lang === 'de' ? 'Details anzeigen' : 'Show details';
        }
      }
    });
  });
})();

/* ---------- Email: construct from data attrs ---------- */
(function () {
  document.querySelectorAll('[data-email-user][data-email-domain]').forEach(el => {
    const user   = el.dataset.emailUser;
    const domain = el.dataset.emailDomain;
    const addr   = user + '@' + domain;
    if (el.tagName === 'A') {
      el.href = 'mailto:' + addr;
      el.textContent = addr;
    } else {
      el.textContent = addr;
    }
  });
})();

/* ---------- Smooth scroll for internal anchor links ---------- */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

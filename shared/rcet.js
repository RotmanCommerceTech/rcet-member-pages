/* RCET shared components — served at /shared/rcet.js
 *
 *   <rcet-header team="Marketing"></rcet-header>   sticky site header
 *   <rcet-footer team="Marketing"></rcet-footer>   site footer
 *
 * Both render plain HTML into the page (no shadow DOM), styled by /shared/rcet.css,
 * so a team's own CSS can restyle them. Admins edit this file; team folders can't.
 */
(() => {
  document.documentElement.classList.add('rcet-js');
  const SITE = 'https://www.rotmancommercetech.com/';
  const EMAIL = 'rotmancommercetech@gmail.com';
  const ADDRESS = '105 St. George St, Toronto, ON M5S 3E6';
  const SOCIAL = [
    ['Instagram', 'https://www.instagram.com/rotman.tech/'],
    /* ['LinkedIn', 'https://www.linkedin.com/company/...'], */
  ];

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const wordmark = () => '<span class="rcet-brand__text">Rotman Commerce<b>Emerging Technologies</b></span>';

  class RcetHeader extends HTMLElement {
    connectedCallback() {
      const team = this.getAttribute('team');
      this.innerHTML = `
<a class="rcet-skip" href="#main">Skip to content</a>
<header class="rcet-header">
  <div class="rcet-container rcet-header__inner">
    <a class="rcet-brand" href="/"><img class="rcet-brand__logo" src="/shared/assets/brand/logo-256.png" alt="" width="36" height="36">${wordmark()}</a>
    <nav class="rcet-header__nav" aria-label="Site">
      <a href="/">Home</a>
      <a href="/about/">About</a>
      <a href="/events/">Events</a>
      <a href="/teams/">Teams</a>
      ${team ? `<span class="rcet-header__current">${esc(team)}</span>` : ''}
    </nav>
  </div>
</header>`;
      // Mark the current section so it can be styled.
      const here = location.pathname.replace(/index\.html$/, '');
      for (const a of this.querySelectorAll('.rcet-header__nav a')) {
        const to = new URL(a.getAttribute('href'), location.href).pathname;
        const current = to === '/' || to.endsWith('/rcet-member-pages/') ? here === to : here.startsWith(to);
        if (current) a.setAttribute('aria-current', 'page');
      }
    }
  }

  class RcetFooter extends HTMLElement {
    connectedCallback() {
      const team = this.getAttribute('team');
      const links = SOCIAL.map(([name, url]) => `<a href="${url}" rel="noopener">${esc(name)}</a>`).join('');
      this.innerHTML = `
<footer class="rcet-footer">
  <div class="rcet-container rcet-footer__inner">
    <div>
      ${wordmark()}
      <p>${ADDRESS}<br><a href="mailto:${EMAIL}">${EMAIL}</a></p>
    </div>
    <nav aria-label="RCET links">${links}<a href="mailto:${EMAIL}">Email</a><a href="/about/">About</a><a href="/events/">Events</a><a href="/teams/">Teams</a></nav>
    <p class="rcet-footer__note">${team ? `This page was written by the ${esc(team)} team. ` : ''}Team and member pages are written by the people named on them. Views are their own.</p>
  </div>
</footer>`;
    }
  }

  customElements.define('rcet-header', RcetHeader);
  customElements.define('rcet-footer', RcetFooter);

  // Reveal on scroll: elements with data-reveal get .in when they enter the viewport.
  const reveal = () => {
    const els = document.querySelectorAll('[data-reveal]');
    if (!els.length) return;
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) { els.forEach((e) => e.classList.add('in')); return; }
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    }, { threshold: .15, rootMargin: '0px 0px -5% 0px' });
    els.forEach((e) => io.observe(e));
  };

  // Constellation: a slow network of dots and lines behind a hero — <section class="rcet-hero rcet-hero--art" data-constellation>.
  // No library, ~60 points, pauses when hidden or off-screen, skipped under prefers-reduced-motion.
  const constellation = (host) => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = document.createElement('canvas');
    c.className = 'rcet-constellation'; c.setAttribute('aria-hidden', 'true');
    host.prepend(c);
    const ctx = c.getContext('2d');
    const color = getComputedStyle(host).getPropertyValue('--rcet-accent').trim() || '#1a6aff';
    let w = 0, h = 0, raf = 0, running = false;
    const pts = [];
    const mk = () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .22, vy: (Math.random() - .5) * .22, r: 1.2 + Math.random() * 1.5 });
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = host.clientWidth; h = host.clientHeight;
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.max(24, Math.min(64, Math.round(w / 22)));
      while (pts.length < n) pts.push(mk());
      pts.length = n;
    };
    const step = () => {
      ctx.clearRect(0, 0, w, h);
      const link = Math.min(150, w / 7);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -12) p.x = w + 12; else if (p.x > w + 12) p.x = -12;
        if (p.y < -12) p.y = h + 12; else if (p.y > h + 12) p.y = -12;
      }
      ctx.lineWidth = 1; ctx.strokeStyle = color; ctx.fillStyle = color;
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < link) { ctx.globalAlpha = (1 - d / link) * .3; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      }
      ctx.globalAlpha = .6;
      for (const p of pts) { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(step);
    };
    const start = () => { if (!running) { running = true; raf = requestAnimationFrame(step); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    resize(); start();
    addEventListener('resize', resize);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(host);
  };

  // Scroll-lit statement: <h2 data-words>…</h2> — words brighten one by one as the block moves up the viewport.
  // If the heading is pinned (position: sticky), put data-words-track on the section so progress follows the
  // section instead of the heading, which stops moving once it sticks.
  const words = (el) => {
    const parts = el.textContent.trim().split(/\s+/);
    el.innerHTML = parts.map((w) => `<span class="rcet-word">${esc(w)}</span>`).join(' ');
    const spans = el.querySelectorAll('.rcet-word');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { spans.forEach((sp) => sp.classList.add('on')); return; }
    let ticking = false;
    const track = el.closest('[data-words-track]');
    const update = () => {
      ticking = false;
      const vh = innerHeight;
      let p;
      if (track) {                                            // section-driven: fully lit by the time the section top reaches ~12% of the viewport
        const t = track.getBoundingClientRect().top;
        p = (vh * 0.85 - t) / (vh * 0.73);
      } else {
        const r = el.getBoundingClientRect();
        const start = vh * 0.9, end = vh * 0.3;               // lights from 10% in view to 70% up
        p = (start - r.top) / (start - end + r.height * 0.6);
      }
      p = Math.min(1, Math.max(0, p));
      const n = Math.round(p * spans.length);
      spans.forEach((sp, i) => sp.classList.toggle('on', i < n));
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); update();
  };

  // Count-up numbers: <div class="rcet-stat"><b data-count="130" data-suffix="+">0</b>…  (data-format="k" → 1.8k)
  const counters = () => {
    const els = document.querySelectorAll('.rcet-stat b[data-count]');
    if (!els.length) return;
    const fmt = (el, n) => (el.dataset.format === 'k' ? `${Math.floor(n / 100) / 10}k` : String(Math.round(n))) + (el.dataset.suffix || '');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) { els.forEach((el) => { el.textContent = fmt(el, +el.dataset.count); }); return; }
    const io = new IntersectionObserver((entries) => {
      for (const { isIntersecting, target } of entries) {
        if (!isIntersecting) continue;
        io.unobserve(target);
        const end = +target.dataset.count, t0 = performance.now();
        const tick = (t) => { const p = Math.min(1, (t - t0) / 900); target.textContent = fmt(target, end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
      }
    }, { threshold: .6 });
    els.forEach((el) => io.observe(el));
  };

  const init = () => { reveal(); counters(); document.querySelectorAll('[data-constellation]').forEach(constellation); document.querySelectorAll('[data-words]').forEach(words); };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();

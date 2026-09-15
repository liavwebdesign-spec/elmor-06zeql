(function () {
  'use strict';
  var html = document.documentElement;
  html.classList.add('js');
  var params = new URLSearchParams(location.search);
  var QA = params.has('qa');
  if (QA) html.classList.add('qa');
  var rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var still = function () { return rm || QA || html.classList.contains('a11y-still'); };

  /* ---------- preloader: hides on real window load, no artificial wait ---------- */
  (function preloader() {
    var pre = document.getElementById('preloader');
    if (!pre) return;
    if (rm || QA) { pre.remove(); return; }
    if (params.get('preloader') === 'hold') return; // QA hook: freeze the preloader visible
    var hidden = false;
    function hide() {
      if (hidden) return; hidden = true;
      pre.classList.add('is-hidden');
      setTimeout(function () { pre.remove(); }, 520);
    }
    if (document.readyState === 'complete') hide();
    else window.addEventListener('load', hide);
    setTimeout(hide, 4000);
  })();

  /* ---------- header ---------- */
  var header = document.getElementById('siteHeader');
  var hero = document.getElementById('hero');
  function syncHeader() {
    var solid = !hero || window.scrollY > (hero.offsetHeight - 80);
    header.classList.toggle('is-solid', solid);
  }
  syncHeader();
  window.addEventListener('scroll', syncHeader, { passive: true });

  document.querySelectorAll('.has-sub').forEach(function (li) {
    var t = li.querySelector('.nav-sub-toggle');
    t.addEventListener('click', function () {
      var open = li.classList.toggle('is-open');
      t.setAttribute('aria-expanded', String(open));
    });
    li.addEventListener('focusout', function (e) {
      if (!li.contains(e.relatedTarget)) { li.classList.remove('is-open'); t.setAttribute('aria-expanded', 'false'); }
    });
  });

  /* ---------- mobile menu ---------- */
  var burger = document.getElementById('burger');
  var menu = document.getElementById('mobileMenu');
  var lastFocus = null;
  function openMenu() {
    lastFocus = document.activeElement;
    menu.hidden = false;
    requestAnimationFrame(function () { menu.classList.add('is-open'); });
    document.body.style.overflow = 'hidden';
    burger.setAttribute('aria-expanded', 'true');
    menu.querySelector('.mobile-menu-close').focus();
  }
  function closeMenu() {
    menu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    setTimeout(function () { menu.hidden = true; if (lastFocus) lastFocus.focus(); }, 320);
  }
  burger.addEventListener('click', openMenu);
  menu.querySelectorAll('[data-close-menu]').forEach(function (el) { el.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) closeMenu(); });

  /* ---------- reveal (engine) ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (!still() && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- count-up (B2) ---------- */
  var counts = document.querySelectorAll('.count');
  function fmt(v, d) { return d ? v.toFixed(d) : Math.round(v).toLocaleString('en-US'); }
  function runCount(el) {
    var target = parseFloat(el.dataset.count), d = parseInt(el.dataset.decimals || '0', 10);
    var start = performance.now(), dur = 900;
    function step(t) {
      var p = Math.min(1, (t - start) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * e, d);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (!still() && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { runCount(en.target); cio.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counts.forEach(function (el) { cio.observe(el); });
  } else {
    counts.forEach(function (el) { el.textContent = fmt(parseFloat(el.dataset.count), parseInt(el.dataset.decimals || '0', 10)); });
  }

  /* ---------- corridor arrows ---------- */
  var corridor = document.getElementById('corridor');
  if (corridor) {
    document.querySelectorAll('.corridor-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var card = corridor.querySelector('.proj-card');
        var gap = parseFloat(getComputedStyle(corridor.querySelector('.corridor-track')).columnGap) || 24;
        var stepX = card ? card.getBoundingClientRect().width + gap : 380;
        corridor.scrollBy({ left: stepX * parseInt(b.dataset.dir, 10), behavior: still() ? 'auto' : 'smooth' });
      });
    });
    corridor.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        corridor.scrollBy({ left: (e.key === 'ArrowRight' ? 1 : -1) * (corridor.querySelector('.proj-card').getBoundingClientRect().width + 24), behavior: still() ? 'auto' : 'smooth' });
      }
    });
  }

  /* ---------- contact form (static sketch: no backend yet) ---------- */
  var form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll('[required]').forEach(function (f) {
        var bad = f.type === 'checkbox' ? !f.checked : !f.value.trim() || (f.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.value));
        f.classList.toggle('is-error', bad);
        if (bad) ok = false;
      });
      var err = document.getElementById('formError');
      if (!ok) { err.hidden = false; err.textContent = 'Please fill in all required fields.'; return; }
      err.hidden = true;
      // Backend is wired in the Lovable stage; until then the sketch shows the failure path, never a fake success.
      err.hidden = false;
      err.innerHTML = 'The form is not connected yet. Please call <a href="tel:+97247368770">074-7368770</a>.';
    });
  }

  /* ---------- accessibility widget (B19) ---------- */
  (function a11y() {
    var link = document.getElementById('a11yBtn');
    if (!link) return;
    var KEY = 'elmor-a11y';
    var state = {};
    try { state = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) {}
    var modes = [
      { id: 'contrast', label: 'High contrast', cls: 'a11y-contrast' },
      { id: 'invert', label: 'Invert colors', cls: 'a11y-invert' },
      { id: 'gray', label: 'Grayscale', cls: 'a11y-gray' },
      { id: 'links', label: 'Highlight links', cls: 'a11y-links' },
      { id: 'font', label: 'Readable font', cls: 'a11y-font' },
      { id: 'spacing', label: 'Text spacing', cls: 'a11y-spacing' },
      { id: 'still', label: 'Stop animations', cls: 'a11y-still' },
      { id: 'cursor', label: 'Large cursor', cls: 'a11y-cursor' },
      { id: 'guide', label: 'Reading guide', cls: 'a11y-guide-on' }
    ];
    var btn = document.createElement('button');
    btn.className = 'a11y-btn'; btn.id = 'a11yBtn'; btn.type = 'button';
    btn.setAttribute('aria-label', 'Accessibility options'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'a11yPanel');
    btn.innerHTML = link.innerHTML;
    link.replaceWith(btn);

    var panel = document.createElement('div');
    panel.className = 'a11y-panel'; panel.id = 'a11yPanel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Accessibility options'); panel.hidden = true;
    var rows = '<button type="button" data-act="bigger"><span>Increase text</span><span class="dot">+</span></button>' +
               '<button type="button" data-act="smaller"><span>Decrease text</span><span class="dot">&minus;</span></button>';
    modes.forEach(function (m) { rows += '<button type="button" data-mode="' + m.id + '" aria-pressed="false"><span>' + m.label + '</span><span class="dot"></span></button>'; });
    panel.innerHTML = '<div class="a11y-head"><h2>Accessibility</h2><button type="button" class="a11y-close" aria-label="Close">&#x2715;</button></div>' +
      '<div class="a11y-list">' + rows + '</div>' +
      '<div class="a11y-foot"><a href="accessibility-statement.html">Accessibility Statement</a><button type="button" data-act="reset">Reset</button></div>';
    document.body.appendChild(panel);

    var guide = null;
    function apply() {
      var scale = 1 + (state.size || 0) * 0.1;
      html.style.setProperty('--a11y-scale', scale.toFixed(2));
      modes.forEach(function (m) {
        var on = !!state[m.id];
        html.classList.toggle(m.cls, on);
        var b = panel.querySelector('[data-mode="' + m.id + '"]');
        if (b) { b.setAttribute('aria-pressed', String(on)); b.querySelector('.dot').textContent = on ? '✓' : ''; }
      });
      if (state.guide && !guide) {
        guide = document.createElement('div'); guide.className = 'a11y-guide'; document.body.appendChild(guide);
        document.addEventListener('mousemove', moveGuide);
      } else if (!state.guide && guide) { guide.remove(); guide = null; document.removeEventListener('mousemove', moveGuide); }
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    }
    function moveGuide(e) { if (guide) guide.style.top = (e.clientY - 6) + 'px'; }
    panel.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.dataset.mode) { state[b.dataset.mode] = !state[b.dataset.mode]; }
      else if (b.dataset.act === 'bigger') { state.size = Math.min(4, (state.size || 0) + 1); }
      else if (b.dataset.act === 'smaller') { state.size = Math.max(-2, (state.size || 0) - 1); }
      else if (b.dataset.act === 'reset') { state = {}; }
      else if (b.classList.contains('a11y-close')) { close(); return; }
      apply();
    });
    function open() { panel.hidden = false; btn.setAttribute('aria-expanded', 'true'); panel.querySelector('.a11y-close').focus(); }
    function close() { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
    btn.addEventListener('click', function () { panel.hidden ? open() : close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) close(); });
    document.addEventListener('click', function (e) { if (!panel.hidden && !panel.contains(e.target) && e.target !== btn) close(); });
    var qa = params.get('a11y');
    if (qa) { qa.split(',').forEach(function (k) { if (k === 'open') open(); else state[k] = true; }); }
    apply();
  })();

  /* ---------- GSAP layer (approved: G13, G4ב, G12) ---------- */
  if (!window.gsap || !window.ScrollTrigger || QA) {
    document.querySelectorAll('.batch-card').forEach(function (el) { el.style.opacity = 1; });
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  history.scrollRestoration = 'manual';

  function splitWords(el) {
    if (el.querySelector('.w')) return Array.prototype.slice.call(el.querySelectorAll('.w'));
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    return words.map(function (w, i) {
      var s = document.createElement('span'); s.className = 'w'; s.textContent = w + (i < words.length - 1 ? ' ' : '');
      el.appendChild(s); return s;
    });
  }

  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', function () {
    // G13 · batch reveal for grids (bento tiles + project cards)
    gsap.set('.batch-card', { y: 24, opacity: 0 });
    ScrollTrigger.batch('.batch-card', {
      start: 'top 88%', once: true,
      onEnter: function (batch) { gsap.to(batch, { y: 0, opacity: 1, stagger: 0.08, duration: 0.5, ease: 'power2.out', overwrite: true }); }
    });
    // cards already past the trigger on load (deep link / refresh mid-page)
    ScrollTrigger.addEventListener('refreshInit', function () {
      document.querySelectorAll('.batch-card').forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.88 && gsap.getProperty(el, 'opacity') === 0) gsap.set(el, { y: 0, opacity: 1 });
      });
    });

    // G4ב · words brighten from 20% on key headings
    document.querySelectorAll('.gsap-words').forEach(function (h) {
      var words = splitWords(h);
      gsap.from(words, { opacity: 0.2, stagger: 0.12, ease: 'none',
        scrollTrigger: { trigger: h, start: 'top 85%', end: 'top 45%', scrub: 1 } });
    });

    // G12 · depth parallax, two layers only (hero video, closer photo)
    gsap.utils.toArray('[data-speed]').forEach(function (el) {
      var sec = el.closest('section');
      gsap.fromTo(el, { y: function () { return -(1 - parseFloat(el.dataset.speed)) * 240; } },
        { y: function () { return (1 - parseFloat(el.dataset.speed)) * 240; }, ease: 'none',
          scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });

  /* ---------- debug: overflow scan ---------- */
  if (params.has('debug')) {
    window.addEventListener('load', function () {
      var bad = [];
      document.querySelectorAll('body *').forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.width && (r.left < -1 || r.right > window.innerWidth + 1)) bad.push(el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : ''));
      });
      document.body.setAttribute('data-overflow', bad.slice(0, 20).join(',') || 'none');
    });
  }
})();

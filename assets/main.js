// JS Peinture — interactions
(function () {
  // Header scroll state
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Mobile menu
  const toggle = document.querySelector('.menu-toggle');
  const panel = document.querySelector('.mobile-panel');
  const mabMenu = document.querySelector('.mab-menu');
  if (panel) {
    const setMenu = (open) => {
      panel.classList.toggle('open', open);
      document.body.classList.toggle('menu-open', open);
      if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (mabMenu) mabMenu.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    if (toggle) toggle.addEventListener('click', () => setMenu(!panel.classList.contains('open')));
    if (mabMenu) mabMenu.addEventListener('click', () => setMenu(!panel.classList.contains('open')));
    panel.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panel.classList.contains('open')) setMenu(false);
    });
  }

  // Reveal on scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // Fallback: if IO is unsupported or stalled (some iframes), force-reveal
  // anything still hidden after a beat — and immediately reveal anything
  // already inside the initial viewport.
  const isInViewport = (el) => {
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0;
  };
  requestAnimationFrame(() => {
    document.querySelectorAll('.reveal').forEach(el => {
      if (isInViewport(el)) el.classList.add('in');
    });
  });
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.in)').forEach(el => {
      if (isInViewport(el)) el.classList.add('in');
    });
  }, 600);

  // Parallax (light)
  const para = document.querySelectorAll('.parallax');
  if (para.length && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const onScrollPara = () => {
      para.forEach(el => {
        const rect = el.getBoundingClientRect();
        const speed = parseFloat(el.dataset.speed || '0.08');
        const offset = (window.innerHeight / 2 - rect.top - rect.height / 2) * speed;
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      });
    };
    window.addEventListener('scroll', onScrollPara, { passive: true });
    onScrollPara();
  }

  // Before / After compare slider
  document.querySelectorAll('.compare').forEach(setupCompare);
  function setupCompare(el) {
    const after = el.querySelector('.after-wrap');
    const handle = el.querySelector('.handle');
    const knob = el.querySelector('.knob');
    let dragging = false;
    const setPos = (x) => {
      const rect = el.getBoundingClientRect();
      const pct = Math.max(0, Math.min(100, ((x - rect.left) / rect.width) * 100));
      after.style.width = pct + '%';
      handle.style.left = pct + '%';
      if (knob) knob.style.left = pct + '%';
    };
    const onMove = (e) => {
      if (!dragging) return;
      const x = (e.touches ? e.touches[0].clientX : e.clientX);
      setPos(x);
    };
    el.addEventListener('mousedown', (e) => { dragging = true; setPos(e.clientX); });
    el.addEventListener('touchstart', (e) => { dragging = true; setPos(e.touches[0].clientX); }, { passive: true });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('mouseup', () => dragging = false);
    window.addEventListener('touchend', () => dragging = false);
  }

  // Lightbox
  const lb = document.querySelector('.lightbox');
  if (lb) {
    const lbImg = lb.querySelector('img');
    const tiles = [...document.querySelectorAll('[data-lightbox]')];
    let idx = 0;
    const show = (i) => {
      idx = (i + tiles.length) % tiles.length;
      const t = tiles[idx];
      lbImg.src = t.dataset.lightbox || t.querySelector('img').src;
      lbImg.alt = t.dataset.alt || '';
      lb.classList.add('open');
    };
    tiles.forEach((t, i) => t.addEventListener('click', (e) => { e.preventDefault(); show(i); }));
    lb.querySelector('.lightbox-close')?.addEventListener('click', () => lb.classList.remove('open'));
    lb.querySelector('.lightbox-prev')?.addEventListener('click', () => show(idx - 1));
    lb.querySelector('.lightbox-next')?.addEventListener('click', () => show(idx + 1));
    lb.addEventListener('click', (e) => { if (e.target === lb) lb.classList.remove('open'); });
    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') lb.classList.remove('open');
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
  }

  // Realisations filter
  const chips = document.querySelectorAll('.chip');
  const items = document.querySelectorAll('[data-cat]');
  chips.forEach(c => c.addEventListener('click', () => {
    chips.forEach(x => x.classList.remove('active'));
    c.classList.add('active');
    const f = c.dataset.filter;
    items.forEach(it => {
      it.style.display = (f === 'all' || it.dataset.cat === f) ? '' : 'none';
    });
  }));

  // Marquee duplicate for seamless loop
  document.querySelectorAll('.marquee-track').forEach(t => {
    const inner = t.innerHTML;
    t.innerHTML = inner + inner;
  });

  // Animated counters
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    const cio = new IntersectionObserver((ents) => {
      ents.forEach(en => {
        if (!en.isIntersecting) return;
        cio.unobserve(en.target);
        const el = en.target;
        const target = parseInt(el.dataset.count, 10);
        const dur = 1400;
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min(1, (now - start) / dur);
          const ease = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(ease * target).toLocaleString('fr-FR');
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.4 });
    counters.forEach(c => cio.observe(c));
  }

  // ===== Scroll progress bar =====
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  document.body.appendChild(progress);
  const updateProgress = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
    progress.style.width = pct + '%';
  };
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  // ===== Tilt 3D sur .tilt-inner =====
  const tilters = document.querySelectorAll('.tilt');
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && !matchMedia('(hover: none)').matches) {
    tilters.forEach(card => {
      const inner = card.querySelector('.tilt-inner') || card;
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        const rx = (-y * 8).toFixed(2);
        const ry = (x * 8).toFixed(2);
        inner.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`;
      });
      card.addEventListener('mouseleave', () => {
        inner.style.transform = 'rotateX(0) rotateY(0) scale(1)';
      });
    });
  }

  // ===== Glow magnétique sur les boutons accent =====
  document.querySelectorAll('.btn--accent').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      btn.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    });
  });

  // ===== Curseur custom =====
  const supportsHover = matchMedia('(hover: hover)').matches && matchMedia('(pointer: fine)').matches;
  if (supportsHover) {
    const dot = document.createElement('div');
    const ring = document.createElement('div');
    dot.className = 'cursor-dot';
    ring.className = 'cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    document.body.classList.add('has-custom-cursor');

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;
    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    });
    const tick = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(tick);
    };
    tick();

    // Hover state on interactive elements
    const setHover = () => document.body.classList.add('cursor-hover');
    const clearHover = () => document.body.classList.remove('cursor-hover');
    const setText = () => document.body.classList.add('cursor-text');
    const clearText = () => document.body.classList.remove('cursor-text');

    const refresh = () => {
      document.querySelectorAll('a, button, .chip, .fin-swatch, .sr-card, .tile, .m-tile, .faq-item summary, details summary').forEach(el => {
        if (el.dataset.cursorBound) return;
        el.dataset.cursorBound = '1';
        el.addEventListener('mouseenter', setHover);
        el.addEventListener('mouseleave', clearHover);
      });
      document.querySelectorAll('h1, h2, h3, blockquote').forEach(el => {
        if (el.dataset.cursorTextBound) return;
        el.dataset.cursorTextBound = '1';
        el.addEventListener('mouseenter', setText);
        el.addEventListener('mouseleave', clearText);
      });
    };
    refresh();

    window.addEventListener('mouseout', (e) => {
      if (!e.relatedTarget) { dot.style.opacity = '0'; ring.style.opacity = '0'; }
    });
    window.addEventListener('mouseover', () => {
      dot.style.opacity = '1'; ring.style.opacity = '0.9';
    });
  }

  // ===== Split-text per word reveal =====
  // Any element with class .split — wrap words in spans, observe to add .in
  document.querySelectorAll('.split-words').forEach(el => {
    if (el.dataset.splitDone) return;
    el.dataset.splitDone = '1';
    // Only split direct text nodes (preserve existing <span class="italic"> etc)
    const walk = (node) => {
      const kids = [...node.childNodes];
      kids.forEach(k => {
        if (k.nodeType === 3 && k.textContent.trim()) {
          const frag = document.createDocumentFragment();
          k.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(part));
            } else {
              const w = document.createElement('span');
              w.className = 'w';
              const inner = document.createElement('span');
              inner.textContent = part;
              w.appendChild(inner);
              frag.appendChild(w);
            }
          });
          k.replaceWith(frag);
        } else if (k.nodeType === 1 && !k.classList.contains('w')) {
          // Wrap inline elements too (italic, etc) to participate in reveal
          if (['SPAN','EM','I','B','STRONG'].includes(k.tagName)) {
            const w = document.createElement('span');
            w.className = 'w';
            const inner = document.createElement('span');
            // move children of k into inner via clone
            inner.appendChild(k.cloneNode(true));
            w.appendChild(inner);
            k.replaceWith(w);
          } else {
            walk(k);
          }
        }
      });
    };
    walk(el);
  });
  const splitIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); splitIO.unobserve(e.target); }
    });
  }, { threshold: 0.25 });
  document.querySelectorAll('.split-words').forEach(el => splitIO.observe(el));

  // ===== Brand logo load detection =====
  document.querySelectorAll('.brand-logo, .footer-brand img').forEach(img => {
    const parent = img.closest('.brand, .footer-brand');
    if (!parent) return;
    const markLoaded = () => {
      parent.classList.add('logo-loaded');
      img.classList.add('is-loaded');
    };
    if (img.complete && img.naturalWidth > 0) {
      markLoaded();
    } else {
      img.addEventListener('load', markLoaded, { once: true });
      img.addEventListener('error', () => {/* keep text fallback visible */}, { once: true });
    }
  });

  // ===== Hero v3 — kick word-rise animation reliably =====
  // Some browsers/iframes don't start CSS animations on load until first paint.
  // We force it by clearing & re-applying the animation property in a microtask.
  const heroWords = document.querySelectorAll('.hero-v3 h1 .line .word');
  if (heroWords.length) {
    requestAnimationFrame(() => {
      heroWords.forEach((w) => {
        w.style.animation = 'none';
        // Force reflow
        // eslint-disable-next-line no-unused-expressions
        w.offsetHeight;
        w.style.animation = '';
      });
    });
    // Final safety: if animation hasn't actually moved the word after 2s, force-show
    setTimeout(() => {
      heroWords.forEach((w) => {
        const t = getComputedStyle(w).transform;
        if (t.includes('matrix(1, 0, 0, 1, 0,') && t !== 'matrix(1, 0, 0, 1, 0, 0)' && t !== 'none') {
          w.style.animation = 'none';
          w.style.transform = 'translateY(0)';
          w.style.opacity = '1';
        }
      });
    }, 2200);
  }

  // ===== Hero v3 — carousel auto =====
  const heroV3 = document.querySelector('.hero-v3');
  if (heroV3) {
    const slides = [...heroV3.querySelectorAll('.hero-v3-bg .slide')];
    const pagers = [...heroV3.querySelectorAll('.hero-v3-cta .pager button')];
    let current = 0;
    let timer = null;
    const go = (i) => {
      current = (i + slides.length) % slides.length;
      slides.forEach((s, idx) => s.classList.toggle('is-active', idx === current));
      pagers.forEach((p, idx) => p.classList.toggle('is-active', idx === current));
    };
    const start = () => { timer = setInterval(() => go(current + 1), 5500); };
    const stop = () => { clearInterval(timer); };
    pagers.forEach((p, i) => p.addEventListener('click', () => { go(i); stop(); start(); }));
    if (slides.length > 1) start();
    heroV3.addEventListener('mouseenter', stop);
    heroV3.addEventListener('mouseleave', start);
  }

  // ===== Showreel horizontal scroll =====
  document.querySelectorAll('.showreel').forEach(sr => {
    const rail = sr.querySelector('.showreel-rail');
    const prev = sr.querySelector('.sr-btn[data-dir="prev"]');
    const next = sr.querySelector('.sr-btn[data-dir="next"]');
    if (!rail) return;
    const step = () => Math.min(rail.clientWidth * 0.7, 500);
    const update = () => {
      if (!prev || !next) return;
      prev.disabled = rail.scrollLeft <= 4;
      next.disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4;
    };
    prev?.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));
    next?.addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' }));
    rail.addEventListener('scroll', update, { passive: true });
    update();
    // Drag to scroll
    let isDown = false, startX = 0, scrollLeft = 0;
    rail.addEventListener('mousedown', (e) => { isDown = true; startX = e.pageX; scrollLeft = rail.scrollLeft; rail.style.cursor = 'grabbing'; });
    rail.addEventListener('mouseleave', () => { isDown = false; rail.style.cursor = ''; });
    rail.addEventListener('mouseup', () => { isDown = false; rail.style.cursor = ''; });
    rail.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      rail.scrollLeft = scrollLeft - (e.pageX - startX) * 1.4;
    });
  });

  // ===== Finitions — swatch interaction =====
  const finitionsData = {
    mate: { title: 'Mate', subtitle: 'profonde', desc: 'La finition la plus absorbante. Idéale pour les chambres et les plafonds — elle masque les imperfections et donne une profondeur veloutée à la couleur. Sensible aux taches, moins lessivable.', usage: 'Chambres · Plafonds', resistance: 'Faible' },
    veloute: { title: 'Velours', subtitle: 'élégante', desc: 'L\'équilibre parfait entre la profondeur du mate et la lavabilité du satiné. Mon choix par défaut pour les pièces de vie : salons, salles à manger, couloirs. Très belle lumière rasante.', usage: 'Salons · Couloirs', resistance: 'Bonne' },
    satine: { title: 'Satinée', subtitle: 'lumineuse', desc: 'Léger reflet, très facile à entretenir. Parfaite pour les pièces humides et passantes : cuisines, salles de bain, chambres d\'enfant. Met en valeur les imperfections — d\'où l\'importance d\'une prépa irréprochable.', usage: 'Cuisines · SDB', resistance: 'Excellente' },
    laquee: { title: 'Laquée', subtitle: 'tranchante', desc: 'Finition très brillante, réservée aux boiseries, portes, plinthes, radiateurs. Effet "neuf usine" garanti. Application à la brosse fine ou au rouleau laqueur pour un tendu impeccable.', usage: 'Boiseries · Portes', resistance: 'Excellente' },
  };
  const swatches = document.querySelectorAll('.fin-swatch');
  const finDetail = document.querySelector('.fin-detail');
  if (swatches.length && finDetail) {
    const titleEl = finDetail.querySelector('.fd-title');
    const descEl = finDetail.querySelector('.fd-desc');
    const usageEl = finDetail.querySelector('.fd-usage span');
    const resEl = finDetail.querySelector('.fd-res span');
    const setFin = (key) => {
      const d = finitionsData[key];
      if (!d) return;
      swatches.forEach(s => s.classList.toggle('is-active', s.dataset.fin === key));
      // Fade out then in
      finDetail.style.transition = 'opacity .25s ease';
      finDetail.style.opacity = '0';
      setTimeout(() => {
        if (titleEl) titleEl.innerHTML = `${d.title} <br/><span class="italic">${d.subtitle}</span>.`;
        if (descEl) descEl.textContent = d.desc;
        if (usageEl) usageEl.textContent = d.usage;
        if (resEl) resEl.textContent = d.resistance;
        finDetail.style.opacity = '1';
      }, 250);
    };
    swatches.forEach(sw => sw.addEventListener('click', () => setFin(sw.dataset.fin)));
    // Default
    setFin('veloute');
  }
})();

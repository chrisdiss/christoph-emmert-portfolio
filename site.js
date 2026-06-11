/* Chris Emmert v3 — avant-garde interactions on the Wave palette
   cursor · magnetic · scramble · manifesto scroll-light · drag strip
   work preview + accordion · dot-field canvas · loader · clock · active nav */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- loader (counter then wipe) ---------- */
  var loader = document.getElementById('loader');
  var lcount = document.getElementById('lcount');
  if (loader && lcount && !reduced) {
    var n = 0;
    var iv = setInterval(function () {
      n = Math.min(100, n + Math.ceil(Math.random() * 17));
      lcount.textContent = String(n).padStart(3, '0');
      if (n >= 100) {
        clearInterval(iv);
        setTimeout(function () { loader.classList.add('done'); }, 200);
      }
    }, 70);
  } else if (loader) {
    loader.classList.add('done');
  }

  /* free the headline reveal masks once the entrance is done */
  setTimeout(function () { document.documentElement.classList.add('hero-done'); }, 1500);

  /* ---------- custom cursor ---------- */
  var cursor = document.getElementById('cursor');
  var cursorLabel = document.getElementById('cursorLabel');
  var cx = -100, cy = -100, tx = -100, ty = -100;
  if (cursor && finePointer && !reduced) {
    document.documentElement.classList.add('has-cursor');
    window.addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; });
    (function loopCursor() {
      cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22;
      cursor.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
      requestAnimationFrame(loopCursor);
    })();
    document.addEventListener('pointerover', function (e) {
      var t = e.target.closest('[data-cursor], a, button');
      if (t) {
        cursor.classList.add('big');
        cursorLabel.textContent = t.getAttribute && t.getAttribute('data-cursor') || (t.closest('[data-cursor]') ? t.closest('[data-cursor]').getAttribute('data-cursor') : '') || 'OPEN';
      } else {
        cursor.classList.remove('big');
      }
    });
    document.addEventListener('pointerout', function (e) {
      if (!e.relatedTarget || !e.relatedTarget.closest('[data-cursor], a, button')) cursor.classList.remove('big');
    });
  }

  /* ---------- magnetic elements ---------- */
  if (finePointer && !reduced) {
    document.querySelectorAll('[data-mag], [data-mag-big], [data-mag-soft]').forEach(function (el) {
      var str = el.hasAttribute('data-mag-big') ? 0.25 : el.hasAttribute('data-mag-soft') ? 0.06 : 0.35;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + dx * str + 'px,' + dy * str + 'px)';
      });
      el.addEventListener('pointerleave', function () {
        el.style.transition = 'transform 0.5s cubic-bezier(0.2,0.7,0.2,1)';
        el.style.transform = '';
        setTimeout(function () { el.style.transition = ''; }, 500);
      });
    });
  }

  /* ---------- scramble hover ---------- */
  var GLYPHS = '#@%&£§+=/\\<>0123456789';
  document.querySelectorAll('[data-scramble]').forEach(function (el) {
    var orig = el.getAttribute('data-scramble');
    var running = false;
    el.addEventListener('pointerenter', function () {
      if (running || reduced) return;
      running = true;
      var frame = 0;
      var total = Math.max(8, orig.length);
      var iv2 = setInterval(function () {
        frame++;
        var out = '';
        for (var i = 0; i < orig.length; i++) {
          if (orig[i] === ' ') { out += ' '; continue; }
          out += (i < (frame / total) * orig.length) ? orig[i] : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
        el.textContent = out;
        if (frame >= total) { clearInterval(iv2); el.textContent = orig; running = false; }
      }, 28);
    });
  });

  /* ---------- scroll progress ---------- */
  var bar = document.getElementById('progressBar');
  function onScrollProgress() {
    var h = document.documentElement;
    var p = h.scrollTop / (h.scrollHeight - h.clientHeight);
    if (bar) bar.style.width = (p * 100) + '%';
  }
  window.addEventListener('scroll', onScrollProgress, { passive: true });

  /* ---------- active nav highlight ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  var navMap = {};
  navLinks.forEach(function (a) { navMap[a.getAttribute('href').slice(1)] = a; });
  /* sections without their own nav item highlight the nearest previous one */
  var alias = { gallery: 'about', excel: 'work', now: 'writing' };
  var secIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var id = en.target.id;
      id = navMap[id] ? id : alias[id];
      if (!id || !navMap[id]) return;
      navLinks.forEach(function (a) { a.classList.toggle('active', a === navMap[id]); });
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  document.querySelectorAll('main section[id]').forEach(function (s) { secIO.observe(s); });

  /* ---------- manifesto: words light up with scroll ---------- */
  var mani = document.getElementById('manifesto');
  var maniWords = [];
  if (mani) {
    var ACCENTS = ['founder,', 'builder,', 'writer.', '0', '→', '1,', 'vision', 'reality', 'reality:'];
    var words = mani.textContent.split(/\s+/).filter(Boolean);
    mani.textContent = '';
    words.forEach(function (w, i) {
      var s = document.createElement('span');
      s.className = 'w' + (ACCENTS.indexOf(w) !== -1 ? ' acc' : '');
      s.textContent = w;
      mani.appendChild(s);
      if (i < words.length - 1) mani.appendChild(document.createTextNode(' '));
      maniWords.push(s);
    });
    var lightWords = function () {
      var r = mani.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = (vh * 0.82 - r.top) / (r.height + vh * 0.30);
      p = Math.max(0, Math.min(1, p));
      var lit = Math.floor(p * maniWords.length);
      maniWords.forEach(function (s, i) { s.classList.toggle('on', i < lit); });
    };
    if (reduced) {
      maniWords.forEach(function (s) { s.classList.add('on'); });
    } else {
      window.addEventListener('scroll', lightWords, { passive: true });
      lightWords();
    }
  }

  /* ---------- generic reveals ---------- */
  var revealEls = document.querySelectorAll('.sechead, .about-tags, .xcell, .cv-id, .cv-block, .post, .now-item, .cta, .contact-row, .card');
  revealEls.forEach(function (el) { el.classList.add('rv-el'); });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(function (el) { io.observe(el); });

  /* ---------- gallery drag strip ---------- */
  var strip = document.getElementById('strip');
  if (strip) {
    var down = false, startX = 0, startLeft = 0, moved = 0;
    strip.addEventListener('pointerdown', function (e) {
      down = true; moved = 0; startX = e.clientX; startLeft = strip.scrollLeft;
      strip.classList.add('dragging');
      strip.setPointerCapture(e.pointerId);
    });
    strip.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      strip.scrollLeft = startLeft - dx;
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) {
      strip.addEventListener(ev, function () { down = false; strip.classList.remove('dragging'); });
    });
  }

  /* ---------- work rows: cursor preview + accordion ---------- */
  var wpreview = document.getElementById('wpreview');
  var wrows = document.querySelectorAll('.wrow[data-wrow]');
  var px = 0, py = 0, pxT = 0, pyT = 0;
  if (wpreview && finePointer && !reduced) {
    (function loopPreview() {
      px += (pxT - px) * 0.12; py += (pyT - py) * 0.12;
      wpreview.style.left = px + 'px'; wpreview.style.top = py + 'px';
      requestAnimationFrame(loopPreview);
    })();
    window.addEventListener('pointermove', function (e) { pxT = e.clientX; pyT = e.clientY; });
  }
  wrows.forEach(function (row) {
    var head = row.querySelector('.wrow-head');
    if (finePointer && !reduced && wpreview) {
      head.addEventListener('pointerenter', function () {
        if (row.classList.contains('open')) return;
        wpreview.textContent = row.getAttribute('data-preview');
        wpreview.classList.add('show');
      });
      head.addEventListener('pointerleave', function () {
        wpreview.classList.remove('show');
      });
    }
    head.addEventListener('click', function () {
      var willOpen = !row.classList.contains('open');
      wrows.forEach(function (o) {
        if (o !== row) { o.classList.remove('open'); o.querySelector('.wrow-head').setAttribute('aria-expanded', 'false'); }
      });
      row.classList.toggle('open', willOpen);
      head.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      if (willOpen && wpreview) wpreview.classList.remove('show');
    });
  });

  /* ---------- hero dot field (warps near cursor) ---------- */
  var canvas = document.getElementById('field');
  if (canvas && !reduced) {
    var ctx = canvas.getContext('2d');
    var W, H, dots = [], GAP = 42;
    var mx = -9999, my = -9999;
    function buildField() {
      var hero = canvas.parentElement;
      W = canvas.width = hero.offsetWidth;
      H = canvas.height = hero.offsetHeight;
      dots = [];
      for (var y = GAP; y < H; y += GAP) {
        for (var x = GAP; x < W + GAP; x += GAP) {
          dots.push({ x: x, y: y });
        }
      }
    }
    buildField();
    window.addEventListener('resize', buildField);
    canvas.parentElement.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      mx = e.clientX - r.left; my = e.clientY - r.top;
    });
    canvas.parentElement.addEventListener('pointerleave', function () { mx = -9999; my = -9999; });
    var visible = true;
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(canvas);
    (function drawField() {
      requestAnimationFrame(drawField);
      if (!visible) return;
      ctx.clearRect(0, 0, W, H);
      var R = 150;
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        var dx = d.x - mx, dy = d.y - my;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var ox = 0, oy = 0, lit = 0;
        if (dist < R && dist > 0.01) {
          var f = (1 - dist / R) * 16;
          ox = (dx / dist) * f; oy = (dy / dist) * f;
          lit = 1 - dist / R;
        }
        ctx.fillStyle = lit > 0
          ? 'rgba(77,124,255,' + (0.14 + lit * 0.6) + ')'
          : 'rgba(236,231,220,0.08)';
        ctx.fillRect(d.x + ox - 1, d.y + oy - 1, 2, 2);
      }
    })();
  }

  /* ---------- Munich clock ---------- */
  var clock = document.getElementById('clock');
  function tickClock() {
    if (!clock) return;
    try {
      clock.textContent = new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/Berlin', hour12: false });
    } catch (e) {
      clock.textContent = new Date().toLocaleTimeString('en-GB', { hour12: false });
    }
  }
  tickClock();
  setInterval(tickClock, 1000);
})();

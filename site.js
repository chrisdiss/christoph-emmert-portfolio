/* Chris Emmert — site interactions: wave field, scroll reveals, nav, loader */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- reusable wireframe wave field ---------- */
  function WaveField(canvas, opts) {
    opts = opts || {};
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, dpr = 1, start = performance.now(), raf = 0;
    var mouse = { gx: 0, active: false, ix: 0 };
    var COLS = opts.cols || 72, ROWS = opts.rows || 52;
    var near = 0.7, depth = 9.0;
    var camH = 0.55;
    var horizon = opts.horizon != null ? opts.horizon : 0.28;
    var amp = opts.amp != null ? opts.amp : 1;
    var baseAlpha = opts.baseAlpha != null ? opts.baseAlpha : 0.10;

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    var ro = new ResizeObserver(size); ro.observe(canvas); size();

    window.addEventListener('mousemove', function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.gx = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouse.active = e.clientY >= r.top - 80 && e.clientY <= r.bottom + 80;
    }, { passive: true });

    function wy(gx, gz, t) {
      var y = 0.13 * amp * Math.sin(gx * 2.2 + t * 0.9) * Math.cos(gz * 2.6 - t * 0.55);
      y += 0.07 * amp * Math.sin((gx + gz) * 3.4 + t * 1.25);
      y += 0.04 * amp * Math.cos(gx * 5.0 - t * 1.6);
      mouse.ix += ((mouse.active ? mouse.gx : 0) - mouse.ix) * 0.06;
      var d = gx - mouse.ix;
      y += 0.18 * amp * Math.exp(-(d * d) / 0.05) * Math.sin(t * 3.4 - gz * 6.0) * (0.4 + gz);
      return y;
    }
    function project(gx, gz, y) {
      var Z = near + gz * depth;
      var p = 1 / Z;
      var sx = W / 2 + gx * p * (W * 0.27);
      var sy = H * horizon + (camH - y) * p * (H * 0.86);
      return [sx, sy, p, y, gz];
    }
    function render(t) {
      ctx.clearRect(0, 0, W, H);
      var pts = [], j, i;
      for (j = 0; j < ROWS; j++) {
        var row = [], gz = 1 - j / (ROWS - 1);
        for (i = 0; i < COLS; i++) {
          var gx = (i / (COLS - 1)) * 2 - 1;
          row.push(project(gx * 1.7, gz, wy(gx, gz, t)));
        }
        pts.push(row);
      }
      for (j = 0; j < ROWS; j++) {
        var rr = pts[j];
        var Z = near + rr[0][4] * depth, p = 1 / Z;
        var tn = Math.max(0, Math.min(1, (p - 0.10) / 1.33));
        var al = baseAlpha + tn * 0.5;
        var r = Math.round(120 - 120 * tn), g = Math.round(112 - 56 * tn), b = Math.round(150 + 105 * tn);
        ctx.strokeStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + al + ')';
        ctx.lineWidth = 0.5 + tn * 1.7;
        ctx.beginPath();
        for (i = 0; i < COLS; i++) { var a = rr[i]; i === 0 ? ctx.moveTo(a[0], a[1]) : ctx.lineTo(a[0], a[1]); }
        ctx.stroke();
      }
      ctx.lineWidth = 0.6; ctx.strokeStyle = 'rgba(0,56,255,0.10)';
      for (i = 0; i < COLS; i += 6) {
        ctx.beginPath();
        for (j = Math.floor(ROWS * 0.45); j < ROWS; j++) { var b = pts[j][i]; j === Math.floor(ROWS * 0.45) ? ctx.moveTo(b[0], b[1]) : ctx.lineTo(b[0], b[1]); }
        ctx.stroke();
      }
    }
    function frame(now) { raf = requestAnimationFrame(frame); render(reduce ? 0.6 : (now - start) / 1000); }
    render(0.6);
    raf = requestAnimationFrame(frame);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { start = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); } });
    return { render: render };
  }

  var heroCanvas = document.getElementById('wave');
  if (heroCanvas) window.__heroWave = WaveField(heroCanvas, {});
  var footCanvas = document.getElementById('wave-foot');
  if (footCanvas) WaveField(footCanvas, { rows: 30, cols: 56, horizon: 0.05, baseAlpha: 0.08, amp: 0.9 });

  /* ---------- scroll reveals ---------- */
  var srs = document.querySelectorAll('.sr');
  if ('IntersectionObserver' in window && srs.length) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    srs.forEach(function (el) { io.observe(el); });
  } else {
    srs.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- active nav on scroll ---------- */
  var sections = document.querySelectorAll('section[id]');
  var navlinks = {};
  document.querySelectorAll('.index a').forEach(function (a) {
    var id = a.getAttribute('href'); if (id && id[0] === '#') navlinks[id.slice(1)] = a;
  });
  if ('IntersectionObserver' in window && sections.length) {
    var no = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          Object.keys(navlinks).forEach(function (k) { navlinks[k].classList.remove('active'); });
          if (navlinks[e.target.id]) navlinks[e.target.id].classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { no.observe(s); });
  }

  /* ---------- work gallery: click a project to expand its detail ---------- */
  var projs = document.querySelectorAll('.proj[data-proj]');
  projs.forEach(function (p) {
    var tile = p.querySelector('.proj-tile');
    if (!tile) return;
    tile.addEventListener('click', function () {
      var willOpen = !p.classList.contains('open');
      projs.forEach(function (o) {
        if (o !== p) { o.classList.remove('open'); var t = o.querySelector('.proj-tile'); if (t) t.setAttribute('aria-expanded', 'false'); }
      });
      p.classList.toggle('open', willOpen);
      tile.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });
  });

  /* ---------- loader ---------- */
  function hideLoader() { var l = document.getElementById('loader'); if (l) l.classList.add('done'); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(hideLoader, 650); });
  setTimeout(hideLoader, 1500);
})();

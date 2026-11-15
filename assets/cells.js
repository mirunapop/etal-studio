/* Animated "fluorescence" figure: T cells (magenta) roam, reach the tumour (cyan),
   and are often switched off. "Add immunotherapy" keeps them working and the tumour shrinks.
   Illustrative only: not a model of real biology data. */
(function(){
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!document.getElementById('cells-style')) {
    var st = document.createElement('style'); st.id = 'cells-style';
    st.textContent = 'svg[data-cells] .tum{transform-box:fill-box; transform-origin:center; animation:cellsBreath 5s ease-in-out infinite}' +
      'svg[data-cells] .tc, svg[data-cells] .nuc circle{transition:opacity 1.2s ease}' +
      '@keyframes cellsBreath{50%{transform:scale(1.018)}}' +
      '@media (prefers-reduced-motion:reduce){svg[data-cells] .tum{animation:none}}';
    document.head.appendChild(st);
  }

  Array.prototype.forEach.call(document.querySelectorAll('svg[data-cells]'), init);

  function el(name, attrs, parent){
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function init(svg){
    var mg = svg.getAttribute('data-mg'), glow = svg.getAttribute('data-glow');
    var CX = 132, CY = 104, R = 58;
    var X0 = 10, X1 = 230, Y0 = 26, Y1 = 168;
    var tcs = [].slice.call(svg.querySelectorAll('.tc'));
    var nucs = [].slice.call(svg.querySelectorAll('.nuc circle'));
    var tumour = tcs.map(function(c){
      var x = +c.getAttribute('cx'), y = +c.getAttribute('cy'), best = null, bd = 1e9;
      nucs.forEach(function(n){ var d = Math.hypot(+n.getAttribute('cx') - x, +n.getAttribute('cy') - y); if (d < bd) { bd = d; best = n; } });
      return { c: c, n: bd < 6 ? best : null, dead: false };
    });

    var layer = el('g', {}, svg);
    var lab = el('g', { opacity: 0 }, svg);
    var labLine = el('line', { stroke: '#FFFFFF', 'stroke-width': .8 }, lab);
    var labText = el('text', { 'font-family': 'IBM Plex Mono, monospace', 'font-size': 8.5, fill: '#FFFFFF' }, lab);
    labText.textContent = 'switched off';
    lab.style.transition = 'opacity .4s';

    var box = svg.closest('[data-cells-box]') || svg.parentNode;
    var btn = box.querySelector('[data-therapy]');
    var read = box.querySelector('[data-readout]');
    var therapy = false, killClock = 0;

    var N = 8, cells = [];
    for (var i = 0; i < N; i++) {
      var g = el('g', {}, layer);
      var body = el('circle', { r: 7.2, fill: 'url(#' + mg + ')', filter: 'url(#' + glow + ')' }, g);
      var ring = el('circle', { r: 7.2, fill: '#4A1B39', stroke: '#FF4FB4', 'stroke-width': 1, 'stroke-dasharray': '2 2', opacity: 0 }, g);
      var c = { g: g, body: body, ring: ring };
      spawn(c, true); cells.push(c);
    }

    function spawn(c, anywhere){
      var x, y, tries = 0;
      do {
        if (anywhere) { x = X0 + Math.random() * (X1 - X0); y = Y0 + Math.random() * (Y1 - Y0); }
        else {
          var side = Math.floor(Math.random() * 4);
          x = side === 0 ? X0 : side === 1 ? X1 : X0 + Math.random() * (X1 - X0);
          y = side === 2 ? Y0 : side === 3 ? Y1 : Y0 + Math.random() * (Y1 - Y0);
        }
        tries++;
      } while (Math.hypot(x - CX, y - CY) < R + 22 && tries < 30);
      c.x = x; c.y = y;
      var a = Math.random() * Math.PI * 2;
      c.vx = Math.cos(a) * 6; c.vy = Math.sin(a) * 6;
      c.state = 'roam'; c.t = 0; c.off = false; c.decided = false; c.offAt = 0;
      c.wait = 1 + Math.random() * 4;
    }

    function step(dt){
      killClock += dt;
      cells.forEach(function(c){
        c.t += dt;
        if (c.state === 'roam') {
          var dx = CX - c.x, dy = CY - c.y, d = Math.hypot(dx, dy) || 1;
          var pull = c.t > c.wait ? 9 : 2;
          c.vx += (dx / d * pull + (Math.random() - .5) * 26) * dt;
          c.vy += (dy / d * pull + (Math.random() - .5) * 26) * dt;
          var sp = Math.hypot(c.vx, c.vy), max = 16;
          if (sp > max) { c.vx *= max / sp; c.vy *= max / sp; }
          c.x += c.vx * dt; c.y += c.vy * dt;
          if (c.x < X0 || c.x > X1) c.vx *= -1;
          if (c.y < Y0 || c.y > Y1) c.vy *= -1;
          c.x = Math.min(X1, Math.max(X0, c.x)); c.y = Math.min(Y1, Math.max(Y0, c.y));
          if (d < R + 6) { c.state = 'bound'; c.t = 0; c.ang = Math.atan2(c.y - CY, c.x - CX); }
        } else if (c.state === 'bound') {
          c.ang += (Math.random() - .5) * .25 * dt;
          var rr = R + 4 + Math.sin(c.t * 2) * 1.2;
          c.x = CX + Math.cos(c.ang) * rr; c.y = CY + Math.sin(c.ang) * rr;
          if (!c.decided && c.t > 2.2) {
            c.decided = true;
            if (!therapy && Math.random() < .7) { c.off = true; c.offAt = performance.now(); }
          }
          if (therapy && c.off) c.off = false;
          if (c.t > (c.off ? 10 : 5)) { c.state = 'leave'; var a = c.ang + (Math.random() - .5); c.vx = Math.cos(a) * 14; c.vy = Math.sin(a) * 14; }
        } else {
          c.x += c.vx * dt; c.y += c.vy * dt;
          if (c.x < X0 - 12 || c.x > X1 + 12 || c.y < Y0 - 30 || c.y > Y1 + 40) spawn(c, false);
        }
      });
      if (therapy && killClock > 1.6) {
        killClock = 0;
        var working = cells.filter(function(c){ return c.state === 'bound' && !c.off; }).length;
        var alive = tumour.filter(function(t){ return !t.dead; });
        if (working && alive.length > 3) {
          var t = alive[Math.floor(Math.random() * alive.length)];
          t.dead = true; t.c.style.opacity = .12; if (t.n) t.n.style.opacity = 0;
        }
      }
    }

    function render(){
      var latest = null;
      cells.forEach(function(c){
        c.g.setAttribute('transform', 'translate(' + c.x.toFixed(1) + ' ' + c.y.toFixed(1) + ')');
        c.body.setAttribute('opacity', c.off ? 0 : 1);
        c.ring.setAttribute('opacity', c.off ? .9 : 0);
        if (c.off && c.state === 'bound' && (!latest || c.offAt > latest.offAt)) latest = c;
      });
      if (latest) {
        var lx = latest.x + (latest.x > 170 ? -44 : 10), ly = Math.min(latest.y + 26, 160);
        labLine.setAttribute('x1', latest.x); labLine.setAttribute('y1', latest.y + 6);
        labLine.setAttribute('x2', lx + 12); labLine.setAttribute('y2', ly - 8);
        labText.setAttribute('x', lx); labText.setAttribute('y', ly);
        lab.setAttribute('opacity', 1);
      } else lab.setAttribute('opacity', 0);
      if (read) {
        var on = cells.filter(function(c){ return !c.off; }).length;
        read.textContent = 'Working T cells: ' + on + ' of ' + N;
      }
    }

    if (btn) btn.addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      therapy = !therapy;
      btn.setAttribute('aria-pressed', therapy ? 'true' : 'false');
      btn.textContent = therapy ? 'Remove immunotherapy' : 'Add immunotherapy';
      if (!therapy) tumour.forEach(function(t){ t.dead = false; t.c.style.opacity = ''; if (t.n) t.n.style.opacity = ''; });
      if (reduce) { for (var k = 0; k < 400; k++) step(1 / 20); render(); }
    });

    if (reduce) { for (var k = 0; k < 400; k++) step(1 / 20); render(); return; }

    var visible = true, last = 0;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function(es){ visible = es[0].isIntersecting; if (visible) { last = 0; requestAnimationFrame(loop); } }).observe(svg);
    }
    function loop(ts){
      if (!visible) return;
      var dt = last ? Math.min(.05, (ts - last) / 1000) : 0; last = ts;
      step(dt); render();
      requestAnimationFrame(loop);
    }
    for (var w = 0; w < 120; w++) step(1 / 20);
    render(); requestAnimationFrame(loop);
  }
})();

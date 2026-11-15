(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Copy buttons */
  Array.prototype.forEach.call(document.querySelectorAll('button[data-copy]'), function(btn){
    var label = btn.textContent;
    btn.addEventListener('click', function(){
      var el = document.getElementById(btn.getAttribute('data-copy'));
      if(!el) return;
      var text = el.textContent.trim();
      var done = function(){ btn.textContent = 'Copied'; setTimeout(function(){ btn.textContent = label; }, 1600); };
      var fail = function(){
        try {
          var r = document.createRange(); r.selectNodeContents(el);
          var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
          btn.textContent = 'Selected — press Ctrl/Cmd+C';
        } catch(e) { btn.textContent = label; }
      };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fail);
        else fail();
      } catch (e) { fail(); }
    });
  });

  /* Sticky header: chapter highlight + reading progress */
  var spyLinks = document.querySelectorAll('.mast nav a[data-spy]');
  var bar = document.querySelector('.progress i');
  var onHome = !!document.getElementById('method');
  var spy = function(){
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
    if (!onHome) return;
    var cur = '';
    Array.prototype.forEach.call(spyLinks, function(a){
      var sec = document.getElementById(a.getAttribute('data-spy'));
      if (sec && sec.getBoundingClientRect().top <= 140) cur = a.getAttribute('data-spy');
    });
    if (window.innerHeight + window.scrollY >= doc.scrollHeight - 4) cur = 'contact';
    Array.prototype.forEach.call(spyLinks, function(a){
      var on = a.getAttribute('data-spy') === cur;
      a.classList.toggle('active', on);
      if (on) { a.setAttribute('aria-current', 'location'); if (a.scrollIntoView && window.innerWidth <= 900) { var n = a.parentNode; n.scrollLeft = a.offsetLeft - 24; } }
      else a.removeAttribute('aria-current');
    });
  };
  window.addEventListener('scroll', spy, { passive: true });
  window.addEventListener('resize', spy);
  spy();

  /* Fig. 1: abstract phrase -> homepage element */
  var fig = document.getElementById('fig1');
  if (fig) {
    var phrases = fig.querySelectorAll('.phr');
    var targets = fig.querySelectorAll('.tgt');
    var active = 1, pinned = false;
    var show = function(n){
      active = n;
      Array.prototype.forEach.call(phrases, function(p){
        var on = Number(p.getAttribute('data-link')) === n;
        p.classList.toggle('on', on);
        p.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      Array.prototype.forEach.call(targets, function(t){ t.classList.toggle('on', Number(t.getAttribute('data-target')) === n); });
    };
    Array.prototype.forEach.call(phrases, function(p){
      p.addEventListener('click', function(){ pinned = true; show(Number(p.getAttribute('data-link'))); });
    });
    show(1);
    if (!reduce) setInterval(function(){ if (!pinned) show((active % phrases.length) + 1); }, 2400);
  }

  /* Specimens: tabbed stack */
  var stack = document.getElementById('stack');
  if (stack) {
    var tabs = document.querySelectorAll('.tabs [role="tab"]');
    var panels = stack.querySelectorAll('.panel');
    var urlEl = stack.querySelector('.url');
    var backs = stack.querySelectorAll('.back');
    var cur = 0, held = false;
    var select = function(i, focus){
      cur = i;
      Array.prototype.forEach.call(tabs, function(t, j){
        t.setAttribute('aria-selected', j === i ? 'true' : 'false');
        t.tabIndex = j === i ? 0 : -1;
        if (j === i && focus) t.focus();
      });
      Array.prototype.forEach.call(panels, function(p, j){ p.hidden = j !== i; });
      urlEl.textContent = panels[i].getAttribute('data-url');
      var href = panels[i].getAttribute('data-href'), nm = panels[i].getAttribute('data-name');
      var lk = document.getElementById('stackLink'), ob = document.getElementById('openFull');
      if (lk) { lk.href = href; var sr = lk.querySelector('.sr-only'); if (sr) sr.textContent = ' the full ' + nm + ' homepage'; }
      if (ob) { ob.href = href; ob.textContent = 'Open the full ' + nm + ' homepage →'; }
      var others = [];
      Array.prototype.forEach.call(panels, function(p, j){ if (j !== i) others.push(p.getAttribute('data-bg')); });
      if (backs[0]) backs[0].style.background = others[0];
      if (backs[1]) backs[1].style.background = others[1];
    };
    Array.prototype.forEach.call(tabs, function(t, j){
      t.addEventListener('click', function(){ held = true; select(j); });
      t.addEventListener('keydown', function(e){
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault(); held = true;
          select((j + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length, true);
        }
      });
    });
    stack.addEventListener('mouseenter', function(){ held = true; });
    select(0);
    if (!reduce) setInterval(function(){ if (!held) select((cur + 1) % tabs.length); }, 3800);
  }
})();

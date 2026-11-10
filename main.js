/* Human Rights Law as Data: small behaviours, no dependencies.
   - [data-copy="#id"]   copies the text of #id and says so to screen readers;
   - [data-film]         shows or hides the film panel it controls (and pauses the film when hidden);
   - a[data-transcript]  opens the transcript it points to;
   - video.loop          silent card loops: a visible Pause/Play button, no autoplay under prefers-reduced-motion. */
(function () {
  'use strict';
  var live = document.getElementById('live');
  function say(t) {
    if (!live) return;
    live.textContent = '';
    setTimeout(function () { live.textContent = t; }, 60);
  }

  // ---- copy ----
  function label(btn, text) {
    var n = btn.firstChild;
    if (n && n.nodeType === 3) n.nodeValue = text;
  }
  function copied(btn) {
    label(btn, 'Copied');
    btn.classList.add('copied');
    say('Copied to the clipboard');
    clearTimeout(btn._t);
    btn._t = setTimeout(function () { label(btn, 'Copy'); btn.classList.remove('copied'); }, 2000);
  }
  function selectText(el) {
    var r = document.createRange();
    r.selectNodeContents(el);
    var s = window.getSelection();
    s.removeAllRanges();
    s.addRange(r);
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-copy]');
    if (!btn) return;
    var el = document.querySelector(btn.getAttribute('data-copy'));
    if (!el) return;
    var text = el.textContent.trim();
    var fallback = function () {
      selectText(el);
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (x) {}
      if (ok) copied(btn); else say('The text is selected: press Ctrl+C or Cmd+C to copy it');
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(function () { copied(btn); }, fallback);
    else fallback();
  });

  // ---- films ----
  [].forEach.call(document.querySelectorAll('[data-film]'), function (btn) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    if (!panel) return;
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      panel.hidden = open;
      var v = panel.querySelector('video');
      if (open && v) v.pause();
    });
  });
  [].forEach.call(document.querySelectorAll('a[data-transcript]'), function (a) {
    a.addEventListener('click', function () {
      var d = document.querySelector(a.getAttribute('href'));
      if (d && d.tagName === 'DETAILS') d.open = true;
    });
  });

  // ---- loops ----
  var reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  [].forEach.call(document.querySelectorAll('video.loop'), function (v) {
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.removeAttribute('autoplay');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'loop-btn';
    var set = function (playing) {
      btn.textContent = playing ? 'Pause' : 'Play';
      btn.setAttribute('aria-label', (playing ? 'Pause' : 'Play') + ' the animation');
    };
    btn.addEventListener('click', function () {
      if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause();
    });
    v.addEventListener('play', function () { set(true); });
    v.addEventListener('pause', function () { set(false); });
    set(false);
    v.parentNode.appendChild(btn);
    if (!reduce.matches) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  });
})();

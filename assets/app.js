/* ROAST — shared client behavior. Roasting runs through /api/roast (Cloudflare Pages Function). */
(function () {
  'use strict';

  // ---- Scroll reveal ----
  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (e) { io.observe(e); });
  } else {
    revealEls.forEach(function (e) { e.classList.add('in'); });
  }

  // ---- Mobile menu ----
  var menuBtn = document.getElementById('menu-btn');
  var mobileMenu = document.getElementById('mobile-menu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', function () { mobileMenu.classList.toggle('hidden'); });
  }

  // ---- Auth (localStorage demo, not secure, no backend) ----
  function getUser() {
    try { return JSON.parse(localStorage.getItem('roast_user')); } catch (e) { return null; }
  }
  function setUser(email) { localStorage.setItem('roast_user', JSON.stringify({ email: email })); }
  function clearUser() { localStorage.removeItem('roast_user'); }

  function refreshAuthUI() {
    var u = getUser();
    document.querySelectorAll('[data-auth-in]').forEach(function (el) { el.classList.toggle('hidden', !u); });
    document.querySelectorAll('[data-auth-out]').forEach(function (el) { el.classList.toggle('hidden', !!u); });
    if (u) document.querySelectorAll('[data-user-email]').forEach(function (el) { el.textContent = u.email; });
  }
  refreshAuthUI();

  document.querySelectorAll('[data-logout]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); clearUser(); window.location.href = 'index.html'; });
  });

  var reEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function fail(errEl, msg, field) { errEl.textContent = msg; errEl.classList.remove('hidden'); if (field) field.focus(); }

  // ---- Sign up ----
  var su = document.getElementById('form-signup');
  if (su) {
    su.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var err = su.querySelector('[data-error]'); err.classList.add('hidden');
      var email = su.email.value.trim(), pw = su.password.value, pw2 = su.confirm.value;
      if (!reEmail.test(email)) return fail(err, 'Enter a valid email.', su.email);
      if (pw.length < 6) return fail(err, 'Password needs at least 6 characters.', su.password);
      if (pw !== pw2) return fail(err, 'Passwords do not match.', su.confirm);
      setUser(email);
      window.location.href = 'app.html';
    });
  }

  // ---- Log in ----
  var li = document.getElementById('form-login');
  if (li) {
    li.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var err = li.querySelector('[data-error]'); err.classList.add('hidden');
      var email = li.email.value.trim(), pw = li.password.value;
      if (!reEmail.test(email)) return fail(err, 'Enter a valid email.', li.email);
      if (pw.length < 6) return fail(err, 'Password needs at least 6 characters.', li.password);
      setUser(email);
      window.location.href = 'app.html';
    });
  }

  // ---- App page guard ----
  if (document.body.hasAttribute('data-guard')) {
    var loggedIn = !!getUser();
    document.querySelectorAll('[data-gated]').forEach(function (el) { el.classList.toggle('hidden', !loggedIn); });
    document.querySelectorAll('[data-need-auth]').forEach(function (el) { el.classList.toggle('hidden', loggedIn); });
  }

  // ---- Roast tool (OpenRouter) ----
  var ROAST_SYSTEM = 'You are a brutally honest landing page critic. Given the visible text of a landing page, return a strict verdict in this exact shape:\nGrade: <a single letter A to F, plus or minus allowed>\nThen exactly 5 numbered issues. Each issue is one sharp sentence, ranked by conversion impact. Be concrete, specific and a little funny. No intro, no closing, no fluff.';

  var rf = document.getElementById('form-roast');
  if (rf) {
    var out = document.getElementById('roast-output');
    var loading = document.getElementById('roast-loading');
    var phase = document.getElementById('roast-phase');
    var status = document.getElementById('roast-status');
    var meta = document.getElementById('roast-meta');

    function showLoading(text, metaText) {
      out.classList.remove('hidden');
      loading.classList.remove('hidden');
      loading.classList.add('flex');
      status.classList.add('hidden');
      if (phase) phase.textContent = text;
      if (meta) meta.textContent = metaText;
    }
    function showResult(text, metaText) {
      out.classList.remove('hidden');
      loading.classList.add('hidden');
      loading.classList.remove('flex');
      status.classList.remove('hidden');
      status.textContent = text;
      if (meta) meta.textContent = metaText;
    }

    // Direct client-side call. Local dev fallback only (needs window.ROAST_KEY).
    function directRoast(target, finish) {
      var key = window.ROAST_KEY;
      if (!key) {
        showResult('No API key configured. On the live site, set OPENROUTER_KEY in Cloudflare Pages env vars. For local dev, add assets/secrets.js.', 'no key');
        finish();
        return;
      }
      showLoading('Reading the page', 'reading');
      fetch('https://r.jina.ai/' + target)
        .then(function (r) { return r.ok ? r.text() : ''; })
        .catch(function () { return ''; })
        .then(function (pageText) {
          showLoading('Roasting your page', 'roasting');
          var userMsg = 'URL: ' + target + '\n\nVisible page text:\n' +
            (pageText ? pageText.slice(0, 6000) : '(could not fetch the page, critique it based on the URL and what such pages usually get wrong)');
          return fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'openrouter/free', messages: [{ role: 'system', content: ROAST_SYSTEM }, { role: 'user', content: userMsg }] })
          });
        })
        .then(function (resp) { return resp.json(); })
        .then(function (data) {
          var content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
          if (content) showResult(content.trim(), 'done');
          else showResult('No verdict came back. ' + (data && data.error ? (data.error.message || JSON.stringify(data.error)) : 'Try again.'), 'error');
        })
        .catch(function (e) { showResult('Something broke: ' + e.message, 'error'); })
        .then(finish);
    }

    rf.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var err = rf.querySelector('[data-error]'); if (err) err.classList.add('hidden');
      var btn = rf.querySelector('button[type=submit]');
      var url = rf.url.value.trim();
      if (!url) { if (err) { err.textContent = 'Paste a URL first.'; err.classList.remove('hidden'); } rf.url.focus(); return; }

      var target = /^https?:\/\//i.test(url) ? url : 'https://' + url;
      btn.disabled = true; var label = btn.textContent; btn.textContent = 'Roasting...';
      function finish() { btn.disabled = false; btn.textContent = label; }
      showLoading('Roasting your page', 'roasting');

      // Prefer the server-side proxy (Cloudflare Pages Function /api/roast).
      fetch('/api/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target })
      })
        .then(function (r) {
          var ct = r.headers.get('content-type') || '';
          if (ct.indexOf('application/json') === -1) return null; // not the Pages Function -> fall back
          return r.json().catch(function () { return null; });
        })
        .then(function (data) {
          if (!data) { directRoast(target, finish); return; } // no proxy (e.g. local static server)
          if (data.content) showResult(data.content, 'done');
          else showResult('No verdict. ' + ((data.error && data.error.message) || 'Try again.'), 'error');
          finish();
        })
        .catch(function () { directRoast(target, finish); });
    });
  }
})();

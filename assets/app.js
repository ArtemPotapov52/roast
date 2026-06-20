/* ROAST — shared client behavior (demo: no backend) */
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

  // ---- Roast tool (placeholder until the AI backend is wired) ----
  var rf = document.getElementById('form-roast');
  if (rf) {
    rf.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var err = rf.querySelector('[data-error]'); if (err) err.classList.add('hidden');
      var url = rf.url.value.trim();
      if (!url) { if (err) { err.textContent = 'Paste a URL first.'; err.classList.remove('hidden'); } rf.url.focus(); return; }
      var out = document.getElementById('roast-output');
      var status = document.getElementById('roast-status');
      if (status) status.textContent = 'Analyzing ' + url + ' ... backend not connected yet. The AI verdict will render here.';
      if (out) out.classList.remove('hidden');
    });
  }
})();

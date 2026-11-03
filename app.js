/* СЭС Служба — интерактив (ваниль). Заменяет утерянный JS исходника.
   Меню, мега-подменю, модалка, geobar, отправка заявки, маска телефона, cookie.
   FAQ — нативные <details>, JS не нужен. */
(function () {
  'use strict';
  var d = document;
  var mqMobile = window.matchMedia('(max-width: 992px)');

  /* ---------- Бургер (мобильное меню) ---------- */
  var header = d.querySelector('.header');
  var burger = d.querySelector('.burger');
  if (burger && header) {
    burger.addEventListener('click', function () {
      var open = header.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      d.body.classList.toggle('has-menu-open', open);
    });
    header.querySelectorAll('.nav__link').forEach(function (a) {
      a.addEventListener('click', function () {
        if (!a.closest('.has-children') || !mqMobile.matches) {
          header.classList.remove('is-open');
          burger.setAttribute('aria-expanded', 'false');
          d.body.classList.remove('has-menu-open');
        }
      });
    });
  }

  /* ---------- Мега-подменю на мобильном ---------- */
  d.querySelectorAll('.nav__item.has-children > .nav__link').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (!mqMobile.matches) return; // на десктопе работает :hover
      e.preventDefault();
      var li = link.parentElement;
      var open = li.classList.toggle('is-open');
      link.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* ---------- Модалка «Заказать обработку» ---------- */
  var modal = d.getElementById('callback-modal');
  var lastFocus = null;
  function openModal() {
    if (!modal) return;
    lastFocus = d.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    d.body.classList.add('has-modal-open');
    var f = modal.querySelector('input[name="name"]');
    if (f) setTimeout(function () { f.focus(); }, 30);
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    d.body.classList.remove('has-modal-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  d.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-modal]');
    if (opener) { e.preventDefault(); openModal(); return; }
    if (e.target.closest('[data-modal-close]')) { e.preventDefault(); closeModal(); }
  });
  d.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal && modal.classList.contains('is-open')) closeModal();
  });

  /* ---------- Geobar «Выбрать город» ---------- */
  var geoToggle = d.querySelector('[data-geobar-toggle]');
  var geoList = d.getElementById('geobar-list');
  if (geoToggle && geoList) {
    geoToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = geoList.hasAttribute('hidden');
      if (open) { geoList.removeAttribute('hidden'); } else { geoList.setAttribute('hidden', ''); }
      geoToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    d.addEventListener('click', function (e) {
      if (!geoList.contains(e.target) && e.target !== geoToggle) {
        geoList.setAttribute('hidden', '');
        geoToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- Маска телефона ---------- */
  function maskPhone(v) {
    var x = v.replace(/\D/g, '');
    if (x[0] === '8') x = '7' + x.slice(1);
    if (x[0] !== '7') x = '7' + x;
    x = x.slice(0, 11);
    var r = '+7';
    if (x.length > 1) r += ' (' + x.slice(1, 4);
    if (x.length >= 4) r += ') ' + x.slice(4, 7);
    if (x.length >= 7) r += '-' + x.slice(7, 9);
    if (x.length >= 9) r += '-' + x.slice(9, 11);
    return r;
  }
  d.querySelectorAll('input[type="tel"], input[name="phone"]').forEach(function (inp) {
    inp.addEventListener('input', function () {
      var p = inp.selectionStart === inp.value.length;
      inp.value = maskPhone(inp.value);
    });
  });

  /* ---------- Отправка заявки ---------- */
  function noteEl(form) {
    var n = form.querySelector('.form-note');
    if (!n) {
      n = d.createElement('p');
      n.className = 'form-note';
      n.setAttribute('role', 'status');
      n.setAttribute('aria-live', 'polite');
      form.appendChild(n);
    }
    return n;
  }
  function setErr(input, on) {
    var f = input && input.closest('.field');
    if (f) f.classList.toggle('is-error', !!on);
  }
  d.querySelectorAll('form.cta__form').forEach(function (form) {
    form.setAttribute('novalidate', '');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.querySelector('input[name="name"]');
      var phone = form.querySelector('input[name="phone"]');
      var agree = form.querySelector('input[name="agree"]');
      var hp = form.querySelector('input[name="company"]');
      var note = noteEl(form);
      note.className = 'form-note';
      note.textContent = '';
      var ok = true;
      if (!name || !name.value.trim()) { setErr(name, true); ok = false; } else setErr(name, false);
      var digits = phone ? phone.value.replace(/\D/g, '') : '';
      if (digits.length < 11) { setErr(phone, true); ok = false; } else setErr(phone, false);
      if (agree && !agree.checked) { ok = false; note.classList.add('is-fail'); note.textContent = 'Отметьте согласие на обработку данных.'; }
      if (!ok) { if (!note.textContent) { note.classList.add('is-fail'); note.textContent = 'Проверьте имя и телефон.'; } return; }
      if (hp && hp.value) return; // ханипот: бот
      form.classList.add('is-sending');
      var fd = new FormData(form);
      fd.append('page', location.pathname);
      fetch(form.getAttribute('action') || '/api/lead.php', { method: 'POST', body: fd })
        .then(function (r) { return r.json().catch(function (err) { return { ok: r.ok }; }); })
        .then(function (res) {
          form.classList.remove('is-sending');
          // send.php отвечает {ok}, api/lead.php — {success, message}
          if (!res || res.ok === false || res.success === false) { throw res || {}; }
          note.classList.add('is-ok');
          note.textContent = (res && res.message) || 'Заявка отправлена. Свяжемся с вами в рабочее время.';
          form.reset();
          if (window.ym && window.__ym_id) window.ym(window.__ym_id, 'reachGoal', 'lead');
        })
        .catch(function (err) {
          form.classList.remove('is-sending');
          note.classList.add('is-fail');
          var msg = (err && err.message) || 'Не удалось отправить. Попробуйте ещё раз через минуту.';
          note.innerHTML = msg + ' Или позвоните: <a href="tel:+78633084977">+7 (863) 308-49-77</a>.';
        });
    });
  });

  /* ---------- Cookie-баннер + согласие на аналитику ----------
     Яндекс.Метрика грузится ТОЛЬКО после разрешения аналитики (не из <head>). */
  var METRIKA_ID = '113598747'; // = lib/site.js METRIKA_ID; меняешь там — поменяй и тут
  var CK_KEY = 'ses.cookie.consent.v1';
  var CK_TEXT = 'Мы используем файлы cookie, чтобы сайт работал и становился удобнее. ' +
    'Нажимая «Хорошо», вы соглашаетесь с обработкой данных согласно Политике обработки ' +
    'персональных данных и Уведомлению об использовании cookie.';

  function ckRead() {
    try { var r = localStorage.getItem(CK_KEY); if (!r) return null; var p = JSON.parse(r); return (p && typeof p === 'object') ? p : null; } catch (_) { return null; }
  }
  function ckWrite(analytics) {
    try { localStorage.setItem(CK_KEY, JSON.stringify({ v: 1, analytics: !!analytics, at: new Date().toISOString(), text: CK_TEXT })); } catch (_) {}
  }
  function startMetrika() {
    if (!METRIKA_ID || window.__sesMetrika) return;
    window.__sesMetrika = true; window.__ym_id = METRIKA_ID;
    var src = 'https://mc.yandex.ru/metrika/tag.js';
    window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
    window.ym.l = 1 * new Date();
    for (var i = 0; i < document.scripts.length; i++) if (document.scripts[i].src === src) return;
    var el = d.createElement('script'); var first = d.getElementsByTagName('script')[0];
    el.async = 1; el.src = src; first.parentNode.insertBefore(el, first);
    window.ym(METRIKA_ID, 'init', { webvisor: true, clickmap: true, trackLinks: true, accurateTrackBounce: true });
  }

  (function cookieInit() {
    var banner = d.getElementById('cookie-banner');
    var mainPanel = banner && banner.querySelector('[data-cookie-main]');
    var setPanel = banner && banner.querySelector('[data-cookie-panel]');
    var toggle = banner && banner.querySelector('[data-cookie-analytics]');
    var hadAnalytics = false;

    function show(expanded) {
      if (!banner) return;
      banner.hidden = false;
      if (mainPanel) mainPanel.hidden = !!expanded;
      if (setPanel) setPanel.hidden = !expanded;
    }
    function hide() { if (banner) banner.hidden = true; }
    function decide(allow) {
      ckWrite(allow); hide();
      if (allow) startMetrika();
      else if (hadAnalytics && window.__sesMetrika) location.reload(); // отзыв после старта счётчика
    }

    var saved = ckRead();
    if (saved) { hadAnalytics = !!saved.analytics; if (saved.analytics) startMetrika(); }
    else if (banner) show(false);

    if (banner) {
      banner.addEventListener('click', function (e) {
        if (e.target.closest('[data-cookie-accept-all]')) { if (toggle) toggle.checked = true; decide(true); }
        else if (e.target.closest('[data-cookie-necessary]')) { if (toggle) toggle.checked = false; decide(false); }
        else if (e.target.closest('[data-cookie-expand]')) show(true);
        else if (e.target.closest('[data-cookie-collapse]')) show(false);
        else if (e.target.closest('[data-cookie-save]')) decide(toggle ? toggle.checked : true);
      });
    }

    // «Настройки cookie» в подвале / на /cookie/ — открыть баннер заново (раскрытым).
    d.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-cookie-settings]');
      if (!t) return;
      e.preventDefault();
      var cur = ckRead(); hadAnalytics = cur ? !!cur.analytics : false;
      if (toggle) toggle.checked = cur ? !!cur.analytics : true;
      show(true);
    });
  })();
})();

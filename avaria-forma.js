/* Временная заглушка форм на время аварии хостинга (ноябрь 2026).
   Сайты отдаются копией с GitHub Pages, где нет PHP-обработчиков заявок.
   При отправке любой формы показываем окно: «позвоните или напишите в мессенджер».
   Телефон и мессенджеры берутся со страницы, поэтому совпадают с тем, что видит посетитель
   (в т. ч. с подменным номером колтрекинга). Убрать вместе с возвратом на основной хостинг. */
(function () {
  if (window.__avariaForma) return;
  window.__avariaForma = 1;

  var LEAD_URL = /(send\.php|lead\.php|form\.php|lead-api|\/api\/lead)/i;

  function first(sel) {
    var a = document.querySelectorAll(sel);
    for (var i = 0; i < a.length; i++) if (a[i].offsetParent !== null || i === a.length - 1) return a[i];
    return null;
  }

  function phone() {
    var a = first('a[href^="tel:"]');
    if (!a) return null;
    var href = a.getAttribute('href');
    var m = (a.textContent || '').replace(/\s+/g, ' ').match(/\+?\d[\d ()\-]{8,}\d/);
    var txt = m ? m[0].trim() : '';
    if (!txt) {
      var d = href.replace(/\D/g, '');
      txt = d.length === 11
        ? '+' + d[0] + ' (' + d.slice(1, 4) + ') ' + d.slice(4, 7) + '-' + d.slice(7, 9) + '-' + d.slice(9)
        : href.replace('tel:', '');
    }
    return { href: href, text: txt };
  }

  function messengers() {
    var kinds = [
      ['Telegram', 'a[href*="t.me/"], a[href*="telegram.me/"]'],
      ['WhatsApp', 'a[href*="wa.me/"], a[href*="api.whatsapp.com"]'],
      ['MAX', 'a[href*="max.ru/u/"]'],
      ['ВКонтакте', 'a[href*="vk.me/"]']
    ];
    var out = [];
    kinds.forEach(function (k) {
      var a = document.querySelector(k[1]);
      if (a) out.push({ name: k[0], href: a.getAttribute('href') });
    });
    return out;
  }

  function q(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }

  function show() {
    if (document.getElementById('avaria-forma')) return;
    var p = phone(), m = messengers();
    var btn = 'display:block;margin:10px 0 0;padding:14px 18px;border-radius:10px;font:600 17px/1.2 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;text-decoration:none;text-align:center;';
    var html = '<div role="dialog" aria-modal="true" aria-labelledby="avaria-forma-h" style="background:#fff;color:#1d1d1f;max-width:420px;width:100%;border-radius:16px;padding:24px 22px 20px;box-shadow:0 20px 60px rgba(0,0,0,.35);position:relative;font:16px/1.45 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif">'
      + '<button type="button" data-avaria-close aria-label="Закрыть" style="position:absolute;top:8px;right:10px;border:0;background:none;font-size:28px;line-height:1;color:#888;cursor:pointer;padding:6px">×</button>'
      + '<div id="avaria-forma-h" style="font-weight:700;font-size:20px;line-height:1.25;margin:0 28px 10px 0">Заявки через форму временно не принимаются</div>'
      + '<div style="color:#444">По техническим причинам форма сейчас не отправляет заявки. Позвоните нам или напишите в мессенджер — ответим быстро.</div>';
    if (p) html += '<a href="' + q(p.href) + '" style="' + btn + 'background:#1f8f3a;color:#fff">Позвонить ' + q(p.text) + '</a>';
    m.forEach(function (x) {
      if (!/^https:\/\//.test(x.href)) return;
      html += '<a href="' + q(x.href) + '" target="_blank" rel="noopener" style="' + btn + 'background:#f2f2f4;color:#1d1d1f">Написать в ' + x.name + '</a>';
    });
    html += '</div>';
    var wrap = document.createElement('div');
    wrap.id = 'avaria-forma';
    wrap.setAttribute('style', 'position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px');
    wrap.innerHTML = html;
    function close() { wrap.remove(); document.removeEventListener('keydown', esc); }
    function esc(e) { if (e.key === 'Escape') close(); }
    wrap.addEventListener('click', function (e) { if (e.target === wrap || e.target.closest('[data-avaria-close]')) close(); });
    document.addEventListener('keydown', esc);
    document.body.appendChild(wrap);
    var c = wrap.querySelector('[data-avaria-close]'); if (c) c.focus();
  }

  function isLeadForm(f) {
    return f && f.tagName === 'FORM' && f.getAttribute('role') !== 'search' && !f.querySelector('input[type="search"]');
  }

  document.addEventListener('submit', function (e) {
    if (!isLeadForm(e.target)) return;
    e.preventDefault(); e.stopImmediatePropagation(); show();
  }, true);

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button, input[type="submit"], input[type="image"]');
    if (!b || b.hasAttribute('data-avaria-close')) return;
    var f = b.form || b.closest('form');
    if (!isLeadForm(f)) return;
    var t = (b.getAttribute('type') || 'submit').toLowerCase();
    if (t !== 'submit' && t !== 'image') return;
    e.preventDefault(); e.stopImmediatePropagation(); show();
  }, true);

  // Подстраховка: формы, которые шлют заявку скриптом без отправки <form>
  var origFetch = window.fetch;
  if (origFetch) window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    if (LEAD_URL.test(url)) { show(); return Promise.resolve(new Response('{"ok":false}', { status: 503, headers: { 'Content-Type': 'application/json' } })); }
    return origFetch.apply(this, arguments);
  };
  var origOpen = XMLHttpRequest.prototype.open, origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) { this.__avariaLead = LEAD_URL.test(String(url)); return origOpen.apply(this, arguments); };
  XMLHttpRequest.prototype.send = function () { if (this.__avariaLead) { show(); return; } return origSend.apply(this, arguments); };
})();

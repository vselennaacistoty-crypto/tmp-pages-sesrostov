/* Внутренние страницы: вкладки цен и рубрики блога.
   До 11.10.2026 вкладки на сайте не переключались (скрипта не было) — видны были только цены квартир.
   Меню, окно заявки, форма, cookie — в общем /app.js. */
(function () {
  'use strict';
  var d = document;

  function label(tab) {
    // текст вкладки без счётчика («Клопы 9» → «Клопы»)
    var c = tab.cloneNode(true);
    c.querySelectorAll('.blog-tabs__count').forEach(function (s) { s.remove(); });
    return c.textContent.replace(/\s+/g, ' ').trim();
  }

  d.querySelectorAll('[role="tablist"]').forEach(function (list) {
    var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
    var panels = Array.prototype.slice.call(list.parentElement.querySelectorAll(':scope > [role="tabpanel"]'));
    var isBlog = list.classList.contains('blog-tabs');
    var section = list.closest('section') || d;
    var cards = isBlog ? Array.prototype.slice.call(section.querySelectorAll('.post-card')) : [];

    function select(i, focus) {
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
      });
      if (panels.length === tabs.length) panels.forEach(function (p, k) { p.classList.toggle('is-active', k === i); p.hidden = k !== i; });
      if (isBlog) {
        var name = label(tabs[i]);
        var all = i === 0;
        cards.forEach(function (c) {
          var cat = c.querySelector('.post-card__cat');
          c.hidden = !all && !(cat && cat.textContent.trim() === name);
        });
      }
      if (focus) tabs[i].focus();
    }

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          var n = (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
          select(n, true);
        }
      });
    });
    var start = tabs.findIndex(function (t) { return t.classList.contains('is-active'); });
    select(start < 0 ? 0 : start);
  });

  // Открытое мобильное меню: стрелка «Услуги» показывает подменю (сам клик обрабатывает /app.js).
  d.querySelectorAll('.site-header .nav__item.has-children > .nav__link').forEach(function (a) {
    a.addEventListener('click', function () {
      var li = a.parentElement;
      setTimeout(function () { a.setAttribute('aria-expanded', li.classList.contains('is-open') ? 'true' : 'false'); }, 0);
    });
  });
})();

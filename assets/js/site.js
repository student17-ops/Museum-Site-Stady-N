/*
 * Інтерактив сторінки на розмітці дизайн-системи SCM:
 * меню «Меню» вужче за 1280px, поточний розділ (aria-current="location"),
 * перемикач UA/EN, кнопки «Записатися» в картках і форма запису (BookingForm).
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function scrollBehavior() { return reduceMotion.matches ? 'auto' : 'smooth'; }

  /* ---------- Меню ---------- */
  var header = document.querySelector('.scm-header');
  var menuBtn = header && header.querySelector('.scm-header__menu');

  function setMenu(open) {
    header.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        menuBtn.focus();
      }
    });
  }

  /* ---------- Поточний розділ ---------- */
  var navLinks = document.querySelectorAll('.scm-header__nav a');
  // Меню однакове на всіх сторінках (index.html#…), тож порівнюємо і якір, і сторінку; «/» = «/index.html»
  function samePage(path) { return path.replace(/\/$/, '/index.html') === location.pathname.replace(/\/$/, '/index.html'); }
  function markCurrent(hash) {
    navLinks.forEach(function (a) {
      if (a.getAttribute('aria-current') === 'page') return; // посилання на поточну сторінку (courses.html) лишаємо позначеним
      if (a.hash && a.hash === hash && samePage(a.pathname)) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
  }
  navLinks.forEach(function (a) {
    a.addEventListener('click', function () {
      markCurrent(a.hash);
      if (menuBtn) setMenu(false);
    });
  });
  if (location.hash) markCurrent(location.hash);

  /* ---------- Мова ----------
   * Англійських текстів ще немає (відкрите питання 4): перемикач запам'ятовує вибір
   * і синхронізує шапку й підвал. Форма при цьому не скидається.
   */
  var langButtons = document.querySelectorAll('.scm-lang__opt');
  function setLang(lang) {
    langButtons.forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.lang === lang ? 'true' : 'false');
    });
    try { localStorage.setItem('scm-lang', lang); } catch (err) { /* без сховища */ }
  }
  langButtons.forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.dataset.lang); });
  });
  try {
    var saved = localStorage.getItem('scm-lang');
    if (saved === 'ua' || saved === 'en') setLang(saved);
  } catch (err) { /* без сховища */ }

  /* ---------- «Показати більше» в сітці експонатів ----------
   * Спершу видно EXHIBITS_STEP карток (один ряд на широкому екрані), кожне натискання
   * відкриває ще стільки ж. Фокус переходить на першу відкриту картку, щоб клавіатурою
   * не довелося шукати нове місце. Коли прихованих не лишилося, кнопка зникає.
   */
  var EXHIBITS_STEP = 3;
  var moreBtn = document.getElementById('exhibits-more');
  var exhibitsGrid = document.getElementById('exhibits-grid');
  if (moreBtn && exhibitsGrid) {
    var moreBox = moreBtn.parentElement;
    var cards = Array.prototype.slice.call(exhibitsGrid.querySelectorAll('.exhibit-card'));
    if (cards.length > EXHIBITS_STEP) {
      cards.forEach(function (card, i) { if (i >= EXHIBITS_STEP) card.hidden = true; });
      moreBox.hidden = false;
      moreBtn.addEventListener('click', function () {
        var rest = cards.filter(function (card) { return card.hidden; });
        var next = rest.slice(0, EXHIBITS_STEP);
        next.forEach(function (card) { card.hidden = false; });
        next[0].setAttribute('tabindex', '-1');
        next[0].focus();
        if (rest.length <= EXHIBITS_STEP) moreBox.hidden = true;
      });
    }
  }

  /* ---------- Форма запису ---------- */
  var form = document.getElementById('booking-form');
  if (!form) return;

  var fields = {
    dir: document.getElementById('f-dir'),
    name: document.getElementById('f-name'),
    phone: document.getElementById('f-phone')
  };
  var labels = { dir: 'Напрям', name: "Ваше ім'я", phone: 'Телефон' };
  var errorsBox = document.getElementById('form-errors');
  var errorsText = document.getElementById('form-errors-text');
  var failedBox = document.getElementById('form-failed');
  var submitBtn = document.getElementById('form-submit');
  var submitLabel = submitBtn.querySelector('span');
  var successBox = document.getElementById('form-success');
  var successDir = document.getElementById('success-dir');
  var againBtn = document.getElementById('form-again');
  var dirNote = document.getElementById('f-dir-note');
  var tried = false;

  function check() {
    var digits = fields.phone.value.replace(/[^0-9]/g, '');
    return {
      dir: !!fields.dir.value,
      name: fields.name.value.trim().length >= 2,
      phone: /^\+?380/.test(fields.phone.value.trim()) && digits.length === 12
    };
  }

  function showErrors(result) {
    var bad = Object.keys(result).filter(function (k) { return !result[k]; });
    Object.keys(fields).forEach(function (k) {
      var invalid = bad.indexOf(k) !== -1;
      document.getElementById('field-' + k).classList.toggle('has-error', invalid);
      if (invalid) fields[k].setAttribute('aria-invalid', 'true');
      else fields[k].removeAttribute('aria-invalid');
      document.getElementById('f-' + k + '-err').hidden = !invalid;
    });
    if (bad.length) {
      errorsText.textContent = 'Перевірте ' + (bad.length > 1 ? 'поля' : 'поле') + ': ' +
        bad.map(function (k) { return labels[k]; }).join(', ') + '.';
    }
    errorsBox.hidden = bad.length === 0;
    return bad;
  }

  /* Повна назва обраного напряму під полем: на вузькому екрані в самому списку вона може не вміститися */
  function showChosen() {
    var opt = fields.dir.options[fields.dir.selectedIndex];
    dirNote.textContent = fields.dir.value ? 'Обрано: ' + opt.text : '';
  }

  Object.keys(fields).forEach(function (k) {
    fields[k].addEventListener(k === 'dir' ? 'change' : 'input', function () {
      if (tried) showErrors(check());
      if (k === 'dir') showChosen();
    });
  });

  function setBusy(busy) {
    Object.keys(fields).forEach(function (k) { fields[k].disabled = busy; });
    submitBtn.disabled = busy;
    form.setAttribute('aria-busy', busy ? 'true' : 'false');
    submitLabel.textContent = busy ? 'Надсилаємо…' : (failedBox.hidden ? 'Надіслати заявку' : 'Надіслати ще раз');
  }

  /*
   * Доставка заявки. Адресата ще не визначено (відкрите питання 1):
   * коли з'явиться серверна частина, вкажіть її адресу в атрибуті action форми.
   * Без action — тестова відповідь: успіх через пів секунди.
   */
  function sendBooking(data) {
    var endpoint = form.getAttribute('action');
    if (!endpoint) return new Promise(function (resolve) { setTimeout(resolve, 500); });
    return fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    tried = true;
    var bad = showErrors(check());
    if (bad.length) {
      failedBox.hidden = true;
      fields[bad[0]].focus();
      return;
    }
    var data = {
      direction: fields.dir.value,
      name: fields.name.value.trim(),
      phone: fields.phone.value.replace(/[\s()-]/g, '')
    };
    setBusy(true);
    sendBooking(data).then(function () {
      failedBox.hidden = true;
      setBusy(false);
      successDir.textContent = data.direction;
      form.hidden = true;
      successBox.hidden = false;
      successBox.focus();
    }, function () {
      failedBox.hidden = false;
      setBusy(false);
      failedBox.focus();
    });
  });

  function resetForm() {
    form.reset();
    tried = false;
    showErrors({ dir: true, name: true, phone: true });
    failedBox.hidden = true;
    dirNote.textContent = '';
    setBusy(false);
    successBox.hidden = true;
    form.hidden = false;
  }
  againBtn.addEventListener('click', function () {
    resetForm();
    fields.dir.focus();
  });

  /* ---------- «Записатися» в картках: прокрутка до форми й підстановка напряму ---------- */
  document.querySelectorAll('[data-book]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      if (form.hidden) resetForm();
      fields.dir.value = link.getAttribute('data-book');
      if (tried) showErrors(check());
      showChosen();
      document.getElementById('booking').scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
      history.replaceState(null, '', '#booking');
      fields.name.focus({ preventScroll: true });
    });
  });
})();

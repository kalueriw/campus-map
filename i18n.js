/* ==========================================================================
   BiUH Campus Map — English / 中文 switch
   The English text stays in the markup; each translatable element carries a
   data-zh attribute with its Chinese text. Inputs use data-ph-zh for the
   placeholder and aria-labels use data-al-zh.
   ========================================================================== */

(function () {
  'use strict';

  var STORAGE_KEY = 'campus-map-lang';
  var listeners = [];
  var lang = 'en';

  function stored() {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return null;
    }
  }

  function remember(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch (error) {
      /* private mode — the switch still works for this page view. */
    }
  }

  function fromUrl() {
    var match = /[?&]lang=(en|zh)(?:&|$)/.exec(window.location.search);
    return match ? match[1] : null;
  }

  function fromBrowser() {
    var list = navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language || 'en'];
    for (var i = 0; i < list.length; i += 1) {
      if (/^zh/i.test(list[i])) {
        return 'zh';
      }
      if (/^en/i.test(list[i])) {
        return 'en';
      }
    }
    return 'en';
  }

  function each(selector, fn) {
    Array.prototype.forEach.call(document.querySelectorAll(selector), fn);
  }

  function translate(root, next) {
    var scope = root || document;
    Array.prototype.forEach.call(scope.querySelectorAll('[data-zh]'), function (el) {
      if (!el.hasAttribute('data-en')) {
        el.setAttribute('data-en', el.textContent);
      }
      el.textContent = next === 'zh'
        ? el.getAttribute('data-zh')
        : el.getAttribute('data-en');
    });

    Array.prototype.forEach.call(scope.querySelectorAll('[data-ph-zh]'), function (el) {
      if (!el.hasAttribute('data-ph-en')) {
        el.setAttribute('data-ph-en', el.getAttribute('placeholder') || '');
      }
      el.setAttribute('placeholder', next === 'zh'
        ? el.getAttribute('data-ph-zh')
        : el.getAttribute('data-ph-en'));
    });

    Array.prototype.forEach.call(scope.querySelectorAll('[data-al-zh]'), function (el) {
      if (!el.hasAttribute('data-al-en')) {
        el.setAttribute('data-al-en', el.getAttribute('aria-label') || '');
      }
      el.setAttribute('aria-label', next === 'zh'
        ? el.getAttribute('data-al-zh')
        : el.getAttribute('data-al-en'));
    });
  }

  function set(next, options) {
    var settings = options || {};
    lang = next === 'zh' ? 'zh' : 'en';
    document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en');
    document.documentElement.setAttribute('data-lang', lang);
    translate(document, lang);

    each('[data-lang-btn]', function (button) {
      var active = button.getAttribute('data-lang-btn') === lang;
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    if (!settings.remember) {
      remember(lang);
    }
    listeners.forEach(function (fn) {
      fn(lang);
    });
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest ? event.target.closest('[data-lang-btn]') : null;
    if (button) {
      set(button.getAttribute('data-lang-btn'));
    }
  });

  window.CampusI18n = {
    get lang() {
      return lang;
    },
    /* Pick the string for the current language. */
    pick: function (en, zh) {
      return lang === 'zh' && zh ? zh : en;
    },
    onChange: function (fn) {
      listeners.push(fn);
    },
    set: set,
    applyTo: function (root) {
      translate(root, lang);
    },
    /* Resolve the starting language without applying it yet. */
    initial: function () {
      return fromUrl() || stored() || fromBrowser();
    }
  };

  set(window.CampusI18n.initial());
})();

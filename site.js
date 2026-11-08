/* ==========================================================================
   BiUH Campus Map — things every page shares
   The light / dark switch, and a shadow under the header once the page has
   scrolled. The theme itself is chosen by a small script in <head>, before
   the page paints; this file only handles changes to it.
   ========================================================================== */

(function () {
  'use strict';

  var STORAGE_KEY = 'campus-map-theme';
  var root = document.documentElement;
  var systemDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var reduceMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  function stored() {
    try {
      return window.localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return null;
    }
  }

  function syncButtons() {
    var dark = root.getAttribute('data-theme') === 'dark';
    Array.prototype.forEach.call(document.querySelectorAll('[data-theme-toggle]'), function (button) {
      button.setAttribute('aria-pressed', dark ? 'true' : 'false');
    });
  }

  function apply(theme, remember) {
    root.setAttribute('data-theme', theme);
    if (remember) {
      try {
        window.localStorage.setItem(STORAGE_KEY, theme);
      } catch (error) {
        /* private mode: the switch still works for this page view. */
      }
    }
    syncButtons();
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest ? event.target.closest('[data-theme-toggle]') : null;
    if (!button) {
      return;
    }
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    /* Cross-fade, like the language switch, unless less motion is asked for. */
    if (document.startViewTransition && !(reduceMotion && reduceMotion.matches)) {
      document.startViewTransition(function () {
        apply(next, true);
      });
    } else {
      apply(next, true);
    }
  });

  /* Follow the system setting until the visitor picks a theme themselves. */
  if (systemDark) {
    var follow = function (event) {
      if (!stored()) {
        apply(event.matches ? 'dark' : 'light', false);
      }
    };
    if (systemDark.addEventListener) {
      systemDark.addEventListener('change', follow);
    } else if (systemDark.addListener) {
      systemDark.addListener(follow);
    }
  }

  syncButtons();

  /* Header shadow: only once the page has moved, so it separates the header
     from content sliding underneath it. */
  var header = document.querySelector('.site-header');
  if (header) {
    var scrolled = false;
    var check = function () {
      var now = window.scrollY > 4;
      if (now !== scrolled) {
        scrolled = now;
        header.classList.toggle('is-scrolled', now);
      }
    };
    window.addEventListener('scroll', check, { passive: true });
    check();
  }
})();

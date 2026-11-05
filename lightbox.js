/* ==========================================================================
   BiUH Campus Map — shared photo viewer
   Any <a data-lightbox href="photos/…" data-caption="…"> opens the dialog.
   Used by both the map page and the photo gallery.
   ========================================================================== */

(function () {
  'use strict';

  var dialog = document.getElementById('photo-lightbox');
  if (!dialog) {
    return;
  }

  var img = dialog.querySelector('img');
  var caption = dialog.querySelector('.lightbox-caption');
  var lastTrigger = null;

  /* Safari before 15.4 has no showModal(). Leaving the click alone there means
     the link's href still opens the photograph, just without the overlay. */
  if (typeof dialog.showModal !== 'function') {
    return;
  }

  function open(link) {
    if (dialog.open) {
      return;
    }
    var thumb = link.querySelector('img');
    var label = link.getAttribute('data-caption') || '';
    lastTrigger = link;

    img.src = link.getAttribute('href');
    img.alt = thumb ? thumb.alt : label;
    if (caption) {
      caption.textContent = label;
    }
    /* iOS keeps scrolling the page behind a modal dialog; lock it while open. */
    document.body.classList.add('has-dialog');
    dialog.showModal();
  }

  document.addEventListener('click', function (event) {
    var link = event.target && event.target.closest
      ? event.target.closest('[data-lightbox]')
      : null;
    if (!link) {
      return;
    }
    event.preventDefault();
    open(link);
  });

  dialog.addEventListener('click', function (event) {
    /* A click on the backdrop targets the dialog itself; a click on the
       picture or the caption does not. */
    if (event.target !== dialog) {
      return;
    }
    var rect = dialog.getBoundingClientRect();
    var outside = event.clientX < rect.left || event.clientX > rect.right ||
                  event.clientY < rect.top || event.clientY > rect.bottom;
    if (outside) {
      dialog.close();
    }
  });

  dialog.addEventListener('close', function () {
    document.body.classList.remove('has-dialog');
    /* Drop the source so the browser can release the decoded image. */
    img.removeAttribute('src');
    if (lastTrigger) {
      lastTrigger.focus();
      lastTrigger = null;
    }
  });
})();

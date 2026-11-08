/* ==========================================================================
   BiUH Campus Map — map behaviour
   Vanilla JavaScript: select a building or a place inside it, search, filter
   by category. Clicking a building opens its photo.
   No libraries, no server, no stored data.
   ========================================================================== */

(function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';

  /* The places live in data.js, shared with the buildings page. */
  var DATA = window.CampusData;
  if (!DATA) {
    return;
  }
  var BUILDINGS = DATA.places;
  var CATEGORY_LABELS = {};
  var CATEGORY_LABELS_ZH = {};
  DATA.categories.forEach(function (category) {
    CATEGORY_LABELS[category.id] = category.en;
    CATEGORY_LABELS_ZH[category.id] = category.zh;
  });

  /* ---- language ---------------------------------------------------------- */

  var i18n = window.CampusI18n;

  function pick(en, zh) {
    return i18n && i18n.lang === 'zh' && zh ? zh : en;
  }

  function categoryLabel(building) {
    return pick(CATEGORY_LABELS[building.category], CATEGORY_LABELS_ZH[building.category]);
  }

  var svg = document.getElementById('campus-svg');
  var panel = document.getElementById('map-panel');
  var search = document.getElementById('map-search');
  var status = document.getElementById('map-status');
  var legendButtons = Array.prototype.slice.call(document.querySelectorAll('.legend-btn'));
  /* The shared lightbox.js owns the dialog; map.js only asks whether it is
     open, so that Escape does not also step back a panel level. */
  var lightbox = document.getElementById('photo-lightbox');

  if (!svg || !panel || !search || !status) {
    return;
  }

  var groups = {};
  Array.prototype.forEach.call(svg.querySelectorAll('[data-building]'), function (group) {
    groups[group.getAttribute('data-building')] = group;
  });

  var spotLayer = document.getElementById('map-spots');
  var spotEls = {};

  /* ---- flat index of the places inside buildings ------------------------- */

  var SPOTS = [];
  var spotById = {};

  BUILDINGS.forEach(function (building) {
    (building.spots || []).forEach(function (spot) {
      spot.parent = building;
      SPOTS.push(spot);
      spotById[spot.id] = spot;
    });
  });

  var EMPTY_PANEL = panel.innerHTML;
  var selectedId = null;
  var selectedSpotId = null;
  var currentCategory = 'all';
  var query = '';

  function normalize(value) {
    return String(value).toLowerCase().normalize('NFKC');
  }

  function byId(id) {
    for (var i = 0; i < BUILDINGS.length; i += 1) {
      if (BUILDINGS[i].id === id) {
        return BUILDINGS[i];
      }
    }
    return null;
  }

  function spotText(building) {
    return (building.spots || []).map(function (spot) {
      return [spot.en, spot.zh, spot.aliases].join(' ');
    }).join(' ');
  }

  function terms() {
    return query ? query.split(/\s+/) : [];
  }

  function allTermsIn(haystack) {
    return terms().every(function (term) {
      return haystack.indexOf(term) !== -1;
    });
  }

  function matches(building) {
    if (!building) {
      return false;
    }
    if (currentCategory !== 'all' && building.category !== currentCategory) {
      return false;
    }
    if (!query) {
      return true;
    }
    var haystack = normalize([
      building.en,
      building.zh,
      building.aliases,
      CATEGORY_LABELS[building.category],
      CATEGORY_LABELS_ZH[building.category],
      spotText(building)
    ].join(' '));
    return allTermsIn(haystack);
  }

  /* A spot only matches when it matches on its own — otherwise typing
     "dorm" would light up every shop inside the dormitory. */
  function spotMatches(spot) {
    if (!matches(spot.parent)) {
      return false;
    }
    if (!query) {
      return true;
    }
    var haystack = normalize([spot.en, spot.zh, spot.aliases].join(' '));
    return allTermsIn(haystack);
  }

  function updateStatus(count) {
    if (!query && currentCategory === 'all') {
      status.textContent = '';
      return;
    }
    if (count === 0) {
      status.textContent = pick(
        'No places match. Try “teaching”, “gym” or “湖”.',
        '没有匹配的地点。试试「teaching」「健身」或「湖」。');
    } else if (count === 1) {
      status.textContent = pick('1 place shown.', '显示 1 个地点。');
    } else {
      status.textContent = pick(count + ' places shown.', '显示 ' + count + ' 个地点。');
    }
  }

  function applyFilters() {
    var spotVisible = {};
    var count = 0;
    var firstVisible = null;

    BUILDINGS.forEach(function (building) {
      var visible = matches(building);
      var group = groups[building.id];
      if (group) {
        group.classList.toggle('is-dimmed', !visible);
        /* Dimmed shapes stay in the DOM, so take them out of the Tab order
           too — otherwise focus lands on something you cannot see. */
        group.setAttribute('tabindex', visible ? '0' : '-1');
      }
      if (visible) {
        count += 1;
        if (!firstVisible) {
          firstVisible = building.id;
        }
      }
    });

    SPOTS.forEach(function (spot) {
      var visible = spotMatches(spot);
      spotVisible[spot.id] = visible;
      var el = spotEls[spot.id];
      if (el) {
        el.classList.toggle('is-dimmed', !visible);
        el.setAttribute('tabindex', visible ? '0' : '-1');
      }
      if (visible) {
        count += 1;
      }
    });

    legendButtons.forEach(function (button) {
      var category = button.getAttribute('data-category');
      button.setAttribute('aria-pressed', category === currentCategory ? 'true' : 'false');
    });

    updateStatus(count);

    /* A phone shows about a fifth of the drawing at a time and starts at the
       left edge, so a search for "宿舍" would otherwise match something the
       reader cannot see. Slide the first match into view. */
    if ((query || currentCategory !== 'all') && firstVisible && groups[firstVisible]) {
      centerInScroller(groups[firstVisible]);
    }

    if (selectedSpotId && !spotVisible[selectedSpotId]) {
      if (selectedId && matches(byId(selectedId))) {
        selectBuilding(selectedId);
      } else {
        clearSelection();
      }
    } else if (selectedId && !selectedSpotId && !matches(byId(selectedId))) {
      clearSelection();
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ---- panel markup ------------------------------------------------------ */

  function spotChipsMarkup(building) {
    if (!building.spots || !building.spots.length) {
      return '';
    }
    return [
      '<div class="spot-strip" role="group" aria-label="' + escapeHtml(pick('Places inside ' + building.en, building.zh + ' 内的场所')) + '">',
      building.spots.map(function (spot) {
        var active = spot.id === selectedSpotId;
        return [
          '<button class="spot-chip' + (active ? ' is-active' : '') + '" type="button" data-spot="' + escapeHtml(spot.id) + '" aria-pressed="' + (active ? 'true' : 'false') + '">',
          '  <svg class="spot-chip-glyph" viewBox="0 0 16 16" aria-hidden="true">' + (SPOT_ICONS[spot.icon] || '') + '</svg>',
          '  <span>' + escapeHtml(pick(spot.en, spot.zh)) + '</span>',
          '</button>'
        ].join('');
      }).join(''),
      '</div>'
    ].join('');
  }

  function nameLines(item) {
    var primary = pick(item.en, item.zh);
    var secondary = pick(item.zh, item.en);
    return [
      '    <h2 class="panel-name" tabindex="-1">' + escapeHtml(primary) + '</h2>',
      '    <p class="panel-zh" lang="' + pick('zh', 'en') + '">' + escapeHtml(secondary) + '</p>'
    ].join('');
  }

  function renderBuilding(building) {
    panel.innerHTML = [
      spotChipsMarkup(building),
      '<div class="panel-grid">',
      '  <div>',
      '    <p class="chip" data-category="' + building.category + '">' + categoryLabel(building) + '</p>',
      nameLines(building),
      '    <p class="panel-desc">' + escapeHtml(pick(building.desc, building.descZh)) + '</p>',
      '  </div>',
      '  <div class="panel-side">',
      '    <p class="panel-meta"><strong>' + pick('Where', '位置') + '</strong>' + escapeHtml(pick(building.where, building.whereZh)) + '</p>',
      '    <div class="panel-actions">',
      '      <button class="btn btn-ghost" type="button" data-clear>' + pick('Clear selection', '取消选择') + '</button>',
      '      <a class="btn btn-ghost" href="buildings.html#' + building.id + '">' + pick('Open in guide', '在建筑页查看') + '</a>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');
  }

  function renderSpot(spot) {
    var building = spot.parent;
    var crumb = pick(
      'Inside <strong>' + escapeHtml(building.en) + '</strong> · ' + escapeHtml(building.zh),
      '位于<strong>' + escapeHtml(building.zh) + '</strong>内 · ' + escapeHtml(building.en));
    panel.innerHTML = [
      '<p class="panel-breadcrumb">' + crumb + '</p>',
      spotChipsMarkup(building),
      '<div class="panel-grid">',
      '  <div>',
      '    <p class="chip" data-category="' + building.category + '">' + categoryLabel(building) + '</p>',
      nameLines(spot),
      '    <p class="panel-desc">' + escapeHtml(pick(spot.desc, spot.descZh)) + '</p>',
      '  </div>',
      '  <div class="panel-side">',
      '    <p class="panel-meta"><strong>' + pick('Where', '位置') + '</strong>' + escapeHtml(pick(spot.where, spot.whereZh)) + '</p>',
      '    <div class="panel-actions">',
      '      <button class="btn btn-ghost" type="button" data-back>' + pick('Back to ' + building.en, '返回 ' + building.zh) + '</button>',
      '      <button class="btn btn-ghost" type="button" data-clear>' + pick('Clear selection', '取消选择') + '</button>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');
  }

  /* ---- URL --------------------------------------------------------------- */

  function syncUrl() {
    if (!window.history || !window.history.replaceState) {
      return;
    }
    try {
      var url = new URL(window.location.href);
      if (selectedId) {
        url.searchParams.set('building', selectedId);
      } else {
        url.searchParams.delete('building');
      }
      if (selectedSpotId) {
        url.searchParams.set('spot', selectedSpotId);
      } else {
        url.searchParams.delete('spot');
      }
      window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    } catch (error) {
      /* file:// in some browsers blocks history updates — the map still works. */
    }
  }

  function centerInScroller(group) {
    var scroller = document.querySelector('.map-scroller');
    if (!scroller || scroller.scrollWidth <= scroller.clientWidth) {
      return;
    }
    var groupRect = group.getBoundingClientRect();
    var scrollerRect = scroller.getBoundingClientRect();
    var padding = 28;
    var outside = groupRect.left < scrollerRect.left + padding ||
                  groupRect.right > scrollerRect.right - padding;
    if (!outside) {
      return;
    }
    var target = scroller.scrollLeft +
      (groupRect.left - scrollerRect.left) -
      (scrollerRect.width - groupRect.width) / 2;
    var reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    scroller.scrollTo({
      left: target,
      behavior: reduceMotion ? 'auto' : 'smooth'
    });
  }

  /* ---- selection --------------------------------------------------------- */

  /* Rebuilding the panel destroys the button the reader just used, which
     drops focus to <body>. Put it back on the matching control instead. */
  function restorePanelFocus(spotId) {
    var target = spotId
      ? panel.querySelector('.spot-chip[data-spot="' + spotId + '"]')
      : panel.querySelector('.panel-name');
    (target || panel).focus({ preventScroll: true });
  }

  function clearMarks() {
    if (selectedId && groups[selectedId]) {
      groups[selectedId].classList.remove('is-selected');
    }
    if (selectedSpotId && spotEls[selectedSpotId]) {
      spotEls[selectedSpotId].classList.remove('is-active');
    }
  }

  function selectBuilding(id, options) {
    var building = byId(id);
    if (!building) {
      return;
    }
    var settings = options || {};
    var hadPanelFocus = panel.contains(document.activeElement);

    clearMarks();
    selectedId = id;
    selectedSpotId = null;

    if (groups[id]) {
      groups[id].classList.add('is-selected');
      centerInScroller(groups[id]);
    }
    renderBuilding(building);
    renderPhoto(building);
    schedulePlacePhoto();
    revealPhoto();
    if (hadPanelFocus) {
      restorePanelFocus(null);
    }
    if (settings.syncUrl !== false) {
      syncUrl();
    }
  }

  function selectSpot(id, options) {
    var spot = spotById[id];
    if (!spot) {
      return;
    }
    var settings = options || {};
    var hadPanelFocus = panel.contains(document.activeElement);

    clearMarks();
    selectedId = spot.parent.id;
    selectedSpotId = id;

    if (groups[selectedId]) {
      groups[selectedId].classList.add('is-selected');
      centerInScroller(groups[selectedId]);
    }
    if (spotEls[id]) {
      spotEls[id].classList.add('is-active');
    }
    renderSpot(spot);
    renderPhoto(spot);
    schedulePlacePhoto();
    revealPhoto();
    if (hadPanelFocus) {
      restorePanelFocus(id);
    }
    if (settings.syncUrl !== false) {
      syncUrl();
    }
  }

  function clearSelection(options) {
    var settings = options || {};
    var hadPanelFocus = panel.contains(document.activeElement);
    clearMarks();
    selectedId = null;
    selectedSpotId = null;
    renderPhoto(null);
    panel.innerHTML = EMPTY_PANEL;
    /* EMPTY_PANEL was captured after i18n had already translated the page, so
       it holds whichever language was active at load. Re-apply the current one. */
    if (i18n && i18n.applyTo) {
      i18n.applyTo(panel);
    }
    if (hadPanelFocus) {
      panel.focus({ preventScroll: true });
    }
    if (settings.syncUrl !== false) {
      syncUrl();
    }
  }

  function bindActivate(element, handler) {
    element.addEventListener('click', handler);
    element.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        handler();
      }
    });
  }

  Object.keys(groups).forEach(function (id) {
    bindActivate(groups[id], function () {
      selectBuilding(id);
    });
  });

  /* ---- the small markers for places inside a building -------------------- */

  /* Small line drawings for the English page: a letter tells nobody what is
     inside, while a fork, a dumbbell or a book reads without words. Each is
     drawn in a 16 × 16 box and centred on the marker. Chinese keeps its
     single character (餐, 习, 馆 …). */
  var SPOT_ICONS = {
    fork: '<path d="M4.5 2v4M6.5 2v4M8.5 2v4M4.5 6h4M6.5 6v8"/><path d="M11.5 2c1.8 2 1.8 5.2 0 7v5"/>',
    bowl: '<path d="M2.8 8.6h10.4a5.2 5.2 0 0 1-10.4 0Z"/><path d="M6.2 2.4 10 6.4M8.6 1.8 12.4 5.8"/>',
    ball: '<circle cx="8" cy="8" r="5.5"/><path d="M8 2.5v11M4.2 3.3c2 2.8 2 6.6 0 9.4M11.8 3.3c-2 2.8-2 6.6 0 9.4"/>',
    dumbbell: '<path d="M3.5 5.5v5M5.5 4.5v7M10.5 4.5v7M12.5 5.5v5M5.5 8h5"/>',
    book: '<path d="M8 4.5C6.4 3.2 4.4 3 3 3.6v8.2c1.4-.6 3.4-.4 5 .9 1.6-1.3 3.6-1.5 5-.9V3.6c-1.4-.6-3.4-.4-5 .9Z"/><path d="M8 4.5v8.2"/>',
    bag: '<path d="M4 6h8l-.9 7.2a1 1 0 0 1-1 .8H5.9a1 1 0 0 1-1-.8Z"/><path d="M6 6V4.6a2 2 0 0 1 4 0V6"/>',
    coffee: '<path d="M4 6h6.5v2.4a3.25 3.25 0 0 1-6.5 0Z"/><path d="M10.5 7h1.1a1.7 1.7 0 0 1 0 3.4h-1.1"/><path d="M5.8 3.6c0-.7.7-.7.7-1.4M8.2 3.6c0-.7.7-.7.7-1.4"/>',
    parcel: '<path d="M3 5.4 8 2.8l5 2.6v5.4L8 13.4l-5-2.6Z"/><path d="M3 5.4 8 8l5-2.6M8 8v5.4"/>',
    fruit: '<path d="M8 6.3c1.4-1.4 3.9-1 4.4 1.2.5 2.2-1 5.2-3 5.7-1 .2-1.4-.4-1.4-.4s-.4.6-1.4.4c-2-.5-3.5-3.5-3-5.7C4.1 5.3 6.6 4.9 8 6.3Z"/><path d="M8 6.3V4.1"/><path d="M8 4.1c1-1.4 2.4-1.3 3-1 0 .9-1.3 1.8-3 1.6Z"/>'
  };

  /* Markers are siblings of the building shapes, not children: a `role="button"`
     inside another `role="button"` is dropped by screen readers, and a nested
     click would select both the spot and its building. Drawn afterwards in the
     same SVG, they still sit on top. */
  function buildSpotMarkers() {
    if (!spotLayer) {
      return;
    }
    SPOTS.forEach(function (spot) {
      var group = document.createElementNS(SVG_NS, 'g');
      group.setAttribute('class', 'map-spot');
      group.setAttribute('data-spot', spot.id);
      group.setAttribute('data-building', spot.parent.id);
      group.setAttribute('data-category', spot.parent.category);
      group.setAttribute('role', 'button');
      group.setAttribute('tabindex', '0');
      group.setAttribute('transform', 'translate(' + spot.x + ' ' + spot.y + ')');
      group.setAttribute('aria-label', spot.en + ', ' + spot.zh + ' — inside ' + spot.parent.en);

      var title = document.createElementNS(SVG_NS, 'title');
      title.textContent = spot.en + ' · ' + spot.zh;

      var hit = document.createElementNS(SVG_NS, 'circle');
      hit.setAttribute('class', 'spot-hit');
      hit.setAttribute('r', '30');

      var dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('class', 'spot-dot');
      dot.setAttribute('r', '13');

      var icon = document.createElementNS(SVG_NS, 'g');
      icon.setAttribute('class', 'spot-icon');
      icon.setAttribute('aria-hidden', 'true');
      icon.setAttribute('transform', 'translate(-9.2 -9.2) scale(1.15)');
      icon.innerHTML = SPOT_ICONS[spot.icon] || '';

      group.appendChild(title);
      group.appendChild(hit);
      group.appendChild(dot);
      group.appendChild(icon);
      spotLayer.appendChild(group);

      spotEls[spot.id] = group;
      bindActivate(group, function () {
        selectSpot(spot.id);
      });
    });
  }

  function labelSpotMarkers() {
    SPOTS.forEach(function (spot) {
      var el = spotEls[spot.id];
      if (!el) {
        return;
      }
      el.setAttribute('aria-label', pick(
        spot.en + ', ' + spot.zh + ' — inside ' + spot.parent.en,
        spot.zh + '，' + spot.en + ' — 位于' + spot.parent.zh + '内'));
      var title = el.querySelector('title');
      if (title) {
        title.textContent = pick(spot.en + ' · ' + spot.zh, spot.zh + ' · ' + spot.en);
      }
    });
  }

  buildSpotMarkers();
  labelSpotMarkers();

  if (i18n && i18n.onChange) {
    i18n.onChange(function () {
      labelSpotMarkers();
      if (selectedSpotId && spotById[selectedSpotId]) {
        renderSpot(spotById[selectedSpotId]);
      } else if (selectedId && byId(selectedId)) {
        renderBuilding(byId(selectedId));
      } else {
        panel.innerHTML = EMPTY_PANEL;
        if (i18n.applyTo) {
          i18n.applyTo(panel);
        }
      }
      renderPhoto(currentPhotoItem());
      applyFilters();
    });
  }

  /* ---- photo column ------------------------------------------------------ */

  /* The photograph opens in its own column beside the map, so it is large
     enough to read and never covers the drawing. The panel below keeps the
     words. */

  var photoBox = document.getElementById('map-photo');

  function thumbPath(src) {
    return String(src).replace('photos/', 'photos/thumbs/');
  }

  function currentPhotoItem() {
    if (selectedSpotId && spotById[selectedSpotId]) {
      return spotById[selectedSpotId];
    }
    return selectedId ? byId(selectedId) : null;
  }

  /* The photograph floats next to the shape that was just clicked, at every
     width: it lands where the eye already is, and the map keeps the whole
     width instead of sharing it with a column. */
  var mapLayout = document.querySelector('.map-layout');
  var mapCard = document.querySelector('.map-card');
  var mapScroller = document.querySelector('.map-scroller');

  function photoAnchor() {
    if (selectedSpotId && spotEls[selectedSpotId]) {
      return spotEls[selectedSpotId];
    }
    return selectedId ? groups[selectedId] : null;
  }

  function placePhoto() {
    if (!photoBox || !mapLayout || !mapCard) {
      return;
    }
    var anchor = photoAnchor();
    if (!anchor || photoBox.classList.contains('is-empty')) {
      return;
    }
    var a = anchor.getBoundingClientRect();
    var lr = mapLayout.getBoundingClientRect();
    var cr = mapCard.getBoundingClientRect();
    var w = photoBox.offsetWidth;
    var h = photoBox.offsetHeight;
    var gap = 12;
    var margin = 8;

    var minTop = cr.top - lr.top + margin;
    var maxTop = cr.bottom - lr.top - margin - h;

    var top = a.bottom - lr.top + gap;
    if (top > maxTop) {
      top = a.top - lr.top - gap - h;
    }

    var left = (a.left + a.right) / 2 - lr.left - w / 2;
    if (top < minTop) {
      /* A tall shape near the top of the map leaves no room above or below,
         so sit beside it instead of covering part of it. */
      top = Math.max(minTop, Math.min(a.top - lr.top + (a.height - h) / 2, maxTop));
      left = a.right - lr.left + gap;
      if (left + w > cr.right - lr.left - margin) {
        left = a.left - lr.left - gap - w;
      }
    }

    var minLeft = cr.left - lr.left + margin;
    var maxLeft = cr.right - lr.left - margin - w;
    left = Math.max(minLeft, Math.min(left, maxLeft));

    photoBox.style.left = Math.round(left) + 'px';
    photoBox.style.top = Math.round(top) + 'px';

    /* Swiping the map away from the place leaves the card pointing at
       nothing, so let it step aside until the place comes back. */
    var view = mapScroller ? mapScroller.getBoundingClientRect() : null;
    var away = view && (a.right < view.left || a.left > view.right);
    photoBox.classList.toggle('is-away', Boolean(away));
  }

  /* If the shape was near the bottom of the screen, the popover below it
     would open out of sight; nudge the page just far enough to show both. */
  function revealPhoto() {
    if (!photoBox || photoBox.classList.contains('is-empty')) {
      return;
    }
    var rect = photoBox.getBoundingClientRect();
    var hidden = rect.top < 0 || rect.bottom > window.innerHeight;
    if (!hidden) {
      return;
    }
    var reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollBy({
      top: rect.bottom - window.innerHeight + 16,
      behavior: reduceMotion ? 'auto' : 'smooth'
    });
  }

  function renderPhoto(item) {
    if (!photoBox) {
      return;
    }
    if (!item || !item.photo) {
      photoBox.classList.add('is-empty');
      photoBox.innerHTML = '<p class="photo-empty">' + pick(
        'Click a building or a marker to see its photograph here.',
        '点击建筑或圆点，照片会显示在这里。') + '</p>';
      return;
    }
    photoBox.classList.remove('is-empty');
    var caption = pick(item.en + ' · ' + item.zh, item.zh + ' · ' + item.en);
    photoBox.innerHTML = [
      '<a class="map-photo-link" href="' + escapeHtml(item.photo) + '" data-lightbox data-caption="' + escapeHtml(caption) + '">',
      '  <img src="' + escapeHtml(thumbPath(item.photo)) + '" alt="' + escapeHtml(caption) + '" width="640" height="480" decoding="async">',
      '</a>',
      '<p class="map-photo-name">' + escapeHtml(pick(item.en, item.zh)) + '</p>',
      '<p class="map-photo-zh" lang="' + pick('zh', 'en') + '">' + escapeHtml(pick(item.zh, item.en)) + '</p>'
    ].join('');
    /* the picture has to be laid out before it can be measured */
    placePhoto();
  }

  /* ---- panel interactions ------------------------------------------------ */

  panel.addEventListener('click', function (event) {
    var target = event.target;

    var clear = target.closest('[data-clear]');
    if (clear) {
      clearSelection();
      return;
    }

    var back = target.closest('[data-back]');
    if (back && selectedId) {
      selectBuilding(selectedId);
      return;
    }

    var chip = target.closest('[data-spot]');
    if (chip) {
      selectSpot(chip.getAttribute('data-spot'));
      return;
    }
  });

  var photoReposition = null;
  function schedulePlacePhoto() {
    if (photoReposition) {
      return;
    }
    photoReposition = window.requestAnimationFrame(function () {
      photoReposition = null;
      placePhoto();
    });
  }

  if (mapScroller) {
    mapScroller.addEventListener('scroll', schedulePlacePhoto, { passive: true });
  }
  window.addEventListener('resize', schedulePlacePhoto);

  /* Clicking away from the photograph puts it away. Anything that is itself
     a choice — a building, a marker, a filter — is left alone. */
  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!selectedId || !(target instanceof Element)) {
      return;
    }
    if (target.closest('#map-photo, #map-panel, #photo-lightbox, .building, .map-spot, .search, .legend, .site-header')) {
      return;
    }
    clearSelection();
  });

  search.addEventListener('input', function () {
    query = normalize(search.value.trim());
    applyFilters();
  });

  legendButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      var next = button.getAttribute('data-category');
      currentCategory = (currentCategory === next) ? 'all' : next;
      applyFilters();
    });
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape' || !selectedId) {
      return;
    }
    /* The dialog handles its own Escape. */
    if (lightbox && lightbox.open) {
      return;
    }
    if (selectedSpotId) {
      selectBuilding(selectedId);
      return;
    }
    clearSelection();
  });

  /* ---- first paint ------------------------------------------------------- */

  var params = new URLSearchParams(window.location.search);
  var initialSpot = params.get('spot');
  var initialId = params.get('building');

  if (initialSpot && spotById[initialSpot]) {
    selectSpot(initialSpot, { syncUrl: false });
  } else if (initialId && byId(initialId)) {
    selectBuilding(initialId, { syncUrl: false });
  }

  applyFilters();

  /* A phone shows only a slice of the drawing. Open on the middle of campus —
     the teaching buildings and the welcome center — instead of the sports
     field at the western edge, which is what scrollLeft 0 lands on. */
  if (!selectedId && mapScroller && mapScroller.scrollWidth > mapScroller.clientWidth) {
    mapScroller.scrollLeft = (mapScroller.scrollWidth - mapScroller.clientWidth) / 2;
  }
})();

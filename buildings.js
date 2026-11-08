/* ==========================================================================
   BiUH Campus Map — buildings page
   Builds one card per place from data.js, grouped by category, so the cards
   and the map can never disagree about a name, a description or a photo.
   The markup carries data-zh attributes like the rest of the site, and
   i18n.js translates it once it is in the page.
   ========================================================================== */

(function () {
  'use strict';

  var data = window.CampusData;
  var root = document.getElementById('building-groups');
  if (!data || !root) {
    return;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* Small copies of every photograph live in photos/thumbs/; the original
     only loads when the picture is opened in the viewer. */
  function thumbPath(src) {
    return String(src).replace('photos/', 'photos/thumbs/');
  }

  function insideItem(place, spot) {
    var name = spot.short || spot.en;
    return [
      '<li class="inside-item">',
      '  <a class="inside-photo" href="' + escapeHtml(spot.photo) + '" data-lightbox',
      '     data-caption="' + escapeHtml(spot.en + ' · ' + spot.zh) + '"',
      '     aria-label="' + escapeHtml('Open the photo of ' + spot.en) + '"',
      '     data-al-zh="' + escapeHtml('查看' + spot.zh + '的照片') + '">',
      '    <img src="' + escapeHtml(thumbPath(spot.photo)) + '" alt="" width="640" height="480" loading="lazy" decoding="async">',
      '  </a>',
      '  <a class="inside-link" href="map.html?building=' + encodeURIComponent(place.id) + '&amp;spot=' + encodeURIComponent(spot.id) + '">',
      '    <span class="inside-name" data-zh="' + escapeHtml(spot.zh) + '">' + escapeHtml(name) + '</span>',
      '    <span class="inside-zh" data-zh="' + escapeHtml(name) + '">' + escapeHtml(spot.zh) + '</span>',
      '  </a>',
      '</li>'
    ].join('\n');
  }

  function card(place) {
    var inside = '';
    if (place.spots && place.spots.length) {
      inside = [
        '<div class="building-inside">',
        '  <p class="inside-label" data-zh="内部">Inside</p>',
        '  <ul class="inside-list">',
        place.spots.map(function (spot) { return insideItem(place, spot); }).join('\n'),
        '  </ul>',
        '</div>'
      ].join('\n');
    }

    return [
      '<article class="building-card" id="' + escapeHtml(place.id) + '" data-category="' + escapeHtml(place.category) + '">',
      '  <a class="building-photo" href="' + escapeHtml(place.photo) + '" data-lightbox data-caption="' + escapeHtml(place.en + ' · ' + place.zh) + '">',
      '    <img src="' + escapeHtml(thumbPath(place.photo)) + '" alt="' + escapeHtml(place.en + ', ' + place.zh) + '" width="640" height="480" loading="lazy" decoding="async">',
      '  </a>',
      '  <div class="building-body">',
      '    <h3 data-zh="' + escapeHtml(place.zh) + '">' + escapeHtml(place.en) + '</h3>',
      '    <p class="zh" data-zh="' + escapeHtml(place.en) + '">' + escapeHtml(place.zh) + '</p>',
      '    <p class="desc" data-zh="' + escapeHtml(place.descZh) + '">' + escapeHtml(place.desc) + '</p>',
      '    <p class="where"><strong data-zh="位置：">Where:</strong><span data-zh="' + escapeHtml(place.whereZh) + '"> ' + escapeHtml(place.where) + '</span></p>',
      '    <a class="card-link" href="map.html?building=' + encodeURIComponent(place.id) + '" data-zh="在地图上查看 →">Show on map →</a>',
      '  </div>',
      inside,
      '</article>'
    ].join('\n');
  }

  root.innerHTML = data.categories.map(function (category) {
    var places = data.places.filter(function (place) {
      return place.category === category.id;
    });
    if (!places.length) {
      return '';
    }
    var countEn = places.length + (places.length === 1 ? ' place' : ' places');
    var countZh = places.length + ' 个地点';
    return [
      /* Folded by default: the page opens as five short rows, and the count
         says what is inside before anything is opened. */
      '<details class="building-group" data-category="' + escapeHtml(category.id) + '">',
      '  <summary>',
      '    <span class="group-dot" aria-hidden="true"></span>',
      '    <span class="group-name" data-zh="' + escapeHtml(category.zh) + '">' + escapeHtml(category.en) + '</span>',
      '    <span class="group-count" data-zh="' + escapeHtml(countZh) + '">' + escapeHtml(countEn) + '</span>',
      '  </summary>',
      '  <div class="building-list">',
      places.map(card).join('\n'),
      '  </div>',
      '</details>'
    ].join('\n');
  }).join('\n');

  if (window.CampusI18n && window.CampusI18n.applyTo) {
    window.CampusI18n.applyTo(root);
  }

  /* The cards did not exist when the browser first looked for #student-center
     in a link from the map, so go to it now that they do. A card inside a
     folded category is not on screen, so open its group first. */
  if (window.location.hash.length > 1) {
    var target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    if (target) {
      var group = target.closest('details');
      if (group) {
        group.open = true;
      }
      target.scrollIntoView();
    }
  }
})();

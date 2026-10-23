/* ==========================================================================
   BiUH Campus Map — map behaviour
   Vanilla JavaScript: select a building, search, filter by category.
   No libraries, no server, no stored data.
   ========================================================================== */

(function () {
  'use strict';

  var BUILDINGS = [
    {
      id: 'sports-field',
      en: 'Sports Field',
      zh: '运动场',
      category: 'sports',
      desc: 'The running track and football pitch at the west end of campus. Used for PE lessons, morning runs and sports day.',
      where: 'West end of campus, beside the basketball courts.',
      aliases: 'track running field football pitch 运动场 操场 田径'
    },
    {
      id: 'basketball-court',
      en: 'Basketball Courts',
      zh: '篮球场',
      category: 'sports',
      desc: 'Outdoor basketball courts next to the track. Busy after class and at weekends.',
      where: 'Between the sports field and the welcome center.',
      aliases: 'basketball courts hoops 篮球场 篮球'
    },
    {
      id: 'welcome-center',
      en: 'Welcome Center',
      zh: '欢迎中心',
      category: 'student-life',
      desc: 'The first stop for visitors and new students: reception, information and campus tours.',
      where: 'South of the teaching buildings, beside the courts.',
      aliases: 'welcome reception visitors admissions 欢迎中心 欢迎'
    },
    {
      id: 'teaching-a',
      en: 'Teaching Building A',
      zh: '教学楼A',
      category: 'academic',
      desc: 'General classrooms and lecture rooms, connected to Building B by a covered walkway.',
      where: 'North side of campus, at the center.',
      aliases: 'teaching classroom lecture 教学楼A 教学楼a 教室'
    },
    {
      id: 'teaching-b',
      en: 'Teaching Building B',
      zh: '教学楼B',
      category: 'academic',
      desc: 'Classrooms and seminar rooms, linked to Building A by a covered walkway.',
      where: 'North side of campus, east of Teaching Building A.',
      aliases: 'teaching classroom seminar 教学楼B 教学楼b 教室'
    },
    {
      id: 'training',
      en: 'Training Building',
      zh: '实训楼',
      category: 'academic',
      desc: 'Laboratories and practical training workshops for hands-on courses.',
      where: 'North-east of Teaching Building B.',
      aliases: 'training lab laboratory workshop 实训楼 实训 实验室'
    },
    {
      id: 'student-center',
      en: 'Student Center',
      zh: '学生中心',
      category: 'student-life',
      desc: 'Student services, clubs and a place to meet between classes.',
      where: 'East side of campus, right of the training building.',
      aliases: 'student center services clubs 学生中心'
    },
    {
      id: 'dorm-b',
      en: 'Student Dormitory B',
      zh: '学生宿舍B',
      category: 'residence',
      desc: 'Student housing on the eastern edge of campus.',
      where: 'Eastern edge, north of Student Dormitory A.',
      aliases: 'student dormitory dorm housing 学生宿舍B 学生宿舍b 宿舍'
    },
    {
      id: 'dorm-a',
      en: 'Student Dormitory A',
      zh: '学生宿舍A',
      category: 'residence',
      desc: 'Student housing on the eastern edge of campus.',
      where: 'Eastern edge, below Student Dormitory B.',
      aliases: 'student dormitory dorm housing 学生宿舍A 学生宿舍a 宿舍'
    },
    {
      id: 'teacher-dorm-a',
      en: 'Teacher Dormitory A',
      zh: '教师宿舍A',
      category: 'residence',
      desc: 'Staff housing south-east of the student center.',
      where: 'Eastern edge, below the student dormitories.',
      aliases: 'teacher staff dormitory housing 教师宿舍A 教师宿舍a 宿舍'
    },
    {
      id: 'teacher-dorm-b',
      en: 'Teacher Dormitory B',
      zh: '教师宿舍B',
      category: 'residence',
      desc: 'Staff housing south-east of the student center.',
      where: 'Eastern edge, below Teacher Dormitory A.',
      aliases: 'teacher staff dormitory housing 教师宿舍B 教师宿舍b 宿舍'
    },
    {
      id: 'teacher-center',
      en: 'Teacher Center',
      zh: '教师中心',
      category: 'student-life',
      desc: 'A small staff building beside the lake, used for meetings and quiet work.',
      where: 'Beside the lake, south-east of the center of campus.',
      aliases: 'teacher staff center offices 教师中心'
    },
    {
      id: 'lake',
      en: 'Lake',
      zh: '小湖',
      category: 'landmark',
      desc: 'A small lake with a landscaped walkway, at the south-east corner of campus.',
      where: 'South-east of campus, beside the teacher center.',
      aliases: 'lake water pond 小湖 湖'
    }
  ];

  var CATEGORY_LABELS = {
    academic: 'Academic',
    'student-life': 'Student life',
    residence: 'Residence',
    sports: 'Sport',
    landmark: 'Landmark'
  };

  var svg = document.getElementById('campus-svg');
  var panel = document.getElementById('map-panel');
  var search = document.getElementById('map-search');
  var status = document.getElementById('map-status');
  var legendButtons = Array.prototype.slice.call(document.querySelectorAll('.legend-btn'));

  if (!svg || !panel || !search || !status) {
    return;
  }

  var groups = {};
  Array.prototype.forEach.call(svg.querySelectorAll('[data-building]'), function (group) {
    groups[group.getAttribute('data-building')] = group;
  });

  var EMPTY_PANEL = panel.innerHTML;
  var selectedId = null;
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

  function matches(building) {
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
      CATEGORY_LABELS[building.category]
    ].join(' '));
    return query.split(/\s+/).every(function (term) {
      return haystack.indexOf(term) !== -1;
    });
  }

  function selectedIsVisible() {
    if (!selectedId) {
      return true;
    }
    var building = byId(selectedId);
    return building ? matches(building) : false;
  }

  function updateStatus(count) {
    if (!query && currentCategory === 'all') {
      status.textContent = '';
      return;
    }
    if (count === 0) {
      status.textContent = 'No places match. Try “teaching”, “dorm” or “湖”.';
    } else if (count === 1) {
      status.textContent = '1 place shown.';
    } else {
      status.textContent = count + ' places shown.';
    }
  }

  function applyFilters() {
    var count = 0;
    BUILDINGS.forEach(function (building) {
      var group = groups[building.id];
      var visible = matches(building);
      if (group) {
        group.classList.toggle('is-dimmed', !visible);
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

    if (selectedId && !selectedIsVisible()) {
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

  function renderPanel(building) {
    panel.innerHTML = [
      '<div class="panel-grid">',
      '  <div>',
      '    <p class="chip" data-category="' + building.category + '">' + CATEGORY_LABELS[building.category] + '</p>',
      '    <h2 class="panel-name">' + escapeHtml(building.en) + '</h2>',
      '    <p class="panel-zh" lang="zh">' + escapeHtml(building.zh) + '</p>',
      '    <p class="panel-desc">' + escapeHtml(building.desc) + '</p>',
      '  </div>',
      '  <div class="panel-side">',
      '    <p class="panel-meta"><strong>Where</strong>' + escapeHtml(building.where) + '</p>',
      '    <div class="panel-actions">',
      '      <button class="btn btn-ghost" type="button" data-clear>Clear selection</button>',
      '      <a class="btn btn-ghost" href="buildings.html#' + building.id + '">Open in guide</a>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');
  }

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

  function selectBuilding(id, options) {
    var building = byId(id);
    if (!building) {
      return;
    }
    var settings = options || {};

    if (selectedId && groups[selectedId]) {
      groups[selectedId].classList.remove('is-selected');
    }

    selectedId = id;
    if (groups[id]) {
      groups[id].classList.add('is-selected');
      centerInScroller(groups[id]);
    }
    renderPanel(building);
    if (settings.syncUrl !== false) {
      syncUrl();
    }

    var reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var panelRect = panel.getBoundingClientRect();
    var panelIsVisible = panelRect.top < window.innerHeight - 180 &&
                         panelRect.bottom > 80;
    var isSmallScreen = window.matchMedia('(max-width: 760px)').matches;
    if (settings.scroll !== false && (!panelIsVisible || isSmallScreen)) {
      panel.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start'
      });
    }
  }

  function clearSelection(options) {
    var settings = options || {};
    if (selectedId && groups[selectedId]) {
      groups[selectedId].classList.remove('is-selected');
    }
    selectedId = null;
    panel.innerHTML = EMPTY_PANEL;
    if (settings.syncUrl !== false) {
      syncUrl();
    }
  }

  function bindBuilding(group) {
    var id = group.getAttribute('data-building');

    group.addEventListener('click', function () {
      selectBuilding(id);
    });

    group.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        selectBuilding(id);
      }
    });
  }

  Object.keys(groups).forEach(function (id) {
    bindBuilding(groups[id]);
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

  panel.addEventListener('click', function (event) {
    var clear = event.target.closest('[data-clear]');
    if (clear) {
      clearSelection();
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && selectedId) {
      clearSelection();
    }
  });

  var initialId = new URLSearchParams(window.location.search).get('building');
  if (initialId && byId(initialId)) {
    selectBuilding(initialId, { syncUrl: false, scroll: false });
  }

  applyFilters();
})();

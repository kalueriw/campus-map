/* ==========================================================================
   BiUH Campus Map — map behaviour
   Vanilla JavaScript: select a building or a place inside it, search, filter
   by category. Clicking a building opens its photo.
   No libraries, no server, no stored data.
   ========================================================================== */

(function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';

  /* Two kinds of place: a building, and a spot inside a building. A spot
     carries its own page number, description and photo; `parent` is filled in
     below so nothing has to be repeated in the data. */
  var BUILDINGS = [
    {
      id: 'sports-field',
      en: 'Sports Field',
      zh: '运动场',
      category: 'sports',
      desc: 'The running track and football pitch at the west end of campus. Used for PE lessons, morning runs and sports day.',
      descZh: '校园西端的跑道和足球场，体育课、晨跑和运动会都在这里。',
      where: 'West end of campus, beside the badminton and basketball courts.',
      whereZh: '校园西端，羽毛球场和篮球场旁边。',
      aliases: 'track running field football pitch 运动场 操场 田径',
      photo: 'photos/sports-field.jpg'
    },
    {
      id: 'badminton-court',
      en: 'Badminton Courts',
      zh: '羽毛球场',
      category: 'sports',
      desc: 'A row of outdoor badminton courts set among the basketball courts, next to the track.',
      descZh: '嵌在篮球场之间的一排露天羽毛球场，紧邻跑道。',
      where: 'The second row up from the bottom of the courts area, beside the sports field.',
      whereZh: '球场区从上往下数第二排，运动场旁边。',
      aliases: 'badminton shuttlecock court 羽毛球场 羽毛球',
      photo: 'photos/badminton-court.jpg'
    },
    {
      id: 'basketball-court',
      en: 'Basketball Courts',
      zh: '篮球场',
      category: 'sports',
      desc: 'Outdoor basketball courts next to the track, three rows of them. Busy after class and at weekends.',
      descZh: '跑道旁边的露天篮球场，共三排，下课和周末都有人。',
      where: 'Between the sports field and the welcome center, with the badminton row near the bottom.',
      whereZh: '运动场和欢迎中心之间，羽毛球场靠下。',
      aliases: 'basketball courts hoops 篮球场 篮球',
      photo: 'photos/basketball-court.jpg'
    },
    {
      id: 'welcome-center',
      en: 'Welcome Center',
      zh: '欢迎中心',
      category: 'student-life',
      desc: 'The first stop for visitors and new students: reception, information and campus tours.',
      descZh: '访客和新生报到的地方：接待、咨询和校园参观都从这里开始。',
      where: 'South of the teaching buildings, beside the courts.',
      whereZh: '教学楼以南，球场旁边。',
      aliases: 'welcome reception visitors admissions 欢迎中心 欢迎',
      photo: 'photos/welcome-center.jpg'
    },
    {
      id: 'teaching-a',
      en: 'Teaching Building A',
      zh: '教学楼A',
      category: 'academic',
      desc: 'General classrooms and lecture rooms, connected to Building B by a covered walkway.',
      descZh: '通用教室与阶梯教室，有连廊与 B 楼相连。',
      where: 'North side of campus, at the center.',
      whereZh: '校园北侧中部。',
      aliases: 'teaching classroom lecture 教学楼A 教学楼a 教室',
      photo: 'photos/teaching-a.jpg',
      spots: [
        {
          id: 'study-room',
          en: 'Study Room 1',
          zh: '自习室1',
          glyph: '习',
          x: 700,
          y: 340,
          desc: 'A quiet room for individual study, open between classes.',
          descZh: '安静的自主学习空间，课间开放。',
          where: 'Ground floor of Teaching Building A.',
          whereZh: '教学楼 A 一楼。',
          aliases: 'study room quiet revise 自习室1 自习室 自习 学习',
          photo: 'photos/teaching-a-study-room.jpg'
        }
      ]
    },
    {
      id: 'teaching-b',
      en: 'Teaching Building B',
      zh: '教学楼B',
      category: 'academic',
      desc: 'Classrooms and seminar rooms, linked to Building A by a covered walkway.',
      descZh: '教室与研讨室，通过连廊与 A 楼相连。',
      where: 'North side of campus, east of Teaching Building A.',
      whereZh: '校园北侧，教学楼 A 以东。',
      aliases: 'teaching classroom seminar 教学楼B 教学楼b 教室',
      photo: 'photos/teaching-b.jpg'
    },
    {
      id: 'training',
      en: 'Training Building',
      zh: '实训楼',
      category: 'academic',
      desc: 'Laboratories and practical training workshops for hands-on courses.',
      descZh: '实训实验室与动手课程的操作车间。',
      where: 'North-east of Teaching Building B.',
      whereZh: '教学楼 B 东北侧。',
      aliases: 'training lab laboratory workshop 实训楼 实训 实验室',
      photo: 'photos/training.jpg'
    },
    {
      id: 'student-center',
      en: 'Student Center',
      zh: '学生中心',
      category: 'student-life',
      desc: 'Student services, clubs and a place to meet between classes. Two restaurants, a sports hall, two gyms and a study room are inside.',
      descZh: '学生服务、社团和课后碰面的地方。里面有餐厅、风味餐厅、体育馆、两间健身房和一间自习室。',
      where: 'East side of campus, right of the training building.',
      whereZh: '校园东侧，实训楼以东。',
      aliases: 'student center services clubs 学生中心',
      photo: 'photos/student-center.jpg',
      spots: [
        {
          id: 'canteen',
          en: 'Student Canteen',
          zh: '学生餐厅',
          glyph: '餐',
          x: 1560,
          y: 122,
          desc: 'The main dining hall, serving set meals through the day.',
          descZh: '主餐厅，全天供应套餐。',
          where: 'North half of the building, ground floor.',
          whereZh: '学生中心北半部分，一楼。',
          aliases: 'canteen dining hall canteen 学生餐厅 餐厅 食堂 吃饭',
          photo: 'photos/student-center-canteen.jpg'
        },
        {
          id: 'flavour',
          en: 'Flavour Restaurant',
          zh: '风味餐厅',
          glyph: '味',
          x: 1610,
          y: 120,
          desc: 'A second dining room for noodles, snacks and regional dishes.',
          descZh: '第二间餐厅，供应面食、小吃和地方菜。',
          where: 'North half of the building, ground floor, beside the canteen.',
          whereZh: '北半部分一楼，学生餐厅旁边。',
          aliases: 'flavour restaurant food noodles 风味餐厅 风味 小吃 面',
          photo: 'photos/student-center-flavour.jpg'
        },
        {
          id: 'gym-hall',
          en: 'Indoor Sports Hall 209',
          zh: '室内体育馆209',
          glyph: '馆',
          x: 1560,
          y: 90,
          desc: 'The indoor hall above the canteen, used for badminton and PE on rainy days.',
          descZh: '学生餐厅上方的室内场馆，雨天用来上体育课、打羽毛球。',
          where: 'Room 209, north half of the building, second floor — directly above the canteen.',
          whereZh: '209 室，北半部分二楼，学生餐厅正上方。',
          aliases: 'indoor sports hall gym badminton pe 室内体育馆209 室内体育馆 体育馆 室内 209',
          photo: 'photos/student-center-gym-hall.jpg'
        },
        {
          id: 'gym-303',
          en: 'Gym 303',
          zh: '健身房303',
          glyph: '303',
          x: 1650,
          y: 100,
          desc: 'The larger gym, with racks, benches and free weights.',
          descZh: '较大的健身房，有深蹲架、卧推凳和自由重量区。',
          where: 'Room 303, east end of the north half.',
          whereZh: '303 室，北半部分最东端。',
          aliases: 'gym fitness weights 健身房303 健身房 健身 303',
          photo: 'photos/student-center-gym-303.jpg'
        },
        {
          id: 'gym-304',
          en: 'Gym 304',
          zh: '健身房304',
          glyph: '304',
          x: 1638,
          y: 200,
          desc: 'The second gym, with aerobic machines and a mirrored floor.',
          descZh: '第二间健身房，有氧器械和镜面地板。',
          where: 'Room 304, south half of the building.',
          whereZh: '304 室，南半部分。',
          aliases: 'gym fitness aerobic 健身房304 健身房 健身 304',
          photo: 'photos/student-center-gym-304.jpg'
        },
        {
          id: 'study-room-2',
          en: 'Study Room 2',
          zh: '自习室2',
          glyph: '习',
          x: 1582,
          y: 200,
          desc: 'A study room with rows of desks, directly under the second gym.',
          descZh: '成排书桌的自习室，就在健身房正下方。',
          where: 'South half of the building, second floor — directly below Gym 304.',
          whereZh: '南半部分二楼，健身房 304 正下方。',
          aliases: 'study room quiet revise 自习室2 自习室 自习 学习 学生中心自习室',
          photo: 'photos/student-center-study-room.jpg'
        }
      ]
    },
    {
      /* The dormitories are numbered from the north: the top block on the map
         is 1栋, the lower block is 2栋. Keep the ids (dorm-b / dorm-a) so old
         links and the buildings page anchors keep working. */
      id: 'dorm-b',
      en: 'Student Dormitory 2',
      zh: '学生宿舍2',
      category: 'residence',
      desc: 'Student housing on the eastern edge of campus, with a fruit shop on its south side.',
      descZh: '校园东侧的学生宿舍，南侧有一家水果店。',
      where: 'Northern of the two student dormitories, on the eastern edge.',
      whereZh: '东侧靠北的那栋宿舍。',
      aliases: 'student dormitory dorm housing 2栋 二栋 学生宿舍2 学生公寓 宿舍',
      photo: 'photos/dorm-2.jpg',
      spots: [
        {
          id: 'tingning',
          en: 'Tingning Guoguo',
          zh: '听柠果果',
          glyph: '果',
          x: 1870,
          y: 126,
          desc: 'A fruit and juice shop on the south side of the block.',
          descZh: '宿舍楼南侧的水果与果茶店。',
          where: 'Ground floor, south edge, one shop in from the south-east corner.',
          whereZh: '一楼南侧，东南角往里一家。',
          aliases: 'fruit juice shop 听柠果果 水果 果茶',
          photo: 'photos/dorm-2-tingning.jpg'
        }
      ]
    },
    {
      id: 'dorm-a',
      en: 'Student Dormitory 1',
      zh: '学生宿舍1',
      category: 'residence',
      desc: 'Student housing on the eastern edge of campus, with a coffee shop and a parcel station along its north side, and a supermarket at the south-west corner.',
      descZh: '校园东侧的学生宿舍，北侧是咖啡店和快递驿站，西南角是美宜佳超市。',
      where: 'Southern of the two student dormitories, below Student Dormitory 2.',
      whereZh: '东侧靠南的那栋宿舍，在 2 栋下方。',
      aliases: 'student dormitory dorm housing 1栋 一栋 学生宿舍1 学生公寓 宿舍',
      photo: 'photos/dorm-1.jpg',
      spots: [
        {
          id: 'meiyijia',
          en: 'Meiyijia Supermarket',
          zh: '美宜佳超市',
          glyph: '超',
          x: 1756,
          y: 282,
          desc: 'The convenience store: drinks, snacks and everyday things.',
          descZh: '便利店：饮料、零食和日用品。',
          where: 'Ground floor, south-west corner, facing the road.',
          whereZh: '一楼，西南角，朝马路。',
          aliases: 'supermarket shop convenience store 美宜佳 超市 便利店',
          photo: 'photos/dorm-1-meiyijia.jpg'
        },
        {
          id: 'gmc',
          en: 'GMC Coffee',
          zh: 'GMC咖啡',
          glyph: '咖',
          x: 1819,
          y: 228,
          desc: 'A coffee shop on the north side of the block.',
          descZh: '宿舍楼北侧的咖啡店。',
          where: 'Ground floor, north side, just left of the parcel station.',
          whereZh: '一楼北侧，快递驿站左边。',
          aliases: 'gmc coffee cafe 咖啡 GMC',
          photo: 'photos/dorm-1-gmc.jpg'
        },
        {
          id: 'parcel',
          en: 'Parcel Station',
          zh: '快递驿站',
          glyph: '驿',
          x: 1876,
          y: 228,
          desc: 'Where deliveries are collected — couriers drop parcels here.',
          descZh: '收寄快递的地方，快递员在这里派件。',
          where: 'Ground floor, north-east corner.',
          whereZh: '一楼，东北角。',
          aliases: 'parcel delivery courier post 快递 驿站 取件 包裹',
          photo: 'photos/dorm-1-parcel.jpg'
        }
      ]
    },
    {
      id: 'teacher-dorm-a',
      en: 'Teacher Dormitory A',
      zh: '教师宿舍A',
      category: 'residence',
      desc: 'Staff housing in the lakeside cluster, directly below the student center.',
      descZh: '湖畔的教职工公寓。',
      where: 'Below the student center, on the east side of the lake.',
      whereZh: '学生中心下方，湖的东侧。',
      aliases: 'teacher staff dormitory housing 教师宿舍A 教师宿舍a 宿舍',
      photo: 'photos/teacher-dorm-a.jpg'
    },
    {
      id: 'teacher-dorm-b',
      en: 'Teacher Dormitory B',
      zh: '教师宿舍B',
      category: 'residence',
      desc: 'Staff housing in the lakeside cluster, below Teacher Dormitory A.',
      descZh: '湖畔的教职工公寓，在 A 栋下方。',
      where: 'Below Teacher Dormitory A, on the east side of the lake.',
      whereZh: '教师宿舍 A 下方，湖的东侧。',
      aliases: 'teacher staff dormitory housing 教师宿舍B 教师宿舍b 宿舍',
      photo: 'photos/teacher-dorm-b.jpg'
    },
    {
      id: 'lakeside-restaurant',
      en: 'Lakeside Restaurant',
      zh: '湖畔坊餐厅',
      category: 'student-life',
      desc: 'The campus restaurant, on the edge of the lake below the student center.',
      descZh: '校园餐厅，在学生中心下方的湖边。',
      where: 'On the east bank of the lake, below the student center.',
      whereZh: '湖的东岸，学生中心下方。',
      aliases: 'lakeside restaurant canteen dining food eat 湖畔坊餐厅 湖畔坊 餐厅 食堂 吃饭',
      photo: 'photos/lakeside-restaurant.jpg'
    },
    {
      id: 'lake',
      en: 'Lake',
      zh: '小湖',
      category: 'landmark',
      desc: 'A small lake with a landscaped walkway, at the south-east corner of campus.',
      descZh: '带环湖步道的小湖，在校园东南角。',
      where: 'South-east of campus, beside the teacher dormitories.',
      whereZh: '校园东南方向，教师公寓旁边。',
      aliases: 'lake water pond 小湖 湖',
      photo: 'photos/lake.jpg'
    }
  ];

  var CATEGORY_LABELS = {
    academic: 'Academic',
    'student-life': 'Student life',
    residence: 'Residence',
    sports: 'Sport',
    landmark: 'Landmark'
  };

  var CATEGORY_LABELS_ZH = {
    academic: '教学',
    'student-life': '生活',
    residence: '住宿',
    sports: '运动',
    landmark: '地标'
  };

  /* ---- language ---------------------------------------------------------- */

  var i18n = window.CampusI18n;

  function pick(en, zh) {
    return i18n && i18n.lang === 'zh' && zh ? zh : en;
  }

  function categoryLabel(building) {
    return pick(CATEGORY_LABELS[building.category], CATEGORY_LABELS_ZH[building.category]);
  }

  /* Photos are 4:3 (4080 × 3060 or 4096 × 3072). Declaring the ratio lets the
     browser reserve the space before the image arrives. */
  var PHOTO_WIDTH = 1600;
  var PHOTO_HEIGHT = 1200;

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

    if (selectedSpotId && !spotVisible[selectedSpotId]) {
      if (selectedId && matches(byId(selectedId))) {
        selectBuilding(selectedId, { scroll: false });
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

  function photoMarkup(photo, caption, fallback) {
    if (!photo) {
      return [
        '<div class="panel-photo panel-photo--empty">',
        '  <p>' + escapeHtml(fallback || pick('No photo of this place yet.', '这个地点还没有照片。')) + '</p>',
        '</div>'
      ].join('');
    }
    return [
      '<figure class="panel-photo">',
      '  <a class="panel-photo-link" href="' + escapeHtml(photo) + '" data-lightbox data-caption="' + escapeHtml(caption) + '">',
      /* The <img> only exists once something is selected, so it can start
         loading straight away: lazy-loading would just delay the photo the
         reader asked for. */
      '    <img src="' + escapeHtml(photo) + '" alt="' + escapeHtml(caption) + '" width="' + PHOTO_WIDTH + '" height="' + PHOTO_HEIGHT + '" decoding="async">',
      '  </a>',
      '  <figcaption>' + pick('Click the photo to see it full size.', '点击照片查看大图。') + '</figcaption>',
      '</figure>'
    ].join('');
  }

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
          '  <span class="spot-chip-glyph" aria-hidden="true">' + escapeHtml(spot.glyph) + '</span>',
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
    var emptyText = (building.spots && building.spots.length)
      ? pick('No photo of the outside yet — pick a place inside to see one.',
             '还没有外景照片——点下方楼内的场所。')
      : pick('No photo of this place yet — it is still on the to-do list.',
             '这个地点还没有照片，正在补拍。');
    panel.innerHTML = [
      photoMarkup(building.photo, pick(building.en + ' · ' + building.zh, building.zh + ' · ' + building.en), emptyText),
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
      photoMarkup(spot.photo, pick(spot.en + ' · ' + spot.zh, spot.zh + ' · ' + spot.en),
                  pick('No photo of this place yet.', '这个地点还没有照片。')),
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

  function revealPanel(options) {
    var settings = options || {};
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
    if (hadPanelFocus) {
      restorePanelFocus(null);
    }
    if (settings.syncUrl !== false) {
      syncUrl();
    }
    revealPanel(settings);
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
    if (hadPanelFocus) {
      restorePanelFocus(id);
    }
    if (settings.syncUrl !== false) {
      syncUrl();
    }
    revealPanel(settings);
  }

  function clearSelection(options) {
    var settings = options || {};
    var hadPanelFocus = panel.contains(document.activeElement);
    clearMarks();
    selectedId = null;
    selectedSpotId = null;
    panel.innerHTML = EMPTY_PANEL;
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

      var glyph = document.createElementNS(SVG_NS, 'text');
      glyph.setAttribute('class', 'spot-glyph' + (spot.glyph.length > 1 ? ' spot-glyph--tiny' : ''));
      glyph.setAttribute('text-anchor', 'middle');
      glyph.setAttribute('dominant-baseline', 'central');
      glyph.textContent = spot.glyph;

      group.appendChild(title);
      group.appendChild(hit);
      group.appendChild(dot);
      group.appendChild(glyph);
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
      applyFilters();
    });
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
    selectSpot(initialSpot, { syncUrl: false, scroll: false });
  } else if (initialId && byId(initialId)) {
    selectBuilding(initialId, { syncUrl: false, scroll: false });
  }

  applyFilters();
})();

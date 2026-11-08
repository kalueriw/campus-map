/* ==========================================================================
   BiUH Campus Map — the places
   The one list of buildings and the places inside them. map.js draws the
   map's panel and search from it, buildings.js builds the cards from it, so a
   name or a description is only ever written here.
   ========================================================================== */

(function () {
  'use strict';

  /* Two kinds of place: a building, and a spot inside a building. A spot
     carries its own description and photo; map.js fills in `parent` so
     nothing has to be repeated here. `short` is an optional shorter English
     name for the small pictures on the buildings page.

     The order is the order of the buildings page. */
  var PLACES = [
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
          short: 'Canteen',
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
          short: 'Flavour',
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
          short: 'Hall 209',
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
      id: 'dorm-a',
      en: 'Student Dormitory 1',
      zh: '学生宿舍1',
      category: 'residence',
      desc: 'Student housing on the eastern edge of campus, with a coffee shop and a parcel station along its north side, and a supermarket at the south-west corner.',
      descZh: '校园东侧的学生宿舍，北侧是咖啡店和快递驿站，西南角是美宜佳超市。',
      where: 'The southern of the two student dormitories, below Student Dormitory 2.',
      whereZh: '东侧靠南的那栋宿舍，在 2 栋下方。',
      aliases: 'student dormitory dorm housing 1栋 一栋 学生宿舍1 学生公寓 宿舍',
      photo: 'photos/dorm-1.jpg',
      spots: [
        {
          id: 'meiyijia',
          en: 'Meiyijia Supermarket',
          short: 'Meiyijia',
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
      /* The dormitories are numbered from the north: the top block on the map
         is 2栋, the lower block is 1栋. Keep the ids (dorm-b / dorm-a) so old
         links and the buildings page anchors keep working. */
      id: 'dorm-b',
      en: 'Student Dormitory 2',
      zh: '学生宿舍2',
      category: 'residence',
      desc: 'Student housing on the eastern edge of campus, with a fruit shop on its south side.',
      descZh: '校园东侧的学生宿舍，南侧有一家水果店。',
      where: 'The northern of the two student dormitories, on the eastern edge.',
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

  /* Category order is the order of the groups on the buildings page. */
  var CATEGORIES = [
    { id: 'academic', en: 'Academic', zh: '教学' },
    { id: 'student-life', en: 'Student life', zh: '生活' },
    { id: 'residence', en: 'Residence', zh: '住宿' },
    { id: 'sports', en: 'Sport', zh: '运动' },
    { id: 'landmark', en: 'Landmark', zh: '地标' }
  ];

  window.CampusData = {
    places: PLACES,
    categories: CATEGORIES
  };
})();

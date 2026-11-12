/* ==========================================================================
   BiUH Campus Map — the 3D campus, as places
   The buildings in the scene, with their English/Chinese names, photos and
   what is inside them. Positions are metres in the scene: +x east, +z south,
   y up; the origin is the old SVG drawing's centre (see site.js).

   The geometry sizes here are the real ones — they come from the master
   plan read at 0.3375 m per plan pixel — and the *_model.js files raise
   each building from them.
   ========================================================================== */

export const CAMPUS = {
  name: '海南比勒费尔德应用科学大学',
  nameEn: 'Hainan Bielefeld University of Applied Sciences',
  short: 'BiUH',
  facts: [
    ['一期用地', '179,824 ㎡'],
    ['一期建面', '106,410 ㎡'],
    ['容积率', '0.55'],
    ['绿地率', '40.09%']
  ]
};

/* kind picks the model in *_model.js; floors and h drive the floors and the
   window bands; w and d are the footprint in metres. */
export const BUILDINGS = [
  {
    id: 'welcome',
    en: 'Welcome Center', zh: '欢迎中心',
    x: -104.0, z: -31.0, rot: 0, floors: 3,
    w: 80.3, d: 48.3, h: 17.0, kind: 'welcome',
    photo: 'photos/welcome-center.jpg',
    card: 'photos/3d/welcome-center.jpg',
    category: 'student-life',
    desc: 'Reception, information and campus tours — the first stop for visitors and new students. A 67 × 40 m lattice canopy on timber columns stands over a three-storey glass block.',
    descZh: '访客和新生报到的地方：接待、咨询和校园参观都从这里开始。一片 67×40 米的菱形木格构大屋顶架在三层玻璃体量上。',
    where: 'South of the teaching buildings, beside the courts.',
    whereZh: '教学楼以南，球场旁边。',
    spots: []
  },
  {
    id: 'a',
    en: 'Teaching Building A', zh: '教学楼A',
    x: -92.2, z: -110.3, rot: 0, floors: 5,
    w: 73.6, d: 42.9, h: 23.4, kind: 'teach', accent: 'blue',
    photo: 'photos/teaching-a.jpg',
    card: 'photos/3d/teaching-a.jpg',
    category: 'academic',
    desc: 'General classrooms and lecture rooms. White cantilevered roof, orange vertical fins, and a roof light well down the middle.',
    descZh: '通用教室与阶梯教室。白色悬挑檐口配橙色竖向遮阳板，屋顶中央是一条下沉天窗带。',
    where: 'North side of campus, west of Building B.',
    whereZh: '校园北侧，教学楼 B 以西。',
    spots: ['study-room']
  },
  {
    id: 'b',
    en: 'Teaching Building B', zh: '教学楼B',
    x: 45.5, z: -110.3, rot: 0, floors: 5,
    w: 73.6, d: 42.9, h: 23.4, kind: 'teach', accent: 'orange',
    photo: 'photos/teaching-b.jpg',
    card: 'photos/3d/teaching-b.jpg',
    category: 'academic',
    desc: 'Classrooms and seminar rooms, linked to Building A by the covered walkway along the north side.',
    descZh: '教室与研讨室，沿北侧连廊与 A 楼相连。',
    where: 'North side of campus, east of Teaching Building A.',
    whereZh: '校园北侧，教学楼 A 以东。'
  },
  {
    id: 'c',
    en: 'Training Building C', zh: '实训楼C',
    x: 87.5, z: -168.6, rot: 0, floors: 5,
    w: 75.9, d: 38.5, h: 27.3, kind: 'lab',
    photo: 'photos/training.jpg',
    card: 'photos/3d/training.jpg',
    category: 'academic',
    desc: 'Laboratories and practical workshops, the biggest single block on campus. Its plan is a ring of rooms round a 55 × 27 m courtyard with a round pool.',
    descZh: '实训实验室与动手课程的车间，是单体里体量最大的一栋。平面是“回”字形，中间一个内院和圆形水盘。',
    where: 'North of Teaching Building B, at the top of campus.',
    whereZh: '教学楼 B 以北，校园最北端。'
  },
  {
    id: 'student',
    en: 'Student Center', zh: '学生中心',
    x: 182.8, z: -158.3, rot: 0, floors: 3,
    w: 38.5, d: 58.4, h: 19.9, kind: 'student',
    photo: 'photos/student-center.jpg',
    card: 'photos/3d/student-center.jpg',
    category: 'student-life',
    desc: 'The two restaurants, the indoor sports hall, both gyms and a study room, round an oval courtyard.',
    descZh: '两间餐厅、室内体育馆、两间健身房和自习室都在这栋里，中间是一个椭圆中庭。',
    where: 'East side of campus, below Training Building C.',
    whereZh: '校园东侧，实训楼C以南。',
    spots: ['canteen', 'flavour', 'gym-hall', 'gym-303', 'gym-304', 'study-room-2']
  },
  {
    id: 'dormA',
    en: 'Student Dormitory 1', zh: '学生宿舍1',
    x: 257.8, z: -124.7, rot: 0, floors: 13,
    w: 46.6, d: 23.0, h: 51.0, kind: 'dorm',
    photo: 'photos/dorm-1.jpg',
    card: 'photos/3d/dorm-a.jpg',
    category: 'residence',
    desc: 'The southern of the two towers, thirteen floors. The supermarket, coffee shop and parcel station run along its ground floor.',
    descZh: '东侧靠南的那栋宿舍，十三层。美宜佳超市、GMC 咖啡和快递驿站都在这栋的一楼。',
    where: 'Eastern edge of campus, the southern of the two towers.',
    whereZh: '校园东侧靠南的那栋宿舍。',
    spots: ['meiyijia', 'gmc', 'parcel']
  },
  {
    id: 'dormB',
    en: 'Student Dormitory 2', zh: '学生宿舍2',
    x: 256.6, z: -176.5, rot: 0, floors: 13,
    w: 43.5, d: 21.9, h: 51.0, kind: 'dorm',
    photo: 'photos/dorm-2.jpg',
    card: 'photos/3d/dorm-b.jpg',
    category: 'residence',
    desc: 'Student housing on the eastern edge, with the fruit shop on its south side.',
    descZh: '校园东侧的学生宿舍，南侧有一家水果店。',
    where: 'The northern of the two towers, on the eastern edge.',
    whereZh: '东侧靠北的那栋宿舍。',
    spots: ['tingning']
  },
  {
    id: 'aptA',
    en: 'Teacher Dormitory A', zh: '教师宿舍A',
    x: 208.0, z: -83.7, rot: 0, floors: 6,
    w: 31.4, d: 20.6, h: 21.0, kind: 'apt',
    photo: 'photos/teacher-dorm-a.jpg',
    card: 'photos/3d/teacher-dorm-a.jpg',
    category: 'residence',
    desc: 'Staff housing on the east bank of the lake, with a full-length balcony along its south face.',
    descZh: '湖东岸的教职工公寓，南面有一条通长阳台廊。',
    where: 'East of the lake, above the Lakeside Restaurant.',
    whereZh: '湖的东岸，湖畔坊餐厅上方。'
  },
  {
    id: 'aptB',
    en: 'Teacher Dormitory B', zh: '教师宿舍B',
    x: 209.8, z: -41.5, rot: 0, floors: 6,
    w: 31.1, d: 21.9, h: 21.0, kind: 'apt',
    photo: 'photos/teacher-dorm-b.jpg',
    card: 'photos/3d/teacher-dorm-b.jpg',
    category: 'residence',
    desc: 'The second staff block, below Teacher Dormitory A, with a row of greenery between them.',
    descZh: '第二栋教职工公寓，在 A 栋下方，两栋之间留了一片绿化。',
    where: 'Below Teacher Dormitory A, on the east side of the lake.',
    whereZh: '教师宿舍 A 下方，湖的东侧。'
  },
  {
    id: 'lakeside',
    en: 'Lakeside Restaurant', zh: '湖畔坊餐厅',
    x: 187.6, z: -63.0, rot: 0, floors: 2,
    w: 34.8, d: 27.7, h: 7.2, kind: 'lakeside',
    photo: 'photos/lakeside-restaurant.jpg',
    card: 'photos/3d/lakeside-restaurant.jpg',
    category: 'student-life',
    desc: 'The campus restaurant, with its west wall on the lake bank and a terrace over the water.',
    descZh: '校园餐厅，西墙直接落在湖岸上，二层向湖面挑出露台。',
    where: 'On the east bank of the lake, below the student center.',
    whereZh: '湖的东岸，学生中心下方。'
  },
  {
    id: 'lake',
    en: 'Lake', zh: '小湖',
    x: 154.7, z: -63.8, rot: 0, floors: 0,
    w: 57.0, d: 66.5, h: 0, kind: 'lake',
    photo: 'photos/lake.jpg',
    card: 'photos/3d/lake.jpg',
    category: 'landmark',
    desc: 'A small lake with a waterfront deck, a fountain and a landscaped walkway.',
    descZh: '带滨水平台、喷泉和环湖步道的小湖。',
    where: 'South-east of campus, beside the teacher dormitories.',
    whereZh: '校园东南方向，教师公寓旁边。',
    spots: []
  },
  {
    id: 'track',
    en: 'Sports Field', zh: '运动场',
    x: -286.1, z: -63.9, rot: 0, floors: 0,
    w: 93.5, d: 139.0, h: 0, kind: 'track',
    photo: 'photos/sports-field.jpg',
    card: 'photos/3d/sports-field.jpg',
    category: 'sports',
    desc: 'The blue running track and football pitch at the west end of campus, with the grass-bank stand on the far side.',
    descZh: '校园西端的蓝色跑道和足球场，西侧是草坡看台。',
    where: 'West end of campus, beside the courts.',
    whereZh: '校园西端，球场旁边。'
  },
  {
    id: 'courts',
    en: 'Basketball & Badminton Courts', zh: '篮球场与羽毛球场',
    x: -217.3, z: -66.5, rot: 0, floors: 0,
    w: 63.8, d: 141.4, h: 0, kind: 'courts',
    photo: 'photos/basketball-court.jpg',
    card: 'photos/3d/basketball-court.jpg',
    photos: [
      { src: 'photos/basketball-court.jpg', preview: 'photos/basketball-court.jpg', en: 'Basketball Courts', zh: '篮球场' },
      { src: 'photos/badminton-court.jpg', preview: 'photos/badminton-court.jpg', en: 'Badminton Courts', zh: '羽毛球场' }
    ],
    category: 'sports',
    desc: 'Three columns of courts next to the track — basketball, volleyball and badminton, with a row of trees between.',
    descZh: '紧挨运动场的三列球场，篮球、排球和羽毛球依次排开，每两列之间是一条树阵。',
    where: 'Between the sports field and the welcome center.',
    whereZh: '运动场和欢迎中心之间。'
  },
  {
    id: 'gate',
    en: 'Main Gate', zh: '校园正门',
    x: -21.5, z: 25.0, rot: 0, floors: 0,
    w: 226.0, d: 26.0, h: 4, kind: 'gate',
    photo: 'photos/main-gate.jpg',
    card: 'photos/3d/main-gate.jpg',
    category: 'landmark',
    desc: 'An open entrance: a low name wall on one side, a gatehouse on the other, and driveways running round the lawn either side of the name stone.',
    descZh: '开放式入口：一侧是校名矮墙，另一侧是门卫房，车道绕着草坪从两侧进来。',
    where: 'The south edge of campus, on the main approach.',
    whereZh: '校园南边界，主入口。'
  }
];

/* buildings.html is keyed by data.js, which uses longer ids than the scene
   does. Where a building has a page of its own, this says where to go. */
export const PAGE_ID = {
  welcome: 'welcome-center',
  a: 'teaching-a',
  b: 'teaching-b',
  c: 'training',
  student: 'student-center',
  dormA: 'dorm-a',
  dormB: 'dorm-b',
  aptA: 'teacher-dorm-a',
  aptB: 'teacher-dorm-b',
  lakeside: 'lakeside-restaurant',
  lake: 'lake',
  track: 'sports-field',
  courts: 'basketball-court'
};

/* The photo cards hung beside each building, and what each one links to. */
export const CARD_FOR = {};
BUILDINGS.forEach((b) => { CARD_FOR[b.id] = b.card; });

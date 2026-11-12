import '../data.js';
import { PAGE_ID } from './data.js';

// Reuse the 2D map's names/photos; PAGE_ID bridges its stable ids to 3D ids.
const floors = { 'study-room': 1, canteen: 1, flavour: 1, 'gym-hall': 2,
  'gym-303': 3, 'gym-304': 3, 'study-room-2': 2,
  meiyijia: 1, gmc: 1, parcel: 1, tingning: 1 };
const outside = new Set(['meiyijia', 'gmc', 'parcel', 'tingning']);
export const SPOTS = [];
for (const [parentId, pageId] of Object.entries(PAGE_ID)) {
  const place = window.CampusData.places.find(p => p.id === pageId);
  for (const spot of place?.spots || []) {
    if (spot.id === 'entrance' || spot.id === 'reception') continue;
    SPOTS.push({ ...spot, parentId, floor: floors[spot.id], exterior: outside.has(spot.id) });
  }
}
SPOTS.push({
  id: 'east-gate', parentId: 'east-gate', en: 'Campus East Gate', zh: '校园东门',
  floor: 1, exterior: true, photo: 'photos/east-gate.jpg',
  desc: 'The secondary entrance north of the student dormitories, with a security booth and barrier.',
  descZh: '学生宿舍北侧的次入口，设有保安亭和道闸。',
  where: 'North side of Student Dormitory 2.',
  whereZh: '学生宿舍 2 号楼北侧。'
});

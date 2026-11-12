"""Cut the small square photos the 3D scene hangs beside each building.

Each card in the 3D view is a 256 x 256 crop of the building's own
photograph, saved as JPEG. Crops are hand-aimed per picture so the building
fills the card rather than a slab of sky.

    python tools/make-billboards.py
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = r'C:/Users/qiaoyi/Desktop/校园图片'
OUT = os.path.join(ROOT, 'photos', '3d')
SIZE = 320

# source file -> (left, top, right, bottom) as fractions of the frame.
# The fractions pick the building out of each photograph.
JOBS = {
    'teaching-a':     ('A教学楼.jpg', (0.00, 0.02, 0.80, 0.80)),
    'teaching-b':     ('B教学楼.jpg', (0.10, 0.05, 0.95, 0.85)),
    'training':       ('C实训楼.jpg', (0.00, 0.22, 0.78, 0.78)),
    'student-center': ('学生中心.jpg', (0.02, 0.02, 0.98, 0.92)),
    'welcome-center': ('欢迎中心.jpg', (0.00, 0.25, 0.85, 0.82)),
    'dorm-a':         ('1栋学生宿舍.jpg', (0.00, 0.02, 0.85, 0.88)),
    'dorm-b':         ('2栋学生宿舍.jpg', (0.06, 0.00, 0.96, 0.86)),
    'teacher-dorm-a': ('A教室公寓.jpg', (0.10, 0.00, 0.95, 0.86)),
    'teacher-dorm-b': ('B教师公寓.jpg', (0.12, 0.00, 0.90, 0.80)),
    'lakeside-restaurant': ('湖畔坊餐厅.jpg', (0.00, 0.30, 0.85, 0.95)),
    'sports-field':   ('操场.jpg', (0.00, 0.30, 0.90, 0.95)),
    'badminton-court': ('羽毛球场.jpg', (0.00, 0.15, 0.85, 0.95)),
    'basketball-court': ('篮球场.jpg', (0.00, 0.15, 0.85, 0.95)),
}


def main():
    os.makedirs(OUT, exist_ok=True)
    for key, (name, box) in JOBS.items():
        path = os.path.join(SRC, name)
        if not os.path.exists(path):
            print('missing', path)
            continue
        im = Image.open(path).convert('RGB')
        w, h = im.size
        crop = im.crop((int(w * box[0]), int(h * box[1]),
                        int(w * box[2]), int(h * box[3])))
        # Square it off about the centre, then shrink.
        side = min(crop.size)
        left = (crop.width - side) // 2
        top = (crop.height - side) // 2
        crop = crop.crop((left, top, left + side, top + side))
        crop = crop.resize((SIZE, SIZE), Image.LANCZOS)
        out = os.path.join(OUT, key + '.jpg')
        crop.save(out, quality=82, optimize=True, progressive=True)
        print('wrote', os.path.basename(out), os.path.getsize(out) // 1024, 'KB')


if __name__ == '__main__':
    main()

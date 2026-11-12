"""Measure every building's footprint off the master plan.

Each building is drawn as a pale roof inside a dark outline. Inside a hand
drawn search box, the roof colour is taken as the building, grown by a few
pixels to take in the outline, and its tight axis-aligned box and outline
polygon are reported in plan pixels and in metres.

    python tools/measure-buildings.py            # print the table
    python tools/measure-buildings.py --overlay  # draw it back on the plan
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw
from skimage import morphology
from skimage.measure import find_contours, label as cc_label

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLAN = os.path.join(ROOT, 'images', '3d', 'ground.jpg')
OUT = os.path.join(ROOT, 'scene3d', 'plan.json')
MPP = 0.3375

# Search boxes, plan pixels. Loose enough to hold the building, tight
# enough to exclude the next one and the trees.
BOXES = {
    'welcome':  (655, 455, 880, 595),
    'a':        (655, 220, 885, 360),
    'b':        (1075, 220, 1305, 360),
    'c':        (1190, 50, 1440, 195),
    'student':  (1520, 55, 1695, 250),
    'dormA':    (1735, 200, 1905, 300),
    'dormB':    (1735, 55, 1905, 155),
    'aptA':     (1600, 330, 1725, 410),
    'aptB':     (1615, 450, 1730, 535),
    'lakeside': (1520, 355, 1665, 465),
    'pavilion': (1480, 465, 1610, 540),
}


def load():
    a = np.asarray(Image.open(PLAN).convert('RGB')).astype(np.float32)
    R, G, B = a[..., 0], a[..., 1], a[..., 2]
    lum = 0.299 * R + 0.587 * G + 0.114 * B
    sat = a.max(2) - a.min(2)
    # A roof is pale: either the near-white of the flat roofs or the pale
    # blue of the metal ones. Foliage is green and far more saturated, the
    # paper round the drawing is grey and duller.
    roof = (lum > 200) & (sat < 30) & ((B - R > -2) | (sat < 10))
    wall = (lum < 190) & ~((G - B > 12) & (G - R > 0))
    return a, roof, wall


def measure_blob(name, roof, wall, box):
    x0, y0, x1, y1 = box
    sub = roof[y0:y1, x0:x1]
    sub = morphology.remove_small_objects(morphology.closing(sub, morphology.disk(1)), 120)
    lab = cc_label(sub, connectivity=2)
    if lab.max() == 0:
        return None
    sizes = np.bincount(lab.ravel())
    sizes[0] = 0
    blob = lab == sizes.argmax()
    # grow to the drawn outline
    blob = morphology.binary_dilation(blob, morphology.disk(3))
    ys, xs = np.nonzero(blob)
    bx = [int(xs.min()) + x0, int(ys.min()) + y0, int(xs.max()) + x0, int(ys.max()) + y0]
    # the ring, for footprints that are not rectangles
    cont = max(find_contours(blob.astype(float), 0.5), key=len)
    pts = np.stack([cont[:, 1] + x0, cont[:, 0] + y0], 1)
    pts = simplify(pts, 1.5)
    return {'box': bx, 'ring': [[round(float(x), 1), round(float(y), 1)] for x, y in pts],
            'area': int(blob.sum())}


def simplify(pts, eps):
    if len(pts) < 4:
        return pts
    keep = np.zeros(len(pts), bool)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        i, j = stack.pop()
        if j <= i + 1:
            continue
        p, q = pts[i], pts[j]
        s = q - p
        L = float(np.hypot(*s)) or 1e-6
        best, bi = 0.0, -1
        for k in range(i + 1, j):
            r = pts[k] - p
            d = abs(s[0] * r[1] - s[1] * r[0]) / L
            if d > best:
                best, bi = d, k
        if best > eps:
            keep[bi] = True
            stack.append((i, bi))
            stack.append((bi, j))
    return pts[keep]


def main():
    a, roof, wall = load()
    found = {}
    print(f'{"id":9s} {"plan x0..x1":>16s} {"plan y0..y1":>14s} '
          f'{"m: w x d":>14s} {"centre (m)":>18s}')
    for name, box in BOXES.items():
        m = measure_blob(name, roof, wall, box)
        if not m:
            print(f'{name:9s} nothing')
            continue
        x0, y0, x1, y1 = m['box']
        w = (x1 - x0 + 1) * MPP
        d = (y1 - y0 + 1) * MPP
        cx = -88 + ((x0 + x1) / 2 - 788) * MPP
        cz = -110 + ((y0 + y1) / 2 - 290) * MPP
        found[name] = m
        print(f'{name:9s} {x0:7d}..{x1:<7d} {y0:6d}..{y1:<6d} '
              f'{w:6.1f} x {d:5.1f}  {cx:8.1f},{cz:8.1f}')

    data = {}
    if os.path.exists(OUT):
        data = json.load(open(OUT, encoding='utf-8'))
    data['buildings'] = found
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(data, f)

    if '--overlay' in sys.argv:
        im = Image.open(PLAN).convert('RGB')
        d = ImageDraw.Draw(im)
        for name, m in found.items():
            x0, y0, x1, y1 = m['box']
            d.rectangle([x0, y0, x1, y1], outline=(220, 0, 0), width=1)
            d.line([(x, y) for x, y in m['ring']] + [tuple(m['ring'][0])],
                   fill=(0, 120, 255), width=1)
            d.text((x0 + 2, y0 + 2), name, fill=(200, 0, 0))
        im.save(os.path.join(ROOT, 'shots', 'measured.png'))
        print('overlay -> shots/measured.png')


if __name__ == '__main__':
    main()

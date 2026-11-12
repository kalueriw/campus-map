"""Build the 3D scene's ground texture from the campus master plan.

The plan is drawn in an aerial projection with long shadows. Cutting the
site out and flattening the camera shading gives a clean base map that the
3D scene drapes over its ground plane, so the paths, lawns and lake sit
exactly where the plan puts them.

    python tools/make-ground.py "path/to/plan.jpg" images/3d/ground.jpg

Everything is expressed in *plan pixels*: the source image is 1964 x 700.
The site is the box below; the 3D code repeats these four numbers as its
PLAN constants, so keep the two in step.
"""
import sys
from PIL import Image, ImageFilter

# The drawing's own bounds, in source pixels.
PLAN_LEFT, PLAN_TOP, PLAN_RIGHT, PLAN_BOTTOM = 8, 8, 1956, 694
# Square texture, and the square is exactly as wide as the strip: the scene
# then maps one texture pixel to one plan pixel, with the strip centred.
SIDE = PLAN_RIGHT - PLAN_LEFT


def flatten_shading(img, radius=34, low=0.74, high=1.5):
    """Divide out the camera's broad shading (building shadows, vignetting).

    A heavily blurred copy of the luminance stands in for the local
    illumination; dividing by it evens the light out while leaving the
    colour of every lawn, path and lake as drawn.
    """
    lum = img.convert('L').filter(ImageFilter.GaussianBlur(radius))
    values = list(lum.getdata())
    mean = sum(values) / len(values)
    gain = [min(high, max(low, mean / (v or 1))) for v in range(256)]
    bands = []
    for band in img.split():
        src = list(band.getdata())
        band.putdata([min(255, int(c * gain[l])) for c, l in zip(src, values)])
        bands.append(band)
    return Image.merge('RGB', bands)


def site_outline(img):
    """Alpha mask: the drawing's not-quite-white outside, its paper inside."""
    mask = Image.new('L', img.size, 0)
    src = img.load()
    dst = mask.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b = src[x, y]
            # Outside is pure (255,255,255); the drawing's palest ground is
            # about (248,247,236). Everything below that is paper.
            dst[x, y] = 0 if (r >= 253 and g >= 253 and b >= 253) else 255
    return mask.filter(ImageFilter.MinFilter(3))


def main(src_path, out_path):
    src = Image.open(src_path).convert('RGB')
    site = src.crop((PLAN_LEFT, PLAN_TOP, PLAN_RIGHT, PLAN_BOTTOM))
    site = flatten_shading(site)
    site = Image.blend(site, site.filter(ImageFilter.GaussianBlur(1.1)), 0.5)

    # The strip is the texture, unmodified: the scene lays a plane of the
    # same shape (PLAN_W x PLAN_D metres) and drapes this over it, so one
    # texel is one plan pixel and nothing is padded or stretched.
    site.save(out_path, quality=88, optimize=True, progressive=True)
    print('wrote', out_path, site.size)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])

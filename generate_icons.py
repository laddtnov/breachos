"""Generate Breachos-style PWA icons (192x192 and 512x512).

Everything here is drawn programmatically from primitives — no font file is
loaded, so the output carries no third-party type foundry's rights. The B
monogram is the same block letterform as icons/favicon.svg, which keeps the
two icons consistent and keeps the artwork wholly original to this project.
"""
from PIL import Image, ImageDraw, ImageFilter

CYAN  = (0, 243, 255)
PINK  = (255, 0, 85)
BG    = (10, 10, 25)

# Block "B" on a 34x44 grid, as polygons. Same letterform family as
# icons/favicon.svg, redrawn on a finer grid because the favicon's 32px cell
# is too coarse here — at 512px the neon bloom closed up its counters and the
# letter read as an E.
#
# Two details do the work of making this a B rather than an 8: the lower bowl
# reaches four units further right than the upper one, and both outer corners
# are chamfered. Without the step and the cuts, a rectangle with two holes in
# it is an 8. The chamfers also echo the circuit traces in the corners.
MONOGRAM_W, MONOGRAM_H = 34, 44   # extent of the letter on that grid
_CHAMFER = 6


def _rect(x, y, w, h):
    return [(x, y), (x + w, y), (x + w, y + h), (x, y + h)]


MONOGRAM_SHAPES = [
    _rect(0,  0,  7, 44),                       # left stem, full height
    _rect(7,  0, 17,  7),                       # top bar
    [(24, 0), (30 - _CHAMFER, 0), (30, _CHAMFER),
     (30, 25), (24, 25)],                       # upper bowl, right edge
    _rect(7, 18, 21,  7),                       # middle bar
    [(28, 18), (34, 18), (34, 44 - _CHAMFER),
     (34 - _CHAMFER, 44), (28, 44)],            # lower bowl, right edge
    _rect(7, 37, 21,  7),                       # bottom bar
]

# Cap height of the monogram as a fraction of the icon. Roughly matches the
# optical weight of the 0.58em type it replaces.
MONOGRAM_SCALE = 0.46


def draw_monogram(draw: ImageDraw.ImageDraw, s: int, fill: tuple) -> None:
    """Draw the block B centred on an s-by-s canvas, nudged up off centre."""
    unit = s * MONOGRAM_SCALE / MONOGRAM_H
    left = (s - MONOGRAM_W * unit) / 2
    top  = (s - MONOGRAM_H * unit) / 2 - s / 30   # same lift the type had

    for shape in MONOGRAM_SHAPES:
        draw.polygon([(left + x * unit, top + y * unit) for x, y in shape], fill=fill)


def make_icon(size: int) -> Image.Image:
    s = size
    radius   = s // 6        # corner radius
    pad      = s // 22       # border inset
    bw       = max(2, s // 80)  # border line width

    canvas = Image.new('RGBA', (s, s), (0, 0, 0, 0))

    # ── 1. Background ──────────────────────────────────────────────────────
    bg = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    ImageDraw.Draw(bg).rounded_rectangle(
        [0, 0, s - 1, s - 1], radius=radius, fill=(*BG, 255)
    )
    canvas = Image.alpha_composite(canvas, bg)

    # ── 2. Scanline grid (matching game card texture) ──────────────────────
    grid = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grid)
    step = max(4, s // 40)
    for y in range(0, s, step * 2):   # horizontal scanlines
        gd.line([(0, y), (s, y)], fill=(*CYAN, 8), width=1)
    col_step = max(6, s // 28)
    for x in range(0, s, col_step):   # vertical grid
        gd.line([(x, 0), (x, s)], fill=(*CYAN, 6), width=1)
    canvas = Image.alpha_composite(canvas, grid)

    # ── 3. Neon border glow ────────────────────────────────────────────────
    # Outer soft glow (blurred)
    glow = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    ImageDraw.Draw(glow).rounded_rectangle(
        [pad, pad, s - pad - 1, s - pad - 1],
        radius=radius - pad // 2,
        outline=(*CYAN, 180),
        width=s // 18,
    )
    canvas = Image.alpha_composite(canvas, glow.filter(ImageFilter.GaussianBlur(s // 22)))

    # Inner soft glow (tighter)
    inner_glow = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    ImageDraw.Draw(inner_glow).rounded_rectangle(
        [pad, pad, s - pad - 1, s - pad - 1],
        radius=radius - pad // 2,
        outline=(*CYAN, 80),
        width=s // 40,
    )
    canvas = Image.alpha_composite(canvas, inner_glow.filter(ImageFilter.GaussianBlur(s // 50)))

    # Sharp border line
    sharp_border = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    ImageDraw.Draw(sharp_border).rounded_rectangle(
        [pad, pad, s - pad - 1, s - pad - 1],
        radius=radius - pad // 2,
        outline=(*CYAN, 255),
        width=bw,
    )
    canvas = Image.alpha_composite(canvas, sharp_border)

    # ── 4. Circuit-trace corner accents ───────────────────────────────────
    trace = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    td = ImageDraw.Draw(trace)
    tlen  = s // 8    # trace arm length
    toff  = pad + s // 12   # offset from corner
    tdot  = max(2, s // 60) # endpoint dot radius
    tw    = max(1, s // 120) # trace line width

    corners = [
        (toff, toff,         1,  1),   # top-left
        (s - toff, toff,    -1,  1),   # top-right
        (toff, s - toff,     1, -1),   # bottom-left
        (s - toff, s - toff,-1, -1),   # bottom-right
    ]
    for cx, cy, dx, dy in corners:
        # horizontal arm
        td.line([(cx, cy), (cx + dx * tlen, cy)], fill=(*CYAN, 160), width=tw)
        # vertical arm
        td.line([(cx, cy), (cx, cy + dy * tlen)], fill=(*CYAN, 160), width=tw)
        # endpoint dot (horizontal end)
        ex, ey = cx + dx * tlen, cy
        td.ellipse([ex - tdot, ey - tdot, ex + tdot, ey + tdot], fill=(*PINK, 220))
        # endpoint dot (vertical end)
        ex2, ey2 = cx, cy + dy * tlen
        td.ellipse([ex2 - tdot, ey2 - tdot, ex2 + tdot, ey2 + tdot], fill=(*PINK, 220))

    canvas = Image.alpha_composite(canvas, trace)

    # ── 5. Central "B" monogram with neon glow ────────────────────────────
    # Four stacked passes: a wide soft bloom, a tighter one, a pink inner
    # halo, then the sharp letter on top.
    # The outer bloom is deliberately tighter than a text glow would be: the
    # counters are only about 0.11*s tall, and a wide blur closes them up.
    for blur, colour, alpha in [
        (s // 26, CYAN, 170),
        (s // 40, CYAN, 230),
        (s // 70, PINK, 60),
        (0,       CYAN, 255),
    ]:
        layer = Image.new('RGBA', (s, s), (0, 0, 0, 0))
        draw_monogram(ImageDraw.Draw(layer), s, (*colour, alpha))
        if blur:
            layer = layer.filter(ImageFilter.GaussianBlur(blur))
        canvas = Image.alpha_composite(canvas, layer)

    # The wordmark that used to sit along the bottom edge is gone: it was set
    # in a licensed system typeface, and at 192px it rendered about nine
    # pixels tall. Launcher icons are not the place for a caption anyway.
    return canvas


if __name__ == '__main__':
    icon_dir = 'icons'
    for size, name in [(512, 'icon-512.png'), (192, 'icon-192.png')]:
        img = make_icon(size)
        out = f'{icon_dir}/{name}'
        img.save(out, 'PNG')
        print(f'Generated {out}')

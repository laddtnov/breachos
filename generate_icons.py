"""Generate Breachos-style PWA icons (192x192 and 512x512)."""
from PIL import Image, ImageDraw, ImageFilter, ImageFont

CYAN  = (0, 243, 255)
PINK  = (255, 0, 85)
BG    = (10, 10, 25)

FONT_PATH = '/System/Library/Fonts/Supplemental/Futura.ttc'


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

    # ── 5. Central "B" with neon glow ─────────────────────────────────────
    font_size = int(s * 0.58)
    try:
        font = ImageFont.truetype(FONT_PATH, font_size, index=3)  # Futura Bold Heavy
    except Exception:
        font = ImageFont.load_default()

    letter = 'B'
    dummy_draw = ImageDraw.Draw(Image.new('RGBA', (s, s)))
    bbox = dummy_draw.textbbox((0, 0), letter, font=font)
    tx = (s - (bbox[2] - bbox[0])) // 2 - bbox[0]
    ty = (s - (bbox[3] - bbox[1])) // 2 - bbox[1] - s // 30  # slight upward nudge

    # Outer cyan glow
    text_glow = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    ImageDraw.Draw(text_glow).text((tx, ty), letter, font=font, fill=(*CYAN, 200))
    canvas = Image.alpha_composite(
        canvas, text_glow.filter(ImageFilter.GaussianBlur(s // 16))
    )

    # Mid cyan glow (tighter)
    text_mid = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    ImageDraw.Draw(text_mid).text((tx, ty), letter, font=font, fill=(*CYAN, 230))
    canvas = Image.alpha_composite(
        canvas, text_mid.filter(ImageFilter.GaussianBlur(s // 40))
    )

    # Pink inner halo
    text_pink = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    ImageDraw.Draw(text_pink).text((tx, ty), letter, font=font, fill=(*PINK, 60))
    canvas = Image.alpha_composite(
        canvas, text_pink.filter(ImageFilter.GaussianBlur(s // 70))
    )

    # Sharp text on top
    text_sharp = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    ImageDraw.Draw(text_sharp).text((tx, ty), letter, font=font, fill=(*CYAN, 255))
    canvas = Image.alpha_composite(canvas, text_sharp)

    # ── 6. Bottom label "BREACHOS" ─────────────────────────────────────────
    label_size = max(8, s // 20)
    try:
        label_font = ImageFont.truetype(FONT_PATH, label_size, index=3)
    except Exception:
        label_font = ImageFont.load_default()

    label = 'BREACHOS'
    lbbox = dummy_draw.textbbox((0, 0), label, font=label_font)
    lx = (s - (lbbox[2] - lbbox[0])) // 2 - lbbox[0]
    ly = s - pad - (lbbox[3] - lbbox[1]) - s // 22

    label_glow = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    ImageDraw.Draw(label_glow).text((lx, ly), label, font=label_font, fill=(*CYAN, 160))
    canvas = Image.alpha_composite(
        canvas, label_glow.filter(ImageFilter.GaussianBlur(max(1, s // 60)))
    )

    label_sharp = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    ImageDraw.Draw(label_sharp).text((lx, ly), label, font=label_font, fill=(*CYAN, 200))
    canvas = Image.alpha_composite(canvas, label_sharp)

    return canvas


if __name__ == '__main__':
    icon_dir = 'icons'
    for size, name in [(512, 'icon-512.png'), (192, 'icon-192.png')]:
        img = make_icon(size)
        out = f'{icon_dir}/{name}'
        img.save(out, 'PNG')
        print(f'Generated {out}')

# Builds every app icon (web PWA + Android) from web/icons/icon-source.jpg, a render of the app tile
# on a phone home screen: the tile is cut out with anti-aliased rounded corners, the rest made transparent.
# Run from the repo root after changing the source: python scripts/make-icons.py  (needs Pillow)
import os
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
WEB = os.path.join(ROOT, 'web', 'icons')
RES = os.path.join(ROOT, 'app', 'src', 'main', 'res')

L, T, R, B = 143, 135, 881, 894   # outer edge of the gold-framed tile in the 1024 px source
RADIUS = 150
SS = 4                            # supersampling for smooth corners
GREEN = (8, 40, 28, 255)          # #08281C, the tile's outer shade, behind maskable / adaptive icons


def cut_tile():
    src = Image.open(os.path.join(WEB, 'icon-source.jpg')).convert('RGB')
    w, h = R - L, B - T
    mask = Image.new('L', (w * SS, h * SS), 0)
    ImageDraw.Draw(mask).rounded_rectangle((SS, SS, w * SS - SS, h * SS - SS), radius=RADIUS * SS, fill=255)
    tile = src.crop((L, T, R, B)).convert('RGBA')
    tile.putalpha(mask.resize((w, h), Image.LANCZOS))
    return tile


TILE = cut_tile()


def on_canvas(size, scale, bg=None):
    canvas = Image.new('RGBA', (size, size), bg or (0, 0, 0, 0))
    k = size * scale / max(TILE.size)
    t = TILE.resize((round(TILE.width * k), round(TILE.height * k)), Image.LANCZOS)
    canvas.alpha_composite(t, ((size - t.width) // 2, (size - t.height) // 2))
    return canvas


def save(img, path, opaque=False):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    (img.convert('RGB') if opaque else img).save(path, optimize=True)


# Web: transparent icons, a maskable one inside the 80% safe circle, and an opaque one for iOS
for size, name in [(512, 'icon-512.png'), (512, 'icon.png'), (192, 'icon-192.png'), (32, 'favicon-32.png')]:
    save(on_canvas(size, 0.96), os.path.join(WEB, name))
save(on_canvas(512, 0.68, GREEN), os.path.join(WEB, 'icon-maskable-512.png'), opaque=True)
save(on_canvas(180, 0.92, GREEN), os.path.join(WEB, 'apple-touch-icon.png'), opaque=True)

# Android: adaptive foreground (108 dp layer; the tile fits inside the 72 dp visible area even under a
# circle mask) and legacy 48 dp launcher icons for Android 7.x
DENSITIES = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
for name, k in DENSITIES.items():
    folder = os.path.join(RES, f'mipmap-{name}')
    save(on_canvas(round(108 * k), 0.52), os.path.join(folder, 'ic_launcher_foreground.png'))
    legacy = on_canvas(round(48 * k), 0.92)
    save(legacy, os.path.join(folder, 'ic_launcher.png'))
    save(legacy, os.path.join(folder, 'ic_launcher_round.png'))
print('icons written')

"""Crop Hello Kitty scenes from sticker sheet and generate sized variants."""
from PIL import Image
import os

SRC = r"C:\Users\Administrator\Desktop\素材.png"
DST = r"C:\Users\Administrator\WorkBuddy\2026-08-14-20-30-56\labubu-workbench\assets\img\kitty"

os.makedirs(DST, exist_ok=True)

img = Image.open(SRC).convert("RGBA")
W, H = img.size  # 437 x 583
COLS, ROWS = 4, 6
cw, ch = W / COLS, H / ROWS

# 场景映射: (row, col) -> 输出文件名 (不带扩展名)
SCENES = {
    (0, 0): "airplane",          # 粉色飞机
    (0, 1): "picnic",            # 野餐篮
    (0, 2): "cart",              # 购物车
    (0, 3): "cloud-sleep",       # 云朵睡觉
    (1, 0): "bike",              # 自行车
    (1, 1): "car",               # 小黄车
    (1, 2): "tea",               # 茶杯
    (1, 3): "book",              # 红书
    (2, 0): "umbrella",          # 雨伞
    (2, 1): "scooter",           # 滑板车
    (2, 2): "blocks",            # 积木
    (2, 3): "star-sleep",        # 星星睡觉
    (3, 0): "notebook",          # 笔记本
    (3, 1): "bowl",              # 浴缸
    (3, 2): "plane-seat",        # 飞机座位
    (3, 3): "suitcase",          # 行李箱
    (4, 0): "snowglobe-pink",    # 粉色雪球
    (4, 1): "house",             # 小屋
    (4, 2): "kuromi-bike",       # 库洛米骑车
    (4, 3): "kuromi-cart",       # 库洛米购物
    (5, 0): "doghouse",          # 狗屋
    (5, 1): "bag-pink",          # 粉色购物袋
    (5, 2): "snowglobe-purple",  # 紫色雪球
    (5, 3): "bag-paper",         # 纸袋
}

def crop_scene(row, col, pad=8):
    """Crop a single scene with some padding."""
    x0 = max(0, int(col * cw) + pad)
    y0 = max(0, int(row * ch) + pad)
    x1 = min(W, int((col + 1) * cw) - pad)
    y1 = min(H, int((row + 1) * ch) - pad)
    return img.crop((x0, y0, x1, y1))

def save_resized(im, size, out_path, fmt=None):
    """Resize keeping aspect ratio (cover mode, centered)."""
    sw, sh = im.size
    target_w, target_h = size
    # 保持比例，按短边缩放
    scale = max(target_w / sw, target_h / sh)
    nw, nh = int(sw * scale), int(sh * scale)
    im2 = im.resize((nw, nh), Image.LANCZOS)
    # 中心裁切
    left = (nw - target_w) // 2
    top = (nh - target_h) // 2
    im2 = im2.crop((left, top, left + target_w, top + target_h))
    im2.save(out_path, fmt or "PNG", optimize=True)

# 裁切并保存
print("Cropping 24 scenes...")
for (r, c), name in SCENES.items():
    cropped = crop_scene(r, c, pad=6)
    # 保存原始裁切图
    out_orig = os.path.join(DST, f"kitty-{name}.png")
    cropped.save(out_orig, "PNG", optimize=True)
    print(f"  {name}: {cropped.size} -> {os.path.basename(out_orig)}")

# 为关键场景生成多尺寸变体
# 通用尺寸: tiny(48), small(96), thumb(128), medium(180), card(240), header(320), hero(480)
SIZES = {
    "tiny": 48,
    "small": 96,
    "thumb": 128,
    "medium": 180,
    "card": 240,
    "header": 320,
    "hero": 480,
}

# 模块主图: 5 个模块各一个 + 备用
MAIN_SCENES = ["bike", "tea", "book", "star-sleep", "cart", "picnic", "cloud-sleep", "snowglobe-pink", "airplane", "notebook", "umbrella", "scooter", "bag-pink", "snowglobe-purple"]

print("\nGenerating sized variants for main scenes...")
for name in MAIN_SCENES:
    src_path = os.path.join(DST, f"kitty-{name}.png")
    if not os.path.exists(src_path):
        print(f"  SKIP {name} (source not found)")
        continue
    src = Image.open(src_path).convert("RGBA")
    for size_name, size_px in SIZES.items():
        out_path = os.path.join(DST, f"kitty-{name}-{size_name}.png")
        save_resized(src, (size_px, size_px), out_path)
    print(f"  {name}: 7 sizes")

# WebP 版本 (hero 尺寸)
print("\nGenerating WebP versions for performance...")
for name in MAIN_SCENES[:6]:  # 最重要的几个
    src_path = os.path.join(DST, f"kitty-{name}-hero.png")
    if os.path.exists(src_path):
        im = Image.open(src_path).convert("RGBA")
        webp_path = os.path.join(DST, f"kitty-{name}-hero.webp")
        im.save(webp_path, "WEBP", quality=85, method=6)
        print(f"  {name}.webp OK")

print(f"\nAll done! Files in: {DST}")
print(f"Total PNG files: {len([f for f in os.listdir(DST) if f.endswith('.png')])}")

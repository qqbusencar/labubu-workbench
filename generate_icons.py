"""Generate Hello Kitty PWA icons (192x192, 512x512)."""
from PIL import Image, ImageDraw
import os

SRC = r"C:\Users\Administrator\WorkBuddy\2026-08-14-20-30-56\labubu-workbench\assets\img\kitty\kitty-picnic.png"
DST_DIR = r"C:\Users\Administrator\WorkBuddy\2026-08-14-20-30-56\labubu-workbench\assets\img"

def draw_kitty_icon(size, output_path):
    """Draw a Hello Kitty icon on a soft pink background."""
    # 创建粉色背景
    bg_color = (255, 235, 245)  # 浅粉
    img = Image.new('RGBA', (size, size), bg_color)
    draw = ImageDraw.Draw(img)

    # 画一个圆形粉色背景
    margin = size // 20
    draw.ellipse(
        [margin, margin, size - margin, size - margin],
        fill=(255, 220, 235),
        outline=(255, 143, 188),
        width=max(2, size // 96)
    )

    # 加载并缩放 Kitty 主体
    kitty = Image.open(SRC).convert('RGBA')
    # 缩放到 70% 大小居中
    target = int(size * 0.7)
    kitty.thumbnail((target, target), Image.LANCZOS)

    # 居中粘贴
    x = (size - kitty.width) // 2
    y = (size - kitty.height) // 2
    img.paste(kitty, (x, y), kitty)

    img.save(output_path, 'PNG', optimize=True)
    print(f"  {os.path.basename(output_path)}: {size}x{size}")

draw_kitty_icon(192, os.path.join(DST_DIR, 'icon-192.png'))
draw_kitty_icon(512, os.path.join(DST_DIR, 'icon-512.png'))
print("Done!")

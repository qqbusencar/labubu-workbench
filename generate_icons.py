"""生成 Labubu PWA 图标 PNG 版本"""
from PIL import Image, ImageDraw
import math


def draw_labubu(size, output_path):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    s = size / 200.0  # scale factor (viewBox = 200)

    def sx(x): return x * s
    def sy(y): return y * s
    def sb(x1, y1, x2, y2): return (sx(x1), sy(y1), sx(x2), sy(y2))
    def sp(pts): return [(sx(p[0]), sy(p[1])) for p in pts]

    # 背景渐变
    bg_color1 = (217, 194, 236)
    bg_color2 = (255, 198, 213)
    for y in range(size):
        ratio = y / size
        r = int(bg_color1[0] * (1 - ratio) + bg_color2[0] * ratio)
        g = int(bg_color1[1] * (1 - ratio) + bg_color2[1] * ratio)
        b = int(bg_color1[2] * (1 - ratio) + bg_color2[2] * ratio)
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))

    # 圆角遮罩
    mask = Image.new('L', (size, size), 0)
    mdraw = ImageDraw.Draw(mask)
    radius = int(40 * s)
    mdraw.rounded_rectangle([(0, 0), (size, size)], radius=radius, fill=255)
    result = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    result.paste(img, (0, 0), mask)

    draw = ImageDraw.Draw(result)

    # 身体
    draw.ellipse(sb(45, 130, 155, 210), fill=(255, 248, 251, 255))
    # 背带裤
    draw.polygon(sp([
        (70, 150), (100, 140), (130, 150),
        (135, 200), (100, 210), (65, 200)
    ]), fill=(168, 195, 224, 255))
    # 背带裤扣
    for cx in [95, 105]:
        draw.ellipse(sb(cx - 3, 152, cx + 3, 158), fill=(247, 212, 227, 255))

    # 头部
    draw.ellipse(sb(40, 45, 160, 155), fill=(255, 248, 251, 255))

    # 耳朵
    draw.ellipse(sb(40, 25, 70, 85), fill=(255, 248, 251, 255))
    draw.ellipse(sb(43, 30, 67, 80), fill=(255, 213, 228, 255))
    draw.ellipse(sb(130, 25, 160, 85), fill=(255, 248, 251, 255))
    draw.ellipse(sb(133, 30, 157, 80), fill=(255, 213, 228, 255))

    # 牙齿
    for x in [60, 130]:
        draw.polygon(sp([(x, 40), (x + 5, 50), (x + 10, 40)]), fill=(255, 255, 255, 255))

    # 腮红
    draw.ellipse(sb(55, 109, 75, 121), fill=(255, 198, 213, 200))
    draw.ellipse(sb(125, 109, 145, 121), fill=(255, 198, 213, 200))

    # 眼睛
    eye_color_outer = (110, 76, 168)
    eye_color_inner = (180, 151, 214)
    draw.ellipse(sb(69, 86, 91, 114), fill=eye_color_outer)
    draw.ellipse(sb(72, 89, 88, 111), fill=eye_color_inner)
    draw.ellipse(sb(80, 91, 86, 97), fill=(255, 255, 255, 255))
    draw.ellipse(sb(75, 100, 78, 103), fill=(255, 255, 255, 255))
    draw.ellipse(sb(109, 86, 131, 114), fill=eye_color_outer)
    draw.ellipse(sb(112, 89, 128, 111), fill=eye_color_inner)
    draw.ellipse(sb(120, 91, 126, 97), fill=(255, 255, 255, 255))
    draw.ellipse(sb(115, 100, 118, 103), fill=(255, 255, 255, 255))

    # 嘴
    draw.arc(sb(88, 128, 112, 142), start=0, end=180, fill=(168, 124, 174, 255), width=max(1, int(2 * s)))

    result.save(output_path)
    print(f'Generated: {output_path}')


draw_labubu(192, 'C:/Users/Administrator/WorkBuddy/2026-08-14-20-30-56/labubu-workbench/assets/img/icon-192.png')
draw_labubu(512, 'C:/Users/Administrator/WorkBuddy/2026-08-14-20-30-56/labubu-workbench/assets/img/icon-512.png')
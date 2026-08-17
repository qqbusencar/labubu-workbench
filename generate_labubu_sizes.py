"""Generate sized Labubu hero images for the workbench."""
from PIL import Image
import os

src = r"C:\Users\Administrator\WorkBuddy\2026-08-14-20-30-56\labubu-workbench\assets\img\labubu-hero.png"
dst_dir = r"C:\Users\Administrator\WorkBuddy\2026-08-14-20-30-56\labubu-workbench\assets\img"

img = Image.open(src)
print("Original size:", img.size)

def save_resized(img, w, name, fmt="PNG"):
    ratio = w / img.size[0]
    h = int(img.size[1] * ratio)
    out = img.resize((w, h), Image.LANCZOS)
    # If PNG, convert palette for tiny file
    if fmt.upper() == "PNG" and w <= 200:
        out = out.convert("P", palette=Image.ADAPTIVE, colors=128)
    path = os.path.join(dst_dir, name)
    out.save(path, format=fmt, optimize=True)
    sz = os.path.getsize(path)
    print(f"  {name}: {w}x{h} -> {sz/1024:.1f} KB")

# Optimize the main hero too (1080w is fine for hero use)
save_resized(img, 1080, "labubu-hero.png")

# Module header version
save_resized(img, 360, "labubu-header.png")
save_resized(img, 240, "labubu-card.png")
save_resized(img, 160, "labubu-medium.png")
save_resized(img, 120, "labubu-small.png")
save_resized(img, 96, "labubu-thumb.png")
save_resized(img, 64, "labubu-tiny.png")

# WebP versions for modern browsers (smaller)
img.save(os.path.join(dst_dir, "labubu-hero.webp"), format="WEBP", quality=85, method=6)
print("  labubu-hero.webp generated")

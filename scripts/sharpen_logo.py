"""
Logo IMCP net : on ne garde QUE le sigle teal "imcp" (le sous-titre flou
est retire — il est re-ecrit en texte vectoriel net dans la video).
Keying par "teal-ness" (max(g,b) - r), avivage, upscale x6 + accentuation.
Affiche ensuite en plus petit -> rendu net (downscale).
Sortie : public/logo-mark.png
"""
from PIL import Image, ImageFilter, ImageEnhance

src = Image.open("public/logo.jpg").convert("RGB")

# Aviver le teal AVANT keying (plus lumineux / sature sur fond navy)
src = ImageEnhance.Color(src).enhance(1.25)
src = ImageEnhance.Brightness(src).enhance(1.10)
src = ImageEnhance.Contrast(src).enhance(1.06)

# Upscale genereux pour avoir de la matiere (affichage = downscale net)
scale = 6
src = src.resize((src.width * scale, src.height * scale), Image.LANCZOS)

px = src.load()
w, h = src.size
out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
op = out.load()

LO, HI = 16, 58  # seuils de "teal-ness"
for y in range(h):
    for x in range(w):
        r, g, b = px[x, y]
        teal = max(g, b) - r            # eleve = teal ; ~0 = blanc/gris
        if teal <= LO:
            a = 0
        elif teal >= HI:
            a = 255
        else:
            a = int(255 * (teal - LO) / (HI - LO))
        op[x, y] = (r, g, b, a)

# Accentuation (nettete) sur le sigle
out = out.filter(ImageFilter.UnsharpMask(radius=3, percent=150, threshold=2))

# --- Isoler la bande du sigle (retirer le sous-titre residuel) ---
alpha = out.getchannel("A")
ap = alpha.load()
row_sum = [sum(ap[x, y] for x in range(w)) for y in range(h)]
mx = max(row_sum) or 1
thr = 0.12 * mx
# Groupes de lignes "denses" consecutives
groups, cur = [], None
for y in range(h):
    if row_sum[y] >= thr:
        if cur is None:
            cur = [y, y]
        else:
            cur[1] = y
    else:
        if cur is not None:
            groups.append(cur); cur = None
if cur is not None:
    groups.append(cur)
# Garder le groupe au plus fort total (= le sigle)
best = max(groups, key=lambda g: sum(row_sum[g[0]:g[1] + 1]))
pad = int((best[1] - best[0]) * 0.06)
top = max(0, best[0] - pad)
bot = min(h, best[1] + 1 + pad)
out = out.crop((0, top, w, bot))

# Recadre horizontalement
bbox = out.getbbox()
if bbox:
    out = out.crop(bbox)

out.save("public/logo-mark.png")
print("OK logo-mark.png", out.size)

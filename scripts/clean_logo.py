"""
Nettoie le logo IMCP : supprime le fond blanc -> PNG transparent.
Keying par canal minimum (le blanc a min(r,g,b) eleve ; les lettres
bleu/teal ont un canal rouge bas -> conservees). Feathering doux pour
eviter les bords grossiers. Upscale x3 (LANCZOS) pour la nettete.
"""
from PIL import Image, ImageFilter

src = Image.open("public/logo.jpg").convert("RGB")

# Upscale x3 avant keying pour des bords plus lisses
scale = 3
src = src.resize((src.width * scale, src.height * scale), Image.LANCZOS)

px = src.load()
w, h = src.size
out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
op = out.load()

HI = 236   # >= => totalement transparent (blanc pur)
LO = 200   # <= => totalement opaque (couleur franche)

for y in range(h):
    for x in range(w):
        r, g, b = px[x, y]
        wness = min(r, g, b)            # "blancheur"
        if wness >= HI:
            a = 0
        elif wness <= LO:
            a = 255
        else:
            a = int(255 * (HI - wness) / (HI - LO))
        op[x, y] = (r, g, b, a)

# Lisse legerement le canal alpha pour un rendu propre (anti halo)
alpha = out.getchannel("A").filter(ImageFilter.GaussianBlur(0.6))
out.putalpha(alpha)

# Recadre sur le contenu visible
bbox = out.getbbox()
if bbox:
    out = out.crop(bbox)

out.save("public/logo-clean.png")
print("OK logo-clean.png", out.size)

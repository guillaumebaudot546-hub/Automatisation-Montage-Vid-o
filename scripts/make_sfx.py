"""
Bruitages "premium" RAFFINES (pur Python, sans dependances).
Objectif : discrets, doux, professionnels — pas de cartoon.
Sortie : public/sfx/*.wav  (44.1 kHz, 16-bit, stereo)
  swoosh  : transition aerienne douce (noise filtre, enveloppe lente)
  click   : tick unique soft (apparition d'element)
  bubble  : ping mellow (accent discret)
  zoom    : swell ascendant lisse (reveal)
  impact  : sub-thump doux (moment fort)
"""
import wave, struct, math, random

SR = 44100
random.seed(11)

def one_pole_lp(x, a):
    y, p = [], 0.0
    for s in x:
        p += a * (s - p); y.append(p)
    return y

def normalize(sig, peak=0.5):
    m = max(1e-9, max(abs(s) for s in sig))
    g = peak / m
    return [s * g for s in sig]

def fade_edges(sig, ms=8):
    n = int(ms / 1000 * SR)
    out = list(sig)
    for i in range(min(n, len(out))):
        g = i / n
        out[i] *= g
        out[-1 - i] *= g
    return out

def write_stereo(path, left, right):
    n = min(len(left), len(right))
    with wave.open(path, "w") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        fr = bytearray()
        for i in range(n):
            l = max(-1, min(1, left[i])); r = max(-1, min(1, right[i]))
            fr += struct.pack("<hh", int(l * 32767), int(r * 32767))
        w.writeframes(bytes(fr))
    print("wrote", path, f"{n/SR:.2f}s")

# ---- swoosh : air doux qui passe ----
def make_swoosh():
    dur = 0.55; N = int(dur * SR)
    noise = [random.uniform(-1, 1) for _ in range(N)]
    out, p = [], 0.0
    for i in range(N):
        t = i / N
        fc = 400 + 1500 * math.sin(math.pi * t)   # doux, plafonne bas (~1900 Hz)
        rc = 1 / (2 * math.pi * fc); a = (1 / SR) / (rc + 1 / SR)
        p += a * (noise[i] - p); out.append(p)
    slow = one_pole_lp(out, 0.004)
    out = [out[i] - slow[i] for i in range(N)]    # retire le grave
    left, right = [], []
    for i in range(N):
        t = i / N
        amp = (i / (0.18 * N)) if i < 0.18 * N else math.exp(-(i - 0.18 * N) / (0.16 * SR))
        s = out[i] * amp
        left.append(s * math.cos(t * math.pi / 2))
        right.append(s * math.sin(t * math.pi / 2))
    write_stereo("public/sfx/swoosh.wav",
                 fade_edges(normalize(left, 0.45)), fade_edges(normalize(right, 0.45)))

# ---- click : tick unique, doux ----
def make_click():
    dur = 0.05; N = int(dur * SR)
    sig = []
    for i in range(N):
        decay = math.exp(-i / (0.004 * SR))
        ping = math.sin(2 * math.pi * 1500 * i / SR)
        sig.append((0.5 * ping + 0.5 * random.uniform(-1, 1)) * decay)
    sig = one_pole_lp(sig, 0.45)
    write_stereo("public/sfx/click.wav", fade_edges(normalize(sig, 0.4)),
                 fade_edges(normalize(sig, 0.4)))

# ---- bubble : ping mellow (sinus doux) ----
def make_bubble():
    dur = 0.3; N = int(dur * SR)
    left = []
    for i in range(N):
        amp = math.exp(-i / (0.08 * SR))
        f = 620
        s = math.sin(2 * math.pi * f * i / SR) * amp
        s += 0.18 * math.sin(2 * math.pi * 2 * f * i / SR) * amp
        left.append(s)
    write_stereo("public/sfx/bubble.wav", fade_edges(normalize(left, 0.4)),
                 fade_edges(normalize(left, 0.4)))

# ---- zoom : swell ascendant lisse ----
def make_zoom():
    dur = 0.7; N = int(dur * SR)
    noise = one_pole_lp([random.uniform(-1, 1) for _ in range(N)], 0.015)
    left, right, ph = [], [], 0.0
    for i in range(N):
        t = i / N
        f = 140 * math.exp(1.7 * t)               # montee douce ~140->760
        ph += 2 * math.pi * f / SR
        air = noise[i] * (0.1 + 0.25 * t)
        amp = (0.15 + 0.85 * t) if t < 0.8 else (0.15 + 0.85 * 0.8) * math.exp(-(t - 0.8) * 10)
        s = (0.6 * math.sin(ph) + 0.4 * air) * amp
        left.append(s * (0.6 + 0.4 * (1 - t)))
        right.append(s * (0.6 + 0.4 * t))
    write_stereo("public/sfx/zoom.wav", fade_edges(normalize(left, 0.4)),
                 fade_edges(normalize(right, 0.4)))

# ---- impact : sub-thump doux ----
def make_impact():
    dur = 0.4; N = int(dur * SR)
    left = []
    for i in range(N):
        sub = math.sin(2 * math.pi * 64 * i / SR) * math.exp(-i / (0.11 * SR))
        left.append(sub)
    left = one_pole_lp(left, 0.5)
    write_stereo("public/sfx/impact.wav", fade_edges(normalize(left, 0.5)),
                 fade_edges(normalize(left, 0.5)))

if __name__ == "__main__":
    import os
    os.makedirs("public/sfx", exist_ok=True)
    make_swoosh(); make_click(); make_bubble(); make_zoom(); make_impact()
    print("SFX raffines OK")

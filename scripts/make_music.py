# -*- coding: utf-8 -*-
"""
Lit musical ambient loopable (60 s) pour l'habillage des cas cliniques.
Pads chauds (accords maj7 en sinus empiles), air filtre, notes cloche
clairsemees. Boucle parfaite : progression cyclique + textures periodiques.
Sortie : public/music/ambient-bed.wav (44.1 kHz, 16-bit, stereo)
"""
import wave, struct, math, random

SR = 44100
DUR = 60.0
N = int(SR * DUR)
random.seed(42)

def note(freq):
    return freq

# Progression : Cmaj7 - Am7 - Fmaj7 - G(add9), 15 s chacun, crossfade 3 s
CHORDS = [
    [130.81, 164.81, 196.00, 246.94],   # C3 E3 G3 B3
    [110.00, 130.81, 164.81, 196.00],   # A2 C3 E3 G3
    [ 87.31, 130.81, 174.61, 220.00],   # F2 C3 F3 A3
    [ 98.00, 123.47, 146.83, 220.00],   # G2 B2 D3 A3
]
SEG = 15.0
XF = 3.0

def chord_gain(t, idx):
    """Enveloppe d'un accord : plateau + crossfades cycliques."""
    start = idx * SEG
    # position cyclique
    dt = (t - start) % DUR
    if dt < XF:
        return dt / XF          # fade in
    if dt < SEG:
        return 1.0              # plateau
    if dt < SEG + XF:
        return 1.0 - (dt - SEG) / XF  # fade out
    return 0.0

# Cloches clairsemees : pattern periodique sur 60 s (retombe pareil)
BELLS = [(4.0, 523.25), (13.5, 659.26), (21.0, 587.33), (29.5, 783.99),
         (36.0, 659.26), (44.5, 523.25), (52.0, 698.46)]

left = [0.0] * N
right = [0.0] * N

# --- Pads ---
for ci, chord in enumerate(CHORDS):
    for ni, f in enumerate(chord):
        det = 1.0 + (ni - 1.5) * 0.0006          # leger detune stereo
        phase_l = random.random() * 6.283
        phase_r = random.random() * 6.283
        for i in range(N):
            t = i / SR
            g = chord_gain(t, ci)
            if g <= 0.0:
                continue
            lfo = 0.85 + 0.15 * math.sin(2 * math.pi * t / 9.0 + ni)
            a = 0.045 * g * lfo
            left[i] += a * math.sin(2 * math.pi * f * det * t + phase_l)
            right[i] += a * math.sin(2 * math.pi * f / det * t + phase_r)

# --- Air (bruit filtre passe-bas, tres doux, périodicité par construction) ---
prev_l = prev_r = 0.0
alpha = 0.015
airs_l = [0.0] * N
airs_r = [0.0] * N
for i in range(N):
    prev_l += alpha * (random.uniform(-1, 1) - prev_l)
    prev_r += alpha * (random.uniform(-1, 1) - prev_r)
    airs_l[i] = prev_l
    airs_r[i] = prev_r
# fondu croise interne de l'air pour boucler (2 s)
F = int(2.0 * SR)
for i in range(F):
    w = i / F
    airs_l[i] = airs_l[i] * w + airs_l[N - F + i] * (1 - w)
    airs_r[i] = airs_r[i] * w + airs_r[N - F + i] * (1 - w)
for i in range(N):
    t = i / SR
    sw = 0.55 + 0.45 * math.sin(2 * math.pi * t / 30.0)
    left[i] += 0.030 * airs_l[i] * sw
    right[i] += 0.030 * airs_r[i] * (1.1 - sw * 0.2)

# --- Cloches ---
for t0, f in BELLS:
    start = int(t0 * SR)
    dur = int(4.0 * SR)
    pan = random.uniform(0.35, 0.65)
    for j in range(dur):
        i = (start + j) % N          # wrap -> boucle propre
        tt = j / SR
        env = math.exp(-tt / 1.6) * min(1.0, tt / 0.08)
        s = 0.035 * env * (math.sin(2 * math.pi * f * tt) +
                           0.4 * math.sin(2 * math.pi * f * 2.001 * tt))
        left[i] += s * (1 - pan)
        right[i] += s * pan

# --- Normalisation douce ---
peak = max(max(abs(s) for s in left), max(abs(s) for s in right))
g = 0.55 / peak
with wave.open("public/music/ambient-bed.wav", "w") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    fr = bytearray()
    for i in range(N):
        fr += struct.pack("<hh", int(max(-1, min(1, left[i] * g)) * 32767),
                          int(max(-1, min(1, right[i] * g)) * 32767))
    w.writeframes(bytes(fr))
print("OK ambient-bed.wav", DUR, "s")

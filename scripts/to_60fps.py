"""
Conversion 30fps -> 60fps : double les valeurs de frames ciblees dans les
fichiers .tsx (interpolate inputs, delay, frame -N, periodes Math.sin/cos,
multiplicateurs frame*0.NN, Sequence from/durationInFrames).
N'affecte JAMAIS les arrays de sortie d'interpolate ni les dimensions/styles.
"""
import re, sys
from pathlib import Path


def transform(c: str) -> str:
    # 1) interpolate(frame|local|localFrame [- N]?, [NUMBERS], OUTPUT, OPTS)
    def double_interp(m):
        prefix = m.group(1)
        nums = m.group(2)
        suffix = m.group(3)
        parts = [s.strip() for s in nums.split(',')]
        new_parts = []
        for p in parts:
            try:
                v = float(p)
                d = v * 2
                new_parts.append(str(int(d)) if d.is_integer() else f'{d:g}')
            except ValueError:
                new_parts.append(p)
        return prefix + ', '.join(new_parts) + suffix

    c = re.sub(
        r'(interpolate\(\s*(?:frame|local|localFrame)(?:\s*-\s*\d+)?\s*,\s*\[)([^\]]+)(\])',
        double_interp, c
    )

    # 2) delay = N (let/const) — but NOT default fn arg "delay = 0"
    #    Skip when followed by , } ) — those are default args
    c = re.sub(r'(\bdelay\s*=\s*)(\d+)(?=\s*[;,])',
               lambda m: m.group(1) + str(int(m.group(2)) * 2), c)

    # 3) delay: N (object literal / TS type)
    c = re.sub(r'(\bdelay:\s*)(\d+)(?![\.\d])',
               lambda m: m.group(1) + str(int(m.group(2)) * 2), c)

    # 4) delay={N} (JSX prop)
    c = re.sub(r'(\bdelay=\{)(\d+)(\})',
               lambda m: m.group(1) + str(int(m.group(2)) * 2) + m.group(3), c)

    # 5) Stagger pattern: `d = 50 + i * 16;` -> double both
    c = re.sub(
        r'(\bconst\s+d\s*=\s*)(\d+)(\s*\+\s*i\s*\*\s*)(\d+)',
        lambda m: f'{m.group(1)}{int(m.group(2))*2}{m.group(3)}{int(m.group(4))*2}',
        c
    )

    # 6) Math.sin/cos(frame / N) — double divisor
    def double_div(m):
        v = float(m.group(2))
        d = v * 2
        return m.group(1) + (str(int(d)) if d.is_integer() else f'{d:g}')
    c = re.sub(r'(Math\.(?:sin|cos)\(frame\s*/\s*)(\d+(?:\.\d+)?)', double_div, c)

    # 7) Sequence from={N}, durationInFrames={N}
    c = re.sub(r'(\bfrom=\{)(\d+)(\})',
               lambda m: m.group(1) + str(int(m.group(2))*2) + m.group(3), c)
    c = re.sub(r'(\bdurationInFrames=\{)(\d+)(\})',
               lambda m: m.group(1) + str(int(m.group(2))*2) + m.group(3), c)

    # 8) frame: frame - N (spring config)
    c = re.sub(r'(frame:\s*frame\s*-\s*)(\d+)',
               lambda m: m.group(1) + str(int(m.group(2))*2), c)

    # 9) frame: Math.max(0, frame - N)
    c = re.sub(r'(frame:\s*Math\.max\(0,\s*frame\s*-\s*)(\d+)',
               lambda m: m.group(1) + str(int(m.group(2))*2), c)

    # 10) frame % N
    c = re.sub(r'(\bframe\s*%\s*)(\d+)',
               lambda m: m.group(1) + str(int(m.group(2))*2), c)

    # 11) frame * 0.NNN (rotation/scroll speeds) — halve
    def halve(m):
        v = float(m.group(2))
        return m.group(1) + f'{v/2:g}'
    c = re.sub(r'(frame\s*\*\s*)(0\.\d+)', halve, c)

    return c


if __name__ == '__main__':
    for f in sys.argv[1:]:
        p = Path(f)
        if not p.exists():
            print(f"missing: {f}"); continue
        old = p.read_text(encoding='utf-8')
        new = transform(old)
        if old != new:
            p.write_text(new, encoding='utf-8')
            print(f"DOUBLED: {f}")
        else:
            print(f"unchanged: {f}")

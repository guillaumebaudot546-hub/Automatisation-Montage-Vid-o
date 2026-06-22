"""
Scale frame-based literals by a SCALE factor. Used for timeline changes.
Same rules as scale_to_45s but with configurable factor.
"""
import re, sys
from pathlib import Path

SCALE = float(sys.argv[1])

def scale_int(n: int) -> int:
    return max(0, round(n * SCALE))

def scale_arr(m):
    prefix = m.group(1); nums = m.group(2); suffix = m.group(3)
    parts = [s.strip() for s in nums.split(',')]
    new_parts = []
    for p in parts:
        try:
            v = float(p)
            d = v * SCALE
            if d.is_integer():
                new_parts.append(str(int(d)))
            else:
                new_parts.append(str(round(d)))
        except ValueError:
            new_parts.append(p)
    return prefix + ', '.join(new_parts) + suffix

def transform(c: str) -> str:
    c = re.sub(
        r'(interpolate\(\s*(?:frame|local|localFrame)(?:\s*-\s*\d+)?\s*,\s*\[)([^\]]+)(\])',
        scale_arr, c
    )
    c = re.sub(r'(\bdelay\s*=\s*)(\d+)(?=\s*[;,])',
               lambda m: m.group(1) + str(scale_int(int(m.group(2)))), c)
    c = re.sub(r'(\bdelay:\s*)(\d+)(?![\.\d])',
               lambda m: m.group(1) + str(scale_int(int(m.group(2)))), c)
    c = re.sub(r'(\bdelay=\{)(\d+)(\})',
               lambda m: m.group(1) + str(scale_int(int(m.group(2)))) + m.group(3), c)
    c = re.sub(
        r'(\bdelay=\{)(\d+)(\s*\+\s*i\s*\*\s*)(\d+)(\})',
        lambda m: f'{m.group(1)}{scale_int(int(m.group(2)))}{m.group(3)}{max(1, scale_int(int(m.group(4))))}{m.group(5)}',
        c
    )
    c = re.sub(
        r'(\bconst\s+d\s*=\s*)(\d+)(\s*\+\s*i\s*\*\s*)(\d+)',
        lambda m: f'{m.group(1)}{scale_int(int(m.group(2)))}{m.group(3)}{max(1, scale_int(int(m.group(4))))}',
        c
    )
    c = re.sub(r'(\bfrom=\{)(\d+)(\})',
               lambda m: m.group(1) + str(scale_int(int(m.group(2)))) + m.group(3), c)
    c = re.sub(r'(\bdurationInFrames=\{)(\d+)(\})',
               lambda m: m.group(1) + str(scale_int(int(m.group(2)))) + m.group(3), c)
    c = re.sub(r'(frame:\s*frame\s*-\s*)(\d+)',
               lambda m: m.group(1) + str(scale_int(int(m.group(2)))), c)
    c = re.sub(r'(frame:\s*Math\.max\(0,\s*frame\s*-\s*)(\d+)',
               lambda m: m.group(1) + str(scale_int(int(m.group(2)))), c)
    return c

if __name__ == '__main__':
    for f in sys.argv[2:]:
        p = Path(f)
        if not p.exists():
            print(f"missing: {f}"); continue
        old = p.read_text(encoding='utf-8')
        new = transform(old)
        if old != new:
            p.write_text(new, encoding='utf-8')
            print(f"SCALED x{SCALE}: {f}")
        else:
            print(f"unchanged: {f}")

import sys
from collections import deque

W, H = 680, 614
TOL = 4
R = int(sys.argv[1]) if len(sys.argv) > 1 else 18   # erosion radius, in pixels
src = bytearray(open('cell.raw', 'rb').read())

def px(i):
    o = i * 3
    return src[o], src[o+1], src[o+2]

# 1. key the ground out, exactly as before
bg = bytearray(W * H); q = deque()
for x in range(W):
    for y in (0, H-1):
        i = y*W + x
        if not bg[i]: bg[i] = 1; q.append(i)
for y in range(H):
    for x in (0, W-1):
        i = y*W + x
        if not bg[i]: bg[i] = 1; q.append(i)
t2 = TOL*TOL
while q:
    i = q.popleft(); r0, g0, b0 = px(i); x, y = i % W, i // W
    for nx, ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
        if nx < 0 or ny < 0 or nx >= W or ny >= H: continue
        j = ny*W + nx
        if bg[j]: continue
        r1, g1, b1 = px(j); dr, dg, db = r1-r0, g1-g0, b1-b0
        if dr*dr + dg*dg + db*db <= t2:
            bg[j] = 1; q.append(j)
mask = bytearray(0 if bg[i] else 1 for i in range(W*H))

# 2. Keep what falls inside the five tiles, and nothing else.
#
#    Inference was the wrong tool here and cost several passes. Opening cannot
#    separate the ribbon from the tiles because the tiles overlap each other by
#    about as much as the ribbon is thick; size cannot either -- the gym tile's
#    eroded core and the ribbon's land within a couple of thousand pixels; and
#    the glyph test fails because the ribbon blob had a tile fused to it. The
#    tiles are five rectangles in a fixed render, so they are written down.
TILES = [
    (72, 108, 258, 292),    # cloche
    (350, 106, 512, 290),   # lotus -- right edge pulled in off a ribbon nub
    (164, 220, 430, 478),   # the property, centre
    (30, 362, 196, 534),    # dumbbell -- top-left corner clear of a ribbon hook
    (388, 352, 582, 542),   # bed
]

inside = bytearray(W * H)
for (x0, y0, x1, y1) in TILES:
    for y in range(max(0, y0), min(H, y1)):
        base = y * W
        for x in range(max(0, x0), min(W, x1)):
            inside[base + x] = 1

final = bytearray(255 if (mask[i] and inside[i]) else 0 for i in range(W * H))

def blur(a):
    out = bytearray(W*H)
    for y in range(H):
        base = y*W
        for x in range(W):
            s = c = 0
            for dx in (-1,0,1):
                nx = x+dx
                if 0 <= nx < W: s += a[base+nx]; c += 1
            out[base+x] = s//c
    fin = bytearray(W*H)
    for x in range(W):
        for y in range(H):
            s = c = 0
            for dy in (-1,0,1):
                ny = y+dy
                if 0 <= ny < H: s += out[ny*W+x]; c += 1
            fin[y*W+x] = s//c
    return fin
final = blur(blur(final))

out = bytearray(W*H*4)
for i in range(W*H):
    o3, o4 = i*3, i*4
    out[o4] = src[o3]; out[o4+1] = src[o3+1]; out[o4+2] = src[o3+2]; out[o4+3] = final[i]
open('cell.rgba','wb').write(bytes(out))
print('kept', sum(1 for i in range(W*H) if final[i] > 8)*100//(W*H), '% of frame')

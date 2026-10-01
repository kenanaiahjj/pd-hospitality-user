'use client';

import { Check } from '@phosphor-icons/react';
import { useEffect, useRef } from 'react';

/*
  The confirmation's centrepiece: a medallion struck for the booking, all
  green -- a deep emerald enamel face with a fine engraved sunburst, a
  polished green-metal rim and a raised jade check -- spinning in once and
  then floating, with gold dust around it.

  One fragment shader, no 3D library: the coin is a signed-distance field,
  raymarched per pixel, lit by a procedural studio environment. Gold is a
  metal (its reflection tinted by its colour); the enamel is a dielectric with
  a clear-coat highlight over a plum body.

  Where WebGL 2 is unavailable -- old devices, tests -- the flat seal shows
  instead. With reduced motion, the medallion is drawn once, at rest.
*/

const VERTEX = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uSpin;
out vec4 outColor;

// GOLD is the rim's metal, PLUM the face's enamel, EMERALD the check -- all greens now.
const vec3 GOLD = vec3(0.42, 0.95, 0.66);
const vec3 PLUM = vec3(0.02, 0.2, 0.1);
const vec3 EMERALD = vec3(0.34, 0.9, 0.6);

mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c); }
mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c); }

float sdCylinder(vec3 p, float r, float h) {
  vec2 d = abs(vec2(length(p.xy), p.z)) - vec2(r, h);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}
float sdTorus(vec3 p, float R, float r) { return length(vec2(length(p.xy) - R, p.z)) - r; }
float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0));
}

float checkMark(vec2 p) {
  return min(sdSegment(p, vec2(-0.34, 0.02), vec2(-0.09, -0.23)), sdSegment(p, vec2(-0.09, -0.23), vec2(0.36, 0.25)));
}

// x: distance, y: material (1 gold rim, 2 plum enamel, 3 green check)
vec2 scene(vec3 p) {
  float face = sdCylinder(p, 0.84, 0.085) - 0.025;
  float rim = sdTorus(p, 0.9, 0.125);
  float mark = max(checkMark(p.xy) - 0.07, abs(p.z) - 0.125) - 0.022;
  vec2 hit = rim < face ? vec2(rim, 1.0) : vec2(face, 2.0);
  return mark < hit.x ? vec2(mark, 3.0) : hit;
}

vec3 normalAt(vec3 p) {
  vec2 e = vec2(0.0015, 0.0);
  return normalize(vec3(
    scene(p + e.xyy).x - scene(p - e.xyy).x,
    scene(p + e.yxy).x - scene(p - e.yxy).x,
    scene(p + e.yyx).x - scene(p - e.yyx).x));
}

// A studio: warm ceiling, dark floor, two soft boxes and a rim light.
vec3 environment(vec3 d) {
  // A warm floor bounce, so gold facing down still glows rather than going brown.
  // Dark below, bright above: gloss is contrast, the reflections must have somewhere dark to sit against.
  vec3 col = mix(vec3(0.03, 0.035, 0.035), vec3(0.55, 0.6, 0.58), smoothstep(-0.3, 1.0, d.y));
  col += vec3(3.2, 2.7, 2.2) * pow(max(dot(d, normalize(vec3(-0.6, 0.7, 0.55))), 0.0), 24.0);
  col += vec3(1.6, 1.25, 1.1) * pow(max(dot(d, normalize(vec3(0.75, 0.25, 0.6))), 0.0), 12.0);
  col += vec3(0.9, 0.4, 0.7) * pow(max(dot(d, normalize(vec3(0.1, -0.5, -0.9))), 0.0), 6.0);
  // A broad soft box in front, up and to the left: the wide sheen across the face that reads as gloss.
  col += vec3(5.0, 5.0, 4.8) * pow(max(dot(d, normalize(vec3(-0.35, 0.45, 1.0))), 0.0), 36.0);
  col += vec3(0.7, 0.75, 0.72) * pow(max(dot(d, normalize(vec3(-0.35, 0.45, 1.0))), 0.0), 4.0);
  return col;
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uRes) / min(uRes.x, uRes.y);
  vec3 ro = vec3(0.0, 0.0, 2.85);
  vec3 rd = normalize(vec3(uv, -2.05));

  // The coin turns; the camera does not. Rotate the ray into the coin's space.
  // A standing three-quarter tilt, so the rim's thickness reads, swaying slowly.
  mat3 turn = rotY(uSpin + 0.28 + 0.2 * sin(uTime * 0.5)) * rotX(-0.24 + 0.08 * sin(uTime * 0.4));
  mat3 back = transpose(turn);
  vec3 o = back * ro, r = back * rd;

  float t = 0.0;
  vec2 hit = vec2(-1.0);
  for (int i = 0; i < 90; i++) {
    vec2 h = scene(o + r * t);
    if (h.x < 0.0008) { hit = vec2(t, h.y); break; }
    t += h.x;
    if (t > 6.0) break;
  }

  vec3 col = vec3(0.0);
  float alpha = 0.0;

  if (hit.x > 0.0) {
    vec3 p = o + r * hit.x;
    vec3 n = normalAt(p);
    vec3 nWorld = turn * n;
    vec3 v = -rd;


    if (hit.y < 1.5) {
      // Gold: all reflection, tinted by the metal; brushed rings on the rim.
      float ring = sin(length(p.xy) * 160.0) * 0.04;
      vec3 nb = normalize(nWorld + ring * turn * vec3(normalize(p.xy), 0.0));
      vec3 refl = environment(reflect(rd, nb));
      float f = pow(1.0 - max(dot(nb, v), 0.0), 5.0);
      vec3 F = GOLD + (1.0 - GOLD) * f;
      col = refl * F * 0.95 + GOLD * 0.09;
    } else if (hit.y > 2.5) {
      // The check: green enamel, glassy, deeper at its edges, catching the light on top.
      vec3 key = normalize(vec3(-0.5, 0.7, 0.6));
      float diffuse = max(dot(nWorld, key), 0.0) * 0.7 + 0.3;
      float edge = pow(1.0 - max(dot(nWorld, v), 0.0), 1.5);
      vec3 body = EMERALD * diffuse * 2.4 + vec3(0.2, 0.8, 0.45) * edge * 0.3;
      // A thick, wet clear coat: more reflection at every angle, a hard highlight.
      float f = 0.08 + 0.92 * pow(1.0 - max(dot(nWorld, v), 0.0), 4.0);
      vec3 coat = environment(reflect(rd, nWorld)) * f;
      float spec = pow(max(dot(reflect(-key, nWorld), v), 0.0), 140.0);
      col = body + coat * 1.3 + vec3(1.0, 1.0, 0.95) * spec * 2.2;
    } else {
      // Enamel: a sunburst engraved under clear coat, plum body glowing at the edges.
      float a = atan(p.y, p.x);
      float rr = length(p.xy);
      float engrave = sin(a * 56.0) * 0.5 + sin(rr * 70.0) * 0.25;
      vec3 ne = normalize(nWorld + 0.018 * engrave * (turn * vec3(-sin(a), cos(a), 0.0)));
      vec3 key = normalize(vec3(-0.5, 0.7, 0.6));
      float diffuse = max(dot(ne, key), 0.0) * 0.6 + 0.25;
      float rimGlow = pow(1.0 - max(dot(ne, v), 0.0), 2.0);
      vec3 body = PLUM * diffuse * 2.6 + vec3(0.12, 0.5, 0.3) * rimGlow * 0.5;
      body *= 0.9 + 0.1 * engrave;
      float f = 0.07 + 0.93 * pow(1.0 - max(dot(ne, v), 0.0), 4.0);
      vec3 coat = environment(reflect(rd, ne)) * f;
      // Glossy enamel: the clear coat's reflection plus a tight highlight from the key light.
      float specFace = pow(max(dot(reflect(-key, nWorld), v), 0.0), 120.0);
      // The lacquer highlight: a soft diagonal lozenge on the upper left of the enamel, riding with the
      // coin, brightest when the face looks at you -- the window a glossy surface always seems to hold.
      vec2 q = mat2(0.8, -0.6, 0.6, 0.8) * (p.xy - vec2(-0.3, 0.34));
      float sheen = exp(-dot(q * vec2(1.0, 3.2), q * vec2(1.0, 3.2)) * 7.0) * (0.55 + 0.45 * max(dot(nWorld, v), 0.0));
      col = body + coat * 1.1 + vec3(1.0, 1.0, 0.95) * (specFace * 1.6 + sheen * 0.55);
    }
    alpha = 1.0;
  } else {
    // Gold dust drifting around the medallion.
    vec2 g = uv * 7.0 + vec2(0.0, uTime * 0.12);
    vec2 cell = floor(g);
    vec2 local = fract(g) - 0.5;
    float seed = hash(cell);
    vec2 offset = vec2(hash(cell + 1.3), hash(cell + 7.1)) - 0.5;
    float twinkle = 0.5 + 0.5 * sin(uTime * (1.5 + seed * 2.5) + seed * 40.0);
    float spark = smoothstep(0.05, 0.0, length(local - offset * 0.7)) * step(0.72, seed) * twinkle * smoothstep(1.0, 0.7, length(uv));
    // Inside the canvas's circle only, so its square edge never shows.
    float halo = smoothstep(0.98, 0.42, length(uv)) * 0.16;
    col = vec3(1.0, 0.8, 0.45) * (spark * 1.4 + halo);
    alpha = clamp(spark + halo, 0.0, 1.0);
  }

  // Filmic curve, then display gamma; premultiplied for the page behind.
  // ACES-style curve: keeps highlights hot and darks deep, which is what reads as glossy.
  col = clamp((col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14), 0.0, 1.0);
  col = pow(col, vec3(1.0 / 2.2));
  outColor = vec4(col * alpha, alpha);
}`;

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

const SPIN_MS = 1800;
/* The spin in: two and a half turns, slowing to rest face on. */
const spinAt = (elapsed: number) => {
  const k = Math.min(1, elapsed / SPIN_MS);
  return -Math.PI * 5 * (1 - k) ** 3;
};

export function BookingMedallion({ label }: { label: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const element = canvas.current;
    const holder = wrap.current;
    // jsdom has no WebGL and says so loudly; skip the attempt there.
    if (!element || !holder || /jsdom/i.test(navigator.userAgent)) return;
    let gl: WebGL2RenderingContext | null = null;
    try {
      gl = element.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false });
    } catch {
      gl = null;
    }
    if (!gl) return;
    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);
    const uRes = gl.getUniformLocation(program, 'uRes');
    const uTime = gl.getUniformLocation(program, 'uTime');
    const uSpin = gl.getUniformLocation(program, 'uSpin');

    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const resize = () => {
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      const size = element.getBoundingClientRect();
      element.width = Math.max(1, Math.round(size.width * scale));
      element.height = Math.max(1, Math.round(size.height * scale));
      gl!.viewport(0, 0, element.width, element.height);
    };
    resize();

    const start = performance.now();
    let frame = 0;
    const draw = (now: number) => {
      const elapsed = still ? SPIN_MS : now - start;
      gl!.uniform2f(uRes, element.width, element.height);
      gl!.uniform1f(uTime, still ? 1.2 : elapsed / 1000);
      gl!.uniform1f(uSpin, spinAt(elapsed));
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      if (!still) frame = window.requestAnimationFrame(draw);
    };
    // Shown only once it can draw: until then, and without WebGL, the flat seal stands in.
    holder.dataset.gl = 'on';
    frame = window.requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      // Not loseContext(): a remount (and React's dev double effect) gets this same context back.
      gl?.deleteProgram(program);
    };
  }, []);

  return (
    <div ref={wrap} className="sb-medallion" role="img" aria-label={label}>
      <canvas ref={canvas} className="sb-medallion__canvas" aria-hidden="true" />
      <span className="sb-medallion__fallback" aria-hidden="true"><Check weight="bold" /></span>
    </div>
  );
}

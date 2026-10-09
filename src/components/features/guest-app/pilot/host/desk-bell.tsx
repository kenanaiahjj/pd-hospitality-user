'use client';

import { CallBell } from '@/components/ui/huge-icons';
import { useEffect, useRef } from 'react';

/*
  The front desk's face: a polished brass service bell on a plum lacquer base,
  struck the way the booking confirmation strikes its medallion. One fragment
  shader, no 3D library: the bell is a signed-distance field (a dome, its
  plunger and a base plate), raymarched per pixel and lit by a studio, so it
  reads as metal on the plum card. It rocks once as if just rung, then sways.

  Where WebGL 2 is unavailable -- old devices, tests -- the flat bell icon
  shows instead. With reduced motion it is drawn once, at rest.
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
uniform float uSwing;
out vec4 outColor;

// Brass for the dome, a deep plum lacquer for the base: the card's own colours, made of material.
const vec3 BRASS = vec3(1.0, 0.78, 0.42);
const vec3 LACQUER = vec3(0.07, 0.014, 0.04);

mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c); }
mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c); }
mat3 rotZ(float a) { float c = cos(a), s = sin(a); return mat3(c, -s, 0.0, s, c, 0.0, 0.0, 0.0, 1.0); }

float sdRoundCyl(vec3 p, float r, float h, float k) {
  vec2 d = vec2(length(p.xz) - r + k, abs(p.y) - h + k);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - k;
}

// x: distance, y: material (1 chrome dome and plunger, 2 satin base)
vec2 scene(vec3 p) {
  vec3 q = p - vec3(0.0, -0.1, 0.0);
  // The dome: a sphere cut flat just under its middle, with a small flare at the lip.
  float dome = max(length(q) - 0.64, -q.y - 0.02) - 0.012;
  float stem = sdRoundCyl(q - vec3(0.0, 0.7, 0.0), 0.045, 0.08, 0.02);
  float knob = length(q - vec3(0.0, 0.81, 0.0)) - 0.095;
  float chrome = min(dome, min(stem, knob));
  float base = sdRoundCyl(q - vec3(0.0, -0.075, 0.0), 0.78, 0.05, 0.035);
  return chrome < base ? vec2(chrome, 1.0) : vec2(base, 2.0);
}

vec3 normalAt(vec3 p) {
  vec2 e = vec2(0.0015, 0.0);
  return normalize(vec3(
    scene(p + e.xyy).x - scene(p - e.xyy).x,
    scene(p + e.yxy).x - scene(p - e.yxy).x,
    scene(p + e.yyx).x - scene(p - e.yyx).x));
}

// A monochrome studio: black floor, grey sky, two hard soft boxes. Chrome is only what it reflects.
float environment(vec3 d) {
  float c = mix(0.02, 0.42, smoothstep(-0.25, 0.9, d.y));
  c += 4.2 * pow(max(dot(d, normalize(vec3(-0.55, 0.65, 0.6))), 0.0), 28.0);
  c += 1.6 * pow(max(dot(d, normalize(vec3(0.8, 0.2, 0.55))), 0.0), 10.0);
  c += 0.5 * pow(max(dot(d, normalize(vec3(0.0, -0.3, -1.0))), 0.0), 4.0);
  // A long strip light overhead: the bright band a polished dome always carries.
  c += 2.4 * smoothstep(0.985, 1.0, dot(normalize(d.xy + vec2(0.0001)), normalize(vec2(-0.2, 1.0)))) * smoothstep(0.2, 0.7, d.y);
  return c;
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uRes) / min(uRes.x, uRes.y);
  vec3 ro = vec3(0.0, 0.0, 2.35);
  vec3 rd = normalize(vec3(uv, -2.1));

  // Seen a little from above, so the dome sits on its plate; it rocks on its base as if just rung.
  mat3 turn = rotX(-0.38) * rotY(0.5 + 0.25 * sin(uTime * 0.45)) * rotZ(uSwing);
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
    vec3 n = turn * normalAt(p);
    vec3 v = -rd;
    float fres = pow(1.0 - max(dot(n, v), 0.0), 5.0);
    if (hit.y < 1.5) {
      // Brass: a mirror tinted by the metal, going white at grazing angles.
      vec3 F = BRASS + (vec3(1.0) - BRASS) * fres;
      col = environment(reflect(rd, n)) * F * 0.9 + BRASS * 0.05;
    } else {
      // The base: brushed satin, darker, with fine turned rings catching the light.
      vec3 lp = p + vec3(0.0, 0.1, 0.0);
      float ring = sin(length(lp.xz) * 220.0) * 0.06;
      vec3 nb = normalize(n + ring * turn * vec3(normalize(lp.xz + 0.0001).x, 0.0, normalize(lp.xz + 0.0001).y));
      // Lacquer: the plum body under a clear coat that catches the soft boxes.
      vec3 key = normalize(vec3(-0.5, 0.7, 0.6));
      float diffuse = max(dot(n, key), 0.0) * 0.6 + 0.3;
      float f = 0.05 + 0.95 * fres;
      col = LACQUER * diffuse * 1.6 + vec3(environment(reflect(rd, nb))) * f * 0.55;
    }
    alpha = 1.0;
  } else {
      // A warm glow pooling behind the bell, inside the canvas's circle only.
    float halo = smoothstep(1.0, 0.2, length(uv - vec2(0.0, 0.1))) * 0.14;
    col = vec3(1.0, 0.75, 0.4) * halo;
    alpha = halo;
  }

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

const SWING_MS = 1400;
/* Just rung: a few rocks on its base, dying away to rest. */
const swingAt = (elapsed: number) => {
  const k = Math.min(1, elapsed / SWING_MS);
  return 0.22 * Math.sin(k * Math.PI * 4) * (1 - k) ** 2;
};

export function DeskBell() {
  const wrap = useRef<HTMLSpanElement>(null);
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
    const uSwing = gl.getUniformLocation(program, 'uSwing');

    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    const size = element.getBoundingClientRect();
    element.width = Math.max(1, Math.round(size.width * scale));
    element.height = Math.max(1, Math.round(size.height * scale));
    gl.viewport(0, 0, element.width, element.height);

    const start = performance.now();
    let frame = 0;
    const draw = (now: number) => {
      const elapsed = still ? SWING_MS : now - start;
      gl!.uniform2f(uRes, element.width, element.height);
      gl!.uniform1f(uTime, still ? 0.6 : elapsed / 1000);
      gl!.uniform1f(uSwing, swingAt(elapsed));
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      if (!still) frame = window.requestAnimationFrame(draw);
    };
    holder.dataset.gl = 'on';
    frame = window.requestAnimationFrame(draw);
    return () => {
      window.cancelAnimationFrame(frame);
      // Not loseContext(): a remount (and React's dev double effect) gets this same context back.
      gl?.deleteProgram(program);
    };
  }, []);

  return (
    <span ref={wrap} className="pilot-bell" aria-hidden="true">
      <canvas ref={canvas} className="pilot-bell__canvas" />
      <span className="pilot-bell__fallback"><CallBell /></span>
    </span>
  );
}

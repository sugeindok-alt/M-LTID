'use client';
import { useEffect, useRef } from 'react';

/*
 * Mjukt, levande lys bak hovudoppslaget, teikna med WebGL utan eksterne bibliotek.
 * Fargane kjem frå temaet. Lyset er rein pynt og skal ikkje koste noko ved oppstart:
 * det startar først når sida er ferdig lasta og nettlesaren har ledig tid, skyggeleggjaren
 * blir kompilert utan å blokkere der nettlesaren støttar det, og motivet blir teikna i låg
 * oppløysing (det er uskarpt uansett). Teikninga stoppar når ho er ute av syne, og står
 * stille for dei som har bede om mindre rørsle. Utan WebGL blir lerretet verande usynleg.
 */
const vertexSource = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
const fragmentSource = `
precision mediump float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_scroll;
uniform float u_strength;
uniform vec3 u_bg;
uniform vec3 u_warm;
uniform vec3 u_green;
float glow(vec2 p, vec2 c, float r) {
  return 1.0 - smoothstep(0.0, r, distance(p, c));
}
void main() {
  float aspect = u_res.x / u_res.y;
  vec2 p = gl_FragCoord.xy / u_res;
  p.x *= aspect;
  float t = u_time * 0.07;
  p += 0.05 * vec2(sin(p.y * 3.1 + t * 2.0), cos(p.x * 2.7 - t * 1.6));
  float lift = u_scroll * 0.35;
  vec2 c1 = vec2(aspect * 0.18 + 0.12 * sin(t * 1.3), 0.78 + 0.08 * cos(t) + lift);
  vec2 c2 = vec2(aspect * 0.80 + 0.10 * cos(t * 0.9), 0.30 + 0.10 * sin(t * 1.1) + lift * 0.5);
  vec2 c3 = vec2(aspect * 0.52 + 0.16 * sin(t * 0.7 + 2.0), 0.05 + 0.06 * cos(t * 1.4) + lift * 1.4);
  vec3 col = u_bg;
  col = mix(col, u_warm, glow(p, c1, 0.75) * 0.32 * u_strength);
  col = mix(col, u_green, glow(p, c2, 0.85) * 0.36 * u_strength);
  col = mix(col, u_warm, glow(p, c3, 0.60) * 0.20 * u_strength);
  gl_FragColor = vec4(col, 1.0);
}`;

/** Lengste side på lerretet i pikslar. Motivet er mjukt, så meir trengst ikkje. */
const maxSide = 256;

function startGlow(canvas: HTMLCanvasElement): () => void {
  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    powerPreference: 'low-power',
  });
  const vertex = gl?.createShader(gl.VERTEX_SHADER);
  const fragment = gl?.createShader(gl.FRAGMENT_SHADER);
  const program = gl?.createProgram();
  if (!gl || !vertex || !fragment || !program) return () => {};
  gl.shaderSource(vertex, vertexSource);
  gl.shaderSource(fragment, fragmentSource);
  gl.compileShader(vertex);
  gl.compileShader(fragment);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  // Med denne utvidinga kan vi vente på kompileringa utan å låse sida.
  const parallel = gl.getExtension('KHR_parallel_shader_compile');
  const cleanups: (() => void)[] = [];
  let frame = 0;
  let stopped = false;

  const begin = () => {
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'p');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const uRes = uniform('u_res');
    const uTime = uniform('u_time');
    const uScroll = uniform('u_scroll');
    const uStrength = uniform('u_strength');
    const colors: [string, WebGLUniformLocation | null][] = [
      ['--bg', uniform('u_bg')],
      ['--accent', uniform('u_warm')],
      ['--surface', uniform('u_green')],
    ];
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const started = performance.now();
    let last = 0;
    let onScreen = true;

    const readTheme = () => {
      for (const [name, location] of colors) {
        canvas.style.color = `var(${name})`;
        const parts = getComputedStyle(canvas).color.match(/[\d.]+/g);
        if (!parts || parts.length < 3) continue;
        const [r, g, b] = parts.map((part) => Number(part) / 255);
        gl.uniform3f(location, r, g, b);
        // Mørk bakgrunn toler mindre lys før den lyse teksten mistar kontrast.
        if (name === '--bg')
          gl.uniform1f(uStrength, 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.3 ? 0.55 : 1);
      }
    };
    const resize = () => {
      const scale = Math.min(0.5, maxSide / Math.max(1, canvas.clientWidth, canvas.clientHeight));
      const width = Math.max(1, Math.round(canvas.clientWidth * scale));
      const height = Math.max(1, Math.round(canvas.clientHeight * scale));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
      gl.uniform2f(uRes, width, height);
    };
    const draw = (seconds: number) => {
      gl.uniform1f(uTime, seconds);
      gl.uniform1f(uScroll, Math.min(1, window.scrollY / Math.max(1, window.innerHeight)));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      if (now - last < 33) return;
      last = now;
      draw((now - started) / 1000);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      if (reduce.matches) draw(0);
      else if (onScreen && !document.hidden) frame = requestAnimationFrame(loop);
    };
    const refresh = () => {
      readTheme();
      resize();
      if (!frame) draw(reduce.matches ? 0 : (performance.now() - started) / 1000);
      canvas.dataset.ready = 'true';
    };

    // ResizeObserver melder frå med ein gong, så den første teikninga kjem derfrå.
    const sizeObserver = new ResizeObserver(refresh);
    sizeObserver.observe(canvas);
    const themeObserver = new MutationObserver(refresh);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    const viewObserver = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    viewObserver.observe(canvas);
    document.addEventListener('visibilitychange', sync);
    reduce.addEventListener('change', sync);
    cleanups.push(() => {
      sizeObserver.disconnect();
      themeObserver.disconnect();
      viewObserver.disconnect();
      document.removeEventListener('visibilitychange', sync);
      reduce.removeEventListener('change', sync);
    });
  };
  const waitForShader = () => {
    frame = 0;
    if (stopped) return;
    if (!parallel || gl.getProgramParameter(program, parallel.COMPLETION_STATUS_KHR)) begin();
    else frame = requestAnimationFrame(waitForShader);
  };
  waitForShader();
  return () => {
    stopped = true;
    cancelAnimationFrame(frame);
    for (const cleanup of cleanups) cleanup();
    delete canvas.dataset.ready;
  };
}

export function HeroGlow() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let stop: (() => void) | undefined;
    let idle = 0;
    let timer = 0;
    const start = () => {
      stop = startGlow(canvas);
    };
    // Vent til sida er ferdig lasta og nettlesaren har ledig tid.
    const schedule = () => {
      const whenIdle: typeof window.requestIdleCallback | undefined = window.requestIdleCallback;
      if (whenIdle) idle = whenIdle.call(window, start, { timeout: 3000 });
      else timer = window.setTimeout(start, 800);
    };
    if (document.readyState === 'complete') schedule();
    else window.addEventListener('load', schedule, { once: true });
    return () => {
      window.removeEventListener('load', schedule);
      if (idle) window.cancelIdleCallback(idle);
      window.clearTimeout(timer);
      stop?.();
    };
  }, []);
  return <canvas ref={ref} className="hero-glow" aria-hidden="true" />;
}

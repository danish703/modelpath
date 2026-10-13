/* ==========================================================================
   ModelPath — Subtle Constellation (Gate 11)

   A restrained, slow-drifting particle network for the homepage hero.
   - Native Canvas 2D, no dependencies.
   - DPR capped; particle count scales with hero area and is hard-capped.
   - Runs only while the hero is on-screen AND the document is visible.
   - prefers-reduced-motion → renders a single static frame, no loop.
   - pointer-events: none (set in CSS); no mouse interaction by design.
   ========================================================================== */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  /** 0 = muted slate, 1 = brand blue */
  tone: 0 | 1;
  alpha: number;
}

interface Pulse {
  a: number;
  b: number;
  start: number;
  duration: number;
}

interface Config {
  maxDpr: number;
  areaPerParticle: number;
  minParticles: number;
  maxParticles: number;
  linkDistance: number;
  speed: number; // px per second (max)
  frameInterval: number; // ms; throttles mobile to ~30fps
  lineAlpha: number;
}

const BLUE = '69, 103, 232';
const SLATE = '100, 116, 139';

function getConfig(width: number): Config {
  const mobile = width < 640;
  return mobile
    ? { maxDpr: 1.5, areaPerParticle: 15000, minParticles: 14, maxParticles: 26, linkDistance: 96, speed: 7, frameInterval: 1000 / 30, lineAlpha: 0.11 }
    : { maxDpr: 2, areaPerParticle: 13500, minParticles: 28, maxParticles: 68, linkDistance: 138, speed: 10, frameInterval: 0, lineAlpha: 0.14 };
}

/** Small deterministic PRNG so the static/no-motion frame is stable across loads. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function initConstellation(root: HTMLElement): () => void {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas[data-constellation-canvas]');
  if (!canvas || root.dataset.constellationReady === 'true') return () => {};
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return () => {};
  root.dataset.constellationReady = 'true';

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion = motionQuery.matches;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let cfg = getConfig(window.innerWidth);
  let particles: Particle[] = [];
  let pulses: Pulse[] = [];
  let nextPulseAt = 0;

  let rafId = 0;
  let lastTime = 0;
  let lastDraw = 0;
  let isIntersecting = true;
  let isPageVisible = document.visibilityState === 'visible';

  const rand = mulberry32(1103);

  function makeParticle(): Particle {
    const angle = rand() * Math.PI * 2;
    const speed = (0.35 + rand() * 0.65) * cfg.speed;
    const tone: 0 | 1 = rand() < 0.38 ? 1 : 0;
    return {
      x: rand() * width,
      y: rand() * height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: tone === 1 ? 1.1 + rand() * 0.9 : 0.8 + rand() * 0.8,
      tone,
      alpha: tone === 1 ? 0.42 + rand() * 0.22 : 0.3 + rand() * 0.2,
    };
  }

  function syncParticleCount() {
    const target = Math.max(
      cfg.minParticles,
      Math.min(cfg.maxParticles, Math.round((width * height) / cfg.areaPerParticle))
    );
    if (particles.length > target) particles.length = target;
    while (particles.length < target) particles.push(makeParticle());
    pulses = pulses.filter((p) => p.a < particles.length && p.b < particles.length);
  }

  function resize() {
    const rect = root.getBoundingClientRect();
    const nextW = Math.max(1, Math.round(rect.width));
    const nextH = Math.max(1, Math.round(rect.height));
    cfg = getConfig(window.innerWidth);
    const nextDpr = Math.min(window.devicePixelRatio || 1, cfg.maxDpr);

    // Rescale existing positions so a resize never "jumps" the field.
    if (width > 0 && height > 0) {
      const sx = nextW / width;
      const sy = nextH / height;
      for (const p of particles) {
        p.x *= sx;
        p.y *= sy;
      }
    }

    width = nextW;
    height = nextH;
    dpr = nextDpr;
    canvas!.width = Math.round(width * dpr);
    canvas!.height = Math.round(height * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    syncParticleCount();
  }

  function maybeSpawnPulse(now: number) {
    if (now < nextPulseAt || pulses.length >= 2) return;
    nextPulseAt = now + 2200 + Math.random() * 2600;
    const maxD2 = cfg.linkDistance * cfg.linkDistance * 0.6;
    for (let attempt = 0; attempt < 12; attempt++) {
      const a = Math.floor(Math.random() * particles.length);
      const b = Math.floor(Math.random() * particles.length);
      if (a === b) continue;
      const dx = particles[a].x - particles[b].x;
      const dy = particles[a].y - particles[b].y;
      if (dx * dx + dy * dy < maxD2) {
        pulses.push({ a, b, start: now, duration: 3800 + Math.random() * 1800 });
        return;
      }
    }
  }

  function pulseIntensity(a: number, b: number, now: number): number {
    for (const p of pulses) {
      if ((p.a === a && p.b === b) || (p.a === b && p.b === a)) {
        const t = (now - p.start) / p.duration;
        if (t >= 0 && t <= 1) return Math.sin(Math.PI * t); // smooth ease in/out, no flash
      }
    }
    return 0;
  }

  function step(dt: number) {
    const margin = 20;
    for (const p of particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < -margin) p.x = width + margin;
      else if (p.x > width + margin) p.x = -margin;
      if (p.y < -margin) p.y = height + margin;
      else if (p.y > height + margin) p.y = -margin;
    }
  }

  function draw(now: number) {
    ctx!.clearRect(0, 0, width, height);
    const maxD = cfg.linkDistance;
    const maxD2 = maxD * maxD;

    // Links
    ctx!.lineWidth = 0.6;
    for (let i = 0; i < particles.length; i++) {
      const pi = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const pj = particles[j];
        const dx = pi.x - pj.x;
        const dy = pi.y - pj.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > maxD2) continue;
        const falloff = 1 - Math.sqrt(d2) / maxD;
        const glow = reducedMotion ? 0 : pulseIntensity(i, j, now);
        if (glow > 0.01) {
          ctx!.strokeStyle = `rgba(${BLUE}, ${(falloff * cfg.lineAlpha + glow * 0.22).toFixed(3)})`;
          ctx!.lineWidth = 0.6 + glow * 0.5;
        } else {
          ctx!.strokeStyle = `rgba(${SLATE}, ${(falloff * cfg.lineAlpha).toFixed(3)})`;
          ctx!.lineWidth = 0.6;
        }
        ctx!.beginPath();
        ctx!.moveTo(pi.x, pi.y);
        ctx!.lineTo(pj.x, pj.y);
        ctx!.stroke();
      }
    }

    // Nodes
    for (const p of particles) {
      ctx!.fillStyle = `rgba(${p.tone === 1 ? BLUE : SLATE}, ${p.alpha.toFixed(3)})`;
      ctx!.beginPath();
      ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx!.fill();
    }
  }

  function loop(now: number) {
    rafId = requestAnimationFrame(loop);
    if (cfg.frameInterval && now - lastDraw < cfg.frameInterval) return;
    // Clamp dt so returning from a background tab never teleports particles.
    const dt = Math.min(0.05, lastTime ? (now - lastTime) / 1000 : 0.016);
    lastTime = now;
    lastDraw = now;
    step(dt);
    maybeSpawnPulse(now);
    pulses = pulses.filter((p) => now - p.start < p.duration);
    draw(now);
  }

  function shouldRun() {
    return !reducedMotion && isIntersecting && isPageVisible;
  }

  function start() {
    if (rafId || !shouldRun()) return;
    lastTime = 0;
    rafId = requestAnimationFrame(loop);
  }

  function stop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function update() {
    if (shouldRun()) start();
    else {
      stop();
      if (reducedMotion) draw(performance.now()); // static frame
    }
  }

  // --- Observers & listeners ------------------------------------------------
  const resizeObserver = new ResizeObserver(() => {
    resize();
    if (!rafId) draw(performance.now());
  });
  resizeObserver.observe(root);

  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      isIntersecting = entries.some((e) => e.isIntersecting);
      update();
    },
    { rootMargin: '64px 0px' }
  );
  intersectionObserver.observe(root);

  const onVisibility = () => {
    isPageVisible = document.visibilityState === 'visible';
    update();
  };
  document.addEventListener('visibilitychange', onVisibility);

  const onMotionChange = (e: MediaQueryListEvent) => {
    reducedMotion = e.matches;
    root.dataset.motion = reducedMotion ? 'reduced' : 'full';
    update();
  };
  motionQuery.addEventListener('change', onMotionChange);

  // --- Boot -----------------------------------------------------------------
  resize();
  draw(performance.now());
  root.dataset.motion = reducedMotion ? 'reduced' : 'full';
  root.classList.add('is-live'); // fades canvas in over the static SVG fallback
  update();

  return () => {
    stop();
    resizeObserver.disconnect();
    intersectionObserver.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    motionQuery.removeEventListener('change', onMotionChange);
    delete root.dataset.constellationReady;
  };
}

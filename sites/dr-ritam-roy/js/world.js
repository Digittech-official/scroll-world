// Real-time 3D scroll world. Scroll drives a camera through eight "stations",
// one per page section, connected by a flowing bloodstream of light.
import * as THREE from "three";

const canvas = document.getElementById("world");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
} catch (e) {
  canvas.remove(); // CSS gradient fallback stays visible
  throw e;
}

const COLORS = {
  bg: 0x061521,
  teal: 0x3fd1c2,
  mint: 0x9ff3e6,
  gold: 0xf4c47a,
  rose: 0xff8f8f,
  white: 0xeef6f6
};

renderer.setClearColor(COLORS.bg, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(COLORS.bg, 0.028);
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 400);

scene.add(new THREE.AmbientLight(0x88aabb, 0.6));
const key = new THREE.DirectionalLight(0xffffff, 1.4);
key.position.set(5, 8, 6);
scene.add(key);
const rim = new THREE.PointLight(COLORS.teal, 30, 60, 1.6);
scene.add(rim);

const GAP = 42; // distance between stations along -z
const stationZ = (i) => -i * GAP;

// Soft round sprite for all point clouds.
function dotTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.35, "rgba(255,255,255,.55)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const DOT = dotTexture();
const pointsMat = (color, size, opacity = 1) =>
  new THREE.PointsMaterial({ color, size, map: DOT, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });

const glowMat = (color, opacity = 1) =>
  new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });

// Fresnel-glow shader for orbs.
function fresnelMat(color, power = 2.2, intensity = 1.4) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uPower: { value: power }, uInt: { value: intensity } },
    vertexShader: `varying vec3 vN; varying vec3 vV;
      void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uPower; uniform float uInt; varying vec3 vN; varying vec3 vV;
      void main(){ float f = pow(1.0 - max(dot(vN, vV), 0.0), uPower); gl_FragColor = vec4(uColor * f * uInt, f); }`,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
}

const updaters = [];
const stations = []; // { group, baseX, mobileX }

function station(i, x, y = 0, mobileX = x * 0.25) {
  const g = new THREE.Group();
  g.position.set(x, y, stationZ(i));
  scene.add(g);
  stations[i] = { group: g, baseX: x, mobileX };
  return g;
}

/* ---------- 0 · DNA helix (hero) ---------- */
{
  const g = station(0, 6.2, 0, 5.2);
  const pairs = 46, height = 22, radius = 2.1, turns = 3.2;
  const sphere = new THREE.SphereGeometry(0.22, 16, 12);
  const matA = new THREE.MeshStandardMaterial({ color: COLORS.teal, emissive: COLORS.teal, emissiveIntensity: 0.6, roughness: 0.3, metalness: 0.2 });
  const matB = new THREE.MeshStandardMaterial({ color: COLORS.gold, emissive: COLORS.gold, emissiveIntensity: 0.45, roughness: 0.3, metalness: 0.2 });
  const a = new THREE.InstancedMesh(sphere, matA, pairs);
  const b = new THREE.InstancedMesh(sphere, matB, pairs);
  const rungGeo = new THREE.CylinderGeometry(0.045, 0.045, 1, 6);
  rungGeo.rotateZ(Math.PI / 2);
  const rungs = new THREE.InstancedMesh(rungGeo, new THREE.MeshStandardMaterial({ color: COLORS.mint, emissive: COLORS.mint, emissiveIntensity: 0.3, transparent: true, opacity: 0.55 }), pairs);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3();
  for (let k = 0; k < pairs; k++) {
    const t = k / (pairs - 1);
    const ang = t * turns * Math.PI * 2;
    const yy = (t - 0.5) * height;
    const pa = new THREE.Vector3(Math.cos(ang) * radius, yy, Math.sin(ang) * radius);
    const pb = new THREE.Vector3(-pa.x, yy, -pa.z);
    a.setMatrixAt(k, m.makeTranslation(pa.x, pa.y, pa.z));
    b.setMatrixAt(k, m.makeTranslation(pb.x, pb.y, pb.z));
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -ang);
    s.set(radius * 2, 1, 1);
    rungs.setMatrixAt(k, m.compose(new THREE.Vector3(0, yy, 0), q, s));
  }
  const helix = new THREE.Group();
  helix.add(a, b, rungs);
  helix.rotation.z = -0.32;
  g.add(helix);

  // Backbone ribbons
  for (const sign of [1, -1]) {
    const pts = [];
    for (let k = 0; k <= 200; k++) {
      const t = k / 200, ang = t * turns * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(ang) * radius * sign, (t - 0.5) * height, Math.sin(ang) * radius * sign));
    }
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 300, 0.06, 6), glowMat(sign > 0 ? COLORS.teal : COLORS.gold, 0.6));
    helix.add(tube);
  }
  const halo = new THREE.Mesh(new THREE.SphereGeometry(5.5, 48, 32), fresnelMat(COLORS.teal, 3, 0.5));
  g.add(halo);
  updaters.push((t) => { helix.rotation.y = t * 0.25; });
}

/* ---------- 1 · Credentials orb (about) ---------- */
{
  const g = station(1, -6.5, 1.5, 0);
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4, 1), new THREE.MeshStandardMaterial({ color: COLORS.teal, wireframe: true, emissive: COLORS.teal, emissiveIntensity: 0.6 }));
  const inner = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4, 0), new THREE.MeshStandardMaterial({ color: COLORS.gold, emissive: COLORS.gold, emissiveIntensity: 0.4, flatShading: true, roughness: 0.25, metalness: 0.4 }));
  const shell = new THREE.Mesh(new THREE.SphereGeometry(3.4, 48, 32), fresnelMat(COLORS.mint, 2.4, 0.9));
  g.add(core, inner, shell);
  const rings = [];
  for (let k = 0; k < 3; k++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(4.4 + k * 0.9, 0.018, 8, 160), glowMat(k === 1 ? COLORS.gold : COLORS.teal, 0.7));
    r.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), glowMat(COLORS.white, 1));
    bead.position.x = 4.4 + k * 0.9;
    r.add(bead);
    rings.push(r);
    g.add(r);
  }
  updaters.push((t) => {
    core.rotation.set(t * 0.2, t * 0.3, 0);
    inner.rotation.set(-t * 0.4, t * 0.25, 0);
    rings.forEach((r, k) => { r.rotation.z = t * (0.2 + k * 0.12); r.rotation.x += 0.0008 * (k + 1); });
  });
}

/* ---------- 2 · Glucose molecules (care) ---------- */
{
  const g = station(2, 0, 0, 0);
  const atomGeo = new THREE.SphereGeometry(0.28, 14, 10);
  const hGeo = new THREE.SphereGeometry(0.15, 10, 8);
  const cMat = new THREE.MeshStandardMaterial({ color: COLORS.teal, emissive: COLORS.teal, emissiveIntensity: 0.5, roughness: 0.3 });
  const oMat = new THREE.MeshStandardMaterial({ color: COLORS.rose, emissive: COLORS.rose, emissiveIntensity: 0.4, roughness: 0.3 });
  const hMat = new THREE.MeshStandardMaterial({ color: COLORS.white, emissive: COLORS.white, emissiveIntensity: 0.2 });
  const bondMat = new THREE.LineBasicMaterial({ color: COLORS.mint, transparent: true, opacity: 0.6 });
  function molecule() {
    const m = new THREE.Group();
    const ring = [];
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      const p = new THREE.Vector3(Math.cos(a), Math.sin(a), 0).multiplyScalar(1);
      ring.push(p);
      const atom = new THREE.Mesh(atomGeo, k === 0 ? oMat : cMat);
      atom.position.copy(p);
      m.add(atom);
      // OH branch
      const out = p.clone().multiplyScalar(1.75).add(new THREE.Vector3(0, 0, k % 2 ? 0.4 : -0.4));
      const o = new THREE.Mesh(k === 0 ? hGeo : atomGeo, k === 0 ? hMat : oMat);
      o.scale.setScalar(k === 0 ? 1 : 0.75);
      o.position.copy(out);
      m.add(o);
      const h = new THREE.Mesh(hGeo, hMat);
      h.position.copy(out.clone().multiplyScalar(1.3));
      if (k) m.add(h);
      const bg = new THREE.BufferGeometry().setFromPoints([p, out, out, out.clone().multiplyScalar(1.3)]);
      m.add(new THREE.LineSegments(bg, bondMat));
    }
    const rg = new THREE.BufferGeometry().setFromPoints([...ring, ring[0]]);
    m.add(new THREE.Line(rg, bondMat));
    return m;
  }
  const mols = [];
  for (let k = 0; k < 16; k++) {
    const m = molecule();
    const a = (k / 16) * Math.PI * 2 + Math.random() * 0.3;
    const r = 9 + Math.random() * 6;
    m.position.set(Math.cos(a) * r * 1.3, Math.sin(a) * r * 0.65, -Math.random() * 10 + 2);
    m.scale.setScalar(0.55 + Math.random() * 0.6);
    m.userData = { spin: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.6), y0: m.position.y, ph: Math.random() * 6 };
    mols.push(m);
    g.add(m);
  }
  updaters.push((t, dt) => {
    for (const m of mols) {
      m.rotation.x += m.userData.spin.x * dt;
      m.rotation.y += m.userData.spin.y * dt;
      m.position.y = m.userData.y0 + Math.sin(t * 0.6 + m.userData.ph) * 0.5;
    }
  });
}

/* ---------- 3 · Particle heart + ECG ring (tools) ---------- */
{
  const g = station(3, 7, 0.5, 0);
  const N = reduced ? 1500 : 3200;
  const pos = new Float32Array(N * 3);
  for (let k = 0; k < N; k++) {
    const t = Math.random() * Math.PI * 2;
    const f = Math.pow(Math.random(), 0.5); // fill toward the outline
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    pos[k * 3] = x * 0.17 * f;
    pos[k * 3 + 1] = y * 0.17 * f + 0.4;
    pos[k * 3 + 2] = (Math.random() - 0.5) * 1.6 * f;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const heart = new THREE.Points(geo, pointsMat(COLORS.rose, 0.16, 0.9));
  g.add(heart);
  const ecgPts = [];
  const R = 5.2;
  for (let k = 0; k <= 720; k++) {
    const a = (k / 720) * Math.PI * 2;
    const ph = (k % 180) / 180; // four beats round the ring
    let bump = 0;
    if (ph > 0.40 && ph < 0.43) bump = -0.25;
    else if (ph >= 0.43 && ph < 0.47) bump = 1.4 * Math.sin(((ph - 0.43) / 0.04) * Math.PI);
    else if (ph >= 0.47 && ph < 0.5) bump = -0.5 * Math.sin(((ph - 0.47) / 0.03) * Math.PI);
    else if (ph > 0.6 && ph < 0.7) bump = 0.3 * Math.sin(((ph - 0.6) / 0.1) * Math.PI);
    ecgPts.push(new THREE.Vector3(Math.cos(a) * R, bump, Math.sin(a) * R));
  }
  const ecg = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ecgPts), new THREE.LineBasicMaterial({ color: COLORS.teal, transparent: true, opacity: 0.9 }));
  ecg.rotation.x = 0.35;
  g.add(ecg);
  const glow = new THREE.Mesh(new THREE.SphereGeometry(3.3, 40, 28), fresnelMat(COLORS.rose, 2.5, 0.6));
  g.add(glow);
  updaters.push((t) => {
    const beat = (t * 1.15) % 1; // ~70 bpm
    const s = 1 + 0.08 * Math.exp(-Math.pow((beat - 0.1) / 0.05, 2)) + 0.05 * Math.exp(-Math.pow((beat - 0.3) / 0.05, 2));
    heart.scale.setScalar(s);
    heart.rotation.y = Math.sin(t * 0.4) * 0.5;
    ecg.rotation.y = -t * 0.5;
  });
}

/* ---------- 4 · Chamber map (chambers) ---------- */
{
  const g = station(4, 0, -3.2, 0);
  const grid = new THREE.GridHelper(40, 40, COLORS.teal, COLORS.teal);
  grid.material.transparent = true;
  grid.material.opacity = 0.16;
  grid.material.depthWrite = false;
  g.add(grid);
  // Roads
  const roadMat = new THREE.LineBasicMaterial({ color: COLORS.mint, transparent: true, opacity: 0.35 });
  const roads = [
    [[-18, 0, -4], [-6, 0, -2], [4, 0, -3], [18, 0, 1]],
    [[-2, 0, -16], [-1, 0, -6], [1, 0, 4], [3, 0, 16]],
    [[-16, 0, 8], [-6, 0, 5], [8, 0, 9], [18, 0, 7]]
  ];
  for (const r of roads) {
    const c = new THREE.CatmullRomCurve3(r.map((p) => new THREE.Vector3(...p)));
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(c.getPoints(80)), roadMat));
  }
  const pinSpots = [[-7, -2.4], [-0.6, 1.5], [6.5, -3.2], [2.8, 6.4]];
  const pins = [];
  const pinMat = new THREE.MeshStandardMaterial({ color: COLORS.gold, emissive: COLORS.gold, emissiveIntensity: 0.7, roughness: 0.3 });
  for (const [x, z] of pinSpots) {
    const pin = new THREE.Group();
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 14), pinMat);
    head.position.y = 2.1;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.6, 20), pinMat);
    cone.rotation.x = Math.PI;
    cone.position.y = 1.15;
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.55, 40), glowMat(COLORS.gold, 0.8));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 8, 6), glowMat(COLORS.gold, 0.25));
    beam.position.y = 4;
    pin.add(head, cone, ring, beam);
    pin.position.set(x, 0, z);
    pin.userData.ring = ring;
    pins.push(pin);
    g.add(pin);
  }
  // Arcs between chambers
  const arcMat = new THREE.LineDashedMaterial({ color: COLORS.teal, dashSize: 0.3, gapSize: 0.2, transparent: true, opacity: 0.8 });
  for (let k = 0; k < pinSpots.length; k++) {
    const a = new THREE.Vector3(pinSpots[k][0], 0, pinSpots[k][1]);
    const b = new THREE.Vector3(pinSpots[(k + 1) % 4][0], 0, pinSpots[(k + 1) % 4][1]);
    const mid = a.clone().add(b).multiplyScalar(0.5);
    mid.y = a.distanceTo(b) * 0.35;
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(new THREE.QuadraticBezierCurve3(a, mid, b).getPoints(50)), arcMat);
    line.computeLineDistances();
    g.add(line);
  }
  updaters.push((t) => {
    pins.forEach((p, k) => {
      const ph = (t * 0.7 + k * 0.25) % 1;
      p.userData.ring.scale.setScalar(1 + ph * 3);
      p.userData.ring.material.opacity = 0.8 * (1 - ph);
      p.children[0].position.y = 2.1 + Math.sin(t * 2 + k) * 0.12;
    });
    arcMat.dashOffset = -t * 0.6;
  });
}

/* ---------- 5 · Sunrise orb (booking) ---------- */
{
  const g = station(5, -7.5, 0.5, 0);
  const core = new THREE.Mesh(new THREE.SphereGeometry(2.2, 48, 32), new THREE.MeshStandardMaterial({ color: COLORS.gold, emissive: COLORS.gold, emissiveIntensity: 0.9, roughness: 0.5 }));
  const aura = new THREE.Mesh(new THREE.SphereGeometry(3.6, 48, 32), fresnelMat(COLORS.gold, 1.8, 1.1));
  g.add(core, aura);
  // Calendar-like orbit of 7 day-tiles
  const tiles = new THREE.Group();
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2;
    const tile = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.08), new THREE.MeshStandardMaterial({ color: k === 0 || k === 3 ? COLORS.teal : 0x1b4656, emissive: k === 0 || k === 3 ? COLORS.teal : 0x0, emissiveIntensity: 0.5, roughness: 0.4 }));
    tile.position.set(Math.cos(a) * 5, Math.sin(a * 2) * 0.4, Math.sin(a) * 5);
    tile.lookAt(0, 0, 0);
    tiles.add(tile);
  }
  tiles.rotation.x = 0.3;
  g.add(tiles);
  updaters.push((t) => {
    tiles.rotation.y = t * 0.3;
    aura.scale.setScalar(1 + Math.sin(t * 1.5) * 0.03);
  });
}

/* ---------- 6 · Floating notes (journal) ---------- */
{
  const g = station(6, 0, 0, 0);
  const pages = [];
  const paper = new THREE.MeshStandardMaterial({ color: 0xdfe9e6, emissive: 0x10262c, roughness: 0.8, side: THREE.DoubleSide, transparent: true, opacity: 0.55 });
  const lineMat = new THREE.MeshBasicMaterial({ color: COLORS.teal, transparent: true, opacity: 0.55 });
  for (let k = 0; k < 18; k++) {
    const pg = new THREE.Group();
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.1), paper);
    pg.add(sheet);
    for (let l = 0; l < 5; l++) {
      const ln = new THREE.Mesh(new THREE.PlaneGeometry(l === 0 ? 0.8 : 1.1 - Math.random() * 0.3, 0.06), lineMat);
      ln.position.set(l === 0 ? -0.25 : -0.05, 0.7 - l * 0.3, 0.01);
      pg.add(ln);
    }
    const a = Math.random() * Math.PI * 2, r = 8 + Math.random() * 8;
    pg.position.set(Math.cos(a) * r * 1.3, Math.sin(a) * r * 0.6, -Math.random() * 12 + 2);
    pg.rotation.set(Math.random() - 0.5, Math.random() * Math.PI, Math.random() - 0.5);
    pg.userData = { y0: pg.position.y, ph: Math.random() * 6, rs: (Math.random() - 0.5) * 0.4 };
    pages.push(pg);
    g.add(pg);
  }
  updaters.push((t, dt) => {
    for (const p of pages) {
      p.position.y = p.userData.y0 + Math.sin(t * 0.5 + p.userData.ph) * 0.6;
      p.rotation.y += p.userData.rs * dt;
    }
  });
}

/* ---------- 7 · Calm wave field (contact) ---------- */
{
  const g = station(7, 0, -4, 0);
  const W = 90, H = 50;
  const pos = new Float32Array(W * H * 3);
  for (let i = 0; i < W; i++) for (let j = 0; j < H; j++) {
    const k = (i * H + j) * 3;
    pos[k] = (i - W / 2) * 0.55;
    pos[k + 2] = (j - H / 2) * 0.55;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const field = new THREE.Points(geo, pointsMat(COLORS.teal, 0.14, 0.8));
  g.add(field);
  updaters.push((t) => {
    const p = geo.attributes.position.array;
    for (let k = 0; k < p.length; k += 3) p[k + 1] = Math.sin(p[k] * 0.35 + t) * 0.45 + Math.cos(p[k + 2] * 0.4 + t * 0.8) * 0.45;
    geo.attributes.position.needsUpdate = true;
  });
}

/* ---------- Bloodstream that links every station ---------- */
const COUNT = stations.length;
const pathPts = [];
for (let i = 0; i < COUNT; i++) {
  pathPts.push(new THREE.Vector3(Math.sin(i * 1.7) * 3, Math.cos(i * 1.3) * 1.5 - 1, stationZ(i) + 6));
  pathPts.push(new THREE.Vector3(Math.sin(i * 1.7 + 0.8) * 3.5, Math.cos(i * 1.3 + 0.8) * 1.5 - 1, stationZ(i) - GAP / 2));
}
const stream = new THREE.CatmullRomCurve3(pathPts);
const CELLS = reduced ? 300 : 900;
const cellPos = new Float32Array(CELLS * 3);
const cellCol = new Float32Array(CELLS * 3);
const cellSeed = [];
const cA = new THREE.Color(COLORS.teal), cB = new THREE.Color(COLORS.rose), cC = new THREE.Color(COLORS.gold);
for (let k = 0; k < CELLS; k++) {
  cellSeed.push({ u: Math.random(), off: new THREE.Vector3((Math.random() - 0.5) * 2.4, (Math.random() - 0.5) * 2.4, (Math.random() - 0.5) * 2.4), sp: 0.004 + Math.random() * 0.006 });
  const c = Math.random() < 0.6 ? cA : Math.random() < 0.7 ? cB : cC;
  cellCol.set([c.r, c.g, c.b], k * 3);
}
const cellGeo = new THREE.BufferGeometry();
cellGeo.setAttribute("position", new THREE.BufferAttribute(cellPos, 3));
cellGeo.setAttribute("color", new THREE.BufferAttribute(cellCol, 3));
const cellMat = pointsMat(0xffffff, 0.22, 0.85);
cellMat.vertexColors = true;
scene.add(new THREE.Points(cellGeo, cellMat));
const tmp = new THREE.Vector3();
updaters.push((t, dt) => {
  for (let k = 0; k < CELLS; k++) {
    const s = cellSeed[k];
    s.u = (s.u + s.sp * dt * 3) % 1;
    stream.getPointAt(s.u, tmp).add(s.off);
    cellPos[k * 3] = tmp.x; cellPos[k * 3 + 1] = tmp.y; cellPos[k * 3 + 2] = tmp.z;
  }
  cellGeo.attributes.position.needsUpdate = true;
});

/* ---------- Ambient dust ---------- */
{
  const N = reduced ? 800 : 2400;
  const p = new Float32Array(N * 3);
  for (let k = 0; k < N; k++) {
    p[k * 3] = (Math.random() - 0.5) * 80;
    p[k * 3 + 1] = (Math.random() - 0.5) * 50;
    p[k * 3 + 2] = 20 - Math.random() * (GAP * COUNT + 40);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(p, 3));
  const dust = new THREE.Points(geo, pointsMat(COLORS.mint, 0.09, 0.5));
  scene.add(dust);
  updaters.push((t) => { dust.rotation.z = t * 0.01; });
}

/* ---------- Camera rig driven by scroll ---------- */
const sections = [...document.querySelectorAll("[data-station]")];
let anchors = [];
let narrow = false;

function camFor(i) {
  const s = stations[i];
  const x = narrow ? s.mobileX : s.baseX;
  // Camera sits in front and offset toward the text side so the object frames beside the copy.
  const pos = new THREE.Vector3(x * 0.25, s.group.position.y + (i === 4 ? 9 : 0.6), stationZ(i) + (i === 4 ? 15 : narrow ? 17 : 14));
  const look = new THREE.Vector3(x * 0.35, s.group.position.y + (i === 4 ? 0 : 0), stationZ(i));
  if (i === 2 || i === 6) { pos.z = stationZ(i) + 9; } // fly inside the cloud
  return { pos, look };
}

function layout() {
  const w = innerWidth, h = innerHeight;
  narrow = w < 860;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, narrow ? 1.5 : 1.75));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = narrow ? 62 : 50;
  camera.updateProjectionMatrix();
  stations.forEach((s) => { s.group.position.x = narrow ? s.mobileX : s.baseX; });
  anchors = sections.map((el) => {
    const top = el.getBoundingClientRect().top + scrollY;
    return Math.max(0, top + Math.min(el.offsetHeight, h) / 2 - h / 2);
  });
  anchors[0] = 0;
}

const smooth = (t) => t * t * (3 - 2 * t);
function scrollTarget() {
  const y = scrollY;
  let i = 0;
  while (i < anchors.length - 1 && y >= anchors[i + 1]) i++;
  if (i >= anchors.length - 1) return camFor(anchors.length - 1);
  const t = Math.min(1, Math.max(0, (y - anchors[i]) / Math.max(1, anchors[i + 1] - anchors[i])));
  const a = camFor(i), b = camFor(i + 1);
  const k = smooth(t);
  // Lift slightly mid-flight so transitions feel like a fly-over rather than a dolly.
  const lift = Math.sin(k * Math.PI) * 2.2;
  return { pos: a.pos.lerp(b.pos, k).add(new THREE.Vector3(0, lift, 0)), look: a.look.lerp(b.look, k) };
}

const pointer = new THREE.Vector2();
addEventListener("pointermove", (e) => {
  pointer.set(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5);
}, { passive: true });

layout();
const camPos = scrollTarget().pos.clone();
const camLook = scrollTarget().look.clone();
camera.position.copy(camPos);

let resizeT;
addEventListener("resize", () => { clearTimeout(resizeT); resizeT = setTimeout(layout, 120); });
if ("ResizeObserver" in window) new ResizeObserver(() => { clearTimeout(resizeT); resizeT = setTimeout(layout, 120); }).observe(document.body);
addEventListener("load", layout);

const clock = new THREE.Clock();
let running = true;
document.addEventListener("visibilitychange", () => {
  running = !document.hidden;
  if (running) { clock.getDelta(); requestAnimationFrame(frame); }
});

function frame() {
  if (!running) return;
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime * (reduced ? 0.25 : 1);
  const target = scrollTarget();
  const ease = reduced ? 1 : 1 - Math.pow(0.0025, dt); // frame-rate independent damping
  camPos.lerp(target.pos, ease);
  camLook.lerp(target.look, ease);
  camera.position.copy(camPos);
  if (!reduced) camera.position.add(new THREE.Vector3(pointer.x * 1.2, -pointer.y * 0.8, 0));
  camera.lookAt(camLook);
  rim.position.set(camPos.x + 4, camPos.y + 3, camPos.z - 8);
  for (const st of stations) {
    const d = Math.abs(camPos.z - st.group.position.z - 12);
    st.group.visible = d < GAP * 0.9;
  }
  for (const u of updaters) u(t, dt);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
document.documentElement.classList.add("has-3d");

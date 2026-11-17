import * as THREE from "three";
import { BLOCK } from "@/data/bioxar";

function roundedRect(shape: THREE.Shape | THREE.Path, w: number, h: number, r: number) {
  const x = -w / 2, y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
}

let cached: THREE.BufferGeometry | null = null;

/**
 * The BioXar block, standing: 50 wide (x) x 60 high (y) x 50 deep (z), in metres, centred on the origin.
 * A rounded hole runs front to back (z), 24 x 36 cm at its narrowest, flaring towards both faces.
 */
export function getBlockGeometry() {
  if (cached) return cached;
  const W = BLOCK.sizeCm.w / 100, H = BLOCK.sizeCm.h / 100, D = BLOCK.sizeCm.d / 100;
  const hw = BLOCK.holeCm.w / 100, hh = BLOCK.holeCm.h / 100;
  const bevel = 0.022;
  const outer = new THREE.Shape();
  roundedRect(outer, W - 2 * bevel, H - 2 * bevel, 0.03);
  const hole = new THREE.Path();
  roundedRect(hole, hw + 2 * bevel, hh + 2 * bevel, 0.03);
  outer.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(outer, {
    depth: D - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 5, curveSegments: 12, steps: 10,
  });
  geo.translate(0, 0, -(D - 2 * bevel) / 2);
  // Flare the hole towards both faces.
  const pos = geo.attributes["position"] as THREE.BufferAttribute;
  const limX = (hw / 2) + 0.06, limY = (hh / 2) + 0.06;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (Math.abs(x) < limX && Math.abs(y) < limY) {
      const t = Math.min(1, Math.abs(z) / (D / 2));
      const f = 1 + 0.16 * Math.pow(t, 6);
      pos.setXYZ(i, x * f, y * f, z);
    }
  }
  geo.computeVertexNormals();
  cached = geo;
  return geo;
}

let real: Promise<THREE.BufferGeometry> | null = null;

/**
 * The real BioXar block from the product STL (modelled in cm, Z-up). Normalised to the same frame as
 * getBlockGeometry: metres, Y-up, centred, hole front to back (z). Box-projected UVs in metres so the
 * speckle texture keeps its scale. Browser only; loaded once and shared.
 */
export function loadRealBlockGeometry() {
  if (real) return real;
  real = Promise.all([
    import("@/assets/models/bioxar-block.stl?url"),
    import("three/examples/jsm/loaders/STLLoader.js"),
    import("three/examples/jsm/utils/BufferGeometryUtils.js"),
  ]).then(async ([{ default: url }, { STLLoader }, { toCreasedNormals }]) => {
    const raw = new STLLoader().parse(await (await fetch(url)).arrayBuffer());
    raw.rotateX(-Math.PI / 2);
    raw.scale(0.01, 0.01, 0.01);
    raw.computeBoundingBox();
    const c = raw.boundingBox!.getCenter(new THREE.Vector3());
    raw.translate(-c.x, -c.y, -c.z);
    const geo = toCreasedNormals(raw, Math.PI / 4);
    const pos = geo.attributes["position"] as THREE.BufferAttribute;
    const nor = geo.attributes["normal"] as THREE.BufferAttribute;
    const uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      const ax = Math.abs(nor.getX(i)), ay = Math.abs(nor.getY(i)), az = Math.abs(nor.getZ(i));
      const [u, v] = ax >= ay && ax >= az ? [pos.getZ(i), pos.getY(i)] : ay >= az ? [pos.getX(i), pos.getZ(i)] : [pos.getX(i), pos.getY(i)];
      uv[i * 2] = u;
      uv[i * 2 + 1] = v;
    }
    geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    geo.computeBoundingSphere();
    return geo;
  });
  real.catch(() => { real = null; });
  return real;
}

let speckle: THREE.CanvasTexture | null = null;
/** Matte fine speckle, multiplied by the block colour. Browser only. */
export function getSpeckleTexture() {
  if (speckle) return speckle;
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 214 + rnd() * 34;
    img.data[i] = v; img.data[i + 1] = v * 0.99; img.data[i + 2] = v * 0.97; img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  // Fine biochar grain, then larger terrazzo chips like the real material.
  for (let i = 0; i < 5200; i++) {
    const r = rnd();
    ctx.fillStyle = r > 0.55 ? "rgba(255,250,242,0.75)" : r > 0.2 ? "rgba(60,50,44,0.45)" : "rgba(120,96,82,0.5)";
    ctx.fillRect(rnd() * size, rnd() * size, 0.8 + rnd() * 1.4, 0.8 + rnd() * 1.4);
  }
  for (let i = 0; i < 140; i++) {
    const r = rnd();
    ctx.fillStyle = r > 0.5 ? "rgba(255,252,246,0.85)" : r > 0.2 ? "rgba(34,30,28,0.7)" : "rgba(150,120,104,0.7)";
    const x = rnd() * size, y = rnd() * size, rad = 1.2 + rnd() * 2.6;
    ctx.beginPath();
    for (let k = 0; k < 5; k++) { const ang = (k / 5) * Math.PI * 2 + rnd(); const rr = rad * (0.6 + rnd() * 0.5); ctx.lineTo(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr); }
    ctx.closePath(); ctx.fill();
  }
  speckle = new THREE.CanvasTexture(c);
  speckle.wrapS = speckle.wrapT = THREE.RepeatWrapping;
  speckle.repeat.set(1.6, 1.6);
  speckle.anisotropy = 4;
  speckle.colorSpace = THREE.SRGBColorSpace;
  return speckle;
}

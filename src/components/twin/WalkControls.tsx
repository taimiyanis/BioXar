import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useTwin } from "@/lib/twin/store";

// Walk through the room at eye height (from the 3D build space). Computer only:
// drag to look around, W A S D or the arrow keys to walk. No mouse lock, so it also works inside previews.
const EYE = 1.68; // eye height of a 1.8 m tall person
const SPEED = 2; // m/s
const LOOK = 0.004; // radians per dragged pixel
const KEYS = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

export function WalkControls() {
  const { camera, gl } = useThree();
  const room = useTwin((s) => s.room);
  const keys = useRef<Record<string, boolean>>({});
  const look = useRef(new THREE.Euler(0, 0, 0, "YXZ")).current;
  const fwd = useRef(new THREE.Vector3()).current;
  const right = useRef(new THREE.Vector3()).current;

  // Start at the front edge of the room, looking at its centre.
  useEffect(() => {
    camera.position.set(0, EYE, room.d / 2 - 0.4);
    camera.lookAt(0, 0.6, 0);
    look.setFromQuaternion(camera.quaternion);
  }, [camera, room.d, look]);

  // A wider, human field of view while walking; the orbit view's narrower one comes back after.
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const before = cam.fov;
    cam.fov = 65;
    cam.updateProjectionMatrix();
    return () => {
      cam.fov = before;
      cam.updateProjectionMatrix();
    };
  }, [camera]);

  // Drag to look.
  useEffect(() => {
    const el = gl.domElement;
    let drag: number | null = null;
    let last = { x: 0, y: 0 };
    const down = (e: PointerEvent) => { drag = e.pointerId; last = { x: e.clientX, y: e.clientY }; el.setPointerCapture(e.pointerId); el.style.cursor = "grabbing"; };
    const move = (e: PointerEvent) => {
      if (drag !== e.pointerId) return;
      look.y -= (e.clientX - last.x) * LOOK;
      look.x = THREE.MathUtils.clamp(look.x - (e.clientY - last.y) * LOOK, -1.4, 1.4);
      last = { x: e.clientX, y: e.clientY };
      camera.quaternion.setFromEuler(look);
    };
    const up = (e: PointerEvent) => { if (drag === e.pointerId) { drag = null; el.style.cursor = "grab"; } };
    el.style.cursor = "grab";
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.style.cursor = "";
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [gl, camera, look]);

  // Keys walk. Arrow keys only stop the page from scrolling while the mouse is over the room.
  useEffect(() => {
    const el = gl.domElement;
    let over = false;
    const enter = () => (over = true);
    const leave = () => (over = false);
    const d = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input, textarea")) return;
      if (!KEYS.has(e.code)) return;
      if (e.code.startsWith("Arrow")) { if (!over) return; e.preventDefault(); }
      keys.current[e.code] = true;
    };
    const u = (e: KeyboardEvent) => (keys.current[e.code] = false);
    const blur = () => (keys.current = {});
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    window.addEventListener("keydown", d);
    window.addEventListener("keyup", u);
    window.addEventListener("blur", blur);
    return () => {
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
      window.removeEventListener("keydown", d);
      window.removeEventListener("keyup", u);
      window.removeEventListener("blur", blur);
    };
  }, [gl]);

  useFrame((_, delta) => {
    const k = keys.current;
    const f = (k["KeyW"] || k["ArrowUp"] ? 1 : 0) - (k["KeyS"] || k["ArrowDown"] ? 1 : 0);
    const r = (k["KeyD"] || k["ArrowRight"] ? 1 : 0) - (k["KeyA"] || k["ArrowLeft"] ? 1 : 0);
    if (f || r) {
      camera.getWorldDirection(fwd);
      fwd.y = 0;
      fwd.normalize();
      right.crossVectors(fwd, camera.up).normalize();
      const step = SPEED * Math.min(delta, 0.05);
      camera.position.addScaledVector(fwd, f * step).addScaledVector(right, r * step);
    }
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -room.w / 2 + 0.1, room.w / 2 - 0.1);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -room.d / 2 + 0.1, room.d / 2 - 0.1);
    camera.position.y = EYE;
  });

  return null;
}

import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** The light warm-grey 3D stage. One per screen; pixel ratio capped at 2. */
export function Stage({ children, className, camera = { position: [2.2, 1.6, 2.6] as [number, number, number], fov: 35 }, shadows = true, target = [0, 0.4, 0], capture = false, transparent = false }: { transparent?: boolean; capture?: boolean; target?: [number, number, number]; children: ReactNode; className?: string | undefined; camera?: { position: [number, number, number]; fov: number }; shadows?: boolean }) {
  const [ready, setReady] = useState(false);
  return (
    <div className={cn("relative overflow-hidden", transparent ? "bg-transparent" : "rounded-[var(--radius)] bg-stage", className)} data-scene-ready={ready || undefined}>
      <Canvas dpr={[1, 2]} shadows={shadows} camera={camera} gl={{ alpha: true, antialias: true, preserveDrawingBuffer: capture }} onCreated={({ camera: cam }) => { cam.lookAt(...target); requestAnimationFrame(() => setReady(true)); }}>
        <ambientLight intensity={0.45} />
        <directionalLight position={[3, 6, 4]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
        <Environment resolution={64}>
          <Lightformer intensity={1.4} position={[0, 5, 0]} scale={[10, 10, 1]} rotation-x={Math.PI / 2} />
          <Lightformer intensity={0.8} position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[10, 3, 1]} />
          <Lightformer intensity={0.5} color="#f3e9dc" position={[5, 1, -2]} rotation-y={-Math.PI / 2} scale={[10, 3, 1]} />
        </Environment>
        <Suspense fallback={null}>{children}</Suspense>
        {shadows && <ContactShadows position={[0, 0.001, 0]} opacity={0.45} scale={12} blur={2.2} far={3} />}
      </Canvas>
      {!ready && <StageLoader />}
    </div>
  );
}

export function StageLoader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-stage text-base text-stage-foreground">
      <span className="animate-pulse">Loading 3D view</span>
    </div>
  );
}

/** Renders children only in the browser, with the stage loader meanwhile. */
export function ClientStage({ children, className }: { children: ReactNode; className?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className={cn("relative overflow-hidden rounded-[var(--radius)] bg-stage", className)}><StageLoader /></div>;
  return <>{children}</>;
}

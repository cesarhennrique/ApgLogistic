"use client";

import { useGLTF } from "@react-three/drei";
import { Component, type ReactNode, Suspense, useMemo } from "react";
import type { Material, Mesh } from "three";
import { withSkyFog } from "./skyShared";

// A GLB dropped into public/3d/models/ replaces the procedural model (next.config only sets the URL when the
// file exists, so nothing fetches a missing file). Authored in meters, with the procedural model's origin.
// Any load or parse error falls back to the procedural model.
class Fallback extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function Glb({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const model = useMemo(() => {
    const copy = scene.clone();
    copy.traverse((o) => {
      const mesh = o as Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = mesh.receiveShadow = true;
      // Same fog as the rest of the scene, or its horizon shows a seam.
      if (!Array.isArray(mesh.material)) mesh.material = withSkyFog((mesh.material as Material & { fog: boolean }).clone());
    });
    return copy;
  }, [scene]);
  return <primitive object={model} />;
}

export function GlbOr({ url, children }: { url: string | undefined; children: ReactNode }) {
  if (!url) return <>{children}</>;
  return (
    <Fallback fallback={children}>
      <Suspense fallback={children}>
        <Glb url={url} />
      </Suspense>
    </Fallback>
  );
}

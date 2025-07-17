"use client";

import * as THREE from "three";
import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { Help } from "@/components/help";
import { Hud } from "@/components/hud";
import { Car } from "@/components/car";
import { Track } from "@/components/track";

export default function Home() {
  return (
    <>
      <main className="relative w-full h-screen">
        <Hud />
        <Help />

        <Canvas
          camera={{ fov: 85, near: 0.1, far: 2000, position: [10, 40, 15] }}
        >
          <fog attach="fog" args={[0xfbc8c0, 50, 400]} />
          <Environment preset="sunset" />
          <ambientLight intensity={0.8} />
          {/* <gridHelper args={[500, 30, 30]} /> */}
          {/* <axesHelper args={[50]} /> */}
          <Physics>
            <Suspense fallback={<></>}>
              <Car />
              <Track />
            </Suspense>
          </Physics>
          <OrbitControls />
        </Canvas>
      </main>
    </>
  );
}

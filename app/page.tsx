"use client";
import * as THREE from "three";
import { RefObject, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  OrbitControls,
  useGLTF,
  useHelper,
} from "@react-three/drei";

export default function Home() {
  return (
    <>
      <main className="w-full h-screen">
        <Canvas
          camera={{ fov: 80, near: 0.1, far: 1000, position: [0, 20, 15] }}
        >
          <Environment preset="sunset" />
          <ambientLight intensity={3.5} />
          <gridHelper args={[500, 30, 30]} />
          <axesHelper args={[5]} />
          <mesh
            rotation={[Math.PI / 2, 0, 0]}
            position={[0, -1, 0]}
            receiveShadow
          >
            <planeGeometry args={[500, 500]} />
            <meshStandardMaterial color={"gray"} side={THREE.DoubleSide} />
          </mesh>
          <Light position={[0, 5, 0]} intensity={0.5} />
          <Car position={[0, 0, 0]} />
          <Track />
          <Cube />
          <OrbitControls />
        </Canvas>
      </main>
    </>
  );
}
function Light(props: React.JSX.IntrinsicElements["directionalLight"]) {
  const lightRef = useRef<THREE.DirectionalLight | null>(null);
  useHelper(
    lightRef as RefObject<THREE.DirectionalLight>,
    THREE.DirectionalLightHelper,
    1,
  );
  return <directionalLight ref={lightRef} {...props} />;
}

function Cube() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
      <boxGeometry />
      <meshStandardMaterial color={"#ffffff"} />
    </mesh>
  );
}

function Track(
  props: Omit<React.JSX.IntrinsicElements["primitive"], "object">,
) {
  const { scene } = useGLTF("/models/monaco.glb");

  return (
    <primitive
      {...props}
      object={scene}
      scale={0.002}
      position={[12, 0.01, 0]}
    />
  );
}

function Car(props: Omit<React.JSX.IntrinsicElements["primitive"], "object">) {
  const { scene } = useGLTF("/models/car.glb");

  const carRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (carRef.current) {
      carRef.current.position.x -= 2 * delta;
      carRef.current.position.z += 1 * delta;
    }
  });

  return (
    <primitive
      {...props}
      ref={carRef}
      object={scene}
      scale={1}
      position={[10, 0, 0]}
      rotation={[0, (3 * Math.PI) / 5, 0]}
    />
  );
}

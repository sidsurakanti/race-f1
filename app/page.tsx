"use client";
import * as THREE from "three";
import { Suspense, useEffect, useRef } from "react";
import { useCarStore, type CarState } from "@/lib/store";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  OrbitControls,
  useGLTF,
  useHelper,
} from "@react-three/drei";
import { Physics, RigidBody } from "@react-three/rapier";

export default function Home() {
  return (
    <>
      <main className="w-full h-screen">
        <Canvas
          camera={{ fov: 80, near: 0.1, far: 1000, position: [0, 20, 15] }}
        >
          <Suspense fallback={<></>}>
            <Physics debug>
              <Environment preset="sunset" />
              <ambientLight intensity={3.5} />
              <gridHelper args={[500, 30, 30]} />
              <axesHelper args={[50]} />
              <RigidBody type="fixed" colliders="cuboid">
                <mesh
                  rotation={[-Math.PI / 2, 0, 0]}
                  position={[0, -1, 0]}
                  // receiveShadow
                >
                  <planeGeometry args={[500, 500]} />
                  <meshStandardMaterial color={"gray"} />
                </mesh>
              </RigidBody>
              <Light position={[0, 5, 0]} intensity={0.5} />
              <Car position={[0, 0, 0]} />
              <Track />
              <Cube />
              <OrbitControls />
            </Physics>
          </Suspense>
        </Canvas>
      </main>
    </>
  );
}
function Light(props: React.JSX.IntrinsicElements["directionalLight"]) {
  const lightRef = useRef<THREE.DirectionalLight | null>(null);
  // useHelper(
  //   lightRef as RefObject<THREE.DirectionalLight>,
  //   THREE.DirectionalLightHelper,
  //   1,
  // );

  return <directionalLight ref={lightRef} {...props} />;
}

function Cube() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
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
    <RigidBody type="fixed" colliders="trimesh">
      <primitive
        {...props}
        object={scene}
        scale={0.005}
        position={[50, 0.1, 0]}
      />
    </RigidBody>
  );
}

function Car(props: Omit<React.JSX.IntrinsicElements["primitive"], "object">) {
  const { scene } = useGLTF("/models/car.glb");

  const carRef = useRef<THREE.Mesh | null>(null);
  const {
    position,
    direction,
    velocity,
    update,
    setPosition,
    setVelocity,
    setDirection,
  } = useCarStore((state) => state);
  const turnStep = Math.PI / 20;

  useEffect(() => {
    window.onkeydown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "w":
          setVelocity(0.1);
          break;
        case "s":
          setVelocity(0);
          break;
        case "d":
          setDirection(-turnStep);
          break;
        case "a":
          setDirection(+turnStep);
          break;
        case "r":
          setPosition({ x: 0, y: 0, z: 0 });
          break;
      }
    };
  }, []);

  useFrame(({ camera }, delta) => {
    if (carRef.current) {
      const carPos = carRef.current.position;
      update(delta);
      carPos.x = position.x;
      carPos.z = position.z;
      // console.log(carRef.current.position);
      // console.log(camera.position);
      camera.lookAt(carPos);
      camera.position.set(carPos.x, carPos.y + 3, carPos.z + 5);
      carRef.current.rotation.y = direction;
    }
  });

  return (
    <primitive
      {...props}
      ref={carRef}
      object={scene}
      scale={1}
      position={[10, 0, 0]}
      rotation={[0, 0, 0]}
    />
  );
}

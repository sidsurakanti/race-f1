"use client";

import * as THREE from "three";
import { Suspense, useEffect, useRef } from "react";
import { useCarStore } from "@/lib/store";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  OrbitControls,
  useGLTF,
  useHelper,
} from "@react-three/drei";
import {
  Physics,
  RapierRigidBody,
  RigidBody,
  CuboidCollider,
} from "@react-three/rapier";

export default function Home() {
  return (
    <>
      <main className="w-full h-screen">
        <Canvas
          camera={{ fov: 80, near: 0.1, far: 1000, position: [0, 20, 15] }}
        >
          <fog attach="fog" args={[0xcfecf7, 45, 200]} />
          <Environment preset="sunset" />
          <ambientLight intensity={3.5} />
          {/* <gridHelper args={[500, 30, 30]} /> */}
          <axesHelper args={[50]} />
          <Suspense fallback={<></>}>
            <Physics debug>
              <RigidBody type="fixed" colliders="cuboid">
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
                  <planeGeometry args={[500, 500]} />
                  <meshStandardMaterial color={"#88e788"} />
                </mesh>
              </RigidBody>
              <Light position={[0, 5, 0]} intensity={0.5} />
              <Car />
              <Track />
              {/* <Cube /> */}
            </Physics>
          </Suspense>
          <OrbitControls />
        </Canvas>
      </main>
    </>
  );
}

function Car(props: Omit<React.JSX.IntrinsicElements["primitive"], "object">) {
  const { scene } = useGLTF("/models/car.glb");
  const bodyRef = useRef<RapierRigidBody>(null);
  const turnStep = Math.PI / 18;
  const { direction, velocity, setVelocity, setDirection } = useCarStore(
    (state) => state,
  );

  useEffect(() => {
    window.onkeydown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "w":
          setVelocity(0.015);
          break;
        case "s":
          setVelocity(-0.015);
          break;
        case "d":
          setDirection(-turnStep);
          break;
        case "a":
          setDirection(+turnStep);
          break;
        case "r":
          if (!bodyRef.current) break;
          bodyRef.current.setTranslation({ x: 5, y: 0, z: 0 }, true);
          bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
          break;
      }
    };
  }, []);

  useFrame(({ camera }, _) => {
    if (!bodyRef.current) return;
    const body = bodyRef.current;

    const quat = new THREE.Quaternion();
    quat.setFromEuler(new THREE.Euler(0, direction, 0));
    body.setRotation(quat, true);

    const curvedVelocity = Math.tanh(velocity * 2.5) * 7.5;
    body.setLinvel(
      new THREE.Vector3(
        -Math.sin(direction) * curvedVelocity,
        0,
        -Math.cos(direction) * curvedVelocity,
      ),
      true,
    );
    setVelocity(-0.001);

    const camOffset = new THREE.Vector3(0, 2.5, 6);
    camOffset.applyQuaternion(quat);

    const pos = body.translation();
    camera.lookAt(pos.x, pos.y, pos.z);
    camera.position.set(
      pos.x + camOffset.x,
      pos.y + camOffset.y,
      pos.z + camOffset.z,
    );
  });

  return (
    <RigidBody
      enabledRotations={[false, true, false]}
      position={[5, 0, 0]}
      restitution={0}
      linearDamping={0.25}
      angularDamping={0.25}
      friction={0}
      type="dynamic"
      colliders={false}
      ref={bodyRef}
    >
      <primitive {...props} object={scene} scale={1} rotation={[0, 0, 0]} />
      <CuboidCollider args={[1.0, 0.5, 1.5]} position={[0, 0.5, 0]} />
    </RigidBody>
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
        scale={0.0065}
        position={[65, 0.1, 0]}
      />
    </RigidBody>
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

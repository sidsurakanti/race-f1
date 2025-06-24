"use client";

import * as THREE from "three";
import { Suspense, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
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
      <main className="relative w-full h-screen">
        <section className="flex flex-col space-y-1 p-2 m-2 z-1 absolute bottom-0 right-0 bg-white/60 backdrop-blur">
          <span className="flex items-center gap-1.5">
            <kbd className="py-0.25 px-2 shadow-md border border-stone-400 rounded-lg bg-stone-200">
              w
            </kbd>{" "}
            forward
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="py-0.25 px-2 shadow-md border border-stone-400 rounded-lg bg-stone-200">
              s
            </kbd>{" "}
            brake
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="py-0.25 px-2 shadow-md border border-stone-400 rounded-lg bg-stone-200">
              d
            </kbd>{" "}
            right
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="py-0.25 px-2 shadow-md border border-stone-400 rounded-lg bg-stone-200">
              a
            </kbd>{" "}
            left
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="py-0.25 px-2 shadow-md border border-stone-400 rounded-lg bg-stone-200">
              ⎵
            </kbd>{" "}
            DRS
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="py-0.25 px-2 shadow-md border border-stone-400 rounded-lg bg-stone-200">
              r
            </kbd>{" "}
            reset
          </span>
        </section>
        <Hud />

        <Canvas
          camera={{ fov: 80, near: 0.1, far: 1000, position: [0, 20, 15] }}
        >
          <fog attach="fog" args={[0xcfecf7, 50, 200]} />
          <Environment preset="sunset" />
          <ambientLight intensity={2.5} />
          {/* <gridHelper args={[500, 30, 30]} /> */}
          {/* <axesHelper args={[50]} /> */}
          <Suspense fallback={<></>}>
            <Physics>
              <Car />
              <Track />
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
  const isMoving = useRef<boolean>(false);
  const isBoosting = useRef<number>(1);
  const turnStep = Math.PI / 18;
  const { direction, velocity, resetVelocity, setVelocity, setDirection } =
    useCarStore((state) => state);

  useEffect(() => {
    window.onkeydown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "w":
          setVelocity(0.075);
          isMoving.current = true;
          break;
        case "s":
          setVelocity(-0.075);
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
          bodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
          resetVelocity();
          break;
        case " ":
          isBoosting.current = 1.75;
          break;
      }
    };

    window.onkeyup = (e: KeyboardEvent) => {
      if (e.key === "w") isMoving.current = false;
      if (e.key === " ") isBoosting.current = 1;
    };
  }, []);

  useFrame(({ camera }, _) => {
    if (!bodyRef.current) return;
    const body = bodyRef.current;

    const quat = new THREE.Quaternion();
    quat.setFromEuler(new THREE.Euler(0, direction, 0));
    body.setRotation(quat, true);

    // const curvedVelocity = Math.tanh(velocity * 2.5) * 10;
    const curvedVelocity = Math.pow(velocity, 2.5) * 12.5 * isBoosting.current;
    body.setLinvel(
      new THREE.Vector3(
        -Math.sin(direction) * curvedVelocity,
        0,
        -Math.cos(direction) * curvedVelocity,
      ),
      true,
    );
    // if (isMoving.current) setVelocity(-0.001);

    const camOffset = new THREE.Vector3(0, 2.5, 6);
    camOffset.applyQuaternion(quat);

    const pos = body.translation();
    camera.lookAt(pos.x, pos.y, pos.z);
    const targetPos = new THREE.Vector3(
      pos.x + camOffset.x,
      pos.y + camOffset.y,
      pos.z + camOffset.z,
    );
    camera.position.lerp(targetPos, 0.08);

    // add downforce lmfao
    const vel = bodyRef.current.linvel();
    const speed = Math.sqrt(vel.x ** 2 + vel.z ** 2);
    body.applyImpulse({ x: 0, y: -speed * 0.2, z: 0 }, true);
  });

  return (
    <RigidBody
      ccd={true}
      position={[5, 0, 0]}
      restitution={0}
      linearDamping={0.4}
      angularDamping={0.25}
      friction={0}
      type="dynamic"
      colliders={false}
      enabledRotations={[false, true, false]}
      ref={bodyRef}
    >
      <primitive {...props} object={scene} scale={1} />
      <CuboidCollider args={[1.0, 0.5, 1.5]} position={[0, 0.5, 0]} />
    </RigidBody>
  );
}

function Hud() {
  const { velocity } = useCarStore((state) => state);
  const bars = 10;
  const active = Math.round(velocity * bars);
  return (
    <div className="absolute top-0 w-full flex justify-center auto z-1">
      <span className="gap-1 p-2 m-2 flex bg-black/20 text-white text-2xl ">
        {Array.from({ length: bars }).map((_, i) => (
          <div
            key={i}
            className={cn("w-6 h-6 shadow-sm", i < active ? "" : "bg-black/60")}
            style={{
              backgroundColor:
                i < active ? `hsl(${i * 12}, 100%, 50%)` : undefined,
            }}
          />
        ))}
      </span>
    </div>
  );
}

function Track(
  props: Omit<React.JSX.IntrinsicElements["primitive"], "object">,
) {
  const { scene } = useGLTF("/models/monaco.glb");

  return (
    <RigidBody friction={0} restitution={0} type="fixed" colliders="trimesh">
      <primitive
        {...props}
        object={scene}
        scale={0.0085}
        position={[85, 0.1, 0]}
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

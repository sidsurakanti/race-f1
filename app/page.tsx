"use client";

import * as THREE from "three";
import { MathUtils } from "three";
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
            <Physics gravity={[0, -30, 0]}>
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
  const { scene } = useGLTF("/models/f1.glb");
  const bodyRef = useRef<RapierRigidBody>(null);
  const isMoving = useRef<boolean>(false);
  const isBoosting = useRef<number>(0);
  const turnStep = Math.PI / 18;
  const lookTarget = useRef(new THREE.Vector3());
  const {
    direction,
    velocity,
    resetDirection,
    resetVelocity,
    setVelocity,
    setDirection,
  } = useCarStore((state) => state);
  const INITIAL_DIRECTION = -6 * turnStep;
  const INITIAL_POSITION: [x: number, y: number, z: number] = [15, 0, 0];
  const initialLoad = useRef<boolean>(false);

  useEffect(() => {
    if (bodyRef.current && !initialLoad.current) {
      const quat = new THREE.Quaternion();
      setDirection(INITIAL_DIRECTION);
      quat.setFromEuler(new THREE.Euler(0, direction, 0));
      bodyRef.current.setRotation(quat, true);
      initialLoad.current = true;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "w":
          setVelocity(0.1);
          isMoving.current = true;
          break;
        case "s":
          setVelocity(-0.1);
          break;
        case "d":
          setDirection(-turnStep);
          break;
        case "a":
          setDirection(+turnStep);
          break;
        case "r":
          if (!bodyRef.current) break;
          const body = bodyRef.current;
          body.setTranslation(
            {
              x: INITIAL_POSITION[0],
              y: INITIAL_POSITION[1],
              z: INITIAL_POSITION[2],
            },
            true,
          );
          body.setLinvel({ x: 0, y: 0, z: 0 }, true);
          body.setAngvel({ x: 0, y: 0, z: 0 }, true);
          resetVelocity();

          resetDirection();
          setDirection(INITIAL_DIRECTION);
          const quat = new THREE.Quaternion();
          quat.setFromEuler(new THREE.Euler(0, direction, 0));
          body.setRotation(quat, true);

          break;
        case " ":
          isBoosting.current = 20;
          break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "w") isMoving.current = false;
      if (e.key === " ") isBoosting.current = 0;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useFrame(({ camera }, _) => {
    if (!bodyRef.current) return;
    const body = bodyRef.current;

    const quat = new THREE.Quaternion();
    quat.setFromEuler(new THREE.Euler(0, direction, 0));
    body.setRotation(quat, true);

    // const curvedVelocity =
    //   Math.tanh(velocity * 2.5) * 16.5 + isBoosting.current;
    const curvedVelocity = Math.pow(velocity, 3) * 50 + isBoosting.current;
    body.setLinvel(
      new THREE.Vector3(
        -Math.sin(direction) * curvedVelocity,
        0,
        -Math.cos(direction) * curvedVelocity,
      ),
      true,
    );
    // if (isMoving.current) setVelocity(-0.1);

    // add downforce lmfao
    const downforce = -Math.pow(curvedVelocity, 1.2) * 0.5;
    body.applyImpulse({ x: 0, y: downforce, z: 0 }, true);

    const camOffset = new THREE.Vector3(0, 10, 20);
    camOffset.applyQuaternion(quat);

    const pos = body.translation();
    const targetPos = new THREE.Vector3(
      pos.x + camOffset.x,
      pos.y + camOffset.y,
      pos.z + camOffset.z,
    );
    camera.position.lerp(targetPos, 0.05);

    const target = lookTarget.current;
    target.x = MathUtils.lerp(target.x, pos.x, 0.05);
    target.y = MathUtils.lerp(target.y, pos.y, 0.05);
    target.z = MathUtils.lerp(target.z, pos.z, 0.05);
    camera.lookAt(target.x, target.y, target.z);
  });

  return (
    <RigidBody
      ccd={true}
      position={INITIAL_POSITION}
      restitution={0}
      linearDamping={0.9}
      angularDamping={0.5}
      friction={0}
      type="dynamic"
      colliders={false}
      enabledRotations={[false, true, false]}
      ref={bodyRef}
    >
      <primitive
        {...props}
        object={scene}
        scale={2.25}
        rotation={[0, 5 * Math.PI, 0]}
      />
      <CuboidCollider args={[1.5, 0.2, 5]} position={[0, 0.5, 0]} />
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
  // scale={6}
  // position={[-360, -10, 0]}
  // rotation={[Math.PI, Math.PI, 0]}
  // const { scene } = useGLTF("/models/track2.glb");

  return (
    <RigidBody friction={0} restitution={0} type="fixed" colliders="trimesh">
      <primitive
        {...props}
        object={scene}
        scale={0.025}
        position={[250, 0.1, 0]}
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

"use client";

import * as THREE from "three";
import { MathUtils } from "three";
import { Suspense, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useCarStore } from "@/lib/store";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls, useGLTF } from "@react-three/drei";
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
        <Hud />
        <Help />

        <Canvas
          camera={{ fov: 85, near: 0.1, far: 1000, position: [10, 20, 15] }}
        >
          <fog attach="fog" args={[0xcfecf7, 100, 400]} />
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

function Car(props: Omit<React.JSX.IntrinsicElements["primitive"], "object">) {
  const { scene } = useGLTF("/models/f1.glb");
  const {
    direction,
    velocity,
    boost,
    setBoost,
    resetDirection,
    resetVelocity,
    setVelocity,
    setDirection,
  } = useCarStore((state) => state);

  const bodyRef = useRef<RapierRigidBody>(null);
  const isMoving = useRef<boolean>(false);
  const isBoosting = useRef<number>(0);
  const initialLoad = useRef<boolean>(false);
  const lookTarget = useRef(new THREE.Vector3());

  const TURN_STEP = Math.PI / 16;
  const INITIAL_DIRECTION = -0 * TURN_STEP;
  const INITIAL_POSITION: [x: number, y: number, z: number] = [15, 0, 0];

  useEffect(() => {
    if (bodyRef.current && !initialLoad.current) {
      initialLoad.current = true;
      setDirection(INITIAL_DIRECTION);

      const quat = new THREE.Quaternion();
      quat.setFromEuler(new THREE.Euler(0, direction, 0));
      bodyRef.current.setRotation(quat, true);
    }

    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "w":
          setVelocity(0.065);
          isMoving.current = true;
          break;
        case "s":
          isMoving.current = false;
          break;
        case "d":
          setDirection(-TURN_STEP);
          break;
        case "a":
          setDirection(+TURN_STEP);
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
          if (isMoving.current) setVelocity(0.065);
          setBoost(true);
          break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "w") isMoving.current = false;
      if (e.key === " ") setBoost(false);
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

    const currRot = body.rotation(); // returns {x, y, z, w}
    const currQuat = new THREE.Quaternion(
      currRot.x,
      currRot.y,
      currRot.z,
      currRot.w,
    );

    const targetQuat = new THREE.Quaternion();
    targetQuat.setFromEuler(new THREE.Euler(0, direction, 0));

    const smoothedQuat = currQuat.clone(); // clone so we don’t mutate the original
    smoothedQuat.slerp(targetQuat, 0.4);

    body.setRotation(
      {
        x: smoothedQuat.x,
        y: smoothedQuat.y,
        z: smoothedQuat.z,
        w: smoothedQuat.w,
      },
      true,
    );

    const TOP_SPEED = 80;
    const MID_POINT_T = 1;
    const ACCEL_SPEED = 1.5;
    const curvedVelocity =
      (TOP_SPEED * Math.pow(velocity, ACCEL_SPEED)) /
        (Math.pow(velocity, ACCEL_SPEED) + Math.pow(MID_POINT_T, ACCEL_SPEED)) +
      boost;
    // const curvedVelocity = Math.tanh(velocity * 2.5) * 70 + isBoosting.current;
    // const curvedVelocity = Math.pow(velocity, 3) * 50 + isBoosting.current;
    body.setLinvel(
      new THREE.Vector3(
        -Math.sin(direction) * curvedVelocity,
        0,
        -Math.cos(direction) * curvedVelocity,
      ),
      true,
    );

    // add downforce lmfao
    // this was for my other track with different elevations but keeping it here for trolls
    const downforce = -Math.pow(curvedVelocity, 1.2) * 0.5;
    body.applyImpulse({ x: 0, y: downforce, z: 0 }, true);

    const camOffset = new THREE.Vector3(0, 10, 17);
    camOffset.applyQuaternion(targetQuat);

    const pos = body.translation();
    const targetPos = new THREE.Vector3(
      pos.x + camOffset.x,
      pos.y + camOffset.y,
      pos.z + camOffset.z,
    );
    camera.position.lerp(targetPos, 0.2);

    const target = lookTarget.current;
    target.x = MathUtils.lerp(target.x, pos.x, 0.2);
    target.y = MathUtils.lerp(target.y, pos.y, 0.2);
    target.z = MathUtils.lerp(target.z, pos.z, 0.2);
    camera.lookAt(target.x, target.y, target.z);
  });

  return (
    <RigidBody
      ccd={true}
      position={INITIAL_POSITION}
      restitution={0}
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
  const { velocity, boost } = useCarStore((state) => state);
  const bars = 10;
  const TOP_SPEED = 200;
  const MID_POINT_T = 1;
  const ACCEL_SPEED = 1.5;
  const curvedVelocity =
    (TOP_SPEED * Math.pow(velocity, ACCEL_SPEED)) /
      (Math.pow(velocity, ACCEL_SPEED) + Math.pow(MID_POINT_T, ACCEL_SPEED)) +
    boost;
  const active = Math.round(velocity * 0.5 * bars);
  return (
    <div className="absolute top-0 w-full flex justify-center items-center gap-5 z-1">
      <p className="tracking-tighter text-2xl font-bold">
        {Math.floor(curvedVelocity)} m/ph{" "}
      </p>
      <span className="gap-1 p-2 m-2 flex bg-black/20 text-white text-2xl shadow">
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
      <p
        className={cn(boost > 0 ? "text-emerald-700 font-bold" : "", "text-xl")}
      >
        DRS{" "}
      </p>
    </div>
  );
}

function Track(
  props: Omit<React.JSX.IntrinsicElements["primitive"], "object">,
) {
  const { scene } = useGLTF("/models/track.glb");

  return (
    <RigidBody friction={0} restitution={0} type="fixed" colliders={false}>
      <primitive {...props} object={scene} scale={5.75} />
      <CuboidCollider args={[800, 0.1, 800]} position={[0, -0.075, 0]} />
    </RigidBody>
  );
}

function Help() {
  return (
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
  );
}

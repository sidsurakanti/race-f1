"use client";

import * as THREE from "three";
import { MathUtils } from "three";
import { Suspense, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useGameState, useCarState } from "@/lib/store";
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
          camera={{ fov: 85, near: 0.1, far: 800, position: [10, 40, 15] }}
        >
          <fog attach="fog" args={[0xfbc8c0, 50, 400]} />
          <Environment preset="sunset" />
          <ambientLight intensity={0.8} />
          {/* <gridHelper args={[500, 30, 30]} /> */}
          {/* <axesHelper args={[50]} /> */}
          <Physics debug>
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
    time,
    boost,
    isBreaking,
    velocity,
    setVelocity,
    setIsBreaking,
    setBoost,
    resetDirection,
    resetVelocity,
    resetTime,
    incrementTime,
    setDirection,
  } = useCarState((state) => state);
  const { camMode, setCamMode } = useGameState((state) => state);
  const keysPressed = useRef<Set<string>>(new Set());

  const bodyRef = useRef<RapierRigidBody>(null);
  const isMoving = useRef<boolean>(false);
  const reverse = useRef<boolean>(false);
  const initialLoad = useRef<boolean>(false);
  const lookTarget = useRef(new THREE.Vector3());

  const TURN_STEP = Math.PI * (5 / 6);
  const INITIAL_DIRECTION = -Math.PI;
  const INITIAL_POSITION: [x: number, y: number, z: number] = [-165, 0, 3];

  useEffect(() => {
    if (bodyRef.current && !initialLoad.current) {
      initialLoad.current = true;
      setDirection(INITIAL_DIRECTION);

      const quat = new THREE.Quaternion();
      quat.setFromEuler(new THREE.Euler(0, direction, 0));
      bodyRef.current.setRotation(quat, true);
    }

    const handleKeyDown = ({ key }: KeyboardEvent) => {
      keysPressed.current.add(key.toLowerCase());
    };

    const handleKeyUp = ({ key }: KeyboardEvent) => {
      if (key === "w" || key === "s") resetTime();
      keysPressed.current.delete(key.toLowerCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useFrame(({ camera }, delta) => {
    if (!bodyRef.current) return;
    const body = bodyRef.current;
    const keys = keysPressed.current;

    if (keys.has("r")) {
      keys.delete("r");

      if (bodyRef.current) {
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

        resetTime();
        resetVelocity();
        resetDirection();

        setDirection(INITIAL_DIRECTION);
        const quat = new THREE.Quaternion();
        quat.setFromEuler(new THREE.Euler(0, direction, 0));
        body.setRotation(quat, true);
      }
    }
    const forward = keys.has("w");
    const back = keys.has("s");
    const brake = keys.has(" ");
    const left = keys.has("a");
    const right = keys.has("d");
    const drs = keys.has("shift");
    const [cam1, cam2] = [keys.has("1"), keys.has("2")];
    if (cam1) setCamMode(0);
    if (cam2) setCamMode(1);

    if (forward) {
      reverse.current = false;
      isMoving.current = true;
      incrementTime(delta);
    } else if (back) {
      reverse.current = true;
      isMoving.current = true;
      incrementTime(delta);
    } else {
      isMoving.current = false;
    }

    setIsBreaking(brake);
    setBoost(drs);
    if (left) setDirection(+TURN_STEP * delta);
    if (right) setDirection(-TURN_STEP * delta);

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

    const accelZone = (timeElapsed: number) => {
      if (timeElapsed == 0) return 0;
      const t = Math.abs(timeElapsed);
      const accel =
        t < 0.2 ? 7 + 5 * (t - 1.0) : t < 2.5 ? 1 + 6 * (t - 0.1) : t * 3;
      return accel;
    };

    const TOP_SPEED = 85;

    const isBackwards = reverse.current ? -1 : 1;
    if (isBreaking) {
      const directionSign = velocity >= 0 ? 1 : -1;
      const speedMag = Math.abs(velocity);
      const decay = speedMag < 5 ? 0.05 : speedMag * 0.009;

      setVelocity(-decay * directionSign);
    } else if (forward || back) {
      setVelocity(accelZone(time) * delta * isBackwards);
    } else setVelocity(-velocity * (1 - 0.9996));

    const speed = Math.min(TOP_SPEED, velocity + boost);
    body.setLinvel(
      new THREE.Vector3(
        -Math.sin(direction) * speed,
        0,
        -Math.cos(direction) * speed,
      ),
      true,
    );

    // add downforce lmfao
    // this was for my other track with different elevations but keeping it here for trolls
    const downforce = -Math.pow(Math.abs(velocity), 1.2) * 0.5;
    body.applyImpulse({ x: 0, y: downforce, z: 0 }, true);

    const camOffset = new THREE.Vector3(0, 8, 17);
    camOffset.applyQuaternion(targetQuat);

    const pos = body.translation();
    const targetPos = new THREE.Vector3(
      pos.x + camOffset.x,
      pos.y + camOffset.y,
      pos.z + camOffset.z,
    );
    if (camMode == 0) camera.position.lerp(targetPos, 0.2);

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
  const { velocity, time, isBreaking, boost } = useCarState((state) => state);
  const { camMode } = useGameState((s) => s);
  const bars = 10;
  const active = Math.round(time * 6);
  const speed = Math.abs(Math.floor(Math.min(velocity, 85) * 3.27) + boost);

  return (
    <div className="absolute top-0 w-full flex justify-center items-center gap-5 z-1">
      <p className="tracking-tighter text-2xl font-medium text-neutral-900">
        {speed < 2 ? 0 : speed} mph{" "}
      </p>
      <span
        className={cn(
          isBreaking ? "bg-red-600" : "bg-black/20",
          "gap-1 p-2 m-2 flex text-white text-2xl shadow",
        )}
      >
        {Array.from({ length: bars }).map((_, i) => (
          <div
            key={i}
            className={cn("w-6 h-6 shadow-sm", i < active ? "" : "bg-black/60")}
            style={{
              backgroundColor:
                i < active && velocity >= 0
                  ? `hsl(${i * 12}, 100%, 50%)`
                  : undefined,
            }}
          />
        ))}
      </span>
      <p
        className={cn(boost > 0 ? "text-emerald-700 font-bold" : "", "text-xl")}
      >
        DRS{" "}
      </p>
      <span className={"text-xl text-red-500 flex items-center gap-1.5"}>
        <p className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        Cam {camMode + 1}
      </span>
    </div>
  );
}

function Track(
  props: Omit<React.JSX.IntrinsicElements["primitive"], "object">,
) {
  // const { scene } = useGLTF("/models/track.glb");
  //
  // return (
  //   <RigidBody friction={0} restitution={0} type="fixed" colliders={false}>
  //     <primitive {...props} object={scene} scale={5.75} />
  //     <CuboidCollider args={[800, 0.1, 800]} position={[0, -0.075, 0]} />
  //   </RigidBody>
  // );
  const { scene } = useGLTF("/models/track2.glb");

  return (
    <RigidBody friction={0} restitution={0} type="fixed" colliders={false}>
      <primitive {...props} object={scene} scale={3.25} />
      <CuboidCollider args={[1800, 0.1, 1800]} position={[0, -0.075, 0]} />
    </RigidBody>
  );
}

function Help() {
  return (
    <section className="flex flex-col space-y-1 p-2 m-2 z-1 absolute bottom-0 right-0 bg-white/60 backdrop-blur">
      <span className="flex items-center gap-1.5">
        <kbd className="py-0.25 px-2 shadow-md border border-stone-400 rounded-lg bg-stone-200">
          W
        </kbd>{" "}
        forward
      </span>
      <span className="flex items-center gap-1.5">
        <kbd className="py-0.25 px-2 shadow-md border border-stone-400 rounded-lg bg-stone-200">
          S
        </kbd>{" "}
        back
      </span>
      <span className="flex items-center gap-1.5">
        <kbd className="py-0.25 px-2 shadow-md border border-stone-400 rounded-lg bg-stone-200">
          D
        </kbd>{" "}
        right
      </span>
      <span className="flex items-center gap-1.5">
        <kbd className="py-0.25 px-2 shadow-md border border-stone-400 rounded-lg bg-stone-200">
          A
        </kbd>{" "}
        left
      </span>
      <span className="flex items-center gap-1.5">
        <kbd className="py-0.25 px-2 shadow-md border border-stone-400 rounded-lg bg-stone-200">
          ⎵
        </kbd>{" "}
        brake
      </span>
      <span className="flex items-center gap-1.5">
        <kbd className="py-0.25 text-sm px-2 shadow-md border border-stone-400 rounded-lg bg-stone-200">
          LSHIFT
        </kbd>{" "}
        DRS
      </span>
      <span className="flex items-center gap-1.5">
        <kbd className="py-0.25 px-2 shadow-md border border-stone-400 rounded-lg bg-stone-200">
          1
        </kbd>{" "}
        cam 1
      </span>
      <span className="flex items-center gap-1.5">
        <kbd className="py-0.25 px-2 shadow-md border border-stone-400 rounded-lg bg-stone-200">
          2
        </kbd>{" "}
        cam 2
      </span>
      <span className="flex items-center gap-1.5">
        <kbd className="py-0.25 px-2 shadow-md border border-stone-400 rounded-lg bg-stone-200">
          R
        </kbd>{" "}
        reset
      </span>
    </section>
  );
}

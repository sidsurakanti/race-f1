"use client";

import * as THREE from "three";
import { MathUtils } from "three";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useGameState, useCarState } from "@/lib/store";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import {
  Physics,
  RapierRigidBody,
  RigidBody,
  CuboidCollider,
} from "@react-three/rapier";

export function Car(
  props: Omit<React.JSX.IntrinsicElements["primitive"], "object">,
) {
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
    smoothedQuat.slerp(targetQuat, 0.1);

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
      // prettier-ignore
      const accel =
        t < 1.5 ?
          7 + 8 * (t - 0.1) : 
        t < 3.5 ? 
          1 + 6 * (t - 0.1) : 
        t * 3;
      return accel;
    };

    const TOP_SPEED = 85;

    const isBackwards = reverse.current ? -1 : 1;
    if (isBreaking) {
      const directionSign = velocity >= 0 ? 1 : -1;
      const speedMag = Math.abs(velocity);
      const decay = speedMag < 7 ? 0.05 : speedMag * 0.002;

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

    const camOffset = new THREE.Vector3(0, 8, 20);
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
    if (camMode == 0) camera.lookAt(target.x, target.y, target.z);
  });

  return (
    <RigidBody
      ccd={true}
      position={INITIAL_POSITION}
      restitution={0}
      friction={0.5}
      type="dynamic"
      colliders={false}
      ref={bodyRef}
    >
      <primitive
        {...props}
        object={scene}
        scale={2.2}
        rotation={[0, 5 * Math.PI, 0]}
      />
      <CuboidCollider args={[1.5, 0.5, 5]} position={[0, 0.5, 0]} />
    </RigidBody>
  );
}

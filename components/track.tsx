import { useGLTF } from "@react-three/drei";
import {
  Physics,
  RapierRigidBody,
  RigidBody,
  CuboidCollider,
} from "@react-three/rapier";

export function Track(
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

      <CuboidCollider
        restitution={0}
        args={[500, 10, 5]}
        position={[0, 0.5, 20]}
      />
      <CuboidCollider
        restitution={0}
        args={[370, 10, 5]}
        position={[0, 0.5, -40]}
      />
      <CuboidCollider
        restitution={0}
        args={[150, 10, 5]}
        rotation={[0, Math.PI / 4.3, 0]}
        position={[400, 0.5, 20]}
      />
      <CuboidCollider
        args={[250, 10, 5]}
        rotation={[0, Math.PI / 1.95, 0]}
        position={[500, 0.5, -250]}
      />
      <CuboidCollider
        args={[350, 10, 5]}
        rotation={[0, -Math.PI / 4.5, 0]}
        position={[550, 0.5, -450]}
      />
      <CuboidCollider
        args={[500, 10, 5]}
        rotation={[0, -Math.PI / -1.025, 0]}
        position={[100, 0.5, -625]}
      />
      <CuboidCollider
        args={[100, 10, 5]}
        rotation={[0, -Math.PI / 1.3, 0]}
        position={[250, 0.5, -595]}
      />
      <CuboidCollider
        args={[100, 10, 5]}
        rotation={[0, -Math.PI / 2.7, 0]}
        position={[200, 0.5, -525]}
      />
      <CuboidCollider
        rotation={[0, -Math.PI / -2.025, 0]}
        args={[400, 10, 5]}
        position={[-470, 0.5, -400]}
      />
      <CuboidCollider
        args={[410, 10, 5]}
        rotation={[0, -Math.PI / 1.004, 0]}
        position={[5, 0.5, -105]}
      />
      <CuboidCollider
        args={[300, 10, 5]}
        rotation={[0, -Math.PI / 1.004, 0]}
        position={[-225, 0.5, -158]}
      />
      <CuboidCollider
        args={[300, 10, 5]}
        rotation={[0, -Math.PI / 1.004, 0]}
        position={[-225, 0.5, -200]}
      />
      <CuboidCollider
        args={[130, 10, 5]}
        rotation={[0, -Math.PI / 1.22, 0]}
        position={[-375, 0.5, -590]}
      />
      <CuboidCollider
        args={[105, 10, 5]}
        rotation={[0, Math.PI / 1.22, 0]}
        position={[-375, 0.5, -220]}
      />
      <CuboidCollider
        args={[105, 10, 5]}
        rotation={[0, Math.PI / 1.2, 0]}
        position={[-80, 0.5, -220]}
      />
      <CuboidCollider
        args={[80, 10, 5]}
        rotation={[0, Math.PI / 1.79, 0]}
        position={[-135, 0.5, -290]}
      />
      {/* water stuff */}
      <CuboidCollider
        args={[80, 10, 5]}
        rotation={[0, -Math.PI / 1.9, 0]}
        position={[-180, 0.5, -290]}
      />
      <CuboidCollider
        args={[50, 10, 5]}
        rotation={[0, Math.PI / 1.05, 0]}
        position={[-240, 0.5, -420]}
      />
      <CuboidCollider
        args={[50, 10, 5]}
        rotation={[0, Math.PI / 1.08, 0]}
        position={[-240, 0.5, -385]}
      />
      <CuboidCollider
        args={[50, 10, 5]}
        rotation={[0, Math.PI / 1.25, 0]}
        position={[-190, 0.5, -400]}
      />
    </RigidBody>
  );
}

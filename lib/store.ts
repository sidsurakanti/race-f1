import { create } from "zustand";

export type CarState = {
  velocity: number;
  direction: number;
  position: { x: number; y: number; z: number };
  setVelocity: (n: number) => void;
  setDirection: (n: number) => void;
  setPosition: ({ x, y, z }: { x: number; y: number; z: number }) => void;
  update: (delta: number) => void;
};

export const useCarStore = create<CarState>()((set) => ({
  velocity: 0,
  direction: 0,
  position: {
    x: 0,
    y: 0,
    z: 0,
  },
  setVelocity: (n) => set({ velocity: n }),
  setDirection: (n) => set({ direction: n }),
  setPosition: ({ x, y, z }) => set({ position: { x: x, y: y, z: z } }),
  update: (delta) =>
    set((state) => ({
      position: {
        x:
          state.position.x + Math.sin(state.direction) * delta * state.velocity,
        y: state.position.y,
        z:
          state.position.z + Math.cos(state.direction) * delta * state.velocity,
      },
    })),
}));

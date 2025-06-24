import { create } from "zustand";

export type CarState = {
  velocity: number;
  direction: number;
  setVelocity: (n: number) => void;
  setDirection: (n: number) => void;
};

export const useCarStore = create<CarState>()((set) => ({
  velocity: 0,
  direction: 0,
  setVelocity: (n) =>
    set((state) => ({
      velocity:
        n >= 0
          ? Math.min(state.velocity + n, 1)
          : Math.max(state.velocity + n, 0),
    })),
  setDirection: (n) =>
    set((state) => ({
      direction: state.direction + n * 0.5,
    })),
}));

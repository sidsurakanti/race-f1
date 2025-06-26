import { create } from "zustand";

export type CarState = {
  velocity: number;
  direction: number;
  boost: number;
  setBoost: (n: boolean) => void;
  resetVelocity: () => void;
  resetDirection: () => void;
  setVelocity: (n: number) => void;
  setDirection: (n: number) => void;
};

export const useCarStore = create<CarState>()((set) => ({
  velocity: 0,
  direction: 0,
  boost: 0,
  setBoost: (tf) => set({ boost: tf ? 20 : 0 }),
  resetVelocity: () => set({ velocity: 0 }),
  resetDirection: () => set({ direction: 0 }),
  setVelocity: (n) =>
    set((state) => ({
      velocity:
        n >= 0
          ? Math.min(state.velocity + n, 5)
          : Math.max(state.velocity + n, 0),
    })),
  setDirection: (n) =>
    set((state) => ({
      direction: state.direction + n * 0.5,
    })),
}));

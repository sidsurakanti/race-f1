import { velocity } from "three/tsl";
import { create } from "zustand";

type GameState = {
  camMode: 0 | 1;
  setCamMode: (mode: 0 | 1) => void;
};
export const useGameState = create<GameState>()((set) => ({
  camMode: 0,
  setCamMode: (mode) => set({ camMode: mode }),
}));

export type CarState = {
  time: number;
  velocity: number;
  direction: number;
  boost: number;
  isBreaking: boolean;
  // yes this name is on purpose
  setIsBreaking: (tf: boolean) => void;
  setBoost: (tf: boolean) => void;
  resetTime: () => void;
  incrementTime: (n: number) => void;
  setVelocity: (n: number) => void;
  resetDirection: () => void;
  resetVelocity: () => void;
  setDirection: (n: number) => void;
};

export const useCarState = create<CarState>()((set) => ({
  time: 0,
  direction: 0,
  boost: 0,
  isBreaking: false,
  velocity: 0,
  setVelocity: (n) =>
    set((state) => ({
      velocity: Math.min(85, Math.max(state.velocity + n)),
    })),
  setIsBreaking: (tf) => set({ isBreaking: tf }),
  setBoost: (tf) => set({ boost: tf ? 20 : 0 }),
  resetTime: () => set({ time: 0 }),
  resetVelocity: () => set({ velocity: 0 }),
  incrementTime: (n) =>
    set((state) => ({
      time: Math.max(state.time + n),
    })),

  resetDirection: () => set({ direction: 0 }),
  setDirection: (n) =>
    set((state) => ({
      direction: state.direction + n * 0.5,
    })),
}));

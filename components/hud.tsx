import { cn } from "@/lib/utils";
import { useGameState, useCarState } from "@/lib/store";

export function Hud() {
  const { velocity, time, isBreaking, boost } = useCarState((state) => state);
  const { camMode } = useGameState((s) => s);
  const bars = 10;
  const active = Math.round(time * 6);
  const speed = Math.abs(Math.floor(Math.min(velocity, 85) * 2.79) + boost);

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

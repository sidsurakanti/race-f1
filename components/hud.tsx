"use client";

import { cn } from "@/lib/utils";
import { useGameState, useCarState } from "@/lib/store";
import { useEffect, useState } from "react";

export function Hud() {
  const { velocity, time, isBreaking, boost } = useCarState((state) => state);
  const { raceFinished, raceStarted, camMode } = useGameState((s) => s);
  const bars = 10;
  const active = Math.round(time * 6);
  const speed = Math.abs(Math.floor(Math.min(velocity, 85) * 2.79) + boost);
  const [lapTimer, setLapTimer] = useState<number>(0);
  const [lapTimes, setLapTimes] = useState<number[]>([]);
  const [startBanner, setStartBanner] = useState<boolean>(false);

  useEffect(() => {
    const stored = localStorage.getItem("lapTimes");
    if (stored && stored !== "undefined") setLapTimes(JSON.parse(stored));
  }, []);

  useEffect(() => {
    let startTime = Date.now();
    let interval: NodeJS.Timeout;
    let timeout: NodeJS.Timeout;

    // on reset
    if (!raceStarted && !raceFinished) setLapTimer(0);

    // race start -> start timer & display banner
    if (raceStarted) {
      interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setLapTimer(elapsed);
      }, 1);

      setStartBanner(true);
      timeout = setTimeout(() => setStartBanner(false), 1000);
    }

    // race finish -> append lap time to lap times & update local storage
    if (raceFinished) {
      setLapTimes((prev) => [...prev, lapTimer]);
    }

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [raceStarted, raceFinished]);

  useEffect(
    () => localStorage.setItem("lapTimes", JSON.stringify(lapTimes)),
    [lapTimes],
  );

  function formatTime(ms: number) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;

    const paddedMinutes = String(minutes).padStart(2, "0");
    const paddedSeconds = String(seconds).padStart(2, "0");
    const paddedMilliseconds = String(milliseconds).padStart(3, "0");

    return `${paddedMinutes}:${paddedSeconds}:${paddedMilliseconds}`;
  }

  return (
    <>
      {startBanner && (
        <p className="absolute z-2 top-[20%] w-full flex justify-center text-5xl font-bold text-white">
          GO!
        </p>
      )}
      <div className="absolute m-2 p-2 bg-white/50 backdrop-blur flex flex-col right-0">
        {lapTimes.map((e, idx) => (
          <p key={idx} className="text-sm tracking-tighter">
            Lap {idx + 1}, {formatTime(e)}
          </p>
        ))}
      </div>
      <div className="absolute top-0 w-full flex justify-center items-center gap-5 z-1">
        <p className="tracking-tighter text-2xl font-medium text-neutral-900">
          {speed < 2 ? 0 : speed} mph{" "}
        </p>
        <p
          className={cn(
            boost > 0 ? "text-emerald-700 font-bold" : "",
            "text-xl",
          )}
        >
          DRS{" "}
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
              className={cn(
                "w-6 h-6 shadow-sm",
                i < active ? "" : "bg-black/60",
              )}
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
          className={cn(
            raceStarted
              ? "text-purple-400 font-light"
              : raceFinished
                ? "text-violet-600 font-bold"
                : "text-neutral-700 font-light",
            "tracking-tighter text-2xl",
          )}
        >
          {formatTime(lapTimer)}
        </p>
        <span className={"text-xl text-red-500 flex items-center gap-1.5"}>
          <p className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          Cam {camMode + 1}
        </span>
      </div>
    </>
  );
}

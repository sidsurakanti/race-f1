export function Help() {
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

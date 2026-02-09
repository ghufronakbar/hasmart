// use-f2.ts
import { useHotkey } from "./use-hot-key";

type UseF2Options = Parameters<typeof useHotkey>[2];

export function useF2(onTrigger: () => void, options: UseF2Options = {}) {
  useHotkey(
    (e) => {
      const isF2 = e.key === "F2" || e.code === "F2";
      return isF2;
    },
    () => onTrigger(),
    {
      preventDefault: true,
      requireNoExtraModifiers: true, // blok Shift/Alt/Ctrl/Cmd biar "F2" saja
      allowInInputs: true, // boleh saat fokus input
      capture: true,
      ignoreComposing: true,
      ...options,
    },
  );
}

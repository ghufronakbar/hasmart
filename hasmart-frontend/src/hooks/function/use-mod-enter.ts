// use-mod-enter.ts
import { useHotkey } from "./use-hot-key";

type UseModEnterOptions = Parameters<typeof useHotkey>[2];

export function useModEnter(
  onTrigger: () => void,
  options: UseModEnterOptions = {},
) {
  useHotkey(
    (e) => {
      const isEnter =
        e.key === "Enter" || e.code === "Enter" || e.code === "NumpadEnter";
      const isMod = e.metaKey || e.ctrlKey; // ⌘ di Mac, Ctrl di Win/Linux
      return isEnter && isMod;
    },
    () => onTrigger(),
    {
      // default yang aman untuk UX shortcut “Add”
      preventDefault: true,
      requireNoExtraModifiers: true, // blok Shift/Alt biar gak bentrok
      allowInInputs: true, // biasanya user ngetik lalu Mod+Enter
      capture: true,
      ignoreComposing: true,
      ...options,
    },
  );
}

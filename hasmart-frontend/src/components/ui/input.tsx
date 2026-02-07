import * as React from "react"
import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  onKeyDown,
  onWheel,
  inputMode,
  pattern,
  ...props
}: React.ComponentProps<"input">) {
  const isNumber = type === "number"

  return (
    <input
      type={type}
      data-slot="input"
      // hint untuk mobile keyboard (angka)
      inputMode={isNumber ? "numeric" : inputMode}
      // opsional: kalau mau lebih ketat, pakai pattern digits
      pattern={isNumber ? "[0-9]*" : pattern}
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",

        // hide spinner (Chrome/Safari/Edge)
        isNumber && "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",

        className
      )}
      onKeyDown={(e) => {
        if (isNumber) {
          // blok 'e' / 'E' (scientific notation) + '+' '-' kalau kamu gak mau negatif
          if (["e", "E", "+"].includes(e.key)) {
            e.preventDefault()
          }
        }
        onKeyDown?.(e)
      }}
      onWheel={(e) => {
        if (isNumber) {
          // cegah scroll wheel mengubah nilai
          ; (e.currentTarget).blur()
        }
        onWheel?.(e)
      }}
      {...props}
    />
  )
}

export { Input }

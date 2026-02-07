import * as React from "react"
import { Plus } from "lucide-react"
import { Button } from "../ui/button"
import { useBranch } from "@/providers/branch-provider"

type ActionBranchButtonProps = React.ComponentPropsWithoutRef<typeof Button> & {
}

export const ActionBranchButton = React.forwardRef<
    React.ElementRef<typeof Button>,
    ActionBranchButtonProps
>(({ onClick, children, ...props }, ref) => {
    const { branch, isLoading } = useBranch()

    if (isLoading) return null

    if (!branch) return <Button
        ref={ref}
        disabled
        {...props}
    >
        Pilih Cabang Untuk Menambahkan Data
    </Button>

    return (
        <Button
            ref={ref}
            onClick={(e) => {
                onClick?.(e)
            }}
            {...props}
        >
            <Plus className="mr-2 h-4 w-4" />
            {children}
        </Button>
    )
})

ActionBranchButton.displayName = "ActionBranchButton"

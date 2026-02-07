"use client"

import { Table } from "@tanstack/react-table"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "@/components/ui/data-table/data-table-view-options"

interface DataTableToolbarProps<TData> {
    table: Table<TData>
    filterValue?: string
    onFilterChange?: (value: string) => void
    placeholder?: string
}

export function DataTableToolbar<TData>({
    table,
    filterValue,
    onFilterChange,
    placeholder = "Filter data...",
}: DataTableToolbarProps<TData>) {
    const isFiltered = filterValue && filterValue.length > 0;

    return (
        <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center space-x-2">
                <Input
                    placeholder={placeholder}
                    value={filterValue ?? ""}
                    onChange={(event) =>
                        onFilterChange?.(event.target.value)
                    }
                    className="h-8 w-[150px] lg:w-[250px]"
                />
                {isFiltered && (
                    <Button
                        variant="ghost"
                        onClick={() => onFilterChange?.("")}
                        className="h-8 px-2 lg:px-3"
                    >
                        Reset
                        <X className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>
            <DataTableViewOptions table={table} />
        </div>
    )
}

"use client";

import { useState } from "react";

import {
    ChevronsUpDown,
    Check,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";


export interface ComboboxItem {
    id: number;
    name: string;
    code?: string;
}

export interface ComboboxProps {
    value?: number;
    onChange: (val: number) => void;
    options?: ComboboxItem[];
    placeholder?: string;
    searchPlaceholder?: string;
    renderLabel?: (item: ComboboxItem) => React.ReactNode;
    disabled?: boolean;
    className?: string;
    inputValue?: string;
    onInputChange?: (val: string) => void;
    inputId?: string;
    filterString: string;
}

export const Combobox = ({
    value,
    onChange,
    options,
    placeholder = "Pilih...",
    searchPlaceholder = "Cari...",
    renderLabel,
    disabled = false,
    className,
    inputValue,
    onInputChange,
    inputId,
    filterString,
}: ComboboxProps) => {
    const [open, setOpen] = useState(false);
    const selected = options?.find((item) => item.id === value);
    const label = selected ? (renderLabel ? renderLabel(selected) : selected.name) : placeholder;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    id={inputId}
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between font-normal px-3", className)}
                    disabled={disabled}
                >
                    <span className="truncate">{label}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command shouldFilter={!onInputChange}>
                    <CommandInput
                        placeholder={searchPlaceholder}
                        value={inputValue}
                        onValueChange={onInputChange}
                    />
                    <CommandList>
                        <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                            {options?.filter((item) => item.name.toLowerCase().includes(filterString.toLowerCase()))?.map((item) => (
                                <CommandItem
                                    key={item.id}
                                    value={`${item.code || ''} ${item.name}`}
                                    onSelect={() => {
                                        onChange(item.id);
                                        setOpen(false);
                                    }}
                                >
                                    <Check className={cn("mr-2 h-4 w-4", value === item.id ? "opacity-100" : "opacity-0")} />
                                    {renderLabel ? renderLabel(item) : item.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

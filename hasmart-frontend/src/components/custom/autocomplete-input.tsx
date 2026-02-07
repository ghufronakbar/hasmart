"use client";

import { useState, useRef, useEffect } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverAnchor,
} from "@/components/ui/popover";

export interface AutocompleteItem {
    id: number;
    name: string;
    code?: string;
}

export interface AutocompleteInputProps {
    value: string;
    onChange: (val: string) => void;
    options?: AutocompleteItem[];
    placeholder?: string;
    renderLabel?: (item: AutocompleteItem) => React.ReactNode;
    disabled?: boolean;
    className?: string;
    onSearch?: (val: string) => void;
}

/**
 * AutocompleteInput - Input with dropdown suggestions
 * 
 * - User can type freely
 * - Suggestions appear as user types  
 * - Clicking a suggestion fills the input with item.code (or item.name if no code)
 * - User can also just type and move on without selecting
 */
export const AutocompleteInput = ({
    value,
    onChange,
    options = [],
    placeholder = "Ketik...",
    renderLabel,
    disabled = false,
    className,
    onSearch,
}: AutocompleteInputProps) => {
    const [open, setOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Trigger search callback when value changes
    useEffect(() => {
        onSearch?.(value);
    }, [value, onSearch]);

    const handleSelect = (item: AutocompleteItem) => {
        // Use code if available, otherwise name
        onChange(item.code || item.name);
        setOpen(false);
        // Keep focus on input for quick continuation
        inputRef.current?.focus();
    };

    return (
        <Popover open={open && options.length > 0} onOpenChange={setOpen}>
            <PopoverAnchor asChild>
                <Input
                    ref={inputRef}
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        if (!open && e.target.value) setOpen(true);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && open && options.length > 0) {
                            e.preventDefault();
                            handleSelect(options[0]);
                        }
                    }}
                    onFocus={() => {
                        if (value && options.length > 0) setOpen(true);
                    }}
                    onBlur={() => {
                        // Delay to allow click on suggestion
                        setTimeout(() => setOpen(false), 150);
                    }}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={cn("w-full", className)}
                    autoComplete="off"
                />
            </PopoverAnchor>
            <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <Command shouldFilter={false}>
                    <CommandList>
                        <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                            {options.map((item) => (
                                <CommandItem
                                    key={item.id}
                                    value={`${item.code || ""} ${item.name}`}
                                    onSelect={() => handleSelect(item)}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === item.code || value === item.name
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />
                                    {renderLabel ? renderLabel(item) : (
                                        <div className="flex flex-col">
                                            <span className="font-semibold">{item.code || item.name}</span>
                                            {item.code && <span className="text-xs text-muted-foreground">{item.name}</span>}
                                        </div>
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

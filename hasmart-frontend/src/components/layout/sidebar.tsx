"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";
import { useState, createContext, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { menuItems, MenuItem } from "@/constants/menu-items";
import { useProfile } from "@/hooks/app/use-user";

// Context to share sidebar state if needed, though props could work too
const SidebarContext = createContext<{ isExpanded: boolean }>({ isExpanded: true });

export function Sidebar() {
    const pathname = usePathname();
    const [isExpanded, setIsExpanded] = useState(true);

    const { data: userResponse } = useProfile()
    const user = userResponse?.data

    const toggleSidebar = () => setIsExpanded(!isExpanded);

    const filteredMenuItems: MenuItem[] = useMemo(() => {
        if (!user) return [];;

        const filterRecursive = (items: MenuItem[]): MenuItem[] => {
            return items.reduce((acc, item) => {
                // 1. Check direct access permission if defined
                const hasPermission = !item.access || user[item.access.toString() as keyof typeof user];

                // If user doesn't have direct access, skip immediately
                if (!hasPermission) return acc;

                // 2. Handle Children (Recursive)
                if (item.children) {
                    const filteredChildren = filterRecursive(item.children);

                    // Only include parent if it has visible children
                    if (filteredChildren.length > 0) {
                        acc.push({ ...item, children: filteredChildren });
                    }
                } else {
                    // No children, and hasPermission is true -> Include item
                    acc.push(item);
                }

                return acc;
            }, [] as MenuItem[]);
        };

        return filterRecursive(menuItems);
    }, [user]);

    return (
        <TooltipProvider>
            <div
                className={cn(
                    "flex flex-col border-r bg-gray-100/40 dark:bg-gray-800/40 md:flex transition-all duration-300 ease-in-out h-screen sticky top-0",
                    isExpanded ? "w-64" : "w-[70px]",
                    "hidden" // Keep hidden on mobile by default if that was the intent, but 'hidden md:flex' is standard. 
                    // The issue was 'hidden md:flex' logic might be conflicting in some linters or overlapping.
                    // Actually, 'hidden' and 'flex' together on same breakpoint is invalid, but 'hidden md:flex' means hidden on small, flex on md+.
                    // The linter warning 'flex applies same CSS properties as hidden' usually happens if both are applied unconditionally.
                    // In the original code: "flex flex-col ... hidden md:flex" -> 'flex' and 'hidden' conflict on base breakpoint.
                )}
            >
                <div className={cn("flex h-14 items-center border-b px-4 lg:h-[60px]", isExpanded ? "justify-between" : "justify-center")}>
                    {isExpanded && (
                        <Link href="/" className="flex items-center gap-2 font-semibold truncate">
                            <Image src="/hasmart logo.png" alt="Logo" width={100} height={50} />
                        </Link>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-8 w-8", isExpanded ? "" : "")}
                        onClick={toggleSidebar}
                    >
                        {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">
                    <nav className="grid items-start px-2 text-sm font-medium lg:px-2 gap-1">
                        <SidebarContext.Provider value={{ isExpanded }}>
                            {filteredMenuItems.map((item, index) => (
                                <SidebarItem key={index} item={item} pathname={pathname} isExpanded={isExpanded} />
                            ))}
                        </SidebarContext.Provider>
                    </nav>
                </div>
            </div>
        </TooltipProvider>
    );
}

function SidebarItem({ item, pathname, isExpanded }: { item: MenuItem; pathname: string; isExpanded: boolean }) {
    const [isOpen, setIsOpen] = useState(false);

    // Check if any child is active to open/highlight parent
    const isChildActive = item.children?.some(child => child.href === pathname);

    // Automatically open if expanded and child is active (optional, keeps context)
    // Only works on first render or when isExpanded changes if we want to force open
    // For now keeping manual control + auto highlight

    const isActive = item.href ? pathname === item.href : false;

    if (item.children) {
        // Collapsible only works well when expanded. When collapsed, we might want a Popover or just simple icon behavior.
        // For simplicity: When collapsed, clicking parent toggles expansion or does nothing (or opens a popover).
        // Let's hide children when collapsed for this iteration and just show parent icon.

        if (!isExpanded) {
            return (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            className={cn(
                                "flex w-full items-center justify-center rounded-lg py-2 text-muted-foreground transition-all hover:bg-muted hover:text-primary h-9",
                                isChildActive && "bg-muted text-primary"
                            )}
                        >
                            {item.icon}
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        {item.title}
                    </TooltipContent>
                </Tooltip>
            );
        }

        return (
            <Collapsible open={isOpen || isChildActive} onOpenChange={setIsOpen} className="w-full">
                <CollapsibleTrigger asChild>
                    <button
                        className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                            (isOpen || isChildActive) && "bg-muted text-primary" // Highlight parent if open or child active
                        )}
                    >
                        {item.icon}
                        <span className="flex-1 text-left truncate">{item.title}</span>
                        <ChevronRight
                            className={cn("ml-auto h-4 w-4 transition-transform", (isOpen || isChildActive) && "rotate-90")}
                        />
                    </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="ml-4 mt-1 flex flex-col gap-1 border-l pl-2">
                        {item.children.map((child, index) => (
                            <Link
                                key={index}
                                href={child.href || "#"}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary text-xs",
                                    pathname === child.href && "bg-secondary text-primary font-medium"
                                )}
                            >
                                <span className="truncate">{child.title}</span>
                            </Link>
                        ))}
                    </div>
                </CollapsibleContent>
            </Collapsible>
        );
    }

    // Leaf item
    if (!isExpanded) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <Link
                        href={item.href || "#"}
                        className={cn(
                            "flex items-center justify-center rounded-lg py-2 text-muted-foreground transition-all hover:bg-muted hover:text-primary h-9",
                            isActive && "bg-muted text-primary"
                        )}
                    >
                        {item.icon}
                    </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                    {item.title}
                </TooltipContent>
            </Tooltip>
        );
    }

    return (
        <Link
            href={item.href || "#"}
            className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                isActive && "bg-muted text-primary"
            )}
        >
            {item.icon}
            <span className="truncate">{item.title}</span>
        </Link>
    );
}

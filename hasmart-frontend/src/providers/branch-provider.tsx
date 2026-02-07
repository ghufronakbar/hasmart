"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";
import { Branch } from "@/types/app/branch";

interface BranchContextType {
    branch: Branch | null;
    setBranch: (branch: Branch | null) => void;
    isLoading: boolean;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: ReactNode }) {
    const [branch, setBranchState] = useState<Branch | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedBranch = localStorage.getItem("selectedBranch");
        if (storedBranch) {
            try {
                setBranchState(JSON.parse(storedBranch));
            } catch (e) {
                console.error("Failed to parse selected branch", e);
                localStorage.removeItem("selectedBranch");
            }
        }
        setIsLoading(false);
    }, []);

    const setBranch = (newBranch: Branch | null) => {
        setBranchState(newBranch);
        if (newBranch) {
            localStorage.setItem("selectedBranch", JSON.stringify(newBranch));
        } else {
            localStorage.removeItem("selectedBranch");
        }
    };

    return (
        <BranchContext.Provider value={{ branch, setBranch, isLoading }}>
            {children}
        </BranchContext.Provider>
    );
}

export function useBranch() {
    const context = useContext(BranchContext);
    if (context === undefined) {
        throw new Error("useBranch must be used within a BranchProvider");
    }
    return context;
}

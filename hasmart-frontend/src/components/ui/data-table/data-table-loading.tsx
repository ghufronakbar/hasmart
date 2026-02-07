import { Loader2 } from "lucide-react";
import { TableRow, TableCell } from "@/components/ui/table";

interface DataTableLoadingProps {
    columnsLength: number;
}

export function DataTableLoading({ columnsLength }: DataTableLoadingProps) {
    return (
        <TableRow>
            <TableCell colSpan={columnsLength} className="h-24 text-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin inline" /> Memuat data...
            </TableCell>
        </TableRow>
    );
}

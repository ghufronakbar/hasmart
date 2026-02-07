"use client";

import { useMemo, useState } from "react";
import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    ColumnDef,
    getCoreRowModel,
    useReactTable,
    PaginationState,
    SortingState,
    VisibilityState,
} from "@tanstack/react-table";
import {
    Loader2,
    Plus,
    Pencil,
    Trash2,
    MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Member } from "@/types/master/member";
import {
    useMembers,
    useCreateMember,
    useUpdateMember,
    useDeleteMember,
} from "@/hooks/master/use-member";
import { useMemberCategories } from "@/hooks/master/use-member-category";
import { useDebounce } from "@/hooks/use-debounce";
import { DataTable } from "@/components/ui/data-table/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/ui/data-table/data-table-toolbar";
import { useAccessControl, UserAccess } from "@/hooks/use-access-control";

// --- Validation Schema ---
const memberSchema = z.object({
    code: z.string().min(1, "Kode member harus diisi"),
    name: z.string().min(1, "Nama member harus diisi"),
    phone: z.string().optional().or(z.literal("")),
    email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
    masterMemberCategoryId: z.coerce.number().min(1, "Kategori member harus dipilih"),
});

type MemberFormValues = z.infer<typeof memberSchema>;

export default function MembersPage() {
    useAccessControl([UserAccess.accessMasterMemberRead], true);
    const hasAccess = useAccessControl([UserAccess.accessMasterMemberWrite], false);
    // --- State ---
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

    // Search State
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 500);

    // --- Data Fetching ---
    const { data: memberData, isLoading: isMemberLoading } = useMembers({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: debouncedSearch,
        sort: sorting[0]?.desc ? "desc" : "asc",
        sortBy: sorting[0]?.id,
    });

    const { data: categoryData } = useMemberCategories({ limit: 100 }); // Fetch all categories for select

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [deletingMember, setDeletingMember] = useState<Member | null>(null);

    const { mutate: createMember, isPending: isCreating } = useCreateMember();
    const { mutate: updateMember, isPending: isUpdating } = useUpdateMember();
    const { mutate: deleteMember, isPending: isDeleting } = useDeleteMember();

    const form = useForm<MemberFormValues>({
        resolver: zodResolver(memberSchema) as Resolver<MemberFormValues>,
        defaultValues: {
            code: "",
            name: "",
            phone: "",
            email: "",
            address: "",
            masterMemberCategoryId: 0,
        },
    });

    const handleEditClick = useMemo(() => (member: Member) => {
        setEditingMember(member);
        form.reset({
            code: member.code,
            name: member.name,
            phone: member.phone || "",
            email: member.email || "",
            address: member.address || "",
            masterMemberCategoryId: member.masterMemberCategoryId,
        });
        setIsCreateOpen(true);
    }, [form]);

    // --- Table Columns ---
    const columns = useMemo<ColumnDef<Member>[]>(() => [
        {
            accessorKey: "code",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Kode" />
            ),
        },
        {
            accessorKey: "name",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Nama Member" />
            ),
        },
        {
            accessorKey: "masterMemberCategory",
            header: "Kategori",
            cell: ({ row }) => {
                const category = row.original.masterMemberCategory;
                if (!category) return "-";
                return (
                    <div className="flex items-center gap-2">
                        <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: `#${category.color}` }}
                        />
                        <span>{category.name}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: "createdAt",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Bergabung Pada" />
            ),
            cell: ({ row }) => {
                const date = new Date(row.getValue("createdAt"));
                return new Intl.DateTimeFormat("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                }).format(date);
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const member = row.original;
                if (!hasAccess) return null;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEditClick(member)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => setDeletingMember(member)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Hapus
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ], [handleEditClick, hasAccess]);

    // --- Table Instance ---
    const table = useReactTable({
        data: memberData?.data || [],
        columns,
        state: {
            pagination,
            sorting,
            columnVisibility,
        },
        pageCount: memberData?.pagination?.totalPages || -1,
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        manualSorting: true,
        manualFiltering: true,
    });

    // --- Handlers ---
    const handleOpenChange = (open: boolean) => {
        setIsCreateOpen(open);
        if (!open) {
            setEditingMember(null);
            form.reset({
                code: "",
                name: "",
                phone: "",
                email: "",
                address: "",
                masterMemberCategoryId: 0,
            });
        }
    };

    const onSubmit = (values: MemberFormValues) => {
        if (editingMember) {
            updateMember(
                { id: editingMember.id, data: values },
                {
                    onSuccess: () => {
                        setIsCreateOpen(false);
                        toast.success("Member berhasil diperbarui");
                    },
                    onError: (error: unknown) => {
                        const err = error as { response?: { data?: { errors?: { message?: string } } } };
                        toast.error(err?.response?.data?.errors?.message || "Gagal memperbarui member");
                    }
                }
            );
        } else {
            createMember(values, {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    toast.success("Member berhasil dibuat");
                },
                onError: (error: unknown) => {
                    const err = error as { response?: { data?: { errors?: { message?: string } } } };
                    toast.error(err?.response?.data?.errors?.message || "Gagal membuat member");
                }
            });
        }
    };

    const handleDelete = () => {
        if (deletingMember) {
            deleteMember(deletingMember.id, {
                onSuccess: () => {
                    setDeletingMember(null);
                    toast.success("Member berhasil dihapus");
                },
                onError: (error: unknown) => {
                    const err = error as { response?: { data?: { errors?: { message?: string } } } };
                    toast.error(err?.response?.data?.errors?.message || "Gagal menghapus member");
                }
            });
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Manajemen Member</h2>
                {hasAccess &&
                    <Button onClick={() => { setEditingMember(null); setIsCreateOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Tambah Member
                    </Button>
                }
            </div>

            <DataTableToolbar
                table={table}
                filterValue={searchTerm}
                onFilterChange={setSearchTerm}
                placeholder="Cari member..."
            />

            <DataTable
                table={table}
                columnsLength={columns.length}
                isLoading={isMemberLoading}
                showSelectedRowCount={false}
            />

            {/* Create/Edit Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{editingMember ? "Edit Member" : "Tambah Member Baru"}</DialogTitle>
                        <DialogDescription>
                            Isi formulir di bawah ini untuk {editingMember ? "memperbarui" : "membuat"} data member.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Kode (Wajib)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="cth: 6285112345678" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="masterMemberCategoryId"
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <FormLabel>Kategori Member (Wajib)</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                // Convert number to string for Select value, handle 0/undefined
                                                value={field.value ? field.value.toString() : undefined}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Pilih kategori" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {categoryData?.data?.map((category) => (
                                                        <SelectItem key={category.id} value={category.id.toString()}>
                                                            <div className="flex items-center gap-2">
                                                                <div
                                                                    className="h-3 w-3 rounded-full border border-muted-foreground/20"
                                                                    style={{ backgroundColor: `#${category.color}` }}
                                                                />
                                                                <span>{category.name}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nama Member (Wajib)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="cth: Budi Santoso" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Telepon</FormLabel>
                                            <FormControl>
                                                <Input placeholder="cth: 08123456789" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="cth: email@contoh.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Alamat</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Alamat lengkap member" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="submit" disabled={isCreating || isUpdating}>
                                    {(isCreating || isUpdating) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Simpan
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Alert */}
            <AlertDialog open={!!deletingMember} onOpenChange={(open) => !open && setDeletingMember(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Ini akan menghapus member
                            <strong> {deletingMember?.name}</strong> secara permanen.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); handleDelete(); }}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={isDeleting}
                        >
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

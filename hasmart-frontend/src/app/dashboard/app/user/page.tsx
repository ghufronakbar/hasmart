"use client";

import { useMemo, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
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
    Trash2,
    MoreHorizontal,

    KeyRound,
    Shield,
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
import { Badge } from "@/components/ui/badge";
import { UserFormFields } from "./_components/user-form-fields";

import { User } from "@/types/app/user";
import {
    useUsers,
    useCreateUser,
    useDeleteUser,
    useResetUserPassword,
    useUpdateUserAccess,
} from "@/hooks/app/use-user";
import { useDebounce } from "@/hooks/use-debounce";
import { DataTable } from "@/components/ui/data-table/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { DataTableToolbar } from "@/components/ui/data-table/data-table-toolbar";
import { useAccessControl, UserAccess } from "@/hooks/use-access-control";

// --- Validation Schemas ---

const createUserSchema = z.object({
    name: z.string().min(3, "Nama pengguna minimal 3 karakter"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    isActive: z.boolean(),
    // Access Fields
    accessReportRead: z.boolean(),
    accessOverviewRead: z.boolean(),
    accessPointOfSalesRead: z.boolean(),
    accessPointOfSalesWrite: z.boolean(),
    accessPrintLabelRead: z.boolean(),
    accessFrontStockRead: z.boolean(),
    accessFrontStockWrite: z.boolean(),
    accessFrontStockHistoryRead: z.boolean(),
    accessAppUserRead: z.boolean(),
    accessAppUserWrite: z.boolean(),
    accessAppBranchWrite: z.boolean(),
    accessMasterItemRead: z.boolean(),
    accessMasterItemWrite: z.boolean(),
    accessMasterItemCategoryRead: z.boolean(),
    accessMasterItemCategoryWrite: z.boolean(),
    accessMasterMemberRead: z.boolean(),
    accessMasterMemberWrite: z.boolean(),
    accessMasterMemberCategoryRead: z.boolean(),
    accessMasterMemberCategoryWrite: z.boolean(),
    accessMasterSupplierRead: z.boolean(),
    accessMasterSupplierWrite: z.boolean(),
    accessMasterUnitRead: z.boolean(),
    accessMasterUnitWrite: z.boolean(),
    accessTransactionPurchaseRead: z.boolean(),
    accessTransactionPurchaseWrite: z.boolean(),
    accessTransactionPurchaseReturnRead: z.boolean(),
    accessTransactionPurchaseReturnWrite: z.boolean(),
    accessTransactionSalesRead: z.boolean(),
    accessTransactionSalesWrite: z.boolean(),
    accessTransactionSalesReturnRead: z.boolean(),
    accessTransactionSalesReturnWrite: z.boolean(),
    accessTransactionSellRead: z.boolean(),
    accessTransactionSellWrite: z.boolean(),
    accessTransactionSellReturnRead: z.boolean(),
    accessTransactionSellReturnWrite: z.boolean(),
    accessTransactionTransferRead: z.boolean(),
    accessTransactionTransferWrite: z.boolean(),
    accessTransactionAdjustmentRead: z.boolean(),
    accessTransactionAdjustmentWrite: z.boolean(),
    accessTransactionCashFlowRead: z.boolean(),
    accessTransactionCashFlowWrite: z.boolean(),
});

const updateUserAccessSchema = z.object({
    accessOverviewRead: z.boolean(),
    accessReportRead: z.boolean(),
    accessPointOfSalesRead: z.boolean(),
    accessPointOfSalesWrite: z.boolean(),
    accessPrintLabelRead: z.boolean(),
    accessFrontStockRead: z.boolean(),
    accessFrontStockWrite: z.boolean(),
    accessFrontStockHistoryRead: z.boolean(),
    accessAppUserRead: z.boolean(),
    accessAppUserWrite: z.boolean(),
    accessAppBranchWrite: z.boolean(),
    accessMasterItemRead: z.boolean(),
    accessMasterItemWrite: z.boolean(),
    accessMasterItemCategoryRead: z.boolean(),
    accessMasterItemCategoryWrite: z.boolean(),
    accessMasterMemberRead: z.boolean(),
    accessMasterMemberWrite: z.boolean(),
    accessMasterMemberCategoryRead: z.boolean(),
    accessMasterMemberCategoryWrite: z.boolean(),
    accessMasterSupplierRead: z.boolean(),
    accessMasterSupplierWrite: z.boolean(),
    accessMasterUnitRead: z.boolean(),
    accessMasterUnitWrite: z.boolean(),
    accessTransactionPurchaseRead: z.boolean(),
    accessTransactionPurchaseWrite: z.boolean(),
    accessTransactionPurchaseReturnRead: z.boolean(),
    accessTransactionPurchaseReturnWrite: z.boolean(),
    accessTransactionSalesRead: z.boolean(),
    accessTransactionSalesWrite: z.boolean(),
    accessTransactionSalesReturnRead: z.boolean(),
    accessTransactionSalesReturnWrite: z.boolean(),
    accessTransactionSellRead: z.boolean(),
    accessTransactionSellWrite: z.boolean(),
    accessTransactionSellReturnRead: z.boolean(),
    accessTransactionSellReturnWrite: z.boolean(),
    accessTransactionTransferRead: z.boolean(),
    accessTransactionTransferWrite: z.boolean(),
    accessTransactionAdjustmentRead: z.boolean(),
    accessTransactionAdjustmentWrite: z.boolean(),
    accessTransactionCashFlowRead: z.boolean(),
    accessTransactionCashFlowWrite: z.boolean(),
});

const resetPasswordSchema = z.object({
    newPassword: z.string().min(6, "Password baru minimal 6 karakter"),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;
type UpdateUserAccessFormValues = z.infer<typeof updateUserAccessSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function UsersPage() {

    useAccessControl([UserAccess.accessAppUserRead], true);
    const hasAccess = useAccessControl([UserAccess.accessAppUserWrite], false);

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
    const { data: userData, isLoading: isUserLoading } = useUsers({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: debouncedSearch,
        sort: sorting[0]?.desc ? "desc" : "asc",
        sortBy: sorting[0]?.id,
    });

    // --- Dialog States ---
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
    const [isUpdateAccessOpen, setIsUpdateAccessOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);

    // --- Mutations ---
    const { mutate: createUser, isPending: isCreating } = useCreateUser();
    const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();
    const { mutate: resetPassword, isPending: isResetting } = useResetUserPassword();
    const { mutate: updateUserAccess, isPending: isUpdatingAccess } = useUpdateUserAccess();

    // --- Forms ---
    const createForm = useForm<CreateUserFormValues>({
        resolver: zodResolver(createUserSchema),
        defaultValues: {
            name: "",
            password: "",
            isActive: true,
            accessOverviewRead: false,
            accessPointOfSalesRead: false,
            accessPointOfSalesWrite: false,
            accessAppUserRead: false,
            accessAppUserWrite: false,
            accessAppBranchWrite: false,
            accessMasterItemRead: false,
            accessMasterItemWrite: false,
            accessMasterItemCategoryRead: false,
            accessMasterItemCategoryWrite: false,
            accessMasterMemberRead: false,
            accessMasterMemberWrite: false,
            accessMasterMemberCategoryRead: false,
            accessMasterMemberCategoryWrite: false,
            accessMasterSupplierRead: false,
            accessMasterSupplierWrite: false,
            accessMasterUnitRead: false,
            accessMasterUnitWrite: false,
            accessTransactionPurchaseRead: false,
            accessTransactionPurchaseWrite: false,
            accessTransactionPurchaseReturnRead: false,
            accessTransactionPurchaseReturnWrite: false,
            accessTransactionSalesRead: false,
            accessTransactionSalesWrite: false,
            accessTransactionSalesReturnRead: false,
            accessTransactionSalesReturnWrite: false,
            accessTransactionSellRead: false,
            accessTransactionSellWrite: false,
            accessTransactionSellReturnRead: false,
            accessTransactionSellReturnWrite: false,
            accessTransactionTransferRead: false,
            accessTransactionTransferWrite: false,
            accessTransactionAdjustmentRead: false,
            accessTransactionAdjustmentWrite: false,
            accessTransactionCashFlowRead: false,
            accessTransactionCashFlowWrite: false,
        },
    });

    const updateAccessForm = useForm<UpdateUserAccessFormValues>({
        resolver: zodResolver(updateUserAccessSchema),
        defaultValues: {
            accessOverviewRead: false,
            accessPointOfSalesRead: false,
            accessPointOfSalesWrite: false,
            accessAppUserRead: false,
            accessAppUserWrite: false,
            accessAppBranchWrite: false,
            accessMasterItemRead: false,
            accessMasterItemWrite: false,
            accessMasterItemCategoryRead: false,
            accessMasterItemCategoryWrite: false,
            accessMasterMemberRead: false,
            accessMasterMemberWrite: false,
            accessMasterMemberCategoryRead: false,
            accessMasterMemberCategoryWrite: false,
            accessMasterSupplierRead: false,
            accessMasterSupplierWrite: false,
            accessMasterUnitRead: false,
            accessMasterUnitWrite: false,
            accessTransactionPurchaseRead: false,
            accessTransactionPurchaseWrite: false,
            accessTransactionPurchaseReturnRead: false,
            accessTransactionPurchaseReturnWrite: false,
            accessTransactionSalesRead: false,
            accessTransactionSalesWrite: false,
            accessTransactionSalesReturnRead: false,
            accessTransactionSalesReturnWrite: false,
            accessTransactionSellRead: false,
            accessTransactionSellWrite: false,
            accessTransactionSellReturnRead: false,
            accessTransactionSellReturnWrite: false,
            accessTransactionTransferRead: false,
            accessTransactionTransferWrite: false,
            accessTransactionAdjustmentRead: false,
            accessTransactionAdjustmentWrite: false,
            accessTransactionCashFlowRead: false,
            accessTransactionCashFlowWrite: false,
        },
    });

    const resetPasswordForm = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            newPassword: "",
        },
    });

    // --- Handlers ---
    const handleCreateOpenChange = (open: boolean) => {
        setIsCreateOpen(open);
        if (!open) {
            createForm.reset({
                name: "",
                password: "",
                isActive: true,
                accessReportRead: false,
                accessOverviewRead: false,
                accessPointOfSalesRead: false,
                accessPointOfSalesWrite: false,
                accessFrontStockHistoryRead: false,
                accessFrontStockRead: false,
                accessFrontStockWrite: false,
                accessPrintLabelRead: false,
                accessAppUserRead: false,
                accessAppUserWrite: false,
                accessAppBranchWrite: false,
                accessMasterItemRead: false,
                accessMasterItemWrite: false,
                accessMasterItemCategoryRead: false,
                accessMasterItemCategoryWrite: false,
                accessMasterMemberRead: false,
                accessMasterMemberWrite: false,
                accessMasterMemberCategoryRead: false,
                accessMasterMemberCategoryWrite: false,
                accessMasterSupplierRead: false,
                accessMasterSupplierWrite: false,
                accessMasterUnitRead: false,
                accessMasterUnitWrite: false,
                accessTransactionPurchaseRead: false,
                accessTransactionPurchaseWrite: false,
                accessTransactionPurchaseReturnRead: false,
                accessTransactionPurchaseReturnWrite: false,
                accessTransactionSalesRead: false,
                accessTransactionSalesWrite: false,
                accessTransactionSalesReturnRead: false,
                accessTransactionSalesReturnWrite: false,
                accessTransactionSellRead: false,
                accessTransactionSellWrite: false,
                accessTransactionSellReturnRead: false,
                accessTransactionSellReturnWrite: false,
                accessTransactionTransferRead: false,
                accessTransactionTransferWrite: false,
                accessTransactionAdjustmentRead: false,
                accessTransactionAdjustmentWrite: false,
                accessTransactionCashFlowRead: false,
                accessTransactionCashFlowWrite: false,
            });
        }
    };

    const handleUpdateAccessOpenChange = (open: boolean) => {
        setIsUpdateAccessOpen(open);
        if (!open) {
            setSelectedUser(null);
        }
    };

    const handleEditAccess = useCallback((user: User) => {
        setSelectedUser(user);
        updateAccessForm.reset({
            accessOverviewRead: user.accessOverviewRead,
            accessReportRead: user.accessReportRead,
            accessPointOfSalesRead: user.accessPointOfSalesRead,
            accessPointOfSalesWrite: user.accessPointOfSalesWrite,
            accessFrontStockHistoryRead: user.accessFrontStockHistoryRead,
            accessFrontStockRead: user.accessFrontStockRead,
            accessFrontStockWrite: user.accessFrontStockWrite,
            accessPrintLabelRead: user.accessPrintLabelRead,
            accessAppUserRead: user.accessAppUserRead,
            accessAppUserWrite: user.accessAppUserWrite,
            accessAppBranchWrite: user.accessAppBranchWrite,
            accessMasterItemRead: user.accessMasterItemRead,
            accessMasterItemWrite: user.accessMasterItemWrite,
            accessMasterItemCategoryRead: user.accessMasterItemCategoryRead,
            accessMasterItemCategoryWrite: user.accessMasterItemCategoryWrite,
            accessMasterMemberRead: user.accessMasterMemberRead,
            accessMasterMemberWrite: user.accessMasterMemberWrite,
            accessMasterMemberCategoryRead: user.accessMasterMemberCategoryRead,
            accessMasterMemberCategoryWrite: user.accessMasterMemberCategoryWrite,
            accessMasterSupplierRead: user.accessMasterSupplierRead,
            accessMasterSupplierWrite: user.accessMasterSupplierWrite,
            accessMasterUnitRead: user.accessMasterUnitRead,
            accessMasterUnitWrite: user.accessMasterUnitWrite,
            accessTransactionPurchaseRead: user.accessTransactionPurchaseRead,
            accessTransactionPurchaseWrite: user.accessTransactionPurchaseWrite,
            accessTransactionPurchaseReturnRead: user.accessTransactionPurchaseReturnRead,
            accessTransactionPurchaseReturnWrite: user.accessTransactionPurchaseReturnWrite,
            accessTransactionSalesRead: user.accessTransactionSalesRead,
            accessTransactionSalesWrite: user.accessTransactionSalesWrite,
            accessTransactionSalesReturnRead: user.accessTransactionSalesReturnRead,
            accessTransactionSalesReturnWrite: user.accessTransactionSalesReturnWrite,
            accessTransactionSellRead: user.accessTransactionSellRead,
            accessTransactionSellWrite: user.accessTransactionSellWrite,
            accessTransactionSellReturnRead: user.accessTransactionSellReturnRead,
            accessTransactionSellReturnWrite: user.accessTransactionSellReturnWrite,
            accessTransactionTransferRead: user.accessTransactionTransferRead,
            accessTransactionTransferWrite: user.accessTransactionTransferWrite,
            accessTransactionAdjustmentRead: user.accessTransactionAdjustmentRead,
            accessTransactionAdjustmentWrite: user.accessTransactionAdjustmentWrite,
            accessTransactionCashFlowRead: user.accessTransactionCashFlowRead,
            accessTransactionCashFlowWrite: user.accessTransactionCashFlowWrite,
        });
        setIsUpdateAccessOpen(true);
    }, [updateAccessForm]);

    const handleResetPasswordOpenChange = (open: boolean) => {
        setIsResetPasswordOpen(open);
        if (!open) {
            setSelectedUser(null);
            resetPasswordForm.reset({ newPassword: "" });
        }
    };

    const onCreateSubmit = (values: CreateUserFormValues) => {
        createUser(values, {
            onSuccess: () => {
                setIsCreateOpen(false);
                toast.success("Pengguna berhasil dibuat");
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onError: (error: any) => {
                const message = error?.response?.data?.errors?.message || "Gagal membuat pengguna";
                toast.error(message);
            },
        });
    };

    const onUpdateAccessSubmit = (values: UpdateUserAccessFormValues) => {
        if (!selectedUser) return;

        updateUserAccess(
            { id: selectedUser.id, data: values },
            {
                onSuccess: () => {
                    setIsUpdateAccessOpen(false);
                    toast.success("Hak akses berhasil diperbarui");
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onError: (error: any) => {
                    const message = error?.response?.data?.errors?.message || "Gagal memperbarui hak akses";
                    toast.error(message);
                },
            }
        );
    };

    const onResetPasswordSubmit = (values: ResetPasswordFormValues) => {
        if (!selectedUser) return;

        resetPassword(
            { id: selectedUser.id, data: values },
            {
                onSuccess: () => {
                    setIsResetPasswordOpen(false);
                    toast.success("Password berhasil direset");
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onError: (error: any) => {
                    const message = error?.response?.data?.errors?.message || "Gagal mereset password";
                    toast.error(message);
                },
            }
        );
    };

    const handleDelete = () => {
        if (deletingUser) {
            deleteUser(deletingUser.id, {
                onSuccess: () => {
                    setDeletingUser(null);
                    toast.success("Pengguna berhasil dihapus");
                },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onError: (error: any) => {
                    const message = error?.response?.data?.errors?.message || "Gagal menghapus pengguna";
                    toast.error(message);
                },
            });
        }
    };

    // --- Table Columns ---
    const columns = useMemo<ColumnDef<User>[]>(
        () => [
            {
                accessorKey: "name",
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="Nama Pengguna" />
                ),
            },
            {
                accessorKey: "isActive",
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="Status" />
                ),
                cell: ({ row }) => {
                    const isActive = row.getValue("isActive") as boolean;
                    return (
                        <Badge variant={isActive ? "default" : "destructive"}>
                            {isActive ? "Aktif" : "Tidak Aktif"}
                        </Badge>
                    );
                },
            },
            {
                accessorKey: "isSuperUser",
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="Role" />
                ),
                cell: ({ row }) => {
                    const isSuperUser = row.getValue("isSuperUser") as boolean;
                    return isSuperUser ? <Badge variant="secondary">Super User</Badge> : <span>User</span>;
                }
            },
            {
                accessorKey: "createdAt",
                header: ({ column }) => (
                    <DataTableColumnHeader column={column} title="Dibuat Pada" />
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
                    const user = row.original;
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
                                <DropdownMenuItem
                                    onClick={() => {
                                        setSelectedUser(user);
                                        setIsResetPasswordOpen(true);
                                    }}
                                >
                                    <KeyRound className="mr-2 h-4 w-4" /> Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => handleEditAccess(user)}
                                >
                                    <Shield className="mr-2 h-4 w-4" /> Hak Akses
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => setDeletingUser(user)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Hapus
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    );
                },
            },
        ],
        [handleEditAccess, hasAccess]
    );

    // --- Table Instance ---
    const table = useReactTable({
        data: userData?.data || [],
        columns,
        state: {
            pagination,
            sorting,
            columnVisibility,
        },
        pageCount: userData?.pagination?.totalPages || -1,
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        manualSorting: true,
        manualFiltering: true,
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Manajemen Pengguna</h2>
                {hasAccess &&
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Tambah Pengguna
                    </Button>
                }
            </div>

            <DataTableToolbar
                table={table}
                filterValue={searchTerm}
                onFilterChange={setSearchTerm}
                placeholder="Cari pengguna..."
            />

            <DataTable
                table={table}
                columnsLength={columns.length}
                isLoading={isUserLoading}
                showSelectedRowCount={false}
            />

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={handleCreateOpenChange}>
                <DialogContent className="sm:max-w-[425px] w-full max-w-[60vw]!">
                    <DialogHeader>
                        <DialogTitle>Tambah Pengguna Baru</DialogTitle>
                        <DialogDescription>
                            Isi formulir di bawah ini untuk membuat pengguna baru.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...createForm}>
                        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                            <UserFormFields mode="create" form={createForm} />
                            <DialogFooter>
                                <Button type="submit" disabled={isCreating}>
                                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Simpan
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Update Access Dialog */}
            <Dialog open={isUpdateAccessOpen} onOpenChange={handleUpdateAccessOpenChange}>
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle>Atur Hak Akses - {selectedUser?.name}</DialogTitle>
                        <DialogDescription>
                            Centang module yang diizinkan untuk diakses oleh pengguna ini.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...updateAccessForm}>
                        <form onSubmit={updateAccessForm.handleSubmit(onUpdateAccessSubmit)} className="space-y-4">
                            <UserFormFields mode="edit-access" form={updateAccessForm} />
                            <DialogFooter>
                                <Button type="submit" disabled={isUpdatingAccess}>
                                    {isUpdatingAccess && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Simpan Perubahan
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog >

            {/* Reset Password Dialog */}
            < Dialog open={isResetPasswordOpen} onOpenChange={handleResetPasswordOpenChange} >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Reset Password - {selectedUser?.name}</DialogTitle>
                        <DialogDescription>
                            Masukkan password baru untuk pengguna ini.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...resetPasswordForm}>
                        <form onSubmit={resetPasswordForm.handleSubmit(onResetPasswordSubmit)} className="space-y-4">
                            <FormField
                                control={resetPasswordForm.control}
                                name="newPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password Baru</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="******" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="submit" disabled={isResetting}>
                                    {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Reset Password
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog >

            {/* Delete Confirmation Alert */}
            < AlertDialog open={!!deletingUser
            } onOpenChange={(open) => !open && setDeletingUser(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Ini akan menghapus pengguna
                            <strong> {deletingUser?.name}</strong> secara permanen.
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
            </AlertDialog >
        </div >
    );
}

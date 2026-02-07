"use client";

import { useAccessControl, UserAccess } from "@/hooks/use-access-control";
import { useState } from "react";
import { backupRestoreService } from "@/services/data/backup-restore.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Download, Upload, MonitorCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { useAuth } from "@/providers/auth-provider";

export default function BackupRestorePage() {
    useAccessControl([UserAccess.isSuperUser], true);
    const router = useRouter();

    const [isDownloading, setIsDownloading] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [restoreFile, setRestoreFile] = useState<File | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const { logout } = useAuth();

    const handleDownloadBackup = async () => {
        setIsDownloading(true);
        try {
            const response = await backupRestoreService.downloadBackup();

            // Create a blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            // Try to extract filename from header or use default
            const contentDisposition = response.headers['content-disposition'];
            let fileName = `backup_${new Date().toISOString()}.dump`;
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                if (fileNameMatch && fileNameMatch.length === 2)
                    fileName = fileNameMatch[1];
            }

            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success("Backup berhasil diunduh");
        } catch (error) {
            console.error("Backup download failed", error);
            toast.error("Gagal mengunduh backup");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleRestoreDatabase = async () => {
        if (!restoreFile) {
            toast.error("Pilih file backup terlebih dahulu");
            return;
        }

        if (!confirm("PERINGATAN: Tindakan ini akan menimpa seluruh database dengan data dari file backup. Data yang ada saat ini akan HILANG. Lanjutkan?")) {
            return;
        }

        setIsRestoring(true);
        try {
            await backupRestoreService.restoreDatabase(restoreFile);
            setIsSuccess(true);
            toast.success("Restore berhasil");
        } catch (error) {
            console.error("Restore failed", error);
            const msg = error instanceof AxiosError ? error.response?.data?.message : "Gagal melakukan restore database";
            toast.error(msg);
        } finally {
            setIsRestoring(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
                <div className="rounded-full bg-green-100 p-6">
                    <MonitorCheck className="h-12 w-12 text-green-600" />
                </div>
                <div className="space-y-2 max-w-md">
                    <h1 className="text-2xl font-bold">Restore Berhasil</h1>
                    <p className="text-muted-foreground">
                        Sistem berhasil di restore, masuk kembali ke sistem dengan:
                    </p>
                    <div className="bg-slate-100 p-4 rounded-md border text-left text-sm font-mono space-y-1">
                        <p>Nama: admin</p>
                        <p>Password: 12345678</p>
                    </div>
                </div>
                <Button onClick={() => logout()} size="lg">
                    Ke Halaman Login
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 py-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Backup & Restore</h1>
                <p className="text-muted-foreground">
                    Kelola backup data dan pemulihan sistem (Database).
                </p>
            </div>

            <div className="grid gap-6">
                {/* Backup Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Download className="h-5 w-5" />
                            Backup Database
                        </CardTitle>
                        <CardDescription>
                            Unduh salinan lengkap database sistem saat ini. File akan diunduh dalam format timestamped .dump.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Alert className="mb-4 bg-blue-50 text-blue-800 border-blue-200">
                            <AlertTitle>Informasi</AlertTitle>
                            <AlertDescription>
                                Proses export mungkin memakan waktu tergantung ukuran data. Pastikan koneksi stabil.
                            </AlertDescription>
                        </Alert>
                        <Button onClick={handleDownloadBackup} disabled={isDownloading}>
                            {isDownloading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Mengunduh...
                                </>
                            ) : (
                                "Download Backup (.dump)"
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Restore Card */}
                <Card className="border-red-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-700">
                            <Upload className="h-5 w-5" />
                            Restore Database
                        </CardTitle>
                        <CardDescription>
                            Pulihkan sistem dari file backup.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900 [&>svg]:text-red-900">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Peringatan Keras</AlertTitle>
                            <AlertDescription >
                                <p>
                                    Tindakan ini <strong>DESTRUKTIF</strong>. Database saat ini akan <strong>DITIMPA SECARA TOTAL</strong> oleh data dari file backup.
                                </p>
                                <ul className="list-disc pl-5 mt-2 text-sm">
                                    <li>Data transaksi setelah tanggal backup akan hilang.</li>
                                    <li>Akun super user akan direset menjadi admin/12345678.</li>
                                    <li>Anda akan dipaksa logout setelah proses selesai.</li>
                                </ul>
                            </AlertDescription>
                        </Alert>

                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Label htmlFor="backup-file">File Backup (.dump)</Label>
                            <Input
                                id="backup-file"
                                type="file"
                                accept=".dump"
                                onChange={(e) => setRestoreFile(e.target.files ? e.target.files[0] : null)}
                            />
                        </div>

                        <Button
                            variant="destructive"
                            onClick={handleRestoreDatabase}
                            disabled={isRestoring || !restoreFile}
                            className="w-full sm:w-auto"
                        >
                            {isRestoring ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Memulihkan Database...
                                </>
                            ) : (
                                "Restore Database Sekarang"
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
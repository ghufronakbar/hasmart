import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold">404</h1>
                <p className="text-xl">Halaman tidak ditemukan</p>
                <Link href="/dashboard">
                    <Button>
                        Kembali ke Dashboard
                    </Button>
                </Link>
            </div>
        </div>
    );
}
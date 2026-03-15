"use client";

import AdminAuthGuard from "@/components/AdminAuthGuard";
import Link from "next/link";
import { logout } from "@/lib/adminAuth";
import { useRouter } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <AdminAuthGuard>
      <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="font-bold text-primary hover:underline"
          >
            Admin Dashboard
          </Link>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-text-light hover:text-error cursor-pointer"
        >
          Uitloggen
        </button>
      </div>
      {children}
    </AdminAuthGuard>
  );
}

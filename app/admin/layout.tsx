import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EthicsBanner } from "@/components/admin/EthicsBanner";
import { LogoutButton } from "@/components/admin/LogoutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // /admin/login se renderiza también bajo este layout; si no hay user
  // el middleware ya habría redirigido, salvo en la propia página de login.
  const isLoggedIn = Boolean(user);

  return (
    <div className="flex min-h-screen flex-col">
      {isLoggedIn && (
        <>
          <EthicsBanner />
          <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
            <nav className="flex items-center gap-6">
              <Link href="/admin" className="font-semibold text-indigo-950">
                Panel Admin
              </Link>
              <Link href="/admin/candidates" className="text-sm text-gray-600 hover:text-indigo-700">
                Candidatos
              </Link>
              <Link href="/admin/compare" className="text-sm text-gray-600 hover:text-indigo-700">
                Comparar Candidatos
              </Link>
              <Link href="/admin/audit" className="text-sm text-gray-600 hover:text-indigo-700">
                Auditoría
              </Link>
            </nav>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{user?.email}</span>
              <LogoutButton />
            </div>
          </header>
        </>
      )}
      <div className="flex-1 bg-gray-50">{children}</div>
    </div>
  );
}

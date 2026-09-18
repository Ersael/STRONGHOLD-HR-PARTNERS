import { createClient } from "@/lib/supabase/server";
import { CandidateLogoutButton } from "@/components/candidate/LogoutButton";

export default async function CandidateLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // /candidate/login se renderiza también bajo este layout; si no hay user
  // el middleware ya habría redirigido, salvo en la propia página de login.
  const isLoggedIn = Boolean(user);

  return (
    <div className="flex min-h-screen flex-col">
      {isLoggedIn && (
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
          <span className="font-semibold text-indigo-950">Portal del Candidato</span>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user?.email}</span>
            <CandidateLogoutButton />
          </div>
        </header>
      )}
      <div className="flex-1 bg-gray-50">{children}</div>
    </div>
  );
}

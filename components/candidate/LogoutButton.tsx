"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function CandidateLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/candidate/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm font-medium text-gray-500 hover:text-gray-800"
    >
      Cerrar sesión
    </button>
  );
}

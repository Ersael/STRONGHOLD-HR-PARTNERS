import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Protege `/admin/*` y `/candidate/*` exigiendo sesión válida de Supabase Y
 * que esa sesión corresponda al ROL correcto:
 *  - `/admin/*`     -> la sesión debe tener una fila en `public.admins`.
 *  - `/candidate/*` -> la sesión debe tener una fila en `public.candidates`.
 *
 * Un admin que intenta entrar a `/candidate/*` es redirigido a `/admin`, y
 * un candidato que intenta entrar a `/admin/*` es redirigido a `/candidate`
 * (cada rol a su propio dashboard, nunca al login del otro rol).
 *
 * `/admin/login` y `/candidate/login` quedan exentas del requisito de
 * sesión (si no, nadie podría llegar a loguearse), pero si ya hay sesión
 * del rol correspondiente, redirigen al dashboard de ese rol.
 *
 * Nota histórica: `/assessment/*` y `/api/assessment/*` (flujo VIEJO por
 * `unique_token`) siguen sin pasar por aquí — ese candidato nunca tuvo
 * sesión de Supabase Auth, se valida por token en cada request server-side
 * contra las funciones RPC `SECURITY DEFINER` de `supabase/schema.sql`.
 * El flujo NUEVO (`/candidate/*`, Fase A) sí usa sesión real y por eso sí
 * necesita pasar por este middleware.
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isCandidateRoute = pathname.startsWith("/candidate");
  const isAdminLoginRoute = pathname === "/admin/login";
  const isCandidateLoginRoute = pathname === "/candidate/login";

  if (!isAdminRoute && !isCandidateRoute) {
    return response;
  }

  // Solo se consulta el rol (admins/candidates) cuando hay una sesión, y
  // solo se necesita UNA de las dos tablas según la ruta -salvo que
  // debamos decidir a dónde redirigir a alguien que entró a la ruta que no
  // le corresponde, en cuyo caso consultamos ambas para saber su rol real.
  let isAdmin = false;
  let isCandidate = false;

  if (user) {
    const [adminResult, candidateResult] = await Promise.all([
      supabase.from("admins").select("id").eq("id", user.id).maybeSingle(),
      supabase.from("candidates").select("id").eq("id", user.id).maybeSingle(),
    ]);
    isAdmin = Boolean(adminResult.data);
    isCandidate = Boolean(candidateResult.data);
  }

  if (isAdminRoute) {
    if (user && isCandidate && !isAdmin) {
      return NextResponse.redirect(new URL("/candidate", request.url));
    }

    if (isAdminLoginRoute) {
      if (user && isAdmin) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return response;
    }

    if (!user || !isAdmin) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirectedFrom", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  // isCandidateRoute
  if (user && isAdmin && !isCandidate) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (isCandidateLoginRoute) {
    if (user && isCandidate) {
      return NextResponse.redirect(new URL("/candidate", request.url));
    }
    return response;
  }

  if (!user || !isCandidate) {
    const loginUrl = new URL("/candidate/login", request.url);
    loginUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/candidate/:path*"],
};

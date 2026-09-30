import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

const PUBLIC_PATHS = ["/login", "/auth"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}

// Redirect while preserving any session cookies Supabase just refreshed.
function redirectWithCookies(
  request: NextRequest,
  pathname: string,
  from: NextResponse,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const response = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie.name, cookie.value);
  });
  return response;
}

export async function updateSession(request: NextRequest) {
  // Allow running the app before Supabase env vars are configured.
  if (!hasSupabaseEnv()) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh the session so Server Components always see a valid token.
  // Do not add logic between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    return redirectWithCookies(request, "/login", supabaseResponse);
  }

  if (user && pathname === "/login") {
    return redirectWithCookies(request, "/", supabaseResponse);
  }

  return supabaseResponse;
}

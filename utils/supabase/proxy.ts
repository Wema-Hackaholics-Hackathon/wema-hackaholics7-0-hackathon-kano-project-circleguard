import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }
  if (user && !user.user_metadata.full_name && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }
  if (user?.user_metadata.full_name && request.nextUrl.pathname === "/onboarding") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (user && request.nextUrl.pathname === "/circles/new" && !user.user_metadata.demo_bank_profile_key) {
    const bankUrl = new URL("/bank", request.url);
    bankUrl.searchParams.set("next", "/circles/new");
    return NextResponse.redirect(bankUrl);
  }
  return response;
}

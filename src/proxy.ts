import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { appIdFromPath } from "./role-gate";
import { canAccess, type Role } from "./access-policy";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)"]);

function roleFromClaims(
  claims: Record<string, unknown> | null | undefined,
): Role | null {
  if (!claims) return null;
  const metadata = claims.metadata as Record<string, unknown> | undefined;
  const role = metadata?.role;
  if (role === "admin" || role === "manager" || role === "sales_rep") return role;
  return null;
}

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) return;

  const { sessionClaims } = await auth.protect();

  const appId = appIdFromPath(request.nextUrl.pathname);
  if (appId) {
    const role = roleFromClaims(
      sessionClaims as unknown as Record<string, unknown>,
    );
    if (role && !canAccess(role, appId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

import { notFound } from "next/navigation";
import { getCurrentUser } from "@/auth";
import { canAccess, allAppIds, type AppId } from "@/access-policy";
import { getAppEntries } from "@/app-directory";

export default async function AppPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = await params;

  if (!(allAppIds as readonly string[]).includes(appId) || appId === "portal") {
    notFound();
  }

  const user = await getCurrentUser();
  if (!user || !canAccess(user.role, appId as AppId)) {
    return (
      <main style={{ padding: "2rem", textAlign: "center" }}>
        <h1>Access Denied</h1>
        <p>Your role does not have permission to access this app.</p>
        <a href="/">Return to Launchpad</a>
      </main>
    );
  }

  const [entry] = getAppEntries([appId as AppId]);

  return (
    <main style={{ padding: "2rem" }}>
      <nav style={{ marginBottom: "1rem" }}>
        <a href="/">&#8592; Back to Launchpad</a>
      </nav>
      <h1>{entry?.name ?? appId}</h1>
      <p>{entry?.description ?? "App stub"}</p>
      <p style={{ color: "#6b7280" }}>
        This is a stub app. The real application will be built here.
      </p>
    </main>
  );
}

import { notFound } from "next/navigation";
import { getCurrentUser } from "@/auth";
import { canAccess, allAppIds, type AppId } from "@/access-policy";
import { getAppEntries } from "@/app-directory";
import { listUsers } from "@/user-admin";
import { InviteForm } from "./invite-form";

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

  if (appId === "admin") {
    return <AdminPanel />;
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

async function AdminPanel() {
  const members = await listUsers();

  return (
    <main style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <nav style={{ marginBottom: "1rem" }}>
        <a href="/">&#8592; Back to Launchpad</a>
      </nav>
      <h1>Admin Panel</h1>

      <section style={{ marginTop: "2rem" }}>
        <h2>Invite Team Member</h2>
        <InviteForm />
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2>Team Members</h2>
        {members.length === 0 ? (
          <p style={{ color: "#6b7280" }}>No team members found.</p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "1rem",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "2px solid #e5e7eb",
                  textAlign: "left",
                }}
              >
                <th style={{ padding: "0.75rem 1rem" }}>Email</th>
                <th style={{ padding: "0.75rem 1rem" }}>Role</th>
                <th style={{ padding: "0.75rem 1rem" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr
                  key={member.id}
                  style={{ borderBottom: "1px solid #e5e7eb" }}
                >
                  <td style={{ padding: "0.75rem 1rem" }}>{member.email}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    {member.role ?? "—"}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span
                      style={{
                        color:
                          member.status === "Active" ? "#16a34a" : "#dc2626",
                        fontWeight: 500,
                      }}
                    >
                      {member.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

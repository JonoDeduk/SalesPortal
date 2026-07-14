import { UserButton } from "@clerk/nextjs";
import { getCurrentUser } from "@/auth";
import { appsForRole } from "@/access-policy";
import { getAppEntries, type AppEntry } from "@/app-directory";

export default async function HomePage() {
  const user = await getCurrentUser();
  console.log({user})

  const tiles = user ? getAppEntries(appsForRole(user.role)) : [];

  return (
    <main>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 2rem",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <h1>Sales Portal</h1>
        <UserButton />
      </header>
      <section style={{ padding: "2rem" }}>
        {tiles.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "1rem",
            }}
          >
            {tiles.map((app) => (
              <Tile key={app.id} app={app} />
            ))}
          </div>
        ) : (
          <p>No apps available for your role.</p>
        )}
      </section>
    </main>
  );
}

function Tile({ app }: { app: AppEntry }) {
  return (
    <a
      href={app.href}
      style={{
        display: "block",
        padding: "1.5rem",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <h2 style={{ margin: "0 0 0.5rem" }}>{app.name}</h2>
      <p style={{ margin: 0, color: "#6b7280" }}>{app.description}</p>
    </a>
  );
}

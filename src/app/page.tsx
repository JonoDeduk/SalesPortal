import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";

export default async function HomePage() {
  const user = await currentUser();

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
        <p>Welcome, {user?.firstName ?? "team member"}.</p>
        <p>Portal content coming soon.</p>
      </section>
    </main>
  );
}

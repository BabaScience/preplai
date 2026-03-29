import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Welcome back, {session.user.name ?? session.user.email}
      </p>
      <div className="mt-8 rounded-lg border border-border p-8 text-center text-sm text-muted-foreground">
        Interview session UI coming soon
      </div>
    </main>
  );
}

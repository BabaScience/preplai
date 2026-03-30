import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          AI Interview Prep
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Practice mock interviews with AI. Get scored feedback instantly.
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Sign In
        </Link>
        <Link
          href="/register"
          className="rounded-lg border border-border px-6 py-3 text-sm font-medium transition-colors hover:bg-accent"
        >
          Get Started
        </Link>
      </div>
    </main>
  );
}

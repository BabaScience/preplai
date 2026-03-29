export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to continue your interview prep
          </p>
        </div>
        {/* Auth form will be implemented in PRE-21 */}
        <div className="rounded-lg border border-border p-6 text-center text-sm text-muted-foreground">
          Authentication UI coming soon
        </div>
      </div>
    </main>
  );
}

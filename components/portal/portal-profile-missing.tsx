import SignOutButton from "@/components/portal/sign-out-button"

type Props = {
  email: string | null | undefined
}

/**
 * Signed-in auth user exists but no `member_profiles` row (migration/trigger issue or legacy account).
 */
export default function PortalProfileMissing({ email }: Props) {
  return (
    <main className="min-h-screen bg-black text-foreground flex flex-col items-center justify-center px-4">
      <div className="liquid-glass w-full max-w-lg rounded-2xl border border-white/10 p-8 shadow-xl">
        <h1 className="text-xl font-semibold gradient-text mb-2 text-center">Finish setting up your account</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          You&apos;re signed in{email ? ` as ${email}` : ""}, but your member profile isn&apos;t ready yet. This
          usually means the database migration hasn&apos;t been applied or the signup hook didn&apos;t run.
        </p>
        <ul className="text-sm text-muted-foreground space-y-2 mb-8 list-disc pl-5">
          <li>
            Ask your administrator to apply the Supabase migration and confirm the{" "}
            <code className="text-xs bg-white/10 px-1 rounded">handle_new_user</code> trigger on{" "}
            <code className="text-xs bg-white/10 px-1 rounded">auth.users</code>.
          </li>
          <li>
            Contact{" "}
            <a href="mailto:info@bemdonna.com" className="text-cyan-300 hover:underline">
              info@bemdonna.com
            </a>{" "}
            with this email so we can link your account.
          </li>
        </ul>
        <div className="flex flex-col items-center gap-4">
          <SignOutButton />
          <a href="/" className="text-sm text-muted-foreground hover:text-cyan-300 transition-colors">
            ← Back to site
          </a>
        </div>
      </div>
    </main>
  )
}

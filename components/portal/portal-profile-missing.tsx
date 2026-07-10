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
          Something went wrong on our end - please try again in a few minutes.
        </p>
        <div className="flex flex-col items-center gap-2 mb-8">
          <p className="text-sm text-muted-foreground">
            If the issue persists, please contact{" "}
            <a href="mailto:info@bemdonna.com" className="text-cyan-300 hover:underline">
              info@bemdonna.com
            </a>
          </p>
        </div>
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

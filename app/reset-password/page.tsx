import type { Metadata } from "next"
import PasswordUpdateForm from "@/components/portal/password-update-form"

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset your DONNA member or partner password",
  robots: { index: false, follow: false },
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-black text-foreground flex flex-col items-center justify-center px-4">
      <div className="liquid-glass w-full max-w-lg rounded-2xl border border-white/10 p-8 shadow-xl">
        <h1 className="text-2xl font-semibold gradient-text text-center mb-2">Reset Password</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Enter your new password below.
        </p>
        <div className="flex justify-center">
          <PasswordUpdateForm />
        </div>
      </div>
    </main>
  )
}

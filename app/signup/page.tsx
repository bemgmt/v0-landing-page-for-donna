import type { Metadata } from "next"
import SignupForm from "@/components/auth/signup-form"
import { SkipLink } from "@/components/skip-link"
import { generatePageMetadata } from "@/lib/metadata"

export const metadata: Metadata = {
  ...generatePageMetadata({
    title: "Create your account",
    description: "Create your DONNA account to get started.",
    path: "/signup",
  }),
  robots: {
    index: false,
    follow: true,
  },
}

export default function SignupPage() {
  return (
    <>
      <SkipLink />
      <SignupForm />
    </>
  )
}

import { getPortalSession } from "@/lib/portal/session"
import ProfileForm from "@/components/portal/profile-form"
import PasswordUpdateForm from "@/components/portal/password-update-form"

export default async function ProfilePage() {
  const session = await getPortalSession()
  if (!session) return null

  const { profile } = session

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold gradient-text">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Email is managed by your sign-in provider: {profile.email ?? session.user.email}
        </p>
      </div>
      <ProfileForm
        initial={{
          display_name: profile.display_name,
          company_name: profile.company_name,
          bio: profile.bio,
          phone: profile.phone,
          website_url: profile.website_url,
        }}
      />
      
      <div className="pt-8 mt-8 border-t border-white/10">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Security</h2>
        <PasswordUpdateForm />
      </div>
    </div>
  )
}

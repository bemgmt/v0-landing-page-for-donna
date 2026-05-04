import SeoDashboard from "@/components/admin/seo-dashboard"

export const metadata = {
  title: "SEO Analytics | DONNA Admin",
  description: "Google Search Console performance data for aidonna.co.",
}

export default function SeoAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold gradient-text">SEO Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Search Console performance data for <code className="text-xs bg-muted px-1.5 py-0.5 rounded">aidonna.co</code>
        </p>
      </div>
      <SeoDashboard />
    </div>
  )
}

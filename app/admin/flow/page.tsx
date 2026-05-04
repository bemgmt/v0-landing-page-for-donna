import FlowStudio from "@/components/admin/flow-studio"

export const metadata = {
  title: "Flow Studio | DONNA Admin",
  description: "Generate marketing collateral with Google Flow.",
}

export default function FlowAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold gradient-text">Flow Studio</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate DONNA-branded marketing collateral for the site and social media.
        </p>
      </div>
      <FlowStudio />
    </div>
  )
}

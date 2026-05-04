import LiveChatPanel from "@/components/admin/live-chat-panel"

export const metadata = {
  title: "Live Chat Admin | DONNA",
  description: "Monitor and join member chat conversations.",
}

export default function LiveChatAdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold gradient-text">Live Chat Control</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor AI conversations and take over when members need human assistance.
        </p>
      </div>

      <LiveChatPanel />
    </div>
  )
}

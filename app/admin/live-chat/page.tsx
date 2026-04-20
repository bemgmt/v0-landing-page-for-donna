import LiveChatPanel from "@/components/admin/live-chat-panel"

export default function AdminLiveChatPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold gradient-text">Live chat</h1>
        <p className="text-sm text-muted-foreground mt-1">Take over member sessions after they request a human.</p>
      </div>
      <LiveChatPanel />
    </div>
  )
}

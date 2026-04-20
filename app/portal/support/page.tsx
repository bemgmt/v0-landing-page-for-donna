import MemberChatPanel from "@/components/portal/member-chat-panel"

export default function MemberSupportChatPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold gradient-text">Support chat</h1>
        <p className="text-sm text-muted-foreground mt-1">
          AI-first chat with optional human handoff when staff are online.
        </p>
      </div>
      <MemberChatPanel />
    </div>
  )
}

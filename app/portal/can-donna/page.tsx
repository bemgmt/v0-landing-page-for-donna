import CanDonnaPanel from "@/components/portal/can-donna-panel"

export default function CanDonnaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold gradient-text">Can DONNA</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Structured capability check for members — not a generic marketing chatbot.
        </p>
      </div>
      <CanDonnaPanel />
    </div>
  )
}

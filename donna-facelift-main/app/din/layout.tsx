import { DinAppShell } from "@/components/din/layout/din-app-shell"

export const metadata = {
  title: "DONNA Intelligence Network",
  description: "The DONNA Intelligence Network — a premium operational intelligence exchange layer",
}

export default function DinLayout({ children }: { children: React.ReactNode }) {
  return <DinAppShell>{children}</DinAppShell>
}

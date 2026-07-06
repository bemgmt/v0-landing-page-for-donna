import { PageHeader } from "@/components/portal/dashboard/page-header"
import { ActionList, type ActionItem } from "@/components/portal/dashboard/action-list"
import { InternChecklist, defaultTasks } from "@/components/portal/intern-checklist"
import { getPortalSession } from "@/lib/portal/session"
import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"

export default async function InternDashboardPage() {
  const session = await getPortalSession()
  if (!session) return null

  const { profile } = session
  if (profile.role !== "intern" && profile.role !== "admin" && profile.role !== "staff") {
    redirect("/portal")
  }

  const isAdminOrStaff = profile.role === "admin" || profile.role === "staff"

  let interns: any[] = []
  if (isAdminOrStaff) {
    const admin = createAdminClient()
    const { data } = await admin
      .from("member_profiles")
      .select("id, display_name, email, intern_tasks")
      .eq("role", "intern")
    interns = data || []
  }

  const playbookLinks: ActionItem[] = [
    { title: "Main site", description: "Positioning, pricing logic, ecosystem framing", href: "https://aidonna.co", external: true },
    { title: "What is DONNA", description: "Deepest plain-language explainer", href: "https://notebooklm.google.com/notebook/ef6a20e1-9bc3-402a-91f0-11f286c2c943", external: true },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Intern Portal"
        title={isAdminOrStaff ? "Intern Management" : "Intern Dashboard"}
        subtitle={isAdminOrStaff ? "Monitor intern onboarding progress." : "Welcome to your centralized hub. Check off your onboarding tasks and review the context pack materials below."}
      />

      {isAdminOrStaff ? (
        <div className="rounded-xl border border-white/10 bg-black/30 p-5 overflow-hidden">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Intern Progress Overview</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-muted-foreground border-b border-white/10">
                <tr>
                  <th className="py-2 px-3">Intern</th>
                  <th className="py-2 px-3">Progress</th>
                  <th className="py-2 px-3 hidden sm:table-cell">Missing Tasks</th>
                </tr>
              </thead>
              <tbody>
                {interns.map((intern) => {
                  const tasks = intern.intern_tasks || {}
                  const completedCount = defaultTasks.filter(t => tasks[t.id]).length
                  const totalCount = defaultTasks.length
                  const missing = defaultTasks.filter(t => !tasks[t.id])

                  return (
                    <tr key={intern.id} className="border-b border-white/5 last:border-0">
                      <td className="py-3 px-3">
                        <div className="font-medium text-foreground">{intern.display_name || "Unnamed"}</div>
                        <div className="text-xs text-muted-foreground">{intern.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-cyan-500" 
                              style={{ width: `${(completedCount / totalCount) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs">{completedCount} / {totalCount}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 hidden sm:table-cell">
                        {missing.length === 0 ? (
                          <span className="text-xs text-cyan-500">All complete</span>
                        ) : (
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={missing.map(m => m.label).join(", ")}>
                            {missing.map(m => m.label).join(", ")}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {interns.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-muted-foreground">
                      No interns found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2 items-start">
          <InternChecklist initialTasks={profile.intern_tasks} />
          <ActionList title="Playbook Resources" items={playbookLinks} />
        </div>
      )}
    </div>
  )
}

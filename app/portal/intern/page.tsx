import { PageHeader } from "@/components/portal/dashboard/page-header"
import { ActionList, type ActionItem } from "@/components/portal/dashboard/action-list"
import { InternChecklist } from "@/components/portal/intern-checklist"
import { InternTaskManager } from "@/components/portal/intern-task-manager"
import { getPortalSession } from "@/lib/portal/session"
import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import Link from "next/link"

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

  const myTasks = profile.intern_tasks?.tasks || []

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Intern Portal"
        title={isAdminOrStaff ? "Intern Management" : "Intern Dashboard"}
        subtitle={isAdminOrStaff ? "Assign weekly tasks and monitor intern onboarding progress." : "Welcome to your centralized hub. Check off your onboarding tasks and review the context pack materials below."}
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
                  const tasks = intern.intern_tasks?.tasks || []
                  const totalCount = tasks.length
                  const completedCount = tasks.filter((t: any) => t.completed).length
                  const missing = tasks.filter((t: any) => !t.completed)

                  return (
                    <tr key={intern.id} className="border-b border-white/5 last:border-0 align-top">
                      <td className="py-3 px-3 w-1/3">
                        <div className="font-medium text-foreground">{intern.display_name || "Unnamed"}</div>
                        <div className="text-xs text-muted-foreground">{intern.email}</div>
                        <InternTaskManager internId={intern.id} internName={intern.display_name || "Unnamed"} tasks={tasks} />
                      </td>
                      <td className="py-3 px-3 w-1/4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 bg-white/10 rounded-full overflow-hidden shrink-0">
                              <div 
                                className="h-full bg-cyan-500 transition-all" 
                                style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%' }}
                              />
                            </div>
                            <span className="text-xs whitespace-nowrap">{completedCount} / {totalCount}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 hidden sm:table-cell">
                        {totalCount === 0 ? (
                          <span className="text-xs text-muted-foreground">No tasks assigned</span>
                        ) : missing.length === 0 ? (
                          <span className="text-xs text-cyan-500">All complete</span>
                        ) : (
                          <div className="text-xs text-muted-foreground max-w-[250px]" title={missing.map((m: any) => m.label).join(", ")}>
                            {missing.map((m: any) => m.label).join(", ")}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {interns.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-12 text-center">
                      <p className="text-muted-foreground mb-2">No interns found.</p>
                      <p className="text-xs text-muted-foreground">
                        To add an intern, go to the <Link href="/admin/members" className="text-cyan-400 hover:underline">Members Panel</Link> and change a user's role to "intern".
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2 items-start">
          <InternChecklist tasks={myTasks} />
          <ActionList title="Playbook Resources" items={playbookLinks} />
        </div>
      )}
    </div>
  )
}

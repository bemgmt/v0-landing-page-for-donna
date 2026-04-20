"use client"

import type { MemberRole } from "@/lib/auth/roles"

type Row = { id: string; email: string | null; display_name: string | null; role: MemberRole }

export default function MembersRoleSelect({
  rows,
  canAdmin,
}: {
  rows: Row[]
  canAdmin: boolean
}) {
  async function change(id: string, role: MemberRole) {
    if (!canAdmin) return
    const res = await fetch(`/api/admin/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
      credentials: "same-origin",
    })
    if (!res.ok) window.alert("Could not update role.")
  }

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden text-sm">
      <table className="w-full">
        <thead className="bg-white/5 text-left text-muted-foreground">
          <tr>
            <th className="p-3">Member</th>
            <th className="p-3">Email</th>
            <th className="p-3">Role</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-white/10">
              <td className="p-3">{r.display_name ?? "—"}</td>
              <td className="p-3">{r.email ?? "—"}</td>
              <td className="p-3">
                <select
                  disabled={!canAdmin}
                  defaultValue={r.role}
                  onChange={(e) => void change(r.id, e.target.value as MemberRole)}
                  className="rounded bg-black/40 border border-white/15 px-2 py-1 text-xs disabled:opacity-50"
                >
                  <option value="free_member">free_member</option>
                  <option value="partner">partner</option>
                  <option value="staff">staff</option>
                  <option value="admin">admin</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

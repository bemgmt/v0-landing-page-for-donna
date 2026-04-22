"use client"

import { useCallback, useState } from "react"
import type { MemberRole } from "@/lib/auth/roles"

export type MemberBilling = {
  status: string
  stripe_subscription_id: string | null
  current_period_end: string | null
  price_lookup_key: string | null
} | null

export type MemberRow = {
  id: string
  user_id: string
  email: string | null
  display_name: string | null
  role: MemberRole
  billing: MemberBilling
}

function generateTempPassword(): string {
  const alphabet = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const bytes = new Uint8Array(18)
  crypto.getRandomValues(bytes)
  let out = ""
  for (let i = 0; i < 18; i++) {
    out += alphabet[bytes[i]! % alphabet.length]
  }
  return `${out}Aa1`
}

export default function MembersTable({ rows, canAdmin }: { rows: MemberRow[]; canAdmin: boolean }) {
  const [message, setMessage] = useState<{ text: string; tone: "ok" | "err" } | null>(null)
  const [passwordModal, setPasswordModal] = useState<{
    profileId: string
    label: string
    password: string
  } | null>(null)

  const notify = useCallback((text: string, tone: "ok" | "err") => {
    setMessage({ text, tone })
    setTimeout(() => setMessage(null), 6000)
  }, [])

  async function changeRole(id: string, role: MemberRole) {
    if (!canAdmin) return
    const res = await fetch(`/api/admin/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
      credentials: "same-origin",
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      notify((body as { error?: string }).error ?? "Could not update role.", "err")
      return
    }
    notify("Role updated.", "ok")
  }

  async function syncSubscriptionGlobal() {
    if (!canAdmin) return
    const stripe_subscription_id = window.prompt("Stripe subscription id (sub_...)")
    if (!stripe_subscription_id?.trim()) return
    const optionalUser = window.prompt(
      "Optional: this member’s Supabase user_id (UUID). Use if Stripe has no metadata/email match. Leave empty or Cancel to skip.",
    )
    const supabase_user_id =
      optionalUser && typeof optionalUser === "string" && optionalUser.trim().length > 0
        ? optionalUser.trim()
        : undefined
    const res = await fetch("/api/admin/billing/sync-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stripe_subscription_id: stripe_subscription_id.trim(),
        ...(supabase_user_id ? { supabase_user_id } : {}),
      }),
      credentials: "same-origin",
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      notify((body as { error?: string }).error ?? "Sync failed.", "err")
      return
    }
    notify("Subscription synced from Stripe.", "ok")
    window.location.reload()
  }

  async function syncSubscriptionForRow(row: MemberRow) {
    if (!canAdmin) return
    const stripe_subscription_id = window.prompt(
      `Stripe subscription id (sub_...) for ${row.display_name ?? row.email ?? "this member"}`,
    )
    if (!stripe_subscription_id?.trim()) return
    const res = await fetch("/api/admin/billing/sync-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stripe_subscription_id: stripe_subscription_id.trim(),
        supabase_user_id: row.user_id,
      }),
      credentials: "same-origin",
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      notify((body as { error?: string }).error ?? "Sync failed.", "err")
      return
    }
    notify("Subscription synced from Stripe.", "ok")
    window.location.reload()
  }

  async function attachCheckout() {
    if (!canAdmin) return
    const stripe_checkout_session_id = window.prompt("Stripe Checkout session id (cs_...)")
    if (!stripe_checkout_session_id?.trim()) return
    const res = await fetch("/api/admin/billing/attach-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stripe_checkout_session_id: stripe_checkout_session_id.trim() }),
      credentials: "same-origin",
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      notify((body as { error?: string }).error ?? "Attach failed.", "err")
      return
    }
    notify("Checkout session processed.", "ok")
    window.location.reload()
  }

  function openPasswordModal(row: MemberRow) {
    if (!canAdmin) return
    setPasswordModal({
      profileId: row.id,
      label: row.display_name ?? row.email ?? row.id,
      password: generateTempPassword(),
    })
  }

  async function confirmSetPassword() {
    if (!passwordModal) return
    const res = await fetch(`/api/admin/members/${passwordModal.profileId}/password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ new_password: passwordModal.password }),
      credentials: "same-origin",
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      notify((body as { error?: string }).error ?? "Password update failed.", "err")
      return
    }
    notify("Password updated. Share it with the member securely; they will need to sign in again.", "ok")
    setPasswordModal(null)
  }

  return (
    <div className="space-y-3">
      {canAdmin ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void syncSubscriptionGlobal()}
            className="text-xs rounded-lg border border-white/15 bg-black/40 px-3 py-1.5 hover:bg-white/5"
          >
            Sync subscription by id…
          </button>
          <button
            type="button"
            onClick={() => void attachCheckout()}
            className="text-xs rounded-lg border border-white/15 bg-black/40 px-3 py-1.5 hover:bg-white/5"
          >
            Repair from Checkout session id…
          </button>
        </div>
      ) : null}
      {message ? (
        <p className={`text-sm ${message.tone === "err" ? "text-red-400" : "text-cyan-300/90"}`}>{message.text}</p>
      ) : null}
      <div className="rounded-xl border border-white/10 overflow-hidden text-sm">
        <table className="w-full table-fixed">
          <thead className="bg-white/5 text-left text-muted-foreground">
            <tr>
              <th className="p-3 w-[14%]">Member</th>
              <th className="p-3 w-[16%]">Email</th>
              <th className="p-3 w-[12%]">Subscription</th>
              <th className="p-3 w-[12%]">Plan key</th>
              <th className="p-3 w-[12%]">Renews</th>
              <th className="p-3 w-[10%]">Role</th>
              <th className="p-3 w-[24%]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-white/10 align-top">
                <td className="p-3 break-words">{r.display_name ?? "—"}</td>
                <td className="p-3 break-all text-xs">{r.email ?? "—"}</td>
                <td className="p-3 text-xs">
                  {r.billing ? (
                    <>
                      <span className="capitalize text-foreground/90">{r.billing.status.replace("_", " ")}</span>
                      {r.billing.stripe_subscription_id ? (
                        <p className="text-muted-foreground font-mono truncate mt-1" title={r.billing.stripe_subscription_id}>
                          {r.billing.stripe_subscription_id}
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="p-3 font-mono text-xs break-all">{r.billing?.price_lookup_key ?? "—"}</td>
                <td className="p-3 text-xs text-muted-foreground">
                  {r.billing?.current_period_end
                    ? new Date(r.billing.current_period_end).toLocaleDateString()
                    : "—"}
                </td>
                <td className="p-3">
                  <select
                    disabled={!canAdmin}
                    defaultValue={r.role}
                    onChange={(e) => void changeRole(r.id, e.target.value as MemberRole)}
                    className="w-full max-w-[9rem] rounded bg-black/40 border border-white/15 px-2 py-1 text-xs disabled:opacity-50"
                  >
                    <option value="free_member">free_member</option>
                    <option value="partner">partner</option>
                    <option value="staff">staff</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="p-3">
                  {canAdmin ? (
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => openPasswordModal(r)}
                        className="text-left text-xs rounded border border-white/15 px-2 py-1 hover:bg-white/5"
                      >
                        Set password
                      </button>
                      <button
                        type="button"
                        onClick={() => void syncSubscriptionForRow(r)}
                        className="text-left text-xs rounded border border-white/15 px-2 py-1 hover:bg-white/5"
                      >
                        Sync Stripe sub…
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {passwordModal ? (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pw-modal-title"
        >
          <div className="max-w-md w-full rounded-xl border border-white/15 bg-zinc-950 p-5 space-y-3">
            <h2 id="pw-modal-title" className="text-lg font-semibold text-foreground">
              Set password for {passwordModal.label}
            </h2>
            <p className="text-xs text-muted-foreground">
              Copy this password once and share it securely. Existing sessions for this user will end. The member should
              sign in again and change their password from account settings when available.
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                className="flex-1 rounded border border-white/15 bg-black/50 px-2 py-2 text-xs font-mono"
                value={passwordModal.password}
              />
              <button
                type="button"
                className="shrink-0 rounded border border-white/15 px-3 py-2 text-xs hover:bg-white/5"
                onClick={() => void navigator.clipboard.writeText(passwordModal.password)}
              >
                Copy
              </button>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setPasswordModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded animated-edge-button px-4 py-1.5 text-sm"
                onClick={() => void confirmSetPassword()}
              >
                Apply password
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

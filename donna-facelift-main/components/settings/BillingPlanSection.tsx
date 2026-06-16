"use client"

import SettingsSectionWrapper from "./SettingsSectionWrapper"
import { SettingsFormField } from "./SettingsFormField"
import { Button } from "@/components/ui/button"
import { Download, CreditCard, ArrowUp, ArrowDown } from "lucide-react"
import { useFormContext } from "react-hook-form"

export default function BillingPlanSection() {
  const { watch } = useFormContext()
  const planTier = watch("billing.planTier")
  const usageStats = watch("billing.usageStats")
  const invoices = watch("billing.invoices") || []
  const paymentMethods = watch("billing.paymentMethods") || []

  const getTierBadge = (tier: string) => {
    const badges = {
      free: "bg-gray-500/20 text-gray-400",
      pro: "bg-blue-500/20 text-blue-400",
      enterprise: "bg-purple-500/20 text-purple-400",
    }
    return badges[tier as keyof typeof badges] || badges.free
  }

  return (
    <SettingsSectionWrapper
      title="Billing & Plan"
      description="Manage your subscription and billing"
    >
      <div className="space-y-6">
        <div className="p-4 glass border border-white/20 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-md font-medium mb-1">Current Plan</h4>
              <span className={`text-xs px-2 py-1 rounded ${getTierBadge(planTier)}`}>
                {planTier.charAt(0).toUpperCase() + planTier.slice(1)}
              </span>
            </div>
            <div className="flex gap-2">
              {planTier !== "enterprise" && (
                <Button type="button" variant="outline" size="sm">
                  <ArrowUp className="w-4 h-4 mr-2" />
                  Upgrade
                </Button>
              )}
              {planTier !== "free" && (
                <Button type="button" variant="outline" size="sm">
                  <ArrowDown className="w-4 h-4 mr-2" />
                  Downgrade
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 glass border border-white/20 rounded-lg space-y-4">
          <h4 className="text-md font-medium">Usage Statistics</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-white/60 mb-1">Messages This Month</div>
              <div className="text-2xl font-medium">
                {usageStats?.messagesThisMonth?.toLocaleString() || 0}
              </div>
            </div>
            <div>
              <div className="text-sm text-white/60 mb-1">API Calls This Month</div>
              <div className="text-2xl font-medium">
                {usageStats?.apiCallsThisMonth?.toLocaleString() || 0}
              </div>
            </div>
            <div className="col-span-2">
              <div className="text-sm text-white/60 mb-1">Storage Used</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white/10 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        ((usageStats?.storageUsed || 0) / (usageStats?.storageLimit || 1)) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <span className="text-sm">
                  {((usageStats?.storageUsed || 0) / 1024 / 1024).toFixed(2)} MB /{" "}
                  {((usageStats?.storageLimit || 0) / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 glass border border-white/20 rounded-lg space-y-4">
          <h4 className="text-md font-medium">Add-ons</h4>
          {watch("billing.addons")?.length > 0 ? (
            <div className="space-y-2">
              {watch("billing.addons").map((addon: any) => (
                <div
                  key={addon.id}
                  className="flex items-center justify-between p-2 bg-white/5 rounded"
                >
                  <div>
                    <div className="text-sm font-medium">{addon.name}</div>
                    <div className="text-xs text-white/60">${addon.price}/month</div>
                  </div>
                  <SettingsFormField
                    name={`billing.addons.${watch("billing.addons").findIndex((a: any) => a.id === addon.id)}.enabled`}
                    label=""
                    type="switch"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/60">No add-ons available</p>
          )}
        </div>

        <div className="p-4 glass border border-white/20 rounded-lg space-y-4">
          <h4 className="text-md font-medium">Invoices</h4>
          {invoices.length > 0 ? (
            <div className="space-y-2">
              {invoices.map((invoice: any) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-2 bg-white/5 rounded"
                >
                  <div>
                    <div className="text-sm font-medium">
                      {new Date(invoice.date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-white/60">
                      ${invoice.amount.toFixed(2)} • {invoice.status}
                    </div>
                  </div>
                  <Button type="button" variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/60">No invoices yet</p>
          )}
        </div>

        <div className="p-4 glass border border-white/20 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium">Payment Methods</h4>
            <Button type="button" variant="outline" size="sm">
              <CreditCard className="w-4 h-4 mr-2" />
              Add Payment Method
            </Button>
          </div>
          {paymentMethods.length > 0 ? (
            <div className="space-y-2">
              {paymentMethods.map((method: any) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-2 bg-white/5 rounded"
                >
                  <div>
                    <div className="text-sm font-medium">
                      {method.type === "card" && `Card ending in ${method.last4}`}
                      {method.type === "bank" && "Bank Account"}
                      {method.type === "paypal" && "PayPal"}
                      {method.isDefault && (
                        <span className="ml-2 text-xs text-blue-400">(Default)</span>
                      )}
                    </div>
                    {method.expiryMonth && method.expiryYear && (
                      <div className="text-xs text-white/60">
                        Expires {method.expiryMonth}/{method.expiryYear}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/60">No payment methods added</p>
          )}
        </div>
      </div>
    </SettingsSectionWrapper>
  )
}

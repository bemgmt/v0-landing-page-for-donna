"use client"

import { useVertical } from "@/hooks/use-vertical"
import { VERTICALS, type VerticalKey } from "@/lib/constants/verticals"
import { RealEstateDashboard } from "@/components/dashboard/RealEstateDashboard"
import { HospitalityDashboard } from "@/components/dashboard/HospitalityDashboard"
import { ProfessionalServicesDashboard } from "@/components/dashboard/ProfessionalServicesDashboard"
import { CustomDashboardTab } from "@/components/dashboard/CustomDashboardTab"
import { DashboardConfigProvider } from "@/contexts/DashboardConfigContext"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const dashboardComponents: Record<VerticalKey, React.ComponentType> = {
  real_estate: RealEstateDashboard,
  hospitality: HospitalityDashboard,
  professional_services: ProfessionalServicesDashboard,
}

export default function ProtectedPage() {
  const { vertical, isLoading } = useVertical()

  const verticalLabel = vertical
    ? VERTICALS.find((v) => v.key === vertical)?.label
    : null

  const DashboardContent = vertical ? dashboardComponents[vertical] : null

  return (
    <DashboardConfigProvider initialVertical={vertical}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            {verticalLabel
              ? `Welcome to DONNA - ${verticalLabel} Edition`
              : "Welcome to DONNA"}
          </h1>
          <p className="text-white/70 mt-1 text-sm">
            {isLoading
              ? "Loading your dashboard..."
              : verticalLabel
                ? `Your ${verticalLabel} dashboard is ready.`
                : "Please complete onboarding to access your dashboard."}
          </p>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-white/5 border border-white/10 animate-pulse"
              >
                <div className="h-3 bg-white/10 rounded w-1/2 mb-4" />
                <div className="h-6 bg-white/10 rounded w-1/3 mb-2" />
                <div className="h-2 bg-white/8 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && (
          <Tabs defaultValue={vertical ? "vertical" : "custom"} className="space-y-4">
            <TabsList className="bg-white/5 border border-white/10">
              {vertical && (
                <TabsTrigger value="vertical" className="data-[state=active]:bg-white/10">
                  {verticalLabel ?? "Vertical"}
                </TabsTrigger>
              )}
              <TabsTrigger value="custom" className="data-[state=active]:bg-white/10">
                Custom
              </TabsTrigger>
            </TabsList>
            {vertical && (
              <TabsContent value="vertical" className="mt-4">
                {DashboardContent && <DashboardContent />}
              </TabsContent>
            )}
            <TabsContent value="custom" className="mt-4">
              <CustomDashboardTab />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardConfigProvider>
  )
}

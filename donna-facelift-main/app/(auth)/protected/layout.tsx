"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)
  const isOnboarding = pathname?.includes("/onboarding")

  useEffect(() => {
    if (isOnboarding) {
      setIsChecking(false)
      return
    }

    const demoSession = localStorage.getItem("donna_demo_session")
    if (demoSession === "true") {
      setIsChecking(false)
      return
    }

    const checkVertical = async () => {
      try {
        const response = await fetch("/api/user/vertical")

        if (!response.ok) {
          setIsChecking(false)
          return
        }

        const data = await response.json()

        if (!data.vertical) {
          router.push("/protected/onboarding")
          return
        }

        setIsChecking(false)
      } catch (error) {
        console.error("Error checking vertical:", error)
        setIsChecking(false)
      }
    }

    checkVertical()
  }, [pathname, router, isOnboarding])

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/70">Loading...</div>
      </div>
    )
  }

  if (isOnboarding) {
    return <>{children}</>
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-transparent">
        <div className="flex items-center gap-2 px-4 py-2 md:hidden">
          <SidebarTrigger className="text-white/60 hover:text-white" />
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}

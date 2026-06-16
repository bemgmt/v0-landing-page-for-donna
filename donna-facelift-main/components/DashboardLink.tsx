"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'

export function DashboardLink() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const demoSession = localStorage.getItem('donna_demo_session')
    setShow(demoSession === 'true')
  }, [])

  if (!show) return null

  return (
    <Link
      href="/protected"
      className="text-xs opacity-70 hover:opacity-100 transition-opacity"
    >
      Dashboard
    </Link>
  )
}

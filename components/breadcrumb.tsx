"use client"

import { usePathname } from 'next/navigation'
import Link from 'next/link'

export function Breadcrumb() {
  const pathname = usePathname()
  const paths = pathname.split('/').filter(Boolean)
  
  return (
    <nav className="mb-8 text-sm" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-foreground/60">
        <li>
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
        </li>
        {paths.map((path, index) => {
          const href = '/' + paths.slice(0, index + 1).join('/')
          const isLast = index === paths.length - 1
          const displayName = path.charAt(0).toUpperCase() + path.slice(1)
          
          return (
            <li key={href} className="flex items-center">
              <span className="mx-2">/</span>
              {isLast ? (
                <span className="text-foreground font-medium">{displayName}</span>
              ) : (
                <Link href={href} className="hover:text-foreground transition-colors">
                  {displayName}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}


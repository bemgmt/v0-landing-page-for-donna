"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { DinPageHeader } from "@/components/din/layout/din-page-header"
import { BidFilterBar } from "@/components/din/bids/bid-filter-bar"
import { BidGrid } from "@/components/din/bids/bid-grid"
import { bidBoardItems } from "@/lib/din/mock-data/bids"

export default function OpenBidsPage() {
  const [activeBidsOnly, setActiveBidsOnly] = useState(false)
  const [search, setSearch] = useState("")

  const filteredBids = bidBoardItems.filter((bid) => {
    if (activeBidsOnly && bid.status !== "open" && bid.status !== "closing-soon") return false
    if (search && !bid.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <DinPageHeader
        title="Bid Board"
        subtitle="Browse open opportunities across the DONNA Intelligence Network"
      />

      <BidFilterBar
        activeBidsOnly={activeBidsOnly}
        onToggleActive={setActiveBidsOnly}
        searchValue={search}
        onSearchChange={setSearch}
      />

      <BidGrid bids={filteredBids} />

      <div className="mt-6 text-center">
        <p className="text-xs text-white/25">
          Showing {filteredBids.length} of {bidBoardItems.length} opportunities
        </p>
      </div>
    </motion.div>
  )
}

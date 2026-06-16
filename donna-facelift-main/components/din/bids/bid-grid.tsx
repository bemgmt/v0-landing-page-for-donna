import type { BidItem } from "@/lib/din/types"
import { BidCard } from "./bid-card"

interface BidGridProps {
  bids: BidItem[]
}

export function BidGrid({ bids }: BidGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {bids.map((bid) => (
        <BidCard key={bid.id} bid={bid} />
      ))}
    </div>
  )
}

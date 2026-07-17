const ENTITLED_STATUS_PRIORITY: Record<string, number> = {
  trialing: 1,
  active: 2,
}

export type SubscriptionProjection = {
  id: string
  status: string
}

export function isEntitledSubscriptionStatus(status: string): boolean {
  return (ENTITLED_STATUS_PRIORITY[status] ?? 0) > 0
}

/**
 * Decide whether an incoming Stripe subscription should replace the single
 * subscription projected for a portal user.
 *
 * Stripe migrations can leave a customer with overlapping subscriptions. We
 * never let a cancellation for a different subscription replace a current
 * entitlement, and we prefer active subscriptions over trials.
 */
export function shouldProjectIncomingSubscription(
  current: SubscriptionProjection | null,
  incoming: SubscriptionProjection,
): boolean {
  if (!current) return isEntitledSubscriptionStatus(incoming.status)
  if (current.id === incoming.id) return true

  const currentPriority = ENTITLED_STATUS_PRIORITY[current.status] ?? 0
  const incomingPriority = ENTITLED_STATUS_PRIORITY[incoming.status] ?? 0

  if (incomingPriority !== currentPriority) {
    return incomingPriority > currentPriority
  }

  // Equal-priority overlapping subscriptions are ambiguous. Keep the current
  // projection until an explicit admin reconciliation selects another one.
  return false
}

'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/** Recharge la page toutes les 3 secondes (au plus 20 fois), le temps que le paiement soit confirmé. */
export function AutoRefresh({ every = 3000, max = 20 }: { every?: number; max?: number }) {
  const router = useRouter()
  useEffect(() => {
    let n = 0
    const id = setInterval(() => {
      n += 1
      if (n > max) return clearInterval(id)
      router.refresh()
    }, every)
    return () => clearInterval(id)
  }, [router, every, max])
  return null
}

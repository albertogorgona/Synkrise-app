'use client'

import { type ReactNode } from 'react'
import { useHoverContext } from '@/lib/hover-context'

interface Props {
  id: string
  label: string
  children: ReactNode
  className?: string
}

export function TrackableElement({ id, label, children, className }: Props) {
  const { setHoveredElement, clearHoveredElement } = useHoverContext()

  return (
    <div
      className={className}
      onMouseEnter={() => setHoveredElement(id, label)}
      onMouseLeave={() => clearHoveredElement()}
    >
      {children}
    </div>
  )
}

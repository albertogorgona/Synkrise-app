'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

interface HoverState {
  elementId: string | null
  elementLabel: string | null
}

interface HoverContextValue extends HoverState {
  setHoveredElement: (id: string, label: string) => void
  clearHoveredElement: () => void
}

const HoverContext = createContext<HoverContextValue>({
  elementId: null,
  elementLabel: null,
  setHoveredElement: () => {},
  clearHoveredElement: () => {},
})

export function HoverProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HoverState>({ elementId: null, elementLabel: null })

  function setHoveredElement(id: string, label: string) {
    setState({ elementId: id, elementLabel: label })
  }

  function clearHoveredElement() {
    setState({ elementId: null, elementLabel: null })
  }

  return (
    <HoverContext.Provider value={{ ...state, setHoveredElement, clearHoveredElement }}>
      {children}
    </HoverContext.Provider>
  )
}

export function useHoverContext() {
  return useContext(HoverContext)
}

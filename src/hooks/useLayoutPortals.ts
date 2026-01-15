import { createContext, useContext } from 'react'

/**
 * Context for layout portal targets.
 */
export interface LayoutContextType {
  topBarRef: HTMLDivElement | null
  leftPanelRef: HTMLDivElement | null
  rightPanelRef: HTMLDivElement | null
}

export const LayoutContext = createContext<LayoutContextType>({
  topBarRef: null,
  leftPanelRef: null,
  rightPanelRef: null,
})

export const useLayoutPortals = () => useContext(LayoutContext)

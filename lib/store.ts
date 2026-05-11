import { create } from 'zustand'
import type { SalesRow } from './importExcel'

interface DashboardStore {
  data: SalesRow[]
  isImported: boolean
  setData: (data: SalesRow[]) => void
  clearData: () => void
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  data: [],
  isImported: false,
  setData: (data) => set({ data, isImported: true }),
  clearData: () => set({ data: [], isImported: false }),
}))

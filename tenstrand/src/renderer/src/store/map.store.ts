import { create } from 'zustand'

export interface PartnerPin {
  id: string
  name: string
  type: string
  lat: number
  lng: number
  status: string
}

export interface MapFilters {
  gradeBands: string[]
  subjects: string[]
  standards: string[]
  seasons: string[]
  cost: 'free' | 'low' | 'moderate' | 'all'
  groupSize: '<30' | '30-60' | '60+' | 'all'
}

const defaultFilters: MapFilters = {
  gradeBands: [],
  subjects: [],
  standards: [],
  seasons: [],
  cost: 'all',
  groupSize: 'all'
}

interface MapState {
  mapCenter: [number, number]
  radiusMiles: number
  filters: MapFilters
  pinData: PartnerPin[]
  selectedProgramId: string | null
  panelOpen: boolean
  setMapCenter: (center: [number, number]) => void
  setRadius: (r: number) => void
  setFilters: (f: Partial<MapFilters>) => void
  resetFilters: () => void
  setPins: (pins: PartnerPin[]) => void
  selectProgram: (id: string | null) => void
  closePanel: () => void
}

// Default center: California
const CA_CENTER: [number, number] = [37.5, -119.5]

export const useMapStore = create<MapState>((set) => ({
  mapCenter: CA_CENTER,
  radiusMiles: 20,
  filters: defaultFilters,
  pinData: [],
  selectedProgramId: null,
  panelOpen: false,
  setMapCenter: (center) => set({ mapCenter: center }),
  setRadius: (r) => set({ radiusMiles: r }),
  setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
  resetFilters: () => set({ filters: defaultFilters }),
  setPins: (pins) => set({ pinData: pins }),
  selectProgram: (id) => set({ selectedProgramId: id, panelOpen: id != null }),
  closePanel: () => set({ selectedProgramId: null, panelOpen: false })
}))

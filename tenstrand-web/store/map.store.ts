'use client'
import { create } from 'zustand'

export interface PartnerPin {
  id: string
  name: string
  type: string
  lat: number
  lng: number
  status: string
}

export interface ProgramPin {
  id: string
  title: string
  partner_id: string
  partner_name: string
  partner_type: string
  lat: number
  lng: number
  grade_levels: string | null
  subjects: string | null
  cost: number | null
  season: string | null
  max_students?: number | null
  duration_mins?: number | null
}

export interface SchoolPin {
  id: string
  name: string
  lat: number
  lng: number
  enrollment: number | null
  city: string | null
  county: string | null
  district_name: string | null
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
  gradeBands: [], subjects: [], standards: [], seasons: [],
  cost: 'all', groupSize: 'all'
}

interface MapState {
  mapCenter: [number, number]
  radiusMiles: number
  filters: MapFilters
  searchQuery: string
  showPartners: boolean
  showPrograms: boolean
  showSchools: boolean
  pinData: PartnerPin[]
  programPins: ProgramPin[]
  schoolPins: SchoolPin[]
  selectedProgramId: string | null
  panelOpen: boolean
  programPinsVersion: number

  setMapCenter: (center: [number, number]) => void
  setRadius: (r: number) => void
  setFilters: (f: Partial<MapFilters>) => void
  resetFilters: () => void
  setPins: (pins: PartnerPin[]) => void
  setProgramPins: (pins: ProgramPin[]) => void
  setSchoolPins: (pins: SchoolPin[]) => void
  setSearchQuery: (q: string) => void
  setShowPartners: (v: boolean) => void
  setShowPrograms: (v: boolean) => void
  setShowSchools: (v: boolean) => void
  selectProgram: (id: string | null) => void
  closePanel: () => void
  refreshProgramPins: () => void
}

const CA_CENTER: [number, number] = [37.5, -119.5]

export const useMapStore = create<MapState>((set) => ({
  mapCenter: CA_CENTER,
  radiusMiles: 20,
  filters: defaultFilters,
  searchQuery: '',
  showPartners: true,
  showPrograms: true,
  showSchools: false,
  pinData: [],
  programPins: [],
  schoolPins: [],
  selectedProgramId: null,
  panelOpen: false,
  programPinsVersion: 0,

  setMapCenter: (center) => set({ mapCenter: center }),
  setRadius: (r) => set({ radiusMiles: r }),
  setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
  resetFilters: () => set({ filters: defaultFilters }),
  setPins: (pins) => set({ pinData: pins }),
  setProgramPins: (pins) => set({ programPins: pins }),
  setSchoolPins: (pins) => set({ schoolPins: pins }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setShowPartners: (v) => set({ showPartners: v }),
  setShowPrograms: (v) => set({ showPrograms: v }),
  setShowSchools: (v) => set({ showSchools: v }),
  selectProgram: (id) => set({ selectedProgramId: id, panelOpen: id != null }),
  closePanel: () => set({ selectedProgramId: null, panelOpen: false }),
  refreshProgramPins: () => set((s) => ({ programPinsVersion: s.programPinsVersion + 1 })),
}))

'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, GraduationCap, LocateFixed, Minus, Plus, School, Trees } from 'lucide-react'
import { useMapStore, PartnerPin, ProgramPin, SchoolPin } from '@/store/map.store'
import { useAppStore } from '@/store/app.store'
import { getPartnerTypeColor } from '@/lib/utils'
import { invoke } from '@/lib/api'

function parseArray(value: string | null | undefined): string[] {
  if (!value) return []
  try { return JSON.parse(value) } catch { return [] }
}

function gradeBandMatch(gradeLevels: string | null, bands: string[]) {
  if (!bands.length) return true
  const bandMap: Record<string, string[]> = {
    'TK-2': ['TK', 'K', '1', '2'],
    '3-5': ['3', '4', '5'],
    '6-8': ['6', '7', '8'],
    '9-12': ['9', '10', '11', '12'],
  }
  const grades = parseArray(gradeLevels)
  return bands.some((band) => bandMap[band]?.some((grade) => grades.includes(grade)))
}

function overlaps(value: string | null, filters: string[]) {
  if (!filters.length) return true
  const arr = parseArray(value)
  return filters.some((filter) => arr.includes(filter))
}

function costMatch(cost: number | null, filter: string) {
  if (filter === 'all') return true
  if (filter === 'free') return !cost || cost === 0
  if (filter === 'low') return cost != null && cost > 0 && cost < 10
  if (filter === 'moderate') return cost != null && cost >= 10
  return true
}

function groupSizeMatch(maxStudents: number | null | undefined, filter: string) {
  if (filter === 'all') return true
  if (maxStudents == null) return false
  if (filter === '<30') return maxStudents < 30
  if (filter === '30-60') return maxStudents >= 30 && maxStudents <= 60
  if (filter === '60+') return maxStudents > 60
  return true
}

function pinIcon(L: any, color: string, shape: 'circle' | 'square' | 'school' | 'teacher') {
  const html = shape === 'teacher'
    ? `<div style="width:30px;height:30px;border-radius:999px;background:white;border:3px solid ${color};box-shadow:0 4px 12px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;color:${color};font-size:15px;font-weight:800">T</div>`
    : shape === 'school'
      ? `<div style="width:22px;height:22px;border-radius:999px;background:#4F46E5;border:2px solid white;box-shadow:0 3px 8px rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:800">S</div>`
      : shape === 'square'
        ? `<div style="width:23px;height:23px;border-radius:6px;background:${color};border:2px solid white;box-shadow:0 3px 8px rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:800">P</div>`
        : `<div style="width:26px;height:26px;border-radius:999px;background:${color};border:2px solid white;box-shadow:0 3px 8px rgba(0,0,0,.22)"></div>`

  const size = shape === 'teacher' ? 30 : shape === 'circle' ? 26 : 23
  return L.divIcon({ className: '', html, iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size / 2] })
}

export function MapView() {
  const mapRef = useRef<any>(null)
  const mapNodeRef = useRef<HTMLDivElement>(null)
  const layersRef = useRef<{ partners?: any; programs?: any; schools?: any; teacher?: any; radius?: any }>({})
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  const {
    pinData, setPins, programPins, setProgramPins, schoolPins, setSchoolPins,
    radiusMiles, mapCenter, selectProgram, filters, searchQuery,
    showPartners, showPrograms, showSchools, programPinsVersion
  } = useMapStore()
  const activeTeacher = useAppStore((s) => s.activeTeacher)

  useEffect(() => {
    Promise.all([
      invoke<PartnerPin[]>('partner:listForMap').catch(() => []),
      invoke<ProgramPin[]>('insights:programsForMap').catch(() => []),
      invoke<SchoolPin[]>('insights:schoolsForMap').catch(() => []),
    ]).then(([partners, programs, schools]) => {
      setPins(partners)
      setProgramPins(programs)
      setSchoolPins(schools)
    })
  }, [setPins, setProgramPins, setSchoolPins])

  useEffect(() => {
    if (programPinsVersion === 0) return
    invoke<ProgramPin[]>('insights:programsForMap').catch(() => []).then(setProgramPins)
  }, [programPinsVersion, setProgramPins])

  const q = searchQuery.trim().toLowerCase()
  const visiblePartners = useMemo(() => {
    if (!showPartners) return []
    return pinData.filter((p) => p.lat != null && p.lng != null && (!q || p.name.toLowerCase().includes(q)))
  }, [pinData, q, showPartners])

  const visiblePrograms = useMemo(() => {
    if (!showPrograms) return []
    return programPins.filter((p) => {
      if (p.lat == null || p.lng == null) return false
      if (q && !p.title.toLowerCase().includes(q) && !p.partner_name.toLowerCase().includes(q)) return false
      if (!gradeBandMatch(p.grade_levels, filters.gradeBands)) return false
      if (!overlaps(p.subjects, filters.subjects)) return false
      if (!overlaps(p.season, filters.seasons)) return false
      if (!costMatch(p.cost, filters.cost)) return false
      if (!groupSizeMatch(p.max_students, filters.groupSize)) return false
      return true
    })
  }, [programPins, q, filters, showPrograms])

  const visibleSchools = useMemo(() => {
    if (!showSchools) return []
    return schoolPins.filter((s) => s.lat != null && s.lng != null && (!q || s.name.toLowerCase().includes(q)))
  }, [schoolPins, q, showSchools])

  useEffect(() => {
    if (mapRef.current || !mapNodeRef.current) return
    let cancelled = false

    import('leaflet').then(({ default: L }) => {
      if (cancelled || !mapNodeRef.current) return

      const map = L.map(mapNodeRef.current, {
        center: activeTeacher?.lat && activeTeacher?.lng ? [activeTeacher.lat, activeTeacher.lng] : mapCenter,
        zoom: activeTeacher?.lat && activeTeacher?.lng ? 9 : 6,
        zoomControl: false,
        preferCanvas: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map)

      layersRef.current.partners = L.layerGroup().addTo(map)
      layersRef.current.programs = L.layerGroup().addTo(map)
      layersRef.current.schools = L.layerGroup().addTo(map)
      layersRef.current.teacher = L.layerGroup().addTo(map)
      mapRef.current = map
      setMapReady(true)
      setTimeout(() => map.invalidateSize(), 50)
    }).catch((err) => {
      console.error('Map failed to initialize', err)
      setMapError(err?.message || 'Map failed to initialize')
    })

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [activeTeacher?.lat, activeTeacher?.lng, mapCenter])

  useEffect(() => {
    if (!mapReady || !mapRef.current) return

    import('leaflet').then(({ default: L }) => {
      const map = mapRef.current
      layersRef.current.partners?.clearLayers()
      layersRef.current.programs?.clearLayers()
      layersRef.current.schools?.clearLayers()
      layersRef.current.teacher?.clearLayers()
      if (layersRef.current.radius) {
        layersRef.current.radius.remove()
        layersRef.current.radius = null
      }

      const bounds: [number, number][] = []

      for (const partner of visiblePartners) {
        const color = getPartnerTypeColor(partner.type)
        const marker = L.marker([partner.lat, partner.lng], { icon: pinIcon(L, color, 'circle') })
        marker.bindPopup(`<strong>${partner.name}</strong><br/><span>Partner</span>`)
        marker.on('click', () => {
          invoke<any[]>('program:list', { partnerId: partner.id })
            .then((programs) => { if (programs.length > 0) selectProgram(programs[0].id) })
            .catch(console.error)
        })
        marker.addTo(layersRef.current.partners)
        bounds.push([partner.lat, partner.lng])
      }

      for (const program of visiblePrograms) {
        const color = getPartnerTypeColor(program.partner_type)
        const marker = L.marker([program.lat, program.lng], { icon: pinIcon(L, color, 'square') })
        marker.bindPopup(`<strong>${program.title}</strong><br/><span>${program.partner_name}</span>`)
        marker.on('click', () => selectProgram(program.id))
        marker.addTo(layersRef.current.programs)
        bounds.push([program.lat, program.lng])
      }

      for (const school of visibleSchools) {
        const marker = L.marker([school.lat, school.lng], { icon: pinIcon(L, '#4F46E5', 'school') })
        marker.bindPopup(`<strong>${school.name}</strong><br/><span>${school.enrollment ? `${school.enrollment.toLocaleString()} students` : 'School'}</span>`)
        marker.addTo(layersRef.current.schools)
        bounds.push([school.lat, school.lng])
      }

      if (activeTeacher?.lat && activeTeacher?.lng) {
        L.marker([activeTeacher.lat, activeTeacher.lng], { icon: pinIcon(L, '#134d2a', 'teacher') })
          .bindPopup(`<strong>${activeTeacher.name}</strong><br/><span>Active teacher</span>`)
          .addTo(layersRef.current.teacher)
        layersRef.current.radius = L.circle([activeTeacher.lat, activeTeacher.lng], {
          radius: radiusMiles * 1609.34,
          color: '#1B6B3A',
          weight: 1.5,
          fillColor: '#1B6B3A',
          fillOpacity: 0.06,
          dashArray: '4 4',
        }).addTo(map)
        bounds.push([activeTeacher.lat, activeTeacher.lng])
      }

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: activeTeacher ? 10 : 7 })
      }
      setTimeout(() => map.invalidateSize(), 0)
    })
  }, [mapReady, visiblePartners, visiblePrograms, visibleSchools, activeTeacher?.id, activeTeacher?.lat, activeTeacher?.lng, activeTeacher?.name, radiusMiles, selectProgram])

  const zoomIn = () => mapRef.current?.zoomIn()
  const zoomOut = () => mapRef.current?.zoomOut()
  const centerTeacher = () => {
    if (mapRef.current && activeTeacher?.lat && activeTeacher?.lng) {
      mapRef.current.setView([activeTeacher.lat, activeTeacher.lng], 10)
    }
  }

  return (
    <div className="flex-1 w-full h-full min-h-[560px] relative overflow-hidden bg-[#D8EEF4]">
      <div ref={mapNodeRef} className="absolute inset-0" />

      <div className="absolute left-4 top-4 z-[500] bg-white/95 border border-app-border rounded-xl shadow-sm px-3 py-2">
        <p className="text-xs font-semibold text-gray-900">California Program Map</p>
        <p className="text-[11px] text-gray-500 mt-0.5">{visiblePrograms.length} programs · {visiblePartners.length} partners · {visibleSchools.length} schools</p>
      </div>

      <div className="absolute right-4 top-4 z-[500] bg-white border border-app-border rounded-xl shadow-sm overflow-hidden">
        <button onClick={zoomIn} className="flex w-9 h-9 items-center justify-center hover:bg-gray-50 border-b border-app-border" title="Zoom in"><Plus className="w-4 h-4 text-gray-700" /></button>
        <button onClick={zoomOut} className="flex w-9 h-9 items-center justify-center hover:bg-gray-50 border-b border-app-border" title="Zoom out"><Minus className="w-4 h-4 text-gray-700" /></button>
        <button onClick={centerTeacher} className="flex w-9 h-9 items-center justify-center hover:bg-gray-50 disabled:opacity-40" disabled={!activeTeacher?.lat || !activeTeacher?.lng} title="Center active teacher"><LocateFixed className="w-4 h-4 text-gray-700" /></button>
      </div>

      <div className="absolute bottom-4 left-4 z-[500] bg-white/95 border border-app-border rounded-xl shadow-sm p-3 space-y-1.5">
        <Legend icon={Trees} label="Partner" color="#1B6B3A" />
        <Legend icon={BookOpen} label="Program" color="#2563EB" />
        <Legend icon={School} label="School" color="#4F46E5" />
        <Legend icon={GraduationCap} label="Active teacher" color="#134d2a" />
      </div>

      {mapError && (
        <div className="absolute inset-0 z-[700] bg-white/95 flex items-center justify-center p-6 text-center">
          <div>
            <p className="text-sm font-semibold text-gray-900">Map failed to initialize</p>
            <p className="text-xs text-gray-500 mt-1">{mapError}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function Legend({ icon: Icon, label, color }: { icon: any; label: string; color: string }) {
  return <div className="flex items-center gap-2 text-xs text-gray-600"><span className="flex w-4 h-4 rounded items-center justify-center" style={{ backgroundColor: color }}><Icon className="w-2.5 h-2.5 text-white" /></span>{label}</div>
}

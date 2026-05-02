'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, GraduationCap, Layers, LocateFixed, Maximize2, Minimize2, Minus, Navigation, Plus, School, Trees, X } from 'lucide-react'
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

type TileStyle = 'standard' | 'satellite' | 'terrain'

const TILE_URLS: Record<TileStyle, { url: string; attribution: string }> = {
  standard: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Esri, DigitalGlobe, GeoEye',
  },
  terrain: {
    url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png',
    attribution: '&copy; Stamen Design &mdash; OpenStreetMap contributors',
  },
}

function pinIcon(L: any, color: string, shape: 'circle' | 'square' | 'school' | 'teacher', label?: string) {
  let html: string
  if (shape === 'teacher') {
    html = `<div style="width:34px;height:34px;border-radius:999px;background:white;border:3px solid ${color};box-shadow:0 4px 14px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;color:${color};font-size:14px;font-weight:900">T</div>`
  } else if (shape === 'school') {
    html = `<div style="width:24px;height:24px;border-radius:999px;background:#4F46E5;border:2.5px solid white;box-shadow:0 3px 10px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:900">S</div>`
  } else if (shape === 'square') {
    html = `<div style="width:26px;height:26px;border-radius:8px;background:${color};border:2.5px solid white;box-shadow:0 3px 10px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:900">P</div>`
  } else {
    html = `<div style="width:28px;height:28px;border-radius:999px;background:${color};border:2.5px solid white;box-shadow:0 3px 10px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:700">${label ? label[0].toUpperCase() : ''}</div>`
  }
  const size = shape === 'teacher' ? 34 : shape === 'circle' ? 28 : 26
  return L.divIcon({ className: '', html, iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -(size / 2) - 4] })
}

function clusterIcon(L: any, count: number) {
  const size = count > 100 ? 52 : count > 20 ? 44 : 36
  const color = count > 100 ? '#0d4a28' : count > 20 ? '#1B6B3A' : '#2d9e5f'
  const html = `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 4px 14px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;color:white;font-size:${count > 99 ? 11 : 13}px;font-weight:800">${count > 99 ? '99+' : count}</div>`
  return L.divIcon({ className: '', html, iconSize: [size, size], iconAnchor: [size / 2, size / 2] })
}

function richPopup(title: string, subtitle: string, tags: string[], extra?: string) {
  const tagHtml = tags.length
    ? tags.slice(0, 4).map((t) => `<span style="display:inline-block;padding:2px 8px;margin:2px;background:#e8f5ee;color:#1B6B3A;border-radius:99px;font-size:10px;font-weight:600">${t}</span>`).join('')
    : ''
  return `<div style="min-width:180px;max-width:260px;font-family:system-ui,sans-serif">
    <p style="font-size:13px;font-weight:700;color:#111;margin:0 0 2px">${title}</p>
    <p style="font-size:11px;color:#888;margin:0 0 6px">${subtitle}</p>
    ${tagHtml ? `<div style="margin-bottom:4px">${tagHtml}</div>` : ''}
    ${extra ? `<p style="font-size:11px;color:#666;margin:4px 0 0">${extra}</p>` : ''}
  </div>`
}

export function MapView() {
  const mapRef = useRef<any>(null)
  const mapNodeRef = useRef<HTMLDivElement>(null)
  const tileRef = useRef<any>(null)
  const layersRef = useRef<{ partners?: any; programs?: any; schools?: any; teacher?: any; radius?: any }>({})
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [tileStyle, setTileStyle] = useState<TileStyle>('standard')
  const [showLayerMenu, setShowLayerMenu] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

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

  // Initialize map
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
        attributionControl: true,
      })

      tileRef.current = L.tileLayer(TILE_URLS.standard.url, {
        attribution: TILE_URLS.standard.attribution,
        maxZoom: 19,
      }).addTo(map)

      layersRef.current.partners = L.layerGroup().addTo(map)
      layersRef.current.programs = L.layerGroup().addTo(map)
      layersRef.current.schools = L.layerGroup().addTo(map)
      layersRef.current.teacher = L.layerGroup().addTo(map)

      // Scale control
      L.control.scale({ imperial: true, metric: true, position: 'bottomright' }).addTo(map)

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

  // Switch tile layer on style change
  useEffect(() => {
    if (!mapReady || !mapRef.current || !tileRef.current) return
    import('leaflet').then(({ default: L }) => {
      tileRef.current.remove()
      const cfg = TILE_URLS[tileStyle]
      tileRef.current = L.tileLayer(cfg.url, { attribution: cfg.attribution, maxZoom: 19 })
      tileRef.current.addTo(mapRef.current)
      tileRef.current.bringToBack()
    })
  }, [tileStyle, mapReady])

  // Update markers
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

      // Partner markers with clustering
      const partnerCluster = (L as any).markerClusterGroup
        ? (L as any).markerClusterGroup({ iconCreateFunction: (cluster: any) => clusterIcon(L, cluster.getChildCount()), maxClusterRadius: 50, showCoverageOnHover: false })
        : layersRef.current.partners

      const useCluster = !!(L as any).markerClusterGroup

      for (const partner of visiblePartners) {
        const color = getPartnerTypeColor(partner.type)
        const marker = L.marker([partner.lat, partner.lng], { icon: pinIcon(L, color, 'circle', partner.name) })
        const subjects: string[] = []
        const popupContent = richPopup(partner.name, `Partner · ${partner.type ?? 'Organization'}`, subjects)
        marker.bindPopup(popupContent, { maxWidth: 280 })
        marker.on('click', () => {
          invoke<any[]>('program:list', { partnerId: partner.id })
            .then((programs) => { if (programs.length > 0) selectProgram(programs[0].id) })
            .catch(console.error)
        })
        if (useCluster) {
          partnerCluster.addLayer(marker)
        } else {
          marker.addTo(layersRef.current.partners)
        }
        bounds.push([partner.lat, partner.lng])
      }
      if (useCluster && visiblePartners.length > 0) {
        partnerCluster.addTo(map)
        layersRef.current.partners = partnerCluster
      }

      // Program markers
      for (const program of visiblePrograms) {
        const color = getPartnerTypeColor(program.partner_type)
        const subjects = parseArray(program.subjects)
        const grades = parseArray(program.grade_levels)
        const extra = grades.length > 0 ? `Grades: ${grades.slice(0, 5).join(', ')}` : undefined
        const marker = L.marker([program.lat, program.lng], { icon: pinIcon(L, color, 'square') })
        marker.bindPopup(richPopup(program.title, program.partner_name, subjects.slice(0, 3), extra), { maxWidth: 280 })
        marker.on('click', () => selectProgram(program.id))
        marker.addTo(layersRef.current.programs)
        bounds.push([program.lat, program.lng])
      }

      // School markers
      for (const school of visibleSchools) {
        const marker = L.marker([school.lat, school.lng], { icon: pinIcon(L, '#4F46E5', 'school') })
        marker.bindPopup(richPopup(school.name, 'School', [], school.enrollment ? `${school.enrollment.toLocaleString()} students` : undefined), { maxWidth: 280 })
        marker.addTo(layersRef.current.schools)
        bounds.push([school.lat, school.lng])
      }

      // Active teacher marker + radius
      if (activeTeacher?.lat && activeTeacher?.lng) {
        const teacherMarker = L.marker([activeTeacher.lat, activeTeacher.lng], { icon: pinIcon(L, '#134d2a', 'teacher') })
        teacherMarker.bindPopup(richPopup(activeTeacher.name, 'Active teacher', []))
        teacherMarker.addTo(layersRef.current.teacher)

        layersRef.current.radius = L.circle([activeTeacher.lat, activeTeacher.lng], {
          radius: radiusMiles * 1609.34,
          color: '#1B6B3A',
          weight: 2,
          fillColor: '#1B6B3A',
          fillOpacity: 0.07,
          dashArray: '6 5',
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
      mapRef.current.setView([activeTeacher.lat, activeTeacher.lng], 11, { animate: true })
    }
  }

  const locateMe = useCallback(() => {
    if (!mapRef.current || !('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 11, { animate: true })
      },
      () => {},
      { timeout: 8000 }
    )
  }, [])

  const toggleFullscreen = () => {
    const el = containerRef.current
    if (!el) return
    if (!isFullscreen) {
      el.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) setIsFullscreen(false)
    }
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const totalVisible = visiblePrograms.length + visiblePartners.length + visibleSchools.length

  return (
    <div ref={containerRef} className="flex-1 w-full h-full min-h-[560px] relative overflow-hidden bg-[#D8EEF4]">
      <div ref={mapNodeRef} className="absolute inset-0" />

      {/* Stats badge */}
      <div className="absolute left-4 top-4 z-[500] bg-white/95 backdrop-blur-sm border border-app-border rounded-xl shadow-sm px-3 py-2">
        <p className="text-xs font-semibold text-gray-900">California Program Map</p>
        <p className="text-[11px] text-gray-500 mt-0.5">
          {visiblePrograms.length} programs · {visiblePartners.length} partners · {visibleSchools.length} schools
        </p>
        {totalVisible === 0 && (
          <p className="text-[10px] text-amber-600 mt-0.5">No results — try removing filters</p>
        )}
      </div>

      {/* Map controls */}
      <div className="absolute right-4 top-4 z-[500] flex flex-col gap-1.5">
        {/* Zoom + center controls */}
        <div className="bg-white border border-app-border rounded-xl shadow-sm overflow-hidden">
          <button onClick={zoomIn} className="flex w-9 h-9 items-center justify-center hover:bg-gray-50 border-b border-app-border" title="Zoom in">
            <Plus className="w-4 h-4 text-gray-700" />
          </button>
          <button onClick={zoomOut} className="flex w-9 h-9 items-center justify-center hover:bg-gray-50 border-b border-app-border" title="Zoom out">
            <Minus className="w-4 h-4 text-gray-700" />
          </button>
          <button onClick={centerTeacher} className="flex w-9 h-9 items-center justify-center hover:bg-gray-50 border-b border-app-border disabled:opacity-40" disabled={!activeTeacher?.lat} title="Center on teacher">
            <LocateFixed className="w-4 h-4 text-gray-700" />
          </button>
          <button onClick={locateMe} className="flex w-9 h-9 items-center justify-center hover:bg-gray-50" title="Use my location">
            <Navigation className="w-4 h-4 text-gray-700" />
          </button>
        </div>

        {/* Layer toggle */}
        <div className="relative">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="flex w-9 h-9 items-center justify-center bg-white border border-app-border rounded-xl shadow-sm hover:bg-gray-50"
            title="Map style"
          >
            <Layers className="w-4 h-4 text-gray-700" />
          </button>
          {showLayerMenu && (
            <div className="absolute right-0 top-10 bg-white border border-app-border rounded-xl shadow-lg overflow-hidden w-36 z-[600]">
              {([['standard', 'Standard'], ['satellite', 'Satellite'], ['terrain', 'Terrain']] as [TileStyle, string][]).map(([style, label]) => (
                <button
                  key={style}
                  onClick={() => { setTileStyle(style); setShowLayerMenu(false) }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors flex items-center gap-2 ${tileStyle === style ? 'bg-brand-light text-brand' : 'hover:bg-gray-50 text-gray-700'}`}
                >
                  <span className={`w-2 h-2 rounded-full ${tileStyle === style ? 'bg-brand' : 'bg-gray-300'}`} />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="flex w-9 h-9 items-center justify-center bg-white border border-app-border rounded-xl shadow-sm hover:bg-gray-50"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4 text-gray-700" /> : <Maximize2 className="w-4 h-4 text-gray-700" />}
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-8 left-4 z-[500] bg-white/95 backdrop-blur-sm border border-app-border rounded-xl shadow-sm p-3 space-y-1.5">
        <Legend icon={Trees} label="Partner" color="#1B6B3A" />
        <Legend icon={BookOpen} label="Program" color="#2563EB" />
        <Legend icon={School} label="School" color="#4F46E5" />
        <Legend icon={GraduationCap} label="Active teacher" color="#134d2a" />
      </div>

      {/* Close layer menu on outside click */}
      {showLayerMenu && (
        <div className="fixed inset-0 z-[590]" onClick={() => setShowLayerMenu(false)} />
      )}

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
  return (
    <div className="flex items-center gap-2 text-xs text-gray-600">
      <span className="flex w-4 h-4 rounded items-center justify-center" style={{ backgroundColor: color }}>
        <Icon className="w-2.5 h-2.5 text-white" />
      </span>
      {label}
    </div>
  )
}

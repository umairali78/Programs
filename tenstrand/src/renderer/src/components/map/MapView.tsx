import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet.markercluster'
import { useMapStore, PartnerPin } from '@/store/map.store'
import { useAppStore } from '@/store/app.store'
import { getPartnerTypeColor } from '@/lib/utils'
import { invoke } from '@/lib/api'

function createPinIcon(type: string): L.DivIcon {
  const color = getPartnerTypeColor(type)
  return L.divIcon({
    className: '',
    html: `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="${color}" opacity="0.9" stroke="white" stroke-width="2"/>
    </svg>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  })
}

export function MapView() {
  const mapRef = useRef<L.Map | null>(null)
  const mapDivRef = useRef<HTMLDivElement>(null)
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null)
  const radiusCircleRef = useRef<L.Circle | null>(null)
  const { pinData, setPins, radiusMiles, mapCenter, selectProgram, filters } = useMapStore()
  const activeTeacher = useAppStore((s) => s.activeTeacher)

  // Initialize map
  useEffect(() => {
    if (mapRef.current || !mapDivRef.current) return

    const map = L.map(mapDivRef.current, {
      center: mapCenter,
      zoom: 9,
      zoomControl: true
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18
    }).addTo(map)

    const clusterGroup = (L as any).markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      showCoverageOnHover: false
    })
    map.addLayer(clusterGroup)

    mapRef.current = map
    clusterGroupRef.current = clusterGroup

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Update map center when teacher changes
  useEffect(() => {
    if (!mapRef.current) return
    if (activeTeacher?.lat && activeTeacher?.lng) {
      mapRef.current.setView([activeTeacher.lat, activeTeacher.lng], 10)
    }
  }, [activeTeacher?.id])

  // Load partner pins
  useEffect(() => {
    invoke<PartnerPin[]>('partner:listForMap')
      .then((pins) => setPins(pins))
      .catch(console.error)
  }, [])

  // Render pins when pinData or filters change
  useEffect(() => {
    if (!clusterGroupRef.current) return

    clusterGroupRef.current.clearLayers()

    for (const pin of pinData) {
      if (!pin.lat || !pin.lng) continue

      const marker = L.marker([pin.lat, pin.lng], {
        icon: createPinIcon(pin.type)
      })

      marker.bindTooltip(pin.name, { direction: 'top', offset: [0, -10] })
      marker.on('click', () => {
        // Find a program for this partner to show in the card
        invoke<any[]>('program:list', { partnerId: pin.id })
          .then((programs) => {
            if (programs.length > 0) {
              selectProgram(programs[0].id)
            }
          })
          .catch(console.error)
      })

      clusterGroupRef.current.addLayer(marker)
    }
  }, [pinData])

  // Update radius circle
  useEffect(() => {
    if (!mapRef.current) return

    if (radiusCircleRef.current) {
      radiusCircleRef.current.remove()
      radiusCircleRef.current = null
    }

    const center =
      activeTeacher?.lat && activeTeacher?.lng
        ? ([activeTeacher.lat, activeTeacher.lng] as [number, number])
        : mapCenter

    const radiusMeters = radiusMiles * 1609.34

    radiusCircleRef.current = L.circle(center, {
      radius: radiusMeters,
      color: '#1B6B3A',
      weight: 1.5,
      fillColor: '#1B6B3A',
      fillOpacity: 0.05,
      dashArray: '4 4'
    }).addTo(mapRef.current)
  }, [radiusMiles, activeTeacher?.lat, activeTeacher?.lng])

  return (
    <div
      ref={mapDivRef}
      className="flex-1 w-full h-full"
      style={{ minHeight: 0 }}
    />
  )
}

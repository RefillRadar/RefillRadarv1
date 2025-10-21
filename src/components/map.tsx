"use client"

import { useEffect, useRef } from 'react'

interface MapProps {
  center: [number, number]
  zoom: number
  radius: number
  pharmacies: Array<{
    id: string
    name: string
    address: string
    lat: number
    lng: number
    phone?: string
  }>
}

export default function Map({ center, zoom, radius, pharmacies }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return

    const initMap = async () => {
      // Dynamically import Leaflet to avoid SSR issues
      const L = (await import('leaflet')).default

      // Fix for default marker icons in webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      })

      // Initialize map
      if (!mapInstanceRef.current && mapRef.current) {
        mapInstanceRef.current = L.map(mapRef.current).setView(center, zoom)

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstanceRef.current)
      }

      const map = mapInstanceRef.current

      // Clear existing markers and circles
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker || layer instanceof L.Circle) {
          map.removeLayer(layer)
        }
      })

      // Add radius circle
      L.circle(center, {
        color: '#06b6d4',
        fillColor: '#06b6d4',
        fillOpacity: 0.1,
        radius: radius * 1609.34 // Convert miles to meters
      }).addTo(map)

      // Add center marker
      L.marker(center).addTo(map)
        .bindPopup('Your Location')

      // Add pharmacy markers
      pharmacies.forEach(pharmacy => {
        const marker = L.marker([pharmacy.lat, pharmacy.lng]).addTo(map)
        
        const popupContent = `
          <div>
            <h3 style="margin: 0 0 8px 0; font-weight: bold;">${pharmacy.name}</h3>
            <p style="margin: 0 0 4px 0; font-size: 14px;">${pharmacy.address}</p>
            ${pharmacy.phone ? `<p style="margin: 0; font-size: 14px;">📞 ${pharmacy.phone}</p>` : ''}
          </div>
        `
        
        marker.bindPopup(popupContent)
      })

      // Fit map to show all markers if there are pharmacies
      if (pharmacies.length > 0) {
        const group = L.featureGroup([
          L.marker(center),
          ...pharmacies.map(p => L.marker([p.lat, p.lng]))
        ])
        map.fitBounds(group.getBounds().pad(0.1))
      }
    }

    initMap()

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [center, zoom, radius, pharmacies])

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
        integrity="sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A=="
        crossOrigin=""
      />
      <div 
        ref={mapRef} 
        className="w-full h-full min-h-[400px] rounded-lg"
        style={{ minHeight: '400px' }}
      />
    </>
  )
}
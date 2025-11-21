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

        // Use dark theme map tiles with API key
        const stadiaApiKey = process.env.NEXT_PUBLIC_STADIA_MAPS_API_KEY
        
        if (stadiaApiKey) {
          // Use Stadia Maps with API key
          L.tileLayer(`https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=${stadiaApiKey}`, {
            attribution: '© Stadia Maps, © OpenMapTiles, © OpenStreetMap contributors',
            maxZoom: 20
          }).addTo(mapInstanceRef.current)
        } else {
          // Fallback to OpenStreetMap tiles if no API key
          console.warn('NEXT_PUBLIC_STADIA_MAPS_API_KEY not found, using OpenStreetMap fallback')
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
          }).addTo(mapInstanceRef.current)
        }
      }

      const map = mapInstanceRef.current

      // Clear existing markers and circles
      map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker || layer instanceof L.Circle) {
          map.removeLayer(layer)
        }
      })

      // Add radius circle with modern styling
      L.circle(center, {
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.08,
        weight: 2,
        opacity: 0.8,
        radius: radius * 1609.34 // Convert miles to meters
      }).addTo(map)

      // Add custom center marker
      const centerIcon = L.divIcon({
        className: 'custom-center-marker',
        html: `
          <div style="
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            position: relative;
          ">
            <div style="
              position: absolute;
              top: -8px;
              left: -8px;
              width: 12px;
              height: 12px;
              background: #3b82f6;
              border-radius: 50%;
              animation: pulse 2s infinite;
            "></div>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })
      
      L.marker(center, { icon: centerIcon }).addTo(map)
        .bindPopup(`
          <div style="
            background: linear-gradient(135deg, #1f2937, #374151);
            color: white;
            padding: 12px;
            border-radius: 8px;
            border: none;
            font-family: system-ui;
          ">
            <h3 style="margin: 0 0 4px 0; font-weight: 600; color: #60a5fa;">📍 Search Center</h3>
            <p style="margin: 0; font-size: 13px; color: #d1d5db;">Zip: ${mapRef.current?.dataset?.zipcode || 'Unknown'}</p>
            <p style="margin: 2px 0 0 0; font-size: 13px; color: #d1d5db;">Radius: ${radius} miles</p>
          </div>
        `, {
          className: 'custom-popup'
        })

      // Add custom pharmacy markers
      pharmacies.forEach(pharmacy => {
        // Custom pharmacy icon
        const pharmacyIcon = L.divIcon({
          className: 'custom-pharmacy-marker',
          html: `
            <div style="
              background: linear-gradient(135deg, #10b981, #059669);
              width: 32px;
              height: 32px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 3px 12px rgba(0,0,0,0.4);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              transition: all 0.3s ease;
            " onmouseover="this.style.transform='scale(1.1)'; this.style.boxShadow='0 4px 20px rgba(16, 185, 129, 0.4)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 3px 12px rgba(0,0,0,0.4)'">
              💊
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
        
        const marker = L.marker([pharmacy.lat, pharmacy.lng], { icon: pharmacyIcon }).addTo(map)
        
        const popupContent = `
          <div style="
            background: linear-gradient(135deg, #1f2937, #374151);
            color: white;
            padding: 16px;
            border-radius: 12px;
            border: none;
            font-family: system-ui;
            min-width: 250px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          ">
            <h3 style="
              margin: 0 0 8px 0;
              font-weight: 600;
              font-size: 16px;
              color: #10b981;
              display: flex;
              align-items: center;
              gap: 6px;
            ">💊 ${pharmacy.name}</h3>
            <p style="
              margin: 0 0 8px 0;
              font-size: 14px;
              color: #d1d5db;
              line-height: 1.4;
            ">📍 ${pharmacy.address}</p>
            ${pharmacy.phone ? `
              <p style="
                margin: 0 0 8px 0;
                font-size: 14px;
                color: #60a5fa;
                display: flex;
                align-items: center;
                gap: 4px;
              ">📞 ${pharmacy.phone}</p>
            ` : ''}
            <div style="
              margin-top: 12px;
              padding-top: 8px;
              border-top: 1px solid #4b5563;
              font-size: 12px;
              color: #9ca3af;
            ">
              <span style="background: #374151; padding: 2px 6px; border-radius: 4px;">Click to select for calling</span>
            </div>
          </div>
        `
        
        marker.bindPopup(popupContent, {
          className: 'custom-popup',
          maxWidth: 300,
          closeButton: true
        })
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
      <style jsx global>{`
        .custom-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          padding: 0 !important;
          border-radius: 12px !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important;
        }
        .custom-popup .leaflet-popup-tip {
          background: #1f2937 !important;
          border: none !important;
        }
        .custom-popup .leaflet-popup-close-button {
          color: #9ca3af !important;
          font-size: 18px !important;
          padding: 8px !important;
        }
        .custom-popup .leaflet-popup-close-button:hover {
          color: #f3f4f6 !important;
          background: rgba(75, 85, 99, 0.3) !important;
          border-radius: 4px;
        }
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.3;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
      <div 
        ref={mapRef} 
        className="w-full h-full min-h-[400px] rounded-lg overflow-hidden"
        style={{ 
          minHeight: '400px',
          background: 'linear-gradient(135deg, #1f2937, #374151)'
        }}
      />
    </>
  )
}
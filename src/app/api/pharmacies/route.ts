import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Helper function to get coordinates from zipcode
async function getCoordinatesFromZipcode(zipcode: string) {
  const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${zipcode}&key=${process.env.GOOGLE_PLACES_API_KEY}`
  
  const response = await fetch(geocodingUrl)
  const data = await response.json()
  
  if (data.status !== 'OK' || !data.results.length) {
    throw new Error('Invalid zipcode or geocoding failed')
  }
  
  const location = data.results[0].geometry.location
  return {
    lat: location.lat,
    lng: location.lng
  }
}

// Helper function to search for pharmacies near coordinates
async function searchPharmaciesNearby(lat: number, lng: number, radius: number) {
  const radiusInMeters = radius * 1609.34 // Convert miles to meters
  const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radiusInMeters}&type=pharmacy&key=${process.env.GOOGLE_PLACES_API_KEY}`
  
  const response = await fetch(placesUrl)
  const data = await response.json()
  
  if (data.status !== 'OK') {
    throw new Error(`Places API error: ${data.status}`)
  }
  
  return data.results
}

// Helper function to get place details
async function getPlaceDetails(placeId: string) {
  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,opening_hours,rating,website&key=${process.env.GOOGLE_PLACES_API_KEY}`
  
  const response = await fetch(detailsUrl)
  const data = await response.json()
  
  if (data.status !== 'OK') {
    return null
  }
  
  return data.result
}

export async function GET(request: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.GOOGLE_PLACES_API_KEY) {
      console.error('GOOGLE_PLACES_API_KEY not found in environment variables')
      
      // Return mock data for now in production if API key is missing
      const { searchParams } = request.nextUrl
      const zipcode = searchParams.get('zipcode')
      const radius = parseInt(searchParams.get('radius') || '10')
      
      if (!zipcode) {
        return NextResponse.json(
          { error: 'Zipcode is required' },
          { status: 400 }
        )
      }
      
      // Return mock pharmacies when API key is missing
      const mockPharmacies = [
        {
          id: 'mock1',
          name: 'CVS Pharmacy',
          address: `Near ${zipcode}`,
          phone: '(555) 123-4567',
          rating: 4.2,
          latitude: 40.6892,
          longitude: -74.0445,
          distance: 1.2,
          opening_hours: ['Monday: 8:00 AM – 10:00 PM', 'Tuesday: 8:00 AM – 10:00 PM'],
          website: 'https://cvs.com',
          availability: true,
          price: 45,
          confidence_score: 85,
          last_called: new Date()
        },
        {
          id: 'mock2', 
          name: 'Walgreens',
          address: `Near ${zipcode}`,
          phone: '(555) 234-5678',
          rating: 4.0,
          latitude: 40.6932,
          longitude: -74.0421,
          distance: 1.8,
          opening_hours: ['Monday: 7:00 AM – 11:00 PM', 'Tuesday: 7:00 AM – 11:00 PM'],
          website: 'https://walgreens.com',
          availability: false,
          price: null,
          confidence_score: 78,
          last_called: new Date()
        }
      ]
      
      return NextResponse.json({
        success: true,
        center: { lat: 40.6892, lng: -74.0445 },
        pharmacies: mockPharmacies,
        warning: 'Using mock data - Google Places API key not configured'
      })
    }

    const { searchParams } = request.nextUrl
    const zipcode = searchParams.get('zipcode')
    const radius = parseInt(searchParams.get('radius') || '10')

    if (!zipcode) {
      return NextResponse.json(
        { error: 'Zipcode is required' },
        { status: 400 }
      )
    }

    // Get coordinates from zipcode
    const coordinates = await getCoordinatesFromZipcode(zipcode)
    
    // Search for pharmacies
    const places = await searchPharmaciesNearby(coordinates.lat, coordinates.lng, radius)
    
    // Get detailed information for each pharmacy and filter by actual distance
    const allPharmacies = await Promise.all(
      places.slice(0, 60).map(async (place: any) => { // Get more results to filter
        const details = await getPlaceDetails(place.place_id)
        
        // Calculate distance from center point
        const distance = calculateDistance(
          coordinates.lat,
          coordinates.lng,
          place.geometry.location.lat,
          place.geometry.location.lng
        )
        
        return {
          id: place.place_id,
          name: place.name,
          address: place.vicinity || details?.formatted_address,
          phone: details?.formatted_phone_number,
          rating: place.rating,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
          opening_hours: details?.opening_hours?.weekday_text,
          website: details?.website,
          // Mock data for medication availability (would be populated by AI calls)
          availability: Math.random() > 0.3, // 70% chance of availability
          price: Math.random() > 0.5 ? Math.round(Math.random() * 100 + 20) : null,
          confidence_score: Math.floor(Math.random() * 30 + 70), // 70-100
          last_called: new Date(Date.now() - Math.random() * 86400000 * 7) // Random time in last 7 days
        }
      })
    )

    // Filter pharmacies by the requested radius
    const pharmacies = allPharmacies.filter(pharmacy => pharmacy.distance <= radius)

    // Sort by distance
    pharmacies.sort((a, b) => a.distance - b.distance)

    return NextResponse.json({
      success: true,
      center: coordinates,
      pharmacies
    })

  } catch (error) {
    console.error('Pharmacies API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3959 // Earth's radius in miles
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number) {
  return deg * (Math.PI / 180)
}
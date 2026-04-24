import { NextRequest, NextResponse } from 'next/server'

type NominatimHit = {
  display_name: string
  lat: string
  lon: string
}

const UPSTREAM = 'https://nominatim.openstreetmap.org/search'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  const lang = request.nextUrl.searchParams.get('lang')?.trim() || 'en'

  if (q.length < 2) {
    return NextResponse.json([])
  }

  const url = new URL(UPSTREAM)
  url.searchParams.set('format', 'json')
  url.searchParams.set('q', q)
  url.searchParams.set('limit', '8')
  url.searchParams.set('addressdetails', '0')

  try {
    const upstream = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'NetworkMarketingUltimate/1.0 (+https://nominatim.openstreetmap.org)',
        'Accept-Language': lang === 'tr' ? 'tr,en;q=0.9' : 'en',
      },
      cache: 'no-store',
    })

    if (!upstream.ok) {
      return NextResponse.json({ error: 'places_upstream' }, { status: 502 })
    }

    const data = (await upstream.json()) as NominatimHit[]
    const slim = Array.isArray(data)
      ? data.map((row) => ({
          display_name: row.display_name,
          lat: row.lat,
          lon: row.lon,
        }))
      : []

    return NextResponse.json(slim)
  } catch {
    return NextResponse.json({ error: 'places_fetch' }, { status: 502 })
  }
}

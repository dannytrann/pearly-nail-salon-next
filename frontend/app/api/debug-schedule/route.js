import { NextResponse } from 'next/server'
import { getSquareClient, getLocationId } from '@/lib/squareClient'

// Debug endpoint to check a technician's schedule for a specific date
// Usage: GET /api/debug-schedule?date=2026-02-04&techName=Yen
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const techName = searchParams.get('techName')

    const client = getSquareClient()
    const locationId = getLocationId()

    // Get team members
    const teamResponse = await client.teamMembers.search({
      query: {
        filter: {
          locationIds: [locationId],
          status: 'ACTIVE'
        }
      }
    })

    const teamMembers = teamResponse.teamMembers || []

    // Find the technician by name (partial match)
    let targetTech = null
    if (techName) {
      targetTech = teamMembers.find(m => {
        const fullName = `${m.givenName || ''} ${m.familyName || ''}`.trim().toLowerCase()
        return fullName.includes(techName.toLowerCase()) ||
               (m.givenName || '').toLowerCase().includes(techName.toLowerCase())
      })
    }

    // Get bookings for the date
    const startAt = `${date}T00:00:00-08:00`
    const endAt = `${date}T23:59:59-08:00`

    const bookingsResponse = await client.bookings.listBookings({
      locationId,
      startAtMin: startAt,
      startAtMax: endAt
    })

    const bookings = bookingsResponse.bookings || []

    // Filter by technician if specified
    const filteredBookings = targetTech
      ? bookings.filter(b =>
          b.appointmentSegments?.some(seg => seg.teamMemberId === targetTech.id)
        )
      : bookings

    // Format the response
    const formattedBookings = filteredBookings.map(b => ({
      id: b.id,
      status: b.status,
      startAt: b.startAt,
      // Convert to Pacific time for display
      startAtPacific: new Date(b.startAt).toLocaleString('en-US', {
        timeZone: 'America/Vancouver',
        dateStyle: 'short',
        timeStyle: 'short'
      }),
      customerId: b.customerId,
      segments: b.appointmentSegments?.map(seg => ({
        teamMemberId: seg.teamMemberId,
        teamMemberName: teamMembers.find(m => m.id === seg.teamMemberId)?.givenName || 'Unknown',
        durationMinutes: seg.durationMinutes,
        serviceVariationId: seg.serviceVariationId
      }))
    }))

    return NextResponse.json({
      date,
      technician: targetTech ? {
        id: targetTech.id,
        name: `${targetTech.givenName || ''} ${targetTech.familyName || ''}`.trim()
      } : 'All technicians',
      totalBookings: filteredBookings.length,
      bookings: formattedBookings,
      allTechnicians: teamMembers.map(m => ({
        id: m.id,
        name: `${m.givenName || ''} ${m.familyName || ''}`.trim()
      }))
    })

  } catch (error) {
    console.error('Debug schedule error:', error)
    return NextResponse.json({
      error: error.message,
      details: error.body?.errors
    }, { status: 500 })
  }
}

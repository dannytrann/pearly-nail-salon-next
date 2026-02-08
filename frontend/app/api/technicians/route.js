import { NextResponse } from 'next/server'
import { getSquareClient, getLocationId } from '@/lib/squareClient'
import { technicians } from '@/lib/mockData'

// Check technician availability for a specific date/time
async function checkTechnicianAvailability(date, time) {
  try {
    const client = getSquareClient()
    const locationId = getLocationId()

    // Convert date and time to ISO format
    const [hours, minutes] = time.split(':')
    const startDate = new Date(date + 'T00:00:00')
    startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    const endDate = new Date(startDate)
    endDate.setHours(23, 59, 59, 999)

    // Fetch all bookings for this date (SDK v43+ uses object params)
    const bookingsResponse = await client.bookings.list({
      locationId: locationId,
      startAtMin: startDate.toISOString(),
      startAtMax: endDate.toISOString()
    })

    // Get all team members
    const teamMembersResponse = await client.teamMembers.search({
      query: {
        filter: {
          locationIds: [locationId],
          status: 'ACTIVE'
        }
      }
    })

    const availableTechnicians = []
    const busyTechnicianIds = new Set()

    // Find which technicians are busy at the requested time
    if (bookingsResponse.bookings) {
      for (const booking of bookingsResponse.bookings) {
        if (booking.appointmentSegments) {
          for (const segment of booking.appointmentSegments) {
            const bookingStart = new Date(booking.startAt)
            const bookingHours = bookingStart.getHours().toString().padStart(2, '0')
            const bookingMinutes = bookingStart.getMinutes().toString().padStart(2, '0')
            const bookingTime = `${bookingHours}:${bookingMinutes}`

            // If booking overlaps with requested time
            if (bookingTime === time && segment.teamMemberId) {
              busyTechnicianIds.add(segment.teamMemberId)
            }
          }
        }
      }
    }

    // Build list of available technicians
    if (teamMembersResponse.teamMembers) {
      for (const member of teamMembersResponse.teamMembers) {
        if (!busyTechnicianIds.has(member.id)) {
          availableTechnicians.push({
            id: member.id,
            name: `${member.givenName || ''} ${member.familyName || ''}`.trim() || 'Team Member',
            squareTeamMemberId: member.id,
            isActive: member.status === 'ACTIVE',
            available: true
          })
        }
      }
    }

    return availableTechnicians
  } catch (error) {
    console.error('Error checking technician availability:', error)
    throw error
  }
}

export async function POST(request) {
  try {
    const { date, time } = await request.json()
    const useSquareTechnicians = process.env.USE_SQUARE_TECHNICIANS === 'true'

    if (!date || !time) {
      return NextResponse.json(
        { success: false, error: 'Date and time are required' },
        { status: 400 }
      )
    }

    if (useSquareTechnicians) {
      const availableTechs = await checkTechnicianAvailability(date, time)
      return NextResponse.json({
        success: true,
        technicians: availableTechs,
        source: 'square',
        message: `${availableTechs.length} technicians available`
      })
    }

    // Only use mock data if Square is explicitly disabled
    return NextResponse.json({
      success: true,
      technicians: technicians,
      source: 'mock'
    })
  } catch (error) {
    console.error('Technicians API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch technicians' },
      { status: 500 }
    )
  }
}

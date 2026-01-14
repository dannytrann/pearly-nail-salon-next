import { NextResponse } from 'next/server'
import { timeSlots } from '@/lib/mockData'
import { getSquareClient, getLocationId } from '@/lib/squareClient'

// Use Square's searchAvailability API to get actual technician availability
// This properly checks team member work schedules, not just existing bookings
async function fetchSquareAvailability(date, guestData) {
  try {
    const client = getSquareClient()
    const locationId = getLocationId()

    // Extract service and technician info from guest data
    const serviceVariationIds = []
    const teamMemberIds = []
    let hasAnyStaffSelection = false

    if (Array.isArray(guestData)) {
      for (const guest of guestData) {
        // Collect service variation IDs
        if (guest.services) {
          for (const service of guest.services) {
            const variationId = service.squareVariationId || service.id
            if (variationId && !serviceVariationIds.includes(variationId)) {
              serviceVariationIds.push(variationId)
            }
          }
        }

        // Collect technician IDs
        if (guest.technician?.id === 'any') {
          hasAnyStaffSelection = true
        } else if (guest.technician?.id) {
          if (!teamMemberIds.includes(guest.technician.id)) {
            teamMemberIds.push(guest.technician.id)
          }
        }
      }
    }

    // If no services selected yet, we can't search availability properly
    // Fall back to getting all team member availability
    if (serviceVariationIds.length === 0) {
      // Return empty - user needs to select services first
      return {
        availableSlots: [],
        message: 'Please select services first'
      }
    }

    // Build the search request
    // Start and end of the selected date
    const startAt = new Date(date + 'T00:00:00')
    const endAt = new Date(date + 'T23:59:59')

    // Build segment filters for each service
    const segmentFilters = serviceVariationIds.map(serviceId => {
      const filter = {
        serviceVariationId: serviceId
      }

      // If specific technicians selected (not "Any Staff"), filter by them
      if (teamMemberIds.length > 0 && !hasAnyStaffSelection) {
        filter.teamMemberIdFilter = {
          any: teamMemberIds
        }
      }

      return filter
    })

    const searchRequest = {
      query: {
        filter: {
          locationId: locationId,
          startAtRange: {
            startAt: startAt.toISOString(),
            endAt: endAt.toISOString()
          },
          segmentFilters: segmentFilters
        }
      }
    }

    console.log('Square searchAvailability request:', JSON.stringify(searchRequest, null, 2))

    const response = await client.bookings.searchAvailability(searchRequest)

    console.log('Square searchAvailability found', response.availabilities?.length || 0, 'availabilities')

    // Extract available time slots from the response
    const availableSlots = new Set()

    if (response.availabilities) {
      for (const availability of response.availabilities) {
        if (availability.startAt) {
          const startTime = new Date(availability.startAt)
          // Format as h:mm AM/PM (12-hour format)
          const hours = startTime.getHours()
          const minutes = startTime.getMinutes()
          const period = hours >= 12 ? 'PM' : 'AM'
          const displayHours = hours % 12 || 12 // Convert 0 to 12 for midnight
          const displayMinutes = String(minutes).padStart(2, '0')
          availableSlots.add(`${displayHours}:${displayMinutes} ${period}`)
        }
      }
    }

    // Sort the time slots by actual time (convert back to 24h for sorting)
    const sortedSlots = Array.from(availableSlots).sort((a, b) => {
      const parseTime = (timeStr) => {
        const [time, period] = timeStr.split(' ')
        let [hours, minutes] = time.split(':').map(Number)
        if (period === 'PM' && hours !== 12) hours += 12
        if (period === 'AM' && hours === 12) hours = 0
        return hours * 60 + minutes
      }
      return parseTime(a) - parseTime(b)
    })

    return {
      availableSlots: sortedSlots,
      totalAvailabilities: response.availabilities?.length || 0,
      technicianCount: teamMemberIds.length,
      hasAnyStaff: hasAnyStaffSelection
    }
  } catch (error) {
    console.error('Error fetching Square availability:', error)
    throw error
  }
}

// Fetch time slots from business hours API (fallback for mock mode)
async function fetchTimeSlots() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/business-hours`)
    const data = await response.json()
    return data.timeSlots || timeSlots
  } catch (error) {
    console.error('Error fetching time slots:', error)
    return timeSlots
  }
}

export async function POST(request) {
  try {
    const { date, guests } = await request.json()
    const useSquareBookings = process.env.USE_SQUARE_BOOKINGS === 'true'

    if (useSquareBookings) {
      // Use Square's searchAvailability API - properly checks team member schedules
      const squareData = await fetchSquareAvailability(date, guests)

      const guestCount = Array.isArray(guests) ? guests.length : guests
      return NextResponse.json({
        success: true,
        date,
        availableSlots: squareData.availableSlots,
        message: squareData.message || `Found ${squareData.availableSlots.length} available slots for ${guestCount} guest(s)`,
        source: 'square',
        totalAvailabilities: squareData.totalAvailabilities
      })
    }

    // Only use mock availability if Square is explicitly disabled
    const allTimeSlots = await fetchTimeSlots()
    const availableSlots = allTimeSlots.filter((slot, index) => index % 3 !== 0)
    const guestCount = Array.isArray(guests) ? guests.length : guests
    return NextResponse.json({
      success: true,
      date,
      availableSlots,
      message: `Found ${availableSlots.length} available slots for ${guestCount} guest(s)`,
      source: 'mock'
    })
  } catch (error) {
    console.error('Availability API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch availability' },
      { status: 500 }
    )
  }
}

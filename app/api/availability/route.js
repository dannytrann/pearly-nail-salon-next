import { NextResponse } from 'next/server'
import { timeSlots } from '@/lib/mockData'
import { getSquareClient, getLocationId } from '@/lib/squareClient'

// Fetch business hours for a specific date from Square
async function getBusinessHoursForDate(client, locationId, date) {
  try {
    const response = await client.locations.get(locationId)

    if (response.location?.businessHours?.periods) {
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
      const dateObj = new Date(date + 'T00:00:00')
      const dayOfWeek = days[dateObj.getDay()]

      const todayHours = response.location.businessHours.periods.find(
        p => p.dayOfWeek === dayOfWeek
      )

      if (todayHours) {
        return {
          startTime: todayHours.startLocalTime, // e.g., "09:00"
          endTime: todayHours.endLocalTime,     // e.g., "18:00"
          isOpen: true
        }
      }
    }

    // Default to 9 AM - 6 PM if not found
    return { startTime: '09:00', endTime: '18:00', isOpen: true }
  } catch (error) {
    console.error('Error fetching business hours:', error)
    // Default to 9 AM - 6 PM on error
    return { startTime: '09:00', endTime: '18:00', isOpen: true }
  }
}

// Check if a time slot is within business hours
function isWithinBusinessHours(timeSlot, businessHours) {
  // Parse the 12-hour time slot (e.g., "6:00 PM")
  const [time, period] = timeSlot.split(' ')
  let [hours, minutes] = time.split(':').map(Number)
  if (period === 'PM' && hours !== 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0
  const slotMinutes = hours * 60 + minutes

  // Parse business hours (24-hour format, e.g., "09:00", "18:00")
  const [startHour, startMin] = businessHours.startTime.split(':').map(Number)
  const [endHour, endMin] = businessHours.endTime.split(':').map(Number)
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin

  return slotMinutes >= startMinutes && slotMinutes < endMinutes
}

// Use Square's searchAvailability API to get actual technician availability
// This properly checks team member work schedules, not just existing bookings
async function fetchSquareAvailability(date, guestData) {
  try {
    const client = getSquareClient()
    const locationId = getLocationId()

    // Extract service and technician info from guest data
    // IMPORTANT: Each guest's services should be separate segments, not de-duplicated
    // This ensures Square checks availability for ALL guests simultaneously
    const guestSegments = [] // Array of { serviceVariationId, teamMemberId }
    let hasAnyStaffSelection = false

    if (Array.isArray(guestData)) {
      for (const guest of guestData) {
        const guestTechnicianId = guest.technician?.id === 'any' ? null : guest.technician?.id

        if (guest.technician?.id === 'any') {
          hasAnyStaffSelection = true
        }

        // Each service for each guest is a separate segment
        if (guest.services) {
          for (const service of guest.services) {
            const variationId = service.squareVariationId || service.id
            if (variationId) {
              guestSegments.push({
                serviceVariationId: variationId,
                teamMemberId: guestTechnicianId
              })
            }
          }
        }
      }
    }

    // For backwards compatibility - collect unique service IDs for validation
    const serviceVariationIds = [...new Set(guestSegments.map(s => s.serviceVariationId))]

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

    // Build segment filters for each guest's service (not de-duplicated)
    // This ensures Square knows we need multiple concurrent appointments
    const segmentFilters = guestSegments.map(segment => {
      const filter = {
        serviceVariationId: segment.serviceVariationId
      }

      // If this guest selected a specific technician (not "Any Staff"), filter by them
      if (segment.teamMemberId) {
        filter.teamMemberIdFilter = {
          any: [segment.teamMemberId]
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

    let response
    try {
      response = await client.bookings.searchAvailability(searchRequest)
    } catch (searchError) {
      // Check if it's a "not bookable" error
      if (searchError.body?.errors?.[0]?.detail?.includes('not bookable')) {
        const errorField = searchError.body.errors[0].field || ''
        const segmentMatch = errorField.match(/segment_filters\[(\d+)\]/)
        const segmentIndex = segmentMatch ? parseInt(segmentMatch[1]) : -1

        // Find which service caused the error using guestSegments
        let problemService = 'Unknown service'
        if (segmentIndex >= 0 && segmentIndex < guestSegments.length) {
          // Try to find the service name from guest data
          if (Array.isArray(guestData)) {
            let serviceCount = 0
            for (const guest of guestData) {
              if (guest.services) {
                for (const service of guest.services) {
                  if (serviceCount === segmentIndex) {
                    problemService = service.name || service.id
                    break
                  }
                  serviceCount++
                }
              }
            }
          }
        }

        throw new Error(`"${problemService}" is not available for online booking. Please select a different service or contact the salon directly.`)
      }
      throw searchError
    }

    console.log('Square searchAvailability found', response.availabilities?.length || 0, 'availabilities')

    // Fetch business hours for the selected date to filter results
    const businessHours = await getBusinessHoursForDate(client, locationId, date)
    console.log('Business hours for', date, ':', businessHours)

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
          const timeSlot = `${displayHours}:${displayMinutes} ${period}`

          // Only add slots that are within business hours
          if (isWithinBusinessHours(timeSlot, businessHours)) {
            availableSlots.add(timeSlot)
          }
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

    // Count unique technicians
    const uniqueTechnicianIds = [...new Set(guestSegments.map(s => s.teamMemberId).filter(Boolean))]

    return {
      availableSlots: sortedSlots,
      totalAvailabilities: response.availabilities?.length || 0,
      technicianCount: uniqueTechnicianIds.length,
      hasAnyStaff: hasAnyStaffSelection,
      segmentCount: guestSegments.length
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

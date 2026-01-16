import { NextResponse } from 'next/server'
import { timeSlots } from '@/lib/mockData'
import { getSquareClient, getLocationId } from '@/lib/squareClient'

// Business hours configuration
// lastBookingBuffer: how many minutes before closing is the last booking allowed
const BUSINESS_HOURS = {
  SUN: { startTime: '10:00', endTime: '16:00', lastBookingBuffer: 60 }, // 10 AM - 4 PM, last booking 3 PM
  MON: { startTime: '09:00', endTime: '18:00', lastBookingBuffer: 60 }, // 9 AM - 6 PM, last booking 5 PM
  TUE: { startTime: '09:00', endTime: '18:00', lastBookingBuffer: 60 },
  WED: { startTime: '09:00', endTime: '18:00', lastBookingBuffer: 60 },
  THU: { startTime: '09:00', endTime: '18:00', lastBookingBuffer: 60 },
  FRI: { startTime: '09:00', endTime: '18:00', lastBookingBuffer: 60 },
  SAT: { startTime: '09:00', endTime: '18:00', lastBookingBuffer: 60 },
}

// Get business hours for a specific date
function getBusinessHoursForDate(date) {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const dateObj = new Date(date + 'T00:00:00')
  const dayOfWeek = days[dateObj.getDay()]

  const hours = BUSINESS_HOURS[dayOfWeek]
  if (hours) {
    // Calculate last booking time (endTime minus buffer)
    const [endHour, endMin] = hours.endTime.split(':').map(Number)
    const endMinutes = endHour * 60 + endMin
    const lastBookingMinutes = endMinutes - hours.lastBookingBuffer
    const lastBookingHour = Math.floor(lastBookingMinutes / 60)
    const lastBookingMin = lastBookingMinutes % 60
    const lastBookingTime = `${String(lastBookingHour).padStart(2, '0')}:${String(lastBookingMin).padStart(2, '0')}`

    return {
      startTime: hours.startTime,
      endTime: hours.endTime,
      lastBookingTime: lastBookingTime, // Last allowed booking time
      isOpen: true
    }
  }

  // Default if day not found (shouldn't happen)
  return { startTime: '09:00', endTime: '18:00', lastBookingTime: '17:00', isOpen: true }
}

// Check if a time slot is within bookable hours (up to last booking time)
function isWithinBusinessHours(timeSlot, businessHours) {
  // Parse the 12-hour time slot (e.g., "6:00 PM")
  const [time, period] = timeSlot.split(' ')
  let [hours, minutes] = time.split(':').map(Number)
  if (period === 'PM' && hours !== 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0
  const slotMinutes = hours * 60 + minutes

  // Parse business hours (24-hour format, e.g., "09:00", "17:00")
  const [startHour, startMin] = businessHours.startTime.split(':').map(Number)
  const [lastHour, lastMin] = businessHours.lastBookingTime.split(':').map(Number)
  const startMinutes = startHour * 60 + startMin
  const lastMinutes = lastHour * 60 + lastMin

  // Slot must be >= opening time and <= last booking time
  return slotMinutes >= startMinutes && slotMinutes <= lastMinutes
}

// Query availability for a single guest's services with their technician
async function fetchGuestAvailability(client, locationId, date, guest, guestIndex) {
  const startAt = new Date(date + 'T00:00:00')
  const endAt = new Date(date + 'T23:59:59')

  const technicianId = guest.technician?.id === 'any' ? null : guest.technician?.id

  // Build segment filters for this guest's services
  const segmentFilters = guest.services.map(service => {
    const filter = {
      serviceVariationId: service.squareVariationId || service.id
    }
    if (technicianId) {
      filter.teamMemberIdFilter = {
        any: [technicianId]
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

  console.log(`Guest ${guestIndex + 1} availability request:`, JSON.stringify(searchRequest, null, 2))

  const response = await client.bookings.searchAvailability(searchRequest)

  console.log(`Guest ${guestIndex + 1} (${guest.technician?.name || 'Any'}): ${response.availabilities?.length || 0} availabilities`)

  // Extract time slots from response
  const slots = new Set()
  if (response.availabilities) {
    for (const availability of response.availabilities) {
      if (availability.startAt) {
        const startTime = new Date(availability.startAt)
        const hours = startTime.getHours()
        const minutes = startTime.getMinutes()
        const period = hours >= 12 ? 'PM' : 'AM'
        const displayHours = hours % 12 || 12
        const displayMinutes = String(minutes).padStart(2, '0')
        slots.add(`${displayHours}:${displayMinutes} ${period}`)
      }
    }
  }

  return slots
}

// Use Square's searchAvailability API to get actual technician availability
// For group bookings, we query each guest separately and find the intersection
async function fetchSquareAvailability(date, guestData) {
  try {
    const client = getSquareClient()
    const locationId = getLocationId()

    if (!Array.isArray(guestData) || guestData.length === 0) {
      return {
        availableSlots: [],
        message: 'No guest data provided'
      }
    }

    // Check if any guest has services
    const hasServices = guestData.some(g => g.services && g.services.length > 0)
    if (!hasServices) {
      return {
        availableSlots: [],
        message: 'Please select services first'
      }
    }

    console.log('=== GROUP AVAILABILITY REQUEST ===')
    console.log('Date:', date)
    console.log('Number of guests:', guestData.length)

    // For group bookings with multiple guests, query each guest's availability separately
    // then find the intersection (times where ALL guests can be served)
    const guestAvailabilities = await Promise.all(
      guestData.map((guest, index) =>
        fetchGuestAvailability(client, locationId, date, guest, index)
          .catch(error => {
            console.error(`Error fetching availability for guest ${index + 1}:`, error.message)
            // If a service isn't bookable, return empty set
            if (error.body?.errors?.[0]?.detail?.includes('not bookable')) {
              const serviceName = guest.services?.[0]?.name || 'Unknown service'
              throw new Error(`"${serviceName}" is not available for online booking.`)
            }
            return new Set()
          })
      )
    )

    // Find the intersection of all guests' available times
    let commonSlots
    if (guestAvailabilities.length === 1) {
      commonSlots = guestAvailabilities[0]
    } else {
      // Start with first guest's slots, then intersect with each subsequent guest
      commonSlots = new Set(guestAvailabilities[0])
      for (let i = 1; i < guestAvailabilities.length; i++) {
        const guestSlots = guestAvailabilities[i]
        commonSlots = new Set([...commonSlots].filter(slot => guestSlots.has(slot)))
      }
    }

    console.log('Common slots across all guests:', commonSlots.size)

    // Get business hours for the selected date to filter results
    const businessHours = getBusinessHoursForDate(date)
    console.log('Business hours for', date, ':', businessHours)

    // Filter by business hours
    const filteredSlots = [...commonSlots].filter(slot =>
      isWithinBusinessHours(slot, businessHours)
    )

    console.log('After business hours filter:', filteredSlots.length)

    // Sort the time slots
    const sortedSlots = filteredSlots.sort((a, b) => {
      const parseTime = (timeStr) => {
        const [time, period] = timeStr.split(' ')
        let [hours, minutes] = time.split(':').map(Number)
        if (period === 'PM' && hours !== 12) hours += 12
        if (period === 'AM' && hours === 12) hours = 0
        return hours * 60 + minutes
      }
      return parseTime(a) - parseTime(b)
    })

    // Identify which technicians have no availability
    const unavailableTechnicians = guestData
      .map((guest, index) => ({
        guestIndex: index,
        guestNumber: index + 1,
        technician: guest.technician,
        hasAvailability: guestAvailabilities[index].size > 0
      }))
      .filter(g => !g.hasAvailability && g.technician?.id !== 'any')

    // Count unique technicians
    const uniqueTechnicianIds = guestData
      .map(g => g.technician?.id)
      .filter(id => id && id !== 'any')
    const hasAnyStaffSelection = guestData.some(g => g.technician?.id === 'any')

    return {
      availableSlots: sortedSlots,
      totalAvailabilities: sortedSlots.length,
      technicianCount: new Set(uniqueTechnicianIds).size,
      hasAnyStaff: hasAnyStaffSelection,
      guestCount: guestData.length,
      unavailableTechnicians: unavailableTechnicians.length > 0 ? unavailableTechnicians : undefined,
      guestAvailabilityCounts: guestData.map((guest, i) => ({
        guestNumber: i + 1,
        technician: guest.technician?.name,
        availableSlots: guestAvailabilities[i].size
      }))
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

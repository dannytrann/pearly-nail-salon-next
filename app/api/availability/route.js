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
    const [endHour, endMin] = hours.endTime.split(':').map(Number)
    const endMinutes = endHour * 60 + endMin
    const lastBookingMinutes = endMinutes - hours.lastBookingBuffer
    const lastBookingHour = Math.floor(lastBookingMinutes / 60)
    const lastBookingMin = lastBookingMinutes % 60
    const lastBookingTime = `${String(lastBookingHour).padStart(2, '0')}:${String(lastBookingMin).padStart(2, '0')}`

    return {
      startTime: hours.startTime,
      endTime: hours.endTime,
      lastBookingTime: lastBookingTime,
      isOpen: true
    }
  }

  return { startTime: '09:00', endTime: '18:00', lastBookingTime: '17:00', isOpen: true }
}

// Check if a time slot is within bookable hours (up to last booking time)
function isWithinBusinessHours(timeSlot, businessHours) {
  const [time, period] = timeSlot.split(' ')
  let [hours, minutes] = time.split(':').map(Number)
  if (period === 'PM' && hours !== 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0
  const slotMinutes = hours * 60 + minutes

  const [startHour, startMin] = businessHours.startTime.split(':').map(Number)
  const [lastHour, lastMin] = businessHours.lastBookingTime.split(':').map(Number)
  const startMinutes = startHour * 60 + startMin
  const lastMinutes = lastHour * 60 + lastMin

  return slotMinutes >= startMinutes && slotMinutes <= lastMinutes
}

// Convert an ISO timestamp to a display string in Pacific timezone (e.g. "10:00 AM")
function isoToDisplaySlot(isoString) {
  const startTime = new Date(isoString)
  const pacificTime = new Date(startTime.toLocaleString('en-US', { timeZone: 'America/Vancouver' }))
  const hours = pacificTime.getHours()
  const minutes = pacificTime.getMinutes()
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  const displayMinutes = String(minutes).padStart(2, '0')
  return `${displayHours}:${displayMinutes} ${period}`
}

// Get Pacific timezone offset for a given date
function getPacificOffset(date) {
  const dateObj = new Date(date + 'T12:00:00Z')
  const month = dateObj.getUTCMonth() // 0-11
  const isPDT = month >= 2 && month <= 9 // March through October (rough DST)
  return isPDT ? '-07:00' : '-08:00'
}

// Query availability for a SINGLE service on a SINGLE day.
// If technicianId is provided, passes it to Square's team_member_id_filter
// so Square handles technician filtering server-side (consistent results).
async function fetchServiceAvailability(client, locationId, date, serviceVariationId, technicianId) {
  const tzOffset = getPacificOffset(date)
  const startAt = new Date(`${date}T00:00:00${tzOffset}`)
  const endAt = new Date(`${date}T23:59:59${tzOffset}`)

  // Build segment filter — include technician filter if a specific one is selected
  const segmentFilter = { serviceVariationId }
  if (technicianId) {
    segmentFilter.teamMemberIdFilter = { any: [technicianId] }
  }

  const response = await client.bookings.searchAvailability({
    query: {
      filter: {
        locationId,
        startAtRange: {
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString()
        },
        segmentFilters: [segmentFilter]
      }
    }
  })

  const times = new Set()
  if (response.availabilities) {
    for (const avail of response.availabilities) {
      if (avail.startAt) {
        times.add(avail.startAt)
      }
    }
  }

  return times
}

// Search availability per-GUEST, then intersect across guests.
// For each guest:
//   1. Query each of their services independently (one call per service — fast)
//   2. If the guest selected a specific technician, filter to only slots with that tech
//   3. Intersect all service results for that guest
// Then intersect across all guests to find times where everyone can be served.
async function fetchSquareAvailability(date, guestData) {
  try {
    const client = getSquareClient()
    const locationId = getLocationId()

    if (!Array.isArray(guestData) || guestData.length === 0) {
      return { availableSlots: [], message: 'No guest data provided' }
    }

    const hasServices = guestData.some(g => g.services && g.services.length > 0)
    if (!hasServices) {
      return { availableSlots: [], message: 'Please select services first' }
    }

    // Query each guest's availability in parallel
    const guestAvailabilities = await Promise.all(
      guestData.map(async (guest) => {
        const services = guest.services || []
        if (services.length === 0) return new Set()

        const technicianId = guest.technician?.id === 'any' ? null : guest.technician?.id

        // Query each service for this guest in parallel
        const serviceResults = await Promise.all(
          services.map(service =>
            fetchServiceAvailability(
              client, locationId, date,
              service.squareVariationId || service.id,
              technicianId
            ).catch(error => {
              console.error(`Error fetching availability for service ${service.name}:`, error.message)
              if (error.body?.errors?.[0]?.detail?.includes('not bookable')) {
                throw new Error(`"${service.name}" is not available for online booking.`)
              }
              return new Set()
            })
          )
        )

        // If any service has no availability for this guest, guest can't book
        if (serviceResults.some(s => s.size === 0)) return new Set()

        // Intersect all service times for this guest
        let guestTimes = new Set(serviceResults[0])
        for (let i = 1; i < serviceResults.length; i++) {
          guestTimes = new Set([...guestTimes].filter(t => serviceResults[i].has(t)))
        }
        return guestTimes
      })
    )

    // Intersect across all guests
    let validTimes = new Set(guestAvailabilities[0])
    for (let i = 1; i < guestAvailabilities.length; i++) {
      validTimes = new Set([...validTimes].filter(t => guestAvailabilities[i].has(t)))
    }

    // Convert ISO timestamps to display format
    const displaySlots = [...validTimes].map(iso => isoToDisplaySlot(iso))
    const uniqueSlots = [...new Set(displaySlots)]

    // Filter by business hours
    const businessHours = getBusinessHoursForDate(date)
    const filteredSlots = uniqueSlots.filter(slot =>
      isWithinBusinessHours(slot, businessHours)
    )

    // Sort chronologically
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

    // If no common times found, report ALL guests with specific technicians as changeable.
    // Don't rely on individual per-guest availability — Square's parallel results can be
    // inconsistent, and any specific technician pick could be the bottleneck.
    if (sortedSlots.length === 0) {
      const specificTechGuests = guestData
        .map((guest, index) => ({
          guestIndex: index,
          guestNumber: guest.guestNumber || index + 1,
          guestName: guest.guestName || `Guest ${index + 1}`,
          technician: guest.technician,
          hasAvailability: guestAvailabilities[index].size > 0
        }))
        .filter(g => g.technician?.id && g.technician.id !== 'any')

      return {
        availableSlots: [],
        unavailableGuests: specificTechGuests.length > 0 ? specificTechGuests : undefined,
        message: specificTechGuests.length > 0
          ? 'No common times for your selected technicians on this date'
          : 'No availability on this date'
      }
    }

    return {
      availableSlots: sortedSlots,
      totalAvailabilities: sortedSlots.length,
      guestCount: guestData.length
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
    const body = await request.json()
    const { date, guests } = body

    const useSquareBookings = process.env.USE_SQUARE_BOOKINGS === 'true'

    if (useSquareBookings) {
      const squareData = await fetchSquareAvailability(date, guests)

      const guestCount = Array.isArray(guests) ? guests.length : guests
      return NextResponse.json({
        success: true,
        date,
        availableSlots: squareData.availableSlots,
        message: squareData.message || `Found ${squareData.availableSlots.length} available slots for ${guestCount} guest(s)`,
        source: 'square',
        totalAvailabilities: squareData.totalAvailabilities,
        unavailableGuests: squareData.unavailableGuests
      })
    }

    // Mock mode fallback
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

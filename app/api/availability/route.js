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

// Query availability for MULTIPLE services on a SINGLE day.
// Services are sent as multiple segments so Square calculates TOTAL duration correctly.
// - If technicianId is provided, passes it to Square's team_member_id_filter (server-side filtering)
// - If technicianId is null (Any Staff), but excludeTechnicianIds and requiredCount are provided,
//   checks that at least `requiredCount` non-excluded technicians are available at each slot
async function fetchGuestAvailability(client, locationId, date, services, technicianId, excludeTechnicianIds = [], requiredCount = 1) {
  const tzOffset = getPacificOffset(date)
  const startAt = new Date(`${date}T00:00:00${tzOffset}`)
  const endAt = new Date(`${date}T23:59:59${tzOffset}`)

  // Build segment filters for ALL services - this tells Square to find slots
  // where the TOTAL duration of all services fits sequentially
  const segmentFilters = services.map(service => {
    const segment = { serviceVariationId: service.squareVariationId || service.id }
    if (technicianId) {
      segment.teamMemberIdFilter = { any: [technicianId] }
    }
    return segment
  })

  const totalDuration = services.reduce((sum, s) => sum + (s.duration || 0), 0)
  console.log(`[Square Query] Services: ${services.map(s => s.name).join(' + ')} (${totalDuration} min total)`)
  console.log(`[Square Query] Tech: ${technicianId || 'Any'}, Date: ${date}`)
  console.log(`[Square Query] Date range: ${startAt.toISOString()} to ${endAt.toISOString()}`)

  const response = await client.bookings.searchAvailability({
    query: {
      filter: {
        locationId,
        startAtRange: {
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString()
        },
        segmentFilters
      }
    }
  })

  console.log(`[Square Response] Found ${response.availabilities?.length || 0} raw availabilities`)

  // For "Any Staff" queries with exclusions: we need to count technicians PER TIME SLOT
  // Each availability object represents ONE technician's availability at that time
  if (!technicianId && excludeTechnicianIds.length > 0) {
    // Group availabilities by start time
    const slotTechMap = new Map() // startAt -> Set of technicianIds

    if (response.availabilities) {
      for (const avail of response.availabilities) {
        if (!avail.startAt) continue

        // Get the technician ID from the first segment
        const techId = avail.appointmentSegments?.[0]?.teamMemberId
        if (!techId) continue

        // Skip if this technician is in the exclusion list
        if (excludeTechnicianIds.includes(techId)) continue

        // Add to the map
        if (!slotTechMap.has(avail.startAt)) {
          slotTechMap.set(avail.startAt, new Set())
        }
        slotTechMap.get(avail.startAt).add(techId)
      }
    }

    // Filter to slots with enough available technicians
    const times = new Set()
    for (const [startAt, techIds] of slotTechMap) {
      if (techIds.size >= requiredCount) {
        times.add(startAt)
      }
    }

    console.log(`[Square Response] After tech count filter (need ${requiredCount}): ${times.size} time slots`)
    console.log(`[Square Response] Returning ${times.size} time slots: ${[...times].slice(0, 5).join(', ')}${times.size > 5 ? '...' : ''}`)

    return times
  }

  // Simple case: specific technician or no exclusion requirements
  const times = new Set()
  if (response.availabilities) {
    for (const avail of response.availabilities) {
      if (!avail.startAt) continue
      times.add(avail.startAt)
    }
  }

  console.log(`[Square Response] Returning ${times.size} time slots: ${[...times].slice(0, 5).join(', ')}${times.size > 5 ? '...' : ''}`)

  return times
}

// Search availability per-GUEST, then intersect across guests.
// For each guest:
//   1. Query ALL their services in a single call (so Square calculates total duration)
//   2. If the guest selected a specific technician, filter to only slots with that tech
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

    // Collect technician IDs claimed by specific-technician guests
    const claimedTechnicianIds = guestData
      .filter(g => g.technician?.id && g.technician.id !== 'any')
      .map(g => g.technician.squareTeamMemberId || g.technician.id)

    // Count "Any Staff" guests — they all need distinct non-claimed technicians
    const anyStaffGuestCount = guestData.filter(g => !g.technician?.id || g.technician.id === 'any').length

    // Query each guest's availability in parallel
    const guestAvailabilities = await Promise.all(
      guestData.map(async (guest) => {
        const services = guest.services || []
        if (services.length === 0) return new Set()

        const technicianId = guest.technician?.id === 'any' ? null : (guest.technician?.squareTeamMemberId || guest.technician?.id)

        console.log(`[Availability] Guest: ${guest.guestName}, Technician: ${guest.technician?.name} (ID: ${technicianId})`)
        console.log(`[Availability] Services: ${services.map(s => `${s.name} (${s.squareVariationId || s.id})`).join(', ')}`)

        // Query ALL services for this guest in a single call
        // This ensures Square calculates the TOTAL duration correctly
        const guestTimes = await fetchGuestAvailability(
          client, locationId, date,
          services,
          technicianId,
          // For "Any Staff" guests: exclude claimed techs and require enough available
          technicianId ? [] : claimedTechnicianIds,
          technicianId ? 1 : anyStaffGuestCount
        ).catch(error => {
          console.error(`Error fetching availability for guest ${guest.guestName}:`, error.message)
          // Check if any service is not bookable
          if (error.body?.errors?.[0]?.detail?.includes('not bookable')) {
            const serviceName = error.body?.errors?.[0]?.detail?.match(/"([^"]+)"/)?.[1] || 'A service'
            throw new Error(`"${serviceName}" is not available for online booking.`)
          }
          return new Set()
        })

        console.log(`[Availability] Guest ${guest.guestName}: Found ${guestTimes.size} time slots from Square`)
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
    console.log(`[Availability] Date: ${date}, Business hours: ${businessHours.startTime}-${businessHours.lastBookingTime}`)
    console.log(`[Availability] Slots before business hours filter: ${uniqueSlots.join(', ') || 'none'}`)

    const filteredSlots = uniqueSlots.filter(slot =>
      isWithinBusinessHours(slot, businessHours)
    )
    console.log(`[Availability] Slots after business hours filter: ${filteredSlots.join(', ') || 'none'}`)

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

    // If no slots after filtering, determine why and provide helpful messaging
    if (sortedSlots.length === 0) {
      // For single guest: simple message, no need to show "technician is available"
      // since there are no bookable slots regardless
      if (guestData.length === 1) {
        const guest = guestData[0]
        const rawSlotsExist = guestAvailabilities[0].size > 0

        // If Square had slots but they were filtered out by business hours
        if (rawSlotsExist) {
          return {
            availableSlots: [],
            message: `${guest.technician?.name || 'Selected technician'} has no availability during business hours on this date`
          }
        }

        return {
          availableSlots: [],
          message: `${guest.technician?.name || 'Selected technician'} is not available on this date`
        }
      }

      // For multiple guests: determine the cause and provide helpful messaging
      const anyStaffGuests = guestData.filter(g => !g.technician?.id || g.technician.id === 'any')
      const specificTechGuests = guestData.filter(g => g.technician?.id && g.technician.id !== 'any')

      // Check if any specific-tech guest has NO availability (they're the bottleneck)
      const unavailableSpecificGuests = specificTechGuests
        .map((guest, _) => {
          const originalIndex = guestData.findIndex(g => g === guest)
          return {
            guestIndex: originalIndex,
            guestNumber: guest.guestNumber || originalIndex + 1,
            guestName: guest.guestName || `Guest ${originalIndex + 1}`,
            technician: guest.technician,
            hasAvailability: guestAvailabilities[originalIndex].size > 0
          }
        })
        .filter(g => !g.hasAvailability)

      // If specific technicians have no availability, show them as the issue
      if (unavailableSpecificGuests.length > 0) {
        return {
          availableSlots: [],
          unavailableGuests: unavailableSpecificGuests,
          message: 'Selected technician(s) not available on this date'
        }
      }

      // If all specific techs have availability but still no common slots,
      // the issue is likely not enough technicians for "Any Staff" guests
      if (anyStaffGuests.length > 0) {
        return {
          availableSlots: [],
          message: `Not enough available technicians for ${guestData.length} guests on this date. Try selecting specific technicians or a different date.`
        }
      }

      // Fallback: no common times between specific technicians
      return {
        availableSlots: [],
        message: 'No common times for your selected technicians on this date'
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

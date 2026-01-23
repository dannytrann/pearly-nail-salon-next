import { NextResponse } from 'next/server'
import { timeSlots } from '@/lib/mockData'
import { getSquareClient, getLocationId } from '@/lib/squareClient'

// Display name mappings for team members (same as services route)
const TECHNICIAN_DISPLAY_NAMES = {
  'Cheng Ping Deng': 'Simone',
}

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

// Business timezone (Comox, BC is Pacific Time)
const TIMEZONE_OFFSET = '-08:00' // PST (use -07:00 for PDT during daylight saving)

// Get the current timezone offset for Pacific Time (handles DST automatically)
function getPacificOffset(date) {
  // Create a date formatter for Pacific timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Vancouver',
    timeZoneName: 'shortOffset'
  })
  const parts = formatter.formatToParts(new Date(date + 'T12:00:00Z'))
  const offsetPart = parts.find(p => p.type === 'timeZoneName')
  // Convert "GMT-8" or "GMT-7" to "-08:00" or "-07:00"
  const match = offsetPart?.value?.match(/GMT([+-])(\d+)/)
  if (match) {
    const sign = match[1]
    const hours = match[2].padStart(2, '0')
    return `${sign}${hours}:00`
  }
  return '-08:00' // Default to PST
}

// Query availability for a single guest's services with their technician
async function fetchGuestAvailability(client, locationId, date, guest, guestIndex) {
  // Use Pacific timezone explicitly to ensure consistent behavior across servers
  const tzOffset = getPacificOffset(date)
  const startAt = new Date(date + 'T00:00:00' + tzOffset)
  const endAt = new Date(date + 'T23:59:59' + tzOffset)

  console.log(`[TIMEZONE DEBUG] Date: ${date}, Offset: ${tzOffset}`)
  console.log(`[TIMEZONE DEBUG] startAt: ${startAt.toISOString()}, endAt: ${endAt.toISOString()}`)

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

// Find alternative technicians when the selected one is unavailable for 30+ days
async function findAlternativeTechnicians(client, locationId, unavailableGuestInfo, allGuests, maxDaysToCheck = 14) {
  const alternatives = []

  try {
    // Get all team members
    const teamResponse = await client.teamMembers.search({
      query: {
        filter: {
          locationIds: [locationId],
          status: 'ACTIVE'
        }
      }
    })

    const teamMembers = teamResponse.teamMembers || []
    const unavailableTechId = unavailableGuestInfo.technician?.id

    // Filter out the unavailable technician and technicians already selected by other guests
    const otherGuestTechIds = allGuests
      .filter((_, idx) => idx !== unavailableGuestInfo.guestIndex)
      .map(g => g.technician?.id)
      .filter(id => id && id !== 'any')

    const availableTechs = teamMembers.filter(m =>
      m.id !== unavailableTechId && !otherGuestTechIds.includes(m.id)
    )

    console.log(`Checking ${availableTechs.length} alternative technicians...`)

    // Check each alternative technician's availability
    for (const tech of availableTechs.slice(0, 5)) { // Check up to 5 alternatives
      const techName = `${tech.givenName || ''} ${tech.familyName || ''}`.trim()
      const displayName = TECHNICIAN_DISPLAY_NAMES[techName] || techName || 'Team Member'

      // Find next available date for this technician
      let checkDate = new Date()
      checkDate.setDate(checkDate.getDate() + 1) // Start from tomorrow

      for (let i = 0; i < maxDaysToCheck; i++) {
        const dateString = checkDate.toISOString().split('T')[0]

        try {
          // Create a modified guest with this alternative technician
          const modifiedGuest = {
            ...allGuests[unavailableGuestInfo.guestIndex],
            technician: { id: tech.id, name: displayName }
          }

          // Check if this tech has availability on this date
          const slots = await fetchGuestAvailability(client, locationId, dateString, modifiedGuest, 0)

          if (slots.size > 0) {
            // Get business hours to filter
            const businessHours = getBusinessHoursForDate(dateString)
            const filteredSlots = [...slots].filter(s => isWithinBusinessHours(s, businessHours))

            if (filteredSlots.length > 0) {
              // For single guest bookings, we found availability
              if (allGuests.length === 1) {
                alternatives.push({
                  technician: { id: tech.id, name: displayName, squareTeamMemberId: tech.id },
                  nextAvailableDate: dateString,
                  daysAway: i + 1,
                  slotsAvailable: filteredSlots.length
                })
                break
              }

              // For group bookings, verify other guests can also book on this date
              let allGuestsCanBook = true
              for (let gIdx = 0; gIdx < allGuests.length; gIdx++) {
                if (gIdx === unavailableGuestInfo.guestIndex) continue
                const otherSlots = await fetchGuestAvailability(client, locationId, dateString, allGuests[gIdx], gIdx)
                const otherFiltered = [...otherSlots].filter(s => isWithinBusinessHours(s, businessHours))
                // Find intersection
                const commonSlots = filteredSlots.filter(s => otherFiltered.includes(s))
                if (commonSlots.length === 0) {
                  allGuestsCanBook = false
                  break
                }
              }

              if (allGuestsCanBook) {
                alternatives.push({
                  technician: { id: tech.id, name: displayName, squareTeamMemberId: tech.id },
                  nextAvailableDate: dateString,
                  daysAway: i + 1,
                  slotsAvailable: filteredSlots.length
                })
                break // Found availability for this tech, move to next
              }
            }
          }
        } catch (err) {
          // Skip this date/tech combo on error
        }

        checkDate.setDate(checkDate.getDate() + 1)
      }
    }

    // Also add "Any Staff" option if not already selected
    const anyStaffSelected = allGuests.some(g => g.technician?.id === 'any')
    if (!anyStaffSelected) {
      let checkDate = new Date()
      checkDate.setDate(checkDate.getDate() + 1)

      for (let i = 0; i < maxDaysToCheck; i++) {
        const dateString = checkDate.toISOString().split('T')[0]

        const modifiedGuest = {
          ...allGuests[unavailableGuestInfo.guestIndex],
          technician: { id: 'any', name: 'Any Staff' }
        }

        const slots = await fetchGuestAvailability(client, locationId, dateString, modifiedGuest, 0)
        const businessHours = getBusinessHoursForDate(dateString)
        const filteredSlots = [...slots].filter(s => isWithinBusinessHours(s, businessHours))

        if (filteredSlots.length > 0) {
          alternatives.push({
            technician: { id: 'any', name: 'Any Staff' },
            nextAvailableDate: dateString,
            daysAway: i + 1,
            slotsAvailable: filteredSlots.length,
            isAnyStaff: true
          })
          break
        }

        checkDate.setDate(checkDate.getDate() + 1)
      }
    }

    // Sort by soonest available
    alternatives.sort((a, b) => a.daysAway - b.daysAway)

    // Return top 3
    return alternatives.slice(0, 3)
  } catch (error) {
    console.error('Error finding alternative technicians:', error)
    return []
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
    const { date, guests, findAlternatives } = await request.json()
    const useSquareBookings = process.env.USE_SQUARE_BOOKINGS === 'true'

    console.log(`[ENV DEBUG] USE_SQUARE_BOOKINGS: ${process.env.USE_SQUARE_BOOKINGS}`)
    console.log(`[ENV DEBUG] SQUARE_ENVIRONMENT: ${process.env.SQUARE_ENVIRONMENT}`)
    console.log(`[ENV DEBUG] Has ACCESS_TOKEN: ${!!process.env.SQUARE_ACCESS_TOKEN}`)
    console.log(`[ENV DEBUG] LOCATION_ID: ${process.env.SQUARE_LOCATION_ID}`)

    if (useSquareBookings) {
      // Use Square's searchAvailability API - properly checks team member schedules
      const squareData = await fetchSquareAvailability(date, guests)

      // If no availability and there are unavailable technicians, find alternatives
      let alternativeTechnicians = undefined
      if (findAlternatives !== false && squareData.unavailableTechnicians?.length > 0 && squareData.availableSlots.length === 0) {
        console.log('Finding alternative technicians...')
        const client = getSquareClient()
        const locationId = getLocationId()

        // Find alternatives for the first unavailable technician
        const unavailableTech = squareData.unavailableTechnicians[0]
        alternativeTechnicians = await findAlternativeTechnicians(
          client,
          locationId,
          unavailableTech,
          guests
        )
        console.log(`Found ${alternativeTechnicians.length} alternatives`)
      }

      const guestCount = Array.isArray(guests) ? guests.length : guests
      return NextResponse.json({
        success: true,
        date,
        availableSlots: squareData.availableSlots,
        message: squareData.message || `Found ${squareData.availableSlots.length} available slots for ${guestCount} guest(s)`,
        source: 'square',
        totalAvailabilities: squareData.totalAvailabilities,
        unavailableTechnicians: squareData.unavailableTechnicians,
        guestAvailabilityCounts: squareData.guestAvailabilityCounts,
        alternativeTechnicians
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

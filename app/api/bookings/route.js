import { NextResponse } from 'next/server'
import { getSquareClient, getLocationId } from '@/lib/squareClient'
import { randomUUID } from 'crypto'

// Find an available technician for the given time slot using Square's searchAvailability
async function findAvailableTechnician(selectedDate, selectedTime, duration, excludeTechnicianIds = [], serviceIds = []) {
  try {
    const client = getSquareClient()
    const locationId = getLocationId()

    // Parse the selected time to create start/end range for availability search
    const requestedStart = new Date(selectedDate + 'T00:00:00')

    if (selectedTime.includes('AM') || selectedTime.includes('PM')) {
      // 12-hour format (e.g., "2:30 PM")
      const [time, period] = selectedTime.split(' ')
      let [hours, mins] = time.split(':').map(Number)
      if (period === 'PM' && hours !== 12) hours += 12
      if (period === 'AM' && hours === 12) hours = 0
      requestedStart.setHours(hours, mins, 0, 0)
    } else {
      // 24-hour format (e.g., "14:30")
      const [hours, minutes] = selectedTime.split(':')
      requestedStart.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    }

    // Search window: from requested time to 1 minute later (to find exact slot)
    const searchStart = new Date(requestedStart)
    const searchEnd = new Date(requestedStart)
    searchEnd.setMinutes(searchEnd.getMinutes() + 1)

    // Build the availability query
    const availabilityQuery = {
      query: {
        filter: {
          locationId: locationId,
          startAtRange: {
            startAt: searchStart.toISOString(),
            endAt: searchEnd.toISOString()
          },
          segmentFilters: [{
            serviceVariationId: serviceIds[0] || 'any',
            teamMemberIdFilter: {
              any: excludeTechnicianIds.length > 0 ? undefined : []
            }
          }]
        }
      }
    }

    // Use Square's searchAvailability to find actually available team members
    const availabilityResponse = await client.bookings.searchAvailability(availabilityQuery)

    const availabilities = availabilityResponse.availabilities || []
    const excludeSet = new Set(excludeTechnicianIds)

    // Find the first available slot that matches our requested time and isn't excluded
    for (const slot of availabilities) {
      const slotStart = new Date(slot.startAt)
      // Check if this slot matches our requested time (within a minute)
      if (Math.abs(slotStart.getTime() - requestedStart.getTime()) < 60000) {
        for (const segment of slot.appointmentSegments || []) {
          const teamMemberId = segment.teamMemberId
          if (teamMemberId && !excludeSet.has(teamMemberId)) {
            // Get team member name
            try {
              const teamMemberResponse = await client.teamMembers.retrieve(teamMemberId)
              const member = teamMemberResponse.teamMember
              return {
                id: teamMemberId,
                name: `${member?.givenName || ''} ${member?.familyName || ''}`.trim() || 'Staff Member'
              }
            } catch {
              return {
                id: teamMemberId,
                name: 'Staff Member'
              }
            }
          }
        }
      }
    }

    // Fallback: If searchAvailability doesn't return results, use the old method
    // but only select from team members who are actually working
    console.log('searchAvailability returned no matching slots, falling back to manual check')

    // Get team members with their bookings
    const teamResponse = await client.teamMembers.search({
      query: {
        filter: {
          locationIds: [locationId],
          status: 'ACTIVE'
        }
      }
    })

    const teamMembers = teamResponse.teamMembers || []
    if (teamMembers.length === 0) {
      throw new Error('No team members available')
    }

    // Get all bookings for the day to check conflicts
    const dayStart = new Date(selectedDate + 'T00:00:00')
    const dayEnd = new Date(selectedDate + 'T23:59:59')

    const bookingsResponse = await client.bookings.list({
      locationId: locationId,
      startAtMin: dayStart.toISOString(),
      startAtMax: dayEnd.toISOString()
    })

    // Build a set of team members who have ANY booking on this day (meaning they're working)
    const workingTeamMemberIds = new Set()
    const technicianBookings = new Map()

    if (bookingsResponse.bookings) {
      for (const booking of bookingsResponse.bookings) {
        if (booking.startAt && booking.appointmentSegments) {
          for (const segment of booking.appointmentSegments) {
            const techId = segment.teamMemberId
            if (techId) {
              workingTeamMemberIds.add(techId)

              const bookingStart = new Date(booking.startAt)
              const bookingEnd = new Date(bookingStart)
              bookingEnd.setMinutes(bookingEnd.getMinutes() + (segment.durationMinutes || 30))

              if (!technicianBookings.has(techId)) {
                technicianBookings.set(techId, [])
              }
              technicianBookings.get(techId).push({
                start: bookingStart,
                end: bookingEnd
              })
            }
          }
        }
      }
    }

    const requestedEnd = new Date(requestedStart)
    requestedEnd.setMinutes(requestedEnd.getMinutes() + duration)

    // Only consider team members who are working today (have at least one booking)
    // This prevents assigning to technicians who aren't scheduled
    for (const member of teamMembers) {
      // Skip if not working today (no bookings = not scheduled)
      if (!workingTeamMemberIds.has(member.id)) {
        console.log(`Skipping ${member.givenName} - not working today (no bookings)`)
        continue
      }

      // Skip if already assigned in this booking session
      if (excludeSet.has(member.id)) {
        continue
      }

      const techBookings = technicianBookings.get(member.id) || []

      // Check if this time slot conflicts with any existing bookings
      let isAvailable = true
      for (const booking of techBookings) {
        if (requestedStart < booking.end && requestedEnd > booking.start) {
          isAvailable = false
          break
        }
      }

      if (isAvailable) {
        return {
          id: member.id,
          name: `${member.givenName || ''} ${member.familyName || ''}`.trim() || 'Staff Member'
        }
      }
    }

    throw new Error('No available technicians at the selected time')
  } catch (error) {
    console.error('Error finding available technician:', error)
    throw error
  }
}

// Parse 12-hour time format (e.g., "2:30 PM") to hours and minutes
function parse12HourTime(timeStr) {
  const [time, period] = timeStr.split(' ')
  let [hours, minutes] = time.split(':').map(Number)

  if (period === 'PM' && hours !== 12) {
    hours += 12
  } else if (period === 'AM' && hours === 12) {
    hours = 0
  }

  return { hours, minutes }
}

// Create booking in Square
async function createSquareBooking(guest, selectedDate, selectedTime, contactInfo, excludeTechnicianIds = []) {
  try {
    const client = getSquareClient()
    const locationId = getLocationId()

    // Combine date and time (handle both 12-hour and 24-hour formats)
    const startDate = new Date(selectedDate + 'T00:00:00')

    if (selectedTime.includes('AM') || selectedTime.includes('PM')) {
      // 12-hour format (e.g., "2:30 PM")
      const { hours, minutes } = parse12HourTime(selectedTime)
      startDate.setHours(hours, minutes, 0, 0)
    } else {
      // 24-hour format (e.g., "14:30")
      const [hours, minutes] = selectedTime.split(':')
      startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    }

    // Calculate end time based on total duration
    const endDate = new Date(startDate)
    endDate.setMinutes(endDate.getMinutes() + guest.totalDuration)

    // Create customer first (or search for existing)
    let customerId
    try {
      const searchResponse = await client.customers.search({
        query: {
          filter: {
            emailAddress: {
              exact: contactInfo.email
            }
          }
        }
      })

      if (searchResponse.customers && searchResponse.customers.length > 0) {
        customerId = searchResponse.customers[0].id
      } else {
        // Create new customer
        const createResponse = await client.customers.create({
          givenName: contactInfo.name.split(' ')[0],
          familyName: contactInfo.name.split(' ').slice(1).join(' '),
          emailAddress: contactInfo.email,
          phoneNumber: contactInfo.phone
        })
        customerId = createResponse.customer.id
      }
    } catch (customerError) {
      console.error('Customer creation error:', customerError)
      // Continue without customer ID if it fails
    }

    // Get team member ID (required for Square bookings)
    let teamMemberId = guest.technician?.squareTeamMemberId || guest.technician?.id

    // Handle "Any Staff" selection - auto-assign available technician
    if (!teamMemberId || teamMemberId === 'any') {
      // Extract service IDs for availability search
      const serviceIds = guest.services.map(s => s.squareVariationId || s.id)
      const availableTech = await findAvailableTechnician(
        selectedDate,
        selectedTime,
        guest.totalDuration || 30,
        excludeTechnicianIds,
        serviceIds
      )
      teamMemberId = availableTech.id
      console.log(`Auto-assigned technician: ${availableTech.name} (${availableTech.id})`)
    }

    if (!teamMemberId) {
      throw new Error('Team member is required for booking')
    }

    // Prepare booking items (services)
    // Each segment needs: teamMemberId, durationMinutes, serviceVariationId, serviceVariationVersion (BigInt)
    const appointmentSegments = guest.services.map(service => ({
      teamMemberId: teamMemberId,
      durationMinutes: service.duration || 30,
      serviceVariationId: service.squareVariationId || service.id,
      serviceVariationVersion: BigInt(1)
    }))

    // Build customer note with guest name and special requests
    let customerNote = ''
    if (guest.guestName) {
      customerNote = `Guest: ${guest.guestName}`
    }
    if (contactInfo.specialRequests) {
      customerNote = customerNote
        ? `${customerNote}\n${contactInfo.specialRequests}`
        : contactInfo.specialRequests
    }

    // Create the booking
    const bookingRequest = {
      idempotencyKey: randomUUID(),
      booking: {
        locationId: locationId,
        startAt: startDate.toISOString(),
        customerId: customerId,
        customerNote: customerNote,
        appointmentSegments: appointmentSegments.length > 0
          ? appointmentSegments
          : [{
              teamMemberId: teamMemberId,
              durationMinutes: guest.totalDuration,
            }]
      }
    }

    const response = await client.bookings.create(bookingRequest)

    return {
      bookingId: response.booking.id,
      status: response.booking.status,
      startAt: response.booking.startAt,
      customerId: customerId,
      teamMemberId: teamMemberId
    }
  } catch (error) {
    console.error('Square booking error:', error)
    throw error
  }
}

export async function POST(request) {
  try {
    const bookingData = await request.json()
    const { guests, selectedDate, selectedTime, contactInfo, groupSize } = bookingData
    const useSquareBookings = process.env.USE_SQUARE_BOOKINGS === 'true'

    // Log booking data
    console.log('=== NEW GROUP BOOKING ===')
    console.log('Contact:', contactInfo)
    console.log('Date:', selectedDate)
    console.log('Time:', selectedTime)
    console.log('Group Size:', groupSize)
    console.log('Use Square:', useSquareBookings)

    let bookingIds = []
    let source = 'mock'

    if (useSquareBookings) {
      // Track assigned technicians for smart "Any Staff" distribution
      const assignedTechnicianIds = new Set()

      // Add explicitly selected technicians first (not "any")
      for (const guest of guests) {
        if (guest.technician?.id && guest.technician.id !== 'any') {
          const techId = guest.technician.squareTeamMemberId || guest.technician.id
          assignedTechnicianIds.add(techId)
        }
      }

      // Process each guest sequentially to ensure proper technician distribution
      const squareBookings = []
      for (const guest of guests) {
        const booking = await createSquareBooking(
          guest,
          selectedDate,
          selectedTime,
          contactInfo,
          Array.from(assignedTechnicianIds)
        )
        squareBookings.push(booking)
        // Track the assigned technician for "Any Staff" distribution
        if (booking.teamMemberId) {
          assignedTechnicianIds.add(booking.teamMemberId)
        }
      }

      bookingIds = squareBookings.map(b => b.bookingId)
      source = 'square'

      console.log('Square Bookings Created:', bookingIds)
    } else {
      // Only generate mock booking IDs if Square is explicitly disabled
      bookingIds = guests.map((_, index) => `BK${Date.now()}-${index + 1}`)
    }

    // Log guest details
    guests.forEach((guest, index) => {
      console.log(`\nGuest ${guest.guestNumber}${guest.guestName ? ` (${guest.guestName})` : ''}:`)
      console.log('  Services:', guest.services.map(s => s.name).join(', '))
      console.log('  Technician:', guest.technician?.name || 'Any available')
      console.log('  Total Price: $', guest.totalPrice)
      console.log('  Duration:', guest.totalDuration, 'minutes')
      console.log('  Booking ID:', bookingIds[index])
    })
    console.log('========================\n')

    return NextResponse.json({
      success: true,
      bookingIds,
      message: `Successfully booked ${groupSize} appointment${groupSize > 1 ? 's' : ''}`,
      confirmation: {
        date: selectedDate,
        time: selectedTime,
        groupSize,
        bookingIds
      },
      source
    })
  } catch (error) {
    console.error('Booking error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}

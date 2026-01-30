import { NextResponse } from 'next/server'
import { getSquareClient, getLocationId } from '@/lib/squareClient'
import { randomUUID } from 'crypto'

// Find an available technician for the given time slot
// Uses Square's searchAvailability (with 1-hour window) to find who's actually working,
// then picks an available technician not in the exclude list
async function findAvailableTechnician(selectedDate, selectedTime, duration, excludeTechnicianIds = [], serviceIds = []) {
  try {
    const client = getSquareClient()
    const locationId = getLocationId()

    // Comox, BC is in Pacific Time
    const dateObj = new Date(selectedDate + 'T12:00:00Z')
    const month = dateObj.getUTCMonth()
    const isPDT = month >= 2 && month <= 9
    const tzOffset = isPDT ? '-07:00' : '-08:00'

    // Parse the selected time into a proper Pacific timezone Date
    let hours, mins
    if (selectedTime.includes('AM') || selectedTime.includes('PM')) {
      const [time, period] = selectedTime.split(' ')
      ;[hours, mins] = time.split(':').map(Number)
      if (period === 'PM' && hours !== 12) hours += 12
      if (period === 'AM' && hours === 12) hours = 0
    } else {
      ;[hours, mins] = selectedTime.split(':').map(Number)
    }
    const hh = String(hours).padStart(2, '0')
    const mm = String(mins).padStart(2, '0')
    const requestedStart = new Date(`${selectedDate}T${hh}:${mm}:00${tzOffset}`)

    const excludeSet = new Set(excludeTechnicianIds)

    // Use searchAvailability with a proper 1-hour+ window to find who's working
    if (serviceIds.length > 0) {
      const searchStart = new Date(`${selectedDate}T00:00:00${tzOffset}`)
      const searchEnd = new Date(`${selectedDate}T23:59:59${tzOffset}`)

      const segmentFilters = serviceIds.map(sid => ({
        serviceVariationId: sid
      }))

      try {
        const availabilityResponse = await client.bookings.searchAvailability({
          query: {
            filter: {
              locationId: locationId,
              startAtRange: {
                startAt: searchStart.toISOString(),
                endAt: searchEnd.toISOString()
              },
              segmentFilters: segmentFilters
            }
          }
        })

        const availabilities = availabilityResponse.availabilities || []

        // Collect all eligible technicians at the requested time, then pick randomly
        const eligible = []
        for (const slot of availabilities) {
          const slotStart = new Date(slot.startAt)
          if (Math.abs(slotStart.getTime() - requestedStart.getTime()) < 60000) {
            for (const segment of slot.appointmentSegments || []) {
              const teamMemberId = segment.teamMemberId
              if (teamMemberId && !excludeSet.has(teamMemberId)) {
                eligible.push(teamMemberId)
              }
            }
          }
        }

        if (eligible.length > 0) {
          // Pick a random technician from all eligible
          const picked = eligible[Math.floor(Math.random() * eligible.length)]
          try {
            const teamMemberResponse = await client.teamMembers.retrieve(picked)
            const member = teamMemberResponse.teamMember
            return {
              id: picked,
              name: `${member?.givenName || ''} ${member?.familyName || ''}`.trim() || 'Staff Member'
            }
          } catch {
            return { id: picked, name: 'Staff Member' }
          }
        }

      } catch (searchError) {
        console.error('[findAvailableTechnician] searchAvailability failed, falling back:', searchError.message)
      }
    }

    // Fallback: Use team members list + existing bookings
    // Only assign to team members who have bookings today (i.e., are working)
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

    const dayStart = new Date(`${selectedDate}T00:00:00${tzOffset}`)
    const dayEnd = new Date(`${selectedDate}T23:59:59${tzOffset}`)

    const bookingsResponse = await client.bookings.list({
      locationId: locationId,
      startAtMin: dayStart.toISOString(),
      startAtMax: dayEnd.toISOString()
    })

    // Build a set of team members who have bookings today (meaning they're working)
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

    // Collect all working, available, non-excluded team members, then pick randomly
    const fallbackEligible = []
    for (const member of teamMembers) {
      if (!workingTeamMemberIds.has(member.id)) continue
      if (excludeSet.has(member.id)) continue

      const techBookings = technicianBookings.get(member.id) || []
      let isAvailable = true
      for (const booking of techBookings) {
        if (requestedStart < booking.end && requestedEnd > booking.start) {
          isAvailable = false
          break
        }
      }

      if (isAvailable) {
        fallbackEligible.push(member)
      }
    }

    if (fallbackEligible.length > 0) {
      const picked = fallbackEligible[Math.floor(Math.random() * fallbackEligible.length)]
      return {
        id: picked.id,
        name: `${picked.givenName || ''} ${picked.familyName || ''}`.trim() || 'Staff Member'
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
// preAssignedTech: optional pre-validated technician for "Any Staff" guests (from pre-validation step)
async function createSquareBooking(guest, selectedDate, selectedTime, contactInfo, excludeTechnicianIds = [], preAssignedTech = null) {
  try {
    const client = getSquareClient()
    const locationId = getLocationId()

    // Combine date and time in Pacific timezone
    const dateObj = new Date(selectedDate + 'T12:00:00Z')
    const month = dateObj.getUTCMonth()
    const isPDT = month >= 2 && month <= 9
    const tzOffset = isPDT ? '-07:00' : '-08:00'

    let hours, minutes
    if (selectedTime.includes('AM') || selectedTime.includes('PM')) {
      ;({ hours, minutes } = parse12HourTime(selectedTime))
    } else {
      ;[hours, minutes] = selectedTime.split(':').map(Number)
    }
    const hh = String(hours).padStart(2, '0')
    const mm = String(minutes).padStart(2, '0')
    const startDate = new Date(`${selectedDate}T${hh}:${mm}:00${tzOffset}`)

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
    let teamMemberName = null

    // Handle "Any Staff" selection - use pre-assigned tech if available, otherwise find one
    if (!teamMemberId || teamMemberId === 'any') {
      if (preAssignedTech) {
        // Use the pre-validated assignment from booking pre-check
        teamMemberId = preAssignedTech.id
        teamMemberName = preAssignedTech.name
      } else {
        // Fallback: find available technician (shouldn't happen with pre-validation)
        const serviceIds = guest.services.map(s => s.squareVariationId || s.id)
        const availableTech = await findAvailableTechnician(
          selectedDate,
          selectedTime,
          guest.totalDuration || 30,
          excludeTechnicianIds,
          serviceIds
        )
        teamMemberId = availableTech.id
        teamMemberName = availableTech.name
      }
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
      teamMemberId: teamMemberId,
      teamMemberName: teamMemberName
    }
  } catch (error) {
    console.error('Square booking error:', error)
    throw error
  }
}

export async function POST(request) {
  try {
    const bookingData = await request.json()
    const { guests, selectedDate, selectedTime, contactInfo, groupSize, preAssignedTechnicians } = bookingData
    const useSquareBookings = process.env.USE_SQUARE_BOOKINGS === 'true'

    // Build a map of pre-assigned technicians from the V2 availability endpoint
    // Format: guestIndex -> technicianId
    const preAssignedMap = new Map()
    if (preAssignedTechnicians && Array.isArray(preAssignedTechnicians)) {
      for (const assignment of preAssignedTechnicians) {
        if (assignment.guestIndex !== undefined && assignment.technicianId) {
          preAssignedMap.set(assignment.guestIndex, assignment.technicianId)
        }
      }
    }

    // Log booking data

    let bookingIds = []
    let source = 'mock'
    let assignedTechnicians = []

    if (useSquareBookings) {
      // Fetch all team members once for name lookups
      const client = getSquareClient()
      const locationId = getLocationId()
      const teamResponse = await client.teamMembers.search({
        query: {
          filter: {
            locationIds: [locationId],
            status: 'ACTIVE'
          }
        }
      })

      // Build a lookup map: teamMemberId -> display name
      const TECHNICIAN_DISPLAY_NAMES = {
        'Cheng Ping Deng': 'Simone',
      }
      const teamMemberNames = new Map()
      for (const member of teamResponse.teamMembers || []) {
        const fullName = `${member?.givenName || ''} ${member?.familyName || ''}`.trim()
        const displayName = TECHNICIAN_DISPLAY_NAMES[fullName] || fullName || 'Staff Member'
        teamMemberNames.set(member.id, displayName)
      }

      // Track assigned technicians for smart "Any Staff" distribution
      const assignedTechnicianIds = new Set()

      // Add explicitly selected technicians first (not "any")
      for (const guest of guests) {
        if (guest.technician?.id && guest.technician.id !== 'any') {
          const techId = guest.technician.squareTeamMemberId || guest.technician.id
          assignedTechnicianIds.add(techId)
        }
      }

      // PRE-VALIDATION: Ensure all "Any Staff" guests can be assigned BEFORE creating any bookings
      // This prevents partial bookings (e.g., 2 of 3 created) when there aren't enough technicians
      const preAssignedTechIds = new Set(assignedTechnicianIds)
      const plannedAssignments = new Map() // guestIndex -> { id, name }

      for (let i = 0; i < guests.length; i++) {
        const guest = guests[i]
        if (!guest.technician?.id || guest.technician.id === 'any') {
          // Check if we have a pre-assigned technician from the V2 availability endpoint
          const preAssignedTechId = preAssignedMap.get(i)
          if (preAssignedTechId && !preAssignedTechIds.has(preAssignedTechId)) {
            // Use the pre-computed assignment from the availability check
            const techName = teamMemberNames.get(preAssignedTechId) || 'Staff Member'
            plannedAssignments.set(i, { id: preAssignedTechId, name: techName })
            preAssignedTechIds.add(preAssignedTechId)
          } else {
            // Fallback: find available technician dynamically
            const serviceIds = guest.services.map(s => s.squareVariationId || s.id)
            try {
              const availableTech = await findAvailableTechnician(
                selectedDate,
                selectedTime,
                guest.totalDuration || 30,
                Array.from(preAssignedTechIds),
                serviceIds
              )
              plannedAssignments.set(i, availableTech)
              preAssignedTechIds.add(availableTech.id)
            } catch (error) {
              // Can't find a technician for this guest — fail before creating any bookings
              return NextResponse.json({
                success: false,
                error: `Unable to find an available technician for ${guest.guestName || `Guest ${i + 1}`}. Please try a different time or change technician selections.`
              }, { status: 400 })
            }
          }
        }
      }

      // Process each guest sequentially to ensure proper technician distribution
      const squareBookings = []

      for (let i = 0; i < guests.length; i++) {
        const guest = guests[i]

        // Use pre-planned assignment for "Any Staff" guests to avoid re-querying
        const preAssignedTech = plannedAssignments.get(i)

        const booking = await createSquareBooking(
          guest,
          selectedDate,
          selectedTime,
          contactInfo,
          Array.from(assignedTechnicianIds),
          preAssignedTech // Pass pre-validated assignment
        )
        squareBookings.push(booking)

        // Track the assigned technician for "Any Staff" distribution
        if (booking.teamMemberId) {
          assignedTechnicianIds.add(booking.teamMemberId)
        }

        // Get technician name — prefer the lookup map (most reliable), then
        // findAvailableTechnician's result, then the guest's selection
        let technicianName = 'Staff Member'
        if (booking.teamMemberId && teamMemberNames.has(booking.teamMemberId)) {
          technicianName = teamMemberNames.get(booking.teamMemberId)
        } else if (booking.teamMemberName && booking.teamMemberName !== 'Staff Member') {
          technicianName = booking.teamMemberName
        } else if (guest.technician?.name && guest.technician?.id !== 'any') {
          technicianName = guest.technician.name
        }


        assignedTechnicians.push({
          guestIndex: i,
          guestNumber: guest.guestNumber,
          guestName: guest.guestName,
          teamMemberId: booking.teamMemberId,
          technicianName: technicianName
        })
      }

      bookingIds = squareBookings.map(b => b.bookingId)
      source = 'square'

    } else {
      // Only generate mock booking IDs if Square is explicitly disabled
      bookingIds = guests.map((_, index) => `BK${Date.now()}-${index + 1}`)
    }

    // Log guest details
    guests.forEach((guest, index) => {
    })

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
      assignedTechnicians,
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

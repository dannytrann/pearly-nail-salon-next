import { NextResponse } from 'next/server'
import { getSquareClient, getLocationId } from '@/lib/squareClient'
import { randomUUID } from 'crypto'

// Find an available technician for the given time slot
async function findAvailableTechnician(selectedDate, selectedTime, duration) {
  try {
    const client = getSquareClient()
    const locationId = getLocationId()

    // Convert date to ISO format for Square API
    const startDate = new Date(selectedDate + 'T00:00:00')
    const endDate = new Date(selectedDate + 'T23:59:59')

    // Get all bookings for the day
    const bookingsResponse = await client.bookings.list({
      locationId: locationId,
      startAtMin: startDate.toISOString(),
      startAtMax: endDate.toISOString()
    })

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
    if (teamMembers.length === 0) {
      throw new Error('No team members available')
    }

    // Build a map of technician -> booked time slots
    const technicianBookings = new Map()
    if (bookingsResponse.bookings) {
      for (const booking of bookingsResponse.bookings) {
        if (booking.startAt && booking.appointmentSegments) {
          for (const segment of booking.appointmentSegments) {
            const techId = segment.teamMemberId
            const bookingStart = new Date(booking.startAt)
            const bookingEnd = new Date(bookingStart)
            bookingEnd.setMinutes(bookingEnd.getMinutes() + (segment.durationMinutes || 30))

            if (techId) {
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

    // Parse the selected time (handle both 12-hour and 24-hour formats)
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
    const requestedEnd = new Date(requestedStart)
    requestedEnd.setMinutes(requestedEnd.getMinutes() + duration)

    // Find a technician that is available at the requested time
    for (const member of teamMembers) {
      const techBookings = technicianBookings.get(member.id) || []

      // Check if this time slot conflicts with any existing bookings
      let isAvailable = true
      for (const booking of techBookings) {
        // Check for overlap
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
async function createSquareBooking(guest, selectedDate, selectedTime, contactInfo) {
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
      const availableTech = await findAvailableTechnician(
        selectedDate,
        selectedTime,
        guest.totalDuration || 30
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

    // Create the booking
    const bookingRequest = {
      idempotencyKey: randomUUID(),
      booking: {
        locationId: locationId,
        startAt: startDate.toISOString(),
        customerId: customerId,
        customerNote: contactInfo.specialRequests || '',
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
      customerId: customerId
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
      // Create Square bookings for each guest (no mock fallback)
      const squareBookings = await Promise.all(
        guests.map(guest => createSquareBooking(guest, selectedDate, selectedTime, contactInfo))
      )

      bookingIds = squareBookings.map(b => b.bookingId)
      source = 'square'

      console.log('Square Bookings Created:', bookingIds)
    } else {
      // Only generate mock booking IDs if Square is explicitly disabled
      bookingIds = guests.map((_, index) => `BK${Date.now()}-${index + 1}`)
    }

    // Log guest details
    guests.forEach((guest, index) => {
      console.log(`\nGuest ${guest.guestNumber}:`)
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

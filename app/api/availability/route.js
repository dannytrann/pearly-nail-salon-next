import { NextResponse } from 'next/server'
import { timeSlots } from '@/lib/mockData'
import { getSquareClient, getLocationId } from '@/lib/squareClient'

// Fetch availability from Square Bookings - checks ALL selected technicians
async function fetchSquareAvailability(date, guestData, allTimeSlots) {
  try {
    const client = getSquareClient()
    const locationId = getLocationId()

    // Convert date to ISO format for Square API
    const startDate = new Date(date + 'T00:00:00')
    const endDate = new Date(date + 'T23:59:59')

    // Get all bookings for the day
    const response = await client.bookings.list({
      locationId: locationId,
      startAtMin: startDate.toISOString(),
      startAtMax: endDate.toISOString()
    })

    // Build a map of technician -> booked time slots
    const technicianBookings = new Map()

    if (response.bookings) {
      for (const booking of response.bookings) {
        if (booking.startAt && booking.appointmentSegments) {
          const bookingTime = new Date(booking.startAt)
          const timeString = bookingTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })

          // Get duration to block subsequent slots
          for (const segment of booking.appointmentSegments) {
            const techId = segment.teamMemberId
            if (techId) {
              if (!technicianBookings.has(techId)) {
                technicianBookings.set(techId, new Set())
              }

              // Block the start time and calculate blocked duration
              const duration = segment.durationMinutes || 30
              const blockedSlots = getBlockedTimeSlots(timeString, duration, allTimeSlots)
              blockedSlots.forEach(slot => technicianBookings.get(techId).add(slot))
            }
          }
        }
      }
    }

    // Extract technician info from guest data
    const selectedTechnicianIds = []
    let hasAnyStaffSelection = false

    if (Array.isArray(guestData)) {
      for (const guest of guestData) {
        if (guest.technician?.id === 'any') {
          hasAnyStaffSelection = true
        } else if (guest.technician?.id) {
          selectedTechnicianIds.push(guest.technician.id)
        }
      }
    }

    // Get all technician IDs for "Any Staff" checking
    const allTechnicianIds = Array.from(technicianBookings.keys())

    // Filter slots based on technician availability
    const availableSlots = allTimeSlots.filter(slot => {
      // First check: ALL specifically selected technicians must be available
      for (const techId of selectedTechnicianIds) {
        const techBookedSlots = technicianBookings.get(techId)
        if (techBookedSlots && techBookedSlots.has(slot)) {
          return false // A specific technician is booked at this time
        }
      }

      // Second check: If "Any Staff" selected, at least one technician must be free
      if (hasAnyStaffSelection) {
        // Check if at least one technician is available at this slot
        let anyAvailable = false

        // If we have booking data, check against known technicians
        if (allTechnicianIds.length > 0) {
          for (const techId of allTechnicianIds) {
            const techBookedSlots = technicianBookings.get(techId)
            if (!techBookedSlots || !techBookedSlots.has(slot)) {
              anyAvailable = true
              break
            }
          }
        } else {
          // No booking data means all technicians are available
          anyAvailable = true
        }

        return anyAvailable
      }

      return true // No "Any Staff" selection, specific technicians are available
    })

    return {
      availableSlots,
      totalBookings: response.bookings?.length || 0,
      technicianCount: selectedTechnicianIds.length
    }
  } catch (error) {
    console.error('Error fetching Square availability:', error)
    throw error
  }
}

// Helper function to get all time slots blocked by a booking
function getBlockedTimeSlots(startTime, durationMinutes, allTimeSlots) {
  const blocked = new Set()
  blocked.add(startTime)

  // Parse start time
  const [hours, minutes] = startTime.split(':').map(Number)
  const startMinutes = hours * 60 + minutes

  // Block slots for the duration of the service
  // Assuming 30-minute slot intervals
  const slotInterval = 30
  const slotsToBlock = Math.ceil(durationMinutes / slotInterval)

  for (let i = 1; i < slotsToBlock; i++) {
    const blockedMinutes = startMinutes + (i * slotInterval)
    const blockedHours = Math.floor(blockedMinutes / 60)
    const blockedMins = blockedMinutes % 60
    const blockedTime = `${String(blockedHours).padStart(2, '0')}:${String(blockedMins).padStart(2, '0')}`

    if (allTimeSlots.includes(blockedTime)) {
      blocked.add(blockedTime)
    }
  }

  return blocked
}

// Fetch time slots from business hours API
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

    // Get available time slots based on business hours
    const allTimeSlots = await fetchTimeSlots()

    if (useSquareBookings) {
      // Pass guest data to check per-technician availability
      const squareData = await fetchSquareAvailability(date, guests, allTimeSlots)

      const guestCount = Array.isArray(guests) ? guests.length : guests
      return NextResponse.json({
        success: true,
        date,
        availableSlots: squareData.availableSlots,
        message: `Found ${squareData.availableSlots.length} available slots for ${guestCount} guest(s) with ${squareData.technicianCount} technician(s)`,
        source: 'square',
        totalBookings: squareData.totalBookings
      })
    }

    // Only use mock availability if Square is explicitly disabled
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

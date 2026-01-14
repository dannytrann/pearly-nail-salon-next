import { NextResponse } from 'next/server'
import { getSquareClient, getLocationId } from '@/lib/squareClient'
import { timeSlots } from '@/lib/mockData'

// Generate time slots from business hours
function generateTimeSlots(businessHours) {
  const slots = []

  // Find today's day of week
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const today = days[new Date().getDay()]

  // Find hours for today
  const todayHours = businessHours.periods?.find(p => p.dayOfWeek === today)

  if (!todayHours) {
    console.warn('No business hours found for today, using defaults')
    return timeSlots
  }

  // Parse start and end times (format: "HH:MM")
  const [startHour, startMin] = todayHours.startLocalTime.split(':').map(Number)
  const [endHour, endMin] = todayHours.endLocalTime.split(':').map(Number)

  // Generate 30-minute intervals
  let currentHour = startHour
  let currentMin = startMin

  while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
    const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`
    slots.push(timeString)

    // Add 30 minutes
    currentMin += 30
    if (currentMin >= 60) {
      currentMin = 0
      currentHour++
    }
  }

  return slots
}

// Fetch business hours from Square
async function fetchSquareBusinessHours() {
  try {
    const client = getSquareClient()
    const locationId = getLocationId()

    const response = await client.locations.get({ locationId })

    if (response.location && response.location.businessHours) {
      const slots = generateTimeSlots(response.location.businessHours)

      return {
        businessHours: response.location.businessHours,
        timeSlots: slots,
        timezone: response.location.timezone || 'America/Vancouver'
      }
    }

    throw new Error('No business hours found for location')
  } catch (error) {
    console.error('Error fetching Square business hours:', error)
    throw error
  }
}

export async function GET() {
  try {
    const useSquareBusinessHours = process.env.USE_SQUARE_BUSINESS_HOURS === 'true'

    if (useSquareBusinessHours) {
      const data = await fetchSquareBusinessHours()
      return NextResponse.json({
        success: true,
        ...data,
        source: 'square'
      })
    }

    // Only use mock time slots if Square is explicitly disabled
    return NextResponse.json({
      success: true,
      timeSlots: timeSlots,
      source: 'mock'
    })
  } catch (error) {
    console.error('Business hours API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch business hours' },
      { status: 500 }
    )
  }
}

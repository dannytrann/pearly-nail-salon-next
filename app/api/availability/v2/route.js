import { NextResponse } from 'next/server'
import { getSquareClient, getLocationId } from '@/lib/squareClient'
import {
  findGroupAvailability,
  searchMultipleDates,
  formatTimeDisplay
} from '@/lib/groupBookingLogic'

// Business hours configuration
const BUSINESS_HOURS = {
  SUN: { startTime: '10:00', endTime: '16:00', lastBookingBuffer: 60 },
  MON: { startTime: '09:00', endTime: '18:00', lastBookingBuffer: 60 },
  TUE: { startTime: '09:00', endTime: '18:00', lastBookingBuffer: 60 },
  WED: { startTime: '09:00', endTime: '18:00', lastBookingBuffer: 60 },
  THU: { startTime: '09:00', endTime: '18:00', lastBookingBuffer: 60 },
  FRI: { startTime: '09:00', endTime: '18:00', lastBookingBuffer: 60 },
  SAT: { startTime: '09:00', endTime: '18:00', lastBookingBuffer: 60 },
}

/**
 * Get business hours for a specific date
 */
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
      lastBookingTime
    }
  }

  return { startTime: '09:00', endTime: '18:00', lastBookingTime: '17:00' }
}

/**
 * Get Pacific timezone offset for a date
 */
function getPacificOffset(date) {
  const dateObj = new Date(date + 'T12:00:00Z')
  const month = dateObj.getUTCMonth()
  const isPDT = month >= 2 && month <= 9
  return isPDT ? '-07:00' : '-08:00'
}

/**
 * Fetch availability for ALL technicians on a given date
 * Returns: Map of techId -> Set of available ISO timestamps
 */
async function fetchAllTechnicianAvailability(client, locationId, date, clients, allTechnicianIds) {
  const tzOffset = getPacificOffset(date)
  const startAt = new Date(`${date}T00:00:00${tzOffset}`)
  const endAt = new Date(`${date}T23:59:59${tzOffset}`)

  // Build a map to store availability per technician
  const techAvailability = new Map()
  allTechnicianIds.forEach(id => techAvailability.set(id, new Set()))

  // Query availability for each client's services
  // We need to check if each technician can do each client's services
  const promises = []

  for (const client of clients) {
    const services = client.services || []
    if (services.length === 0) continue

    // Build segment filters for this client's services
    const segmentFilters = services.map(service => ({
      serviceVariationId: service.squareVariationId || service.id
    }))

    // Query availability for each technician
    for (const techId of allTechnicianIds) {
      const techSegmentFilters = segmentFilters.map(sf => ({
        ...sf,
        teamMemberIdFilter: { any: [techId] }
      }))

      promises.push(
        client.bookings?.searchAvailability({
          query: {
            filter: {
              locationId,
              startAtRange: {
                startAt: startAt.toISOString(),
                endAt: endAt.toISOString()
              },
              segmentFilters: techSegmentFilters
            }
          }
        }).then(response => ({
          techId,
          clientIndex: clients.indexOf(client),
          availabilities: response.availabilities || []
        })).catch(err => {
          console.error(`Error fetching availability for tech ${techId}:`, err.message)
          return { techId, clientIndex: clients.indexOf(client), availabilities: [] }
        })
      )
    }
  }

  // Wait, the above approach won't work because we need to use the Square client properly
  // Let me refactor this

  // For each technician, query their availability for ALL services combined
  // This tells us which time slots they can serve any booking
  for (const techId of allTechnicianIds) {
    try {
      // Query with a simple service to get the technician's general availability
      // We'll use the first client's first service as a baseline
      const firstService = clients[0]?.services?.[0]
      if (!firstService) continue

      const response = await client.bookings.searchAvailability({
        query: {
          filter: {
            locationId,
            startAtRange: {
              startAt: startAt.toISOString(),
              endAt: endAt.toISOString()
            },
            segmentFilters: [{
              serviceVariationId: firstService.squareVariationId || firstService.id,
              teamMemberIdFilter: { any: [techId] }
            }]
          }
        }
      })

      if (response.availabilities) {
        for (const avail of response.availabilities) {
          if (avail.startAt) {
            techAvailability.get(techId).add(avail.startAt)
          }
        }
      }

      console.log(`[TechAvail] ${techId}: ${techAvailability.get(techId).size} slots`)
    } catch (err) {
      console.error(`Error fetching availability for tech ${techId}:`, err.message)
    }
  }

  return techAvailability
}

/**
 * Fetch availability with proper per-client, per-technician queries
 * This ensures we know which technician can serve which client at which time
 * All queries run in PARALLEL for better performance
 */
async function fetchDetailedTechAvailability(squareClient, locationId, date, clients, allTechnicianIds, techNameMap = new Map()) {
  const tzOffset = getPacificOffset(date)
  const startAt = new Date(`${date}T00:00:00${tzOffset}`)
  const endAt = new Date(`${date}T23:59:59${tzOffset}`)

  // Map: techId -> Map<clientIndex, Set<ISO timestamps>>
  // This tells us for each tech, which clients they can serve at which times
  const techClientAvailability = new Map()
  allTechnicianIds.forEach(id => techClientAvailability.set(id, new Map()))

  // Build all queries first, then execute in parallel
  const queries = []

  for (let clientIdx = 0; clientIdx < clients.length; clientIdx++) {
    const guestClient = clients[clientIdx]
    const services = guestClient.services || []
    if (services.length === 0) continue

    // Build segment filters for this client's services
    const segmentFilters = services.map(service => ({
      serviceVariationId: service.squareVariationId || service.id
    }))

    // Determine which technicians to check for this client
    const techsToCheck = guestClient.technician?.id === 'any'
      ? allTechnicianIds
      : [guestClient.technician?.squareTeamMemberId || guestClient.technician?.id].filter(Boolean)


    for (const techId of techsToCheck) {
      const techSegmentFilters = segmentFilters.map(sf => ({
        ...sf,
        teamMemberIdFilter: { any: [techId] }
      }))

      // Add query to the batch with metadata
      queries.push({
        techId,
        clientIdx,
        promise: squareClient.bookings.searchAvailability({
          query: {
            filter: {
              locationId,
              startAtRange: {
                startAt: startAt.toISOString(),
                endAt: endAt.toISOString()
              },
              segmentFilters: techSegmentFilters
            }
          }
        }).catch(err => {
          console.error(`Error fetching for tech ${techId}, client ${clientIdx}:`, err.message)
          return { availabilities: [] }
        })
      })
    }
  }

  console.log(`[Availability V2] Fetching ${queries.length} queries in parallel for ${clients.length} clients`)

  // Execute all queries in parallel
  const results = await Promise.all(queries.map(q => q.promise))

  // Process results
  for (let i = 0; i < queries.length; i++) {
    const { techId, clientIdx } = queries[i]
    const response = results[i]

    const slots = new Set()
    if (response.availabilities) {
      for (const avail of response.availabilities) {
        if (avail.startAt) {
          slots.add(avail.startAt)
        }
      }
    }

    techClientAvailability.get(techId).set(clientIdx, slots)
    const techName = techNameMap.get(techId) || techId
    // Log the actual times in readable format
    const readableTimes = [...slots].map(iso => isoToTimeString(iso)).sort().join(', ')
    console.log(`[TechAvail] ${techName} can serve client ${clientIdx} at ${slots.size} times: ${readableTimes || 'none'}`)
  }

  return techClientAvailability
}

/**
 * Convert ISO timestamp to HH:MM format in Pacific time
 */
function isoToTimeString(isoString) {
  const date = new Date(isoString)
  // Convert to Pacific time
  const pacificTime = new Date(date.toLocaleString('en-US', { timeZone: 'America/Vancouver' }))
  const hours = pacificTime.getHours()
  const minutes = pacificTime.getMinutes()
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

/**
 * Attempt to assign technicians for all clients at a given start time
 * Using the detailed per-client availability data
 */
function attemptGroupAssignmentV2(clients, techClientAvailability, date, startTimeHHMM, tzOffset, allTechnicianIds, debug = false) {
  const assignedTechIds = new Set()
  const assignments = []

  // Build the ISO timestamp for comparison
  const isoStart = `${date}T${startTimeHHMM}:00${tzOffset}`
  const targetTime = new Date(isoStart).getTime()

  if (debug) {
    console.log(`[Assignment] Trying time ${startTimeHHMM}, target ISO: ${isoStart}, targetTime: ${targetTime}`)
  }

  // Sort clients by constraints (most constrained first)
  // IMPORTANT: Specific technician selections MUST be processed first,
  // otherwise "Any Staff" might take a technician that a specific selection needs
  const sortedClients = [...clients].map((c, idx) => ({ ...c, originalIndex: idx })).sort((a, b) => {
    // 1. Specific tech BEFORE "any" (most important constraint)
    const aSpecific = a.technician?.id && a.technician.id !== 'any' ? 0 : 1
    const bSpecific = b.technician?.id && b.technician.id !== 'any' ? 0 : 1
    if (aSpecific !== bSpecific) {
      return aSpecific - bSpecific
    }
    // 2. Then longest duration first (within each group)
    return b.totalDuration - a.totalDuration
  })

  for (const client of sortedClients) {
    let assignedTechId = null
    const clientIdx = client.originalIndex

    // Determine which technicians this client allows
    const allowedTechIds = client.technician?.id === 'any'
      ? allTechnicianIds
      : [client.technician?.squareTeamMemberId || client.technician?.id].filter(Boolean)

    if (debug) {
      console.log(`[Assignment] Client ${clientIdx} (${client.guestName}): tech=${client.technician?.name}, allowedTechIds=${JSON.stringify(allowedTechIds)}`)
    }

    // Try to find an available technician
    for (const techId of allowedTechIds) {
      if (assignedTechIds.has(techId)) continue // Already assigned

      // Check if this tech can serve this client at this time
      const clientSlots = techClientAvailability.get(techId)?.get(clientIdx)
      if (!clientSlots) {
        if (debug) {
          console.log(`[Assignment] Tech ${techId} has no slots data for client ${clientIdx}`)
        }
        continue
      }

      // Check if the target time is in the available slots
      for (const slot of clientSlots) {
        const slotTime = new Date(slot).getTime()
        if (slotTime === targetTime) {
          assignedTechId = techId
          break
        }
      }

      if (debug && !assignedTechId && clientSlots.size > 0) {
        const sampleSlot = [...clientSlots][0]
        console.log(`[Assignment] Tech ${techId} for client ${clientIdx}: no match. Sample slot: ${sampleSlot} (${new Date(sampleSlot).getTime()}) vs target ${targetTime}`)
      }

      if (assignedTechId) break
    }

    if (!assignedTechId) {
      if (debug) {
        console.log(`[Assignment] FAILED for client ${clientIdx} (${client.guestName}) at ${startTimeHHMM}`)
      }
      return {
        success: false,
        reason: client.technician?.id === 'any'
          ? `No available technician for ${client.guestName}`
          : `${client.technician?.name} is not available for ${client.guestName}`
      }
    }

    assignedTechIds.add(assignedTechId)
    assignments.push({
      clientIndex: clientIdx,
      guestName: client.guestName,
      technicianId: assignedTechId
    })
  }

  return { success: true, assignments }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { date, guests, searchNextDays = false, maxDays = 7 } = body

    const useSquareBookings = process.env.USE_SQUARE_BOOKINGS === 'true'

    if (!useSquareBookings) {
      // Mock mode - return some slots
      const businessHours = getBusinessHoursForDate(date)
      const mockSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM']
      return NextResponse.json({
        success: true,
        date,
        availableSlots: mockSlots,
        message: `Found ${mockSlots.length} slots (mock mode)`,
        source: 'mock'
      })
    }

    const client = getSquareClient()
    const locationId = getLocationId()

    // Get all technicians
    const teamResponse = await client.teamMembers.search({
      query: {
        filter: {
          locationIds: [locationId],
          status: 'ACTIVE'
        }
      }
    })
    const teamMembers = teamResponse.teamMembers || []
    const allTechnicianIds = teamMembers.map(m => m.id)

    // Build a name lookup map for logging
    const DISPLAY_NAMES = { 'Cheng Ping Deng': 'Simone' }
    const techNameMap = new Map()
    for (const member of teamMembers) {
      const fullName = `${member.givenName || ''} ${member.familyName || ''}`.trim()
      const displayName = DISPLAY_NAMES[fullName] || member.givenName || fullName || 'Unknown'
      techNameMap.set(member.id, displayName)
    }

    console.log(`[Availability V2] Date: ${date}, Guests: ${guests.length}, Techs: ${allTechnicianIds.length}`)

    // Fetch detailed per-client, per-technician availability
    const techClientAvailability = await fetchDetailedTechAvailability(
      client, locationId, date, guests, allTechnicianIds, techNameMap
    )

    // Get business hours and timezone
    const businessHours = getBusinessHoursForDate(date)
    const tzOffset = getPacificOffset(date)

    // Find longest duration
    const longestDuration = Math.max(...guests.map(g => g.totalDuration || 0))

    // Generate candidate start times
    const candidateTimes = []
    const [startHour, startMin] = businessHours.startTime.split(':').map(Number)
    const [lastHour, lastMin] = businessHours.lastBookingTime.split(':').map(Number)
    const startMinutes = startHour * 60 + startMin
    const lastMinutes = lastHour * 60 + lastMin

    for (let mins = startMinutes; mins <= lastMinutes; mins += 15) {
      const hour = Math.floor(mins / 60)
      const min = mins % 60
      candidateTimes.push(`${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`)
    }

    console.log(`[Availability V2] Checking ${candidateTimes.length} candidate times`)

    // Attempt assignment for each candidate time
    const validSlots = []
    for (const time of candidateTimes) {
      const result = attemptGroupAssignmentV2(
        guests, techClientAvailability, date, time, tzOffset, allTechnicianIds
      )

      if (result.success) {
        validSlots.push({
          time,
          displayTime: formatTimeDisplay(time),
          assignments: result.assignments
        })
      }
    }

    console.log(`[Availability V2] Found ${validSlots.length} valid slots`)

    if (validSlots.length > 0) {
      return NextResponse.json({
        success: true,
        date,
        availableSlots: validSlots.map(s => s.displayTime),
        validSlots, // Include full slot info with assignments
        message: `Found ${validSlots.length} available time slots`,
        source: 'square-v2'
      })
    }

    // No slots found - provide helpful message and details about unavailable technicians
    const hasSpecificTechs = guests.some(g => g.technician?.id && g.technician.id !== 'any')
    // Reuse tzOffset from earlier, create date range for alternative queries
    const altStartAt = new Date(`${date}T00:00:00${tzOffset}`)
    const altEndAt = new Date(`${date}T23:59:59${tzOffset}`)

    // First pass: identify which guests have unavailable specific technicians
    const guestsWithUnavailableTechs = []
    for (let idx = 0; idx < guests.length; idx++) {
      const g = guests[idx]
      const hasSpecificTech = g.technician?.id && g.technician.id !== 'any'
      if (!hasSpecificTech) continue

      const techId = g.technician?.squareTeamMemberId || g.technician?.id
      const techSlots = techClientAvailability.get(techId)?.get(idx)
      const hasAvailability = techSlots && techSlots.size > 0

      if (!hasAvailability) {
        guestsWithUnavailableTechs.push({ guest: g, guestIndex: idx, techId })
      }
    }

    // Second pass: for guests with unavailable techs, query OTHER technicians in parallel
    // to find which ones CAN serve that guest's services
    const alternativeQueries = []
    for (const { guest, guestIndex, techId } of guestsWithUnavailableTechs) {
      const services = guest.services || []
      if (services.length === 0) continue

      const segmentFilters = services.map(service => ({
        serviceVariationId: service.squareVariationId || service.id
      }))

      // Query all OTHER technicians for this guest
      for (const altTechId of allTechnicianIds) {
        if (altTechId === techId) continue // Skip the unavailable tech

        const techSegmentFilters = segmentFilters.map(sf => ({
          ...sf,
          teamMemberIdFilter: { any: [altTechId] }
        }))

        alternativeQueries.push({
          guestIndex,
          altTechId,
          promise: client.bookings.searchAvailability({
            query: {
              filter: {
                locationId,
                startAtRange: {
                  startAt: altStartAt.toISOString(),
                  endAt: altEndAt.toISOString()
                },
                segmentFilters: techSegmentFilters
              }
            }
          }).catch(() => ({ availabilities: [] }))
        })
      }
    }

    // Execute alternative queries in parallel
    const altResults = await Promise.all(alternativeQueries.map(q => q.promise))

    // Build map of guestIndex -> available alternative tech IDs
    const guestAlternatives = new Map()
    for (let i = 0; i < alternativeQueries.length; i++) {
      const { guestIndex, altTechId } = alternativeQueries[i]
      const response = altResults[i]

      if (response.availabilities && response.availabilities.length > 0) {
        if (!guestAlternatives.has(guestIndex)) {
          guestAlternatives.set(guestIndex, [])
        }
        guestAlternatives.get(guestIndex).push(altTechId)
      }
    }

    console.log(`[Availability V2] Found alternatives for ${guestAlternatives.size} unavailable guests`)

    // Build the final unavailable guests list with alternatives
    const unavailableTechGuests = guestsWithUnavailableTechs.map(({ guest, guestIndex }) => ({
      guestIndex,
      guestName: guest.guestName || `Guest ${guestIndex + 1}`,
      technician: guest.technician,
      hasAvailability: false,
      availableTechnicianIds: guestAlternatives.get(guestIndex) || []
    }))

    // Determine the right message based on why there are no slots
    let message
    if (unavailableTechGuests.length > 0) {
      // Some specific technicians have no availability at all
      const techNames = unavailableTechGuests.map(g => g.technician?.name).filter(Boolean)
      message = techNames.length === 1
        ? `${techNames[0]} is not available on this date.`
        : `Some of your selected technicians are not available on this date.`
    } else if (hasSpecificTechs) {
      // All specific techs have some availability, but no common time works for the group
      message = `No common times available for your selected technicians on this date.`
    } else {
      message = `Not enough available technicians for ${guests.length} guests on this date.`
    }

    return NextResponse.json({
      success: true,
      date,
      availableSlots: [],
      unavailableGuests: unavailableTechGuests,
      message,
      source: 'square-v2'
    })

  } catch (error) {
    console.error('Availability V2 API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch availability' },
      { status: 500 }
    )
  }
}

/**
 * Group Booking Logic
 *
 * GOAL: Book multiple clients at the same time with different technicians,
 * or return the best alternative recommendations.
 *
 * HARD RULES:
 * - Time is the primary constraint
 * - Technicians are assigned after a start time is chosen
 * - Never partially accept a group booking
 * - Never auto-change technicians without user consent
 * - Fail fast - no backtracking across dates or permutations
 */

// Time slot increment in minutes
const SLOT_INCREMENT = 15

/**
 * Generate candidate start times for a given date
 * @param {string} date - YYYY-MM-DD format
 * @param {Object} businessHours - { startTime: 'HH:MM', endTime: 'HH:MM', lastBookingTime: 'HH:MM' }
 * @param {number} longestDuration - Longest service duration in minutes
 * @returns {string[]} Array of time strings like '09:00', '09:15', etc.
 */
export function generateCandidateStartTimes(date, businessHours, longestDuration) {
  const slots = []

  const [startHour, startMin] = businessHours.startTime.split(':').map(Number)
  const [lastHour, lastMin] = businessHours.lastBookingTime.split(':').map(Number)

  const startMinutes = startHour * 60 + startMin
  const lastMinutes = lastHour * 60 + lastMin

  // Generate slots, excluding those that can't fit the longest service
  for (let mins = startMinutes; mins <= lastMinutes; mins += SLOT_INCREMENT) {
    // Check if there's enough time for the longest service before closing
    const endMinutes = mins + longestDuration
    const closeHour = parseInt(businessHours.endTime.split(':')[0])
    const closeMin = parseInt(businessHours.endTime.split(':')[1])
    const closeMinutes = closeHour * 60 + closeMin

    if (endMinutes <= closeMinutes) {
      const hour = Math.floor(mins / 60)
      const min = mins % 60
      slots.push(`${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`)
    }
  }

  return slots
}

/**
 * Sort clients by constraints (most constrained first)
 * @param {Array} clients - Array of { guestName, services, technician, totalDuration, allowedTechnicianIds }
 * @returns {Array} Sorted clients
 */
export function sortClientsByConstraints(clients) {
  return [...clients].sort((a, b) => {
    // 1. Longest duration first
    if (b.totalDuration !== a.totalDuration) {
      return b.totalDuration - a.totalDuration
    }

    // 2. Fewest allowed technicians first (specific tech = 1, any = many)
    const aAllowed = a.technician?.id === 'any' ? Infinity : 1
    const bAllowed = b.technician?.id === 'any' ? Infinity : 1
    if (aAllowed !== bAllowed) {
      return aAllowed - bAllowed
    }

    // 3. Otherwise maintain order
    return 0
  })
}

/**
 * Check if a technician is available for a given time slot and duration
 * @param {Map} techAvailability - Map of techId -> Set of available ISO timestamps
 * @param {string} techId - Technician ID
 * @param {string} date - YYYY-MM-DD
 * @param {string} startTime - HH:MM format
 * @param {number} duration - Duration in minutes
 * @param {string} tzOffset - Timezone offset like '-08:00'
 * @returns {boolean}
 */
export function isTechnicianAvailable(techAvailability, techId, date, startTime, duration, tzOffset) {
  const techSlots = techAvailability.get(techId)
  if (!techSlots || techSlots.size === 0) return false

  // Build the ISO timestamp for the start time
  const isoStart = `${date}T${startTime}:00${tzOffset}`
  const startDate = new Date(isoStart)

  // Check if this exact start time is in the available slots
  // Square returns availability as start times where the service can begin
  for (const slot of techSlots) {
    const slotDate = new Date(slot)
    if (slotDate.getTime() === startDate.getTime()) {
      return true
    }
  }

  return false
}

/**
 * Attempt to assign technicians for all clients at a given start time
 * @param {Array} sortedClients - Clients sorted by constraints
 * @param {Map} techAvailability - Map of techId -> Set of available ISO timestamps
 * @param {string} date - YYYY-MM-DD
 * @param {string} startTime - HH:MM format
 * @param {string} tzOffset - Timezone offset
 * @param {string[]} allTechnicianIds - List of all technician IDs
 * @returns {{ success: boolean, assignments: Array<{ client, technicianId }> | null, reason?: string }}
 */
export function attemptGroupAssignment(sortedClients, techAvailability, date, startTime, tzOffset, allTechnicianIds) {
  const assignedTechIds = new Set()
  const assignments = []

  for (const client of sortedClients) {
    let assignedTechId = null

    // Determine which technicians this client allows
    const allowedTechIds = client.technician?.id === 'any'
      ? allTechnicianIds
      : [client.technician?.squareTeamMemberId || client.technician?.id]

    // Try to find an available technician
    for (const techId of allowedTechIds) {
      if (assignedTechIds.has(techId)) continue // Already assigned to another client

      if (isTechnicianAvailable(techAvailability, techId, date, startTime, client.totalDuration, tzOffset)) {
        assignedTechId = techId
        break
      }
    }

    if (!assignedTechId) {
      // Failed to find a technician for this client
      return {
        success: false,
        assignments: null,
        reason: client.technician?.id === 'any'
          ? `No available technician for ${client.guestName} at ${startTime}`
          : `${client.technician?.name} is not available for ${client.guestName} at ${startTime}`
      }
    }

    assignedTechIds.add(assignedTechId)
    assignments.push({ client, technicianId: assignedTechId })
  }

  return { success: true, assignments }
}

/**
 * Convert 24h time to 12h display format
 * @param {string} time24 - HH:MM format
 * @returns {string} - e.g., '9:00 AM'
 */
export function formatTimeDisplay(time24) {
  const [hour, min] = time24.split(':').map(Number)
  const period = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${String(min).padStart(2, '0')} ${period}`
}

/**
 * Main function: Find available slots for a group booking
 * @param {Object} params
 * @param {string} params.date - YYYY-MM-DD
 * @param {Array} params.clients - Array of guest data
 * @param {Map} params.techAvailability - Map of techId -> Set of available ISO timestamps
 * @param {Object} params.businessHours - Business hours config
 * @param {string[]} params.allTechnicianIds - All technician IDs
 * @param {string} params.tzOffset - Timezone offset
 * @returns {{
 *   validSlots: Array<{ time: string, displayTime: string, assignments: Array }>,
 *   fallbackRecommendations?: Array,
 *   message: string
 * }}
 */
export function findGroupAvailability({
  date,
  clients,
  techAvailability,
  businessHours,
  allTechnicianIds,
  tzOffset
}) {
  // Step 1: Find longest duration
  const longestDuration = Math.max(...clients.map(c => c.totalDuration || 0))

  // Step 2: Generate candidate start times
  const candidateTimes = generateCandidateStartTimes(date, businessHours, longestDuration)

  if (candidateTimes.length === 0) {
    return {
      validSlots: [],
      message: 'No valid time slots available within business hours'
    }
  }

  // Step 3: Sort clients by constraints
  const sortedClients = sortClientsByConstraints(clients)

  // Step 4: Attempt assignment for each candidate time
  const validSlots = []

  for (const time of candidateTimes) {
    const result = attemptGroupAssignment(
      sortedClients,
      techAvailability,
      date,
      time,
      tzOffset,
      allTechnicianIds
    )

    if (result.success) {
      validSlots.push({
        time,
        displayTime: formatTimeDisplay(time),
        assignments: result.assignments
      })
    }
  }

  if (validSlots.length > 0) {
    return {
      validSlots,
      message: `Found ${validSlots.length} available time slots`
    }
  }

  // Step 5: Same-date fallbacks
  // Fallback 1: Check if relaxing technician constraints would help
  const hasSpecificTechs = clients.some(c => c.technician?.id && c.technician.id !== 'any')

  if (hasSpecificTechs) {
    // Try with all "Any Staff"
    const relaxedClients = clients.map(c => ({
      ...c,
      technician: { id: 'any', name: 'Any Staff' }
    }))
    const sortedRelaxed = sortClientsByConstraints(relaxedClients)

    const relaxedSlots = []
    for (const time of candidateTimes) {
      const result = attemptGroupAssignment(
        sortedRelaxed,
        techAvailability,
        date,
        time,
        tzOffset,
        allTechnicianIds
      )
      if (result.success) {
        relaxedSlots.push({
          time,
          displayTime: formatTimeDisplay(time),
          assignments: result.assignments
        })
      }
    }

    if (relaxedSlots.length > 0) {
      return {
        validSlots: [],
        fallbackRecommendations: [{
          type: 'relax_technicians',
          message: 'Slots available if you select "Any Staff" for all guests',
          slots: relaxedSlots.slice(0, 5) // Return first 5
        }],
        message: 'No slots with your selected technicians. Consider selecting "Any Staff".'
      }
    }
  }

  // No slots found on this date
  return {
    validSlots: [],
    message: `Not enough available technicians for ${clients.length} guests on this date`
  }
}

/**
 * Search multiple dates for availability
 * @param {Object} params - Same as findGroupAvailability plus:
 * @param {Function} params.fetchTechAvailabilityForDate - Async function to fetch tech availability
 * @param {number} params.maxDays - Max days to search (default 7)
 * @returns {Promise<Array<{ date, validSlots, ... }>>}
 */
export async function searchMultipleDates({
  startDate,
  clients,
  businessHoursGetter,
  allTechnicianIds,
  tzOffsetGetter,
  fetchTechAvailabilityForDate,
  maxDays = 7
}) {
  const results = []
  let currentDate = new Date(startDate + 'T00:00:00')
  currentDate.setDate(currentDate.getDate() + 1) // Start from next day

  for (let i = 0; i < maxDays; i++) {
    const dateStr = currentDate.toISOString().split('T')[0]
    const businessHours = businessHoursGetter(dateStr)
    const tzOffset = tzOffsetGetter(dateStr)

    try {
      const techAvailability = await fetchTechAvailabilityForDate(dateStr, clients, allTechnicianIds)

      const result = findGroupAvailability({
        date: dateStr,
        clients,
        techAvailability,
        businessHours,
        allTechnicianIds,
        tzOffset
      })

      if (result.validSlots.length > 0) {
        results.push({
          date: dateStr,
          ...result
        })

        // Return early if we found 3 valid dates
        if (results.length >= 3) {
          break
        }
      }
    } catch (error) {
      console.error(`Error checking date ${dateStr}:`, error)
    }

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return results
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useBookingStore } from '@/lib/bookingStore'
import ProgressBar from '@/components/ProgressBar'
import LoadingSpinner from '@/components/LoadingSpinner'
import Calendar from '@/components/Calendar'

export default function DateTimePage() {
  const router = useRouter()
  const { groupSize, guests, selectedDate, selectedTime, setDateTime, updateGuestTechnician, setAssignedTechnicians } = useBookingStore()

  const [date, setDate] = useState(selectedDate || '')
  const [availableSlots, setAvailableSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(selectedTime || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nextAvailableDate, setNextAvailableDate] = useState(null)
  const [suggestedDates, setSuggestedDates] = useState([]) // Multiple date suggestions
  const [searchingNextAvailable, setSearchingNextAvailable] = useState(false)
  const [summaryExpanded, setSummaryExpanded] = useState(false)
  const [unavailableGuests, setUnavailableGuests] = useState([])
  const [allTechnicians, setAllTechnicians] = useState([])
  const [availabilityMessage, setAvailabilityMessage] = useState('')
  const [searchedNextDate, setSearchedNextDate] = useState(false)
  const [validSlotsWithAssignments, setValidSlotsWithAssignments] = useState([])
  const [searchedTechNames, setSearchedTechNames] = useState([]) // Tech names we searched for

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo({ top: 0, behavior: 'smooth' })

    // Redirect if no bookings
    if (groupSize === 0 || guests.length === 0) {
      router.push('/group-booking')
    }
  }, [groupSize, guests, router])

  // Fetch technician list and clear stale info on mount
  useEffect(() => {
    setUnavailableGuests([])
    setNextAvailableDate(null)

    fetch('/api/services')
      .then(res => res.json())
      .then(data => {
        if (data.technicians) setAllTechnicians(data.technicians)
      })
      .catch(() => {})
  }, []) // Only run on mount

  // Calculate totals
  const totalPrice = guests.reduce((sum, guest) =>
    sum + (guest.services?.reduce((s, svc) => s + svc.price, 0) || 0), 0)
  // Show the longest service duration (services are done in parallel)
  const totalDuration = Math.max(...guests.map(guest =>
    guest.services?.reduce((s, svc) => s + svc.duration, 0) || 0))
  const totalServices = guests.reduce((sum, guest) =>
    sum + (guest.services?.length || 0), 0)

  // For V2: all unavailableGuests are guests with specific technician selections that aren't available
  // (V2 doesn't distinguish hasAvailability - if they're in the list, they need attention)
  const notAvailableTechs = unavailableGuests
  const availableTechs = [] // V2 doesn't return "available but listed for context" guests

  // Get the technician name(s) for the "Find next available" button
  const unavailableTechNames = [...new Set(unavailableGuests.map(g => g.technician?.name).filter(Boolean))]

  // Format guests for the V2 availability API
  const formatGuestsForAPI = (guestList) => {
    return guestList.map(guest => ({
      guestName: guest.guestName || `Guest ${guest.guestNumber}`,
      services: guest.services || [],
      technician: guest.technician,
      totalDuration: guest.services?.reduce((sum, s) => sum + (s.duration || 0), 0) || 0
    }))
  }

  // Find multiple available dates starting from a given date
  // Returns an array of dates with availability (up to maxResults)
  const findNextAvailableDates = async (startDate, maxResults = 3) => {
    const maxDaysToCheck = 30 // Look up to 30 days ahead
    const batchSize = 7 // Check 7 days at a time in parallel

    let checkDate = new Date(startDate + 'T00:00:00')
    checkDate.setDate(checkDate.getDate() + 1) // Start from the next day

    const currentGuests = useBookingStore.getState().guests
    const availableDates = []

    // Check in batches for better performance
    for (let batch = 0; batch < Math.ceil(maxDaysToCheck / batchSize); batch++) {
      const batchPromises = []
      const batchDates = []

      // Create batch of date checks
      for (let i = 0; i < batchSize && (batch * batchSize + i) < maxDaysToCheck; i++) {
        const dateString = checkDate.toISOString().split('T')[0]
        batchDates.push(dateString)

        batchPromises.push(
          fetch('/api/availability/v2', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date: dateString, guests: formatGuestsForAPI(currentGuests) })
          })
          .then(res => res.json())
          .catch(err => {
            console.error('Error checking date:', dateString, err)
            return { success: false }
          })
        )

        checkDate.setDate(checkDate.getDate() + 1)
      }

      // Check this batch in parallel
      const results = await Promise.all(batchPromises)

      // Collect all dates with availability from this batch
      for (let i = 0; i < results.length; i++) {
        const data = results[i]
        if (data.success && data.availableSlots && data.availableSlots.length > 0) {
          availableDates.push({
            date: batchDates[i],
            slotCount: data.availableSlots.length
          })
          // Stop if we have enough results
          if (availableDates.length >= maxResults) {
            return availableDates
          }
        }
      }

      // Early stop: if we've checked 14 days (2 weeks) with no results, likely technician isn't working
      if (batch >= 1 && availableDates.length === 0) {
        break
      }
    }

    return availableDates // Return whatever we found (could be empty or less than maxResults)
  }

  // Legacy function for backwards compatibility
  const findNextAvailableDate = async (startDate) => {
    const results = await findNextAvailableDates(startDate, 1)
    return results.length > 0 ? results[0].date : null
  }

  // Format date for "No availability until" message (e.g., "Sunday, January 18")
  const formatNextAvailableDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleDateChange = async (newDate) => {
    setDate(newDate)
    setSelectedSlot(null)
    setError('')
    setNextAvailableDate(null)
    setSuggestedDates([])
    setUnavailableGuests([])
    setAvailabilityMessage('')
    setSearchedNextDate(false)
    setValidSlotsWithAssignments([])
    setSearchedTechNames([])

    if (!newDate) {
      setAvailableSlots([])
      return
    }

    // Fetch available time slots
    setLoading(true)
    try {
      const currentGuests = useBookingStore.getState().guests
      const response = await fetch('/api/availability/v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: newDate,
          guests: formatGuestsForAPI(currentGuests)
        })
      })

      const data = await response.json()

      if (data.success) {
        setAvailableSlots(data.availableSlots)
        setAvailabilityMessage(data.message || '')
        // Store the full slot info with technician assignments
        setValidSlotsWithAssignments(data.validSlots || [])

        // Track which guests/technicians are unavailable
        if (data.unavailableGuests && data.unavailableGuests.length > 0) {
          setUnavailableGuests(data.unavailableGuests)
        } else {
          setUnavailableGuests([])
        }

        // If no slots available and no specific technician issue, find next available date
        if (data.availableSlots.length === 0 && (!data.unavailableGuests || data.unavailableGuests.length === 0)) {
          setSearchingNextAvailable(true)
          const nextDate = await findNextAvailableDate(newDate)
          setNextAvailableDate(nextDate)
          setSearchingNextAvailable(false)
        }
      } else {
        setError(data.error || 'Failed to load available slots')
      }
    } catch (err) {
      setError('Error loading availability')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleGoToNextAvailable = () => {
    if (nextAvailableDate) {
      handleDateChange(nextAvailableDate)
    }
  }

  const handleContinue = () => {
    if (!date || !selectedSlot) {
      setError('Please select both a date and time')
      return
    }

    // Find the assignments for the selected time slot
    const selectedSlotInfo = validSlotsWithAssignments.find(s => s.displayTime === selectedSlot)
    if (selectedSlotInfo?.assignments) {
      // Convert assignments to the format expected by the booking store
      const techAssignments = selectedSlotInfo.assignments.map(a => ({
        guestIndex: a.clientIndex,
        guestName: a.guestName,
        technicianId: a.technicianId
      }))
      setAssignedTechnicians(techAssignments)
    }

    setDateTime(date, selectedSlot)
    router.push('/contact')
  }

  const formatDate = (dateString) => {
    const d = new Date(dateString + 'T00:00:00')
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <>
      <ProgressBar currentStep={4} />

      <div className="container-custom py-8 pb-32 lg:pb-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-heading tracking-wide mb-2 text-center lg:text-left">
            Select Date & Time
          </h2>
          <p className="text-gray-400 text-center lg:text-left mb-2 tracking-wide">
            Choose your preferred appointment date and time
          </p>

          {/* Show booking summary */}
          {groupSize > 0 && guests.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 mb-1">Booking for {groupSize} {groupSize === 1 ? 'guest' : 'guests'}</p>
                  <div className="text-sm text-blue-800 space-y-1">
                    {guests.map((guest, idx) => (
                      <div key={idx}>
                        <span className="font-semibold">{guest.guestName || `Guest ${guest.guestNumber}`}</span>
                        {' · '}
                        {guest.services.map(s => s.name).join(', ')}
                        {' · '}
                        Technician: {guest.technician?.name || 'Any Staff'}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="flex-1">
              {/* Calendar */}
              <div className="mb-8">
                <Calendar
                  selectedDate={date}
                  onDateSelect={handleDateChange}
                />
              </div>

              {/* Time Selection */}
              {date && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                  <h3 className="text-lg font-heading tracking-wide mb-4">
                    Available Times
                  </h3>

                  {loading ? (
                    <LoadingSpinner size="small" text="Loading available slots..." />
                  ) : error ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
                      {error}
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {availableSlots.map(slot => (
                        <button
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all duration-200 ${
                            selectedSlot === slot
                              ? 'bg-neutral-850 text-white border-neutral-850'
                              : 'bg-white text-neutral-750 border-gray-200 hover:border-primary hover:text-primary'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6">
                      {searchingNextAvailable ? (
                        <p className="text-gray-500 text-center">Finding next available date...</p>
                      ) : searchedNextDate && suggestedDates.length > 0 ? (
                        <div className="text-center space-y-4">
                          <p className="text-gray-600 font-medium">Available dates:</p>
                          <div className="space-y-2">
                            {suggestedDates.map((suggestion) => (
                              <button
                                key={suggestion.date}
                                onClick={() => handleDateChange(suggestion.date)}
                                className="w-full bg-white text-neutral-850 px-4 py-3 rounded-lg font-medium border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors text-left flex justify-between items-center"
                              >
                                <span>{formatNextAvailableDate(suggestion.date)}</span>
                                <span className="text-sm text-gray-500">{suggestion.slotCount} slot{suggestion.slotCount !== 1 ? 's' : ''}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : searchedNextDate && suggestedDates.length === 0 ? (
                        <div className="text-center space-y-4">
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
                            <div className="flex items-start gap-3">
                              <svg className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div className="text-left flex-1">
                                <p className="font-semibold text-amber-900 mb-2">
                                  {searchedTechNames.length === 1
                                    ? `${searchedTechNames[0]} is not available for the next 30 days`
                                    : searchedTechNames.length > 1
                                      ? `Your selected technicians are not available for the next 30 days`
                                      : `No availability found for the next 30 days`}
                                </p>
                                <p className="text-sm text-amber-800">
                                  Please choose a new technician below or call us at{' '}
                                  <a href="tel:+12509417870" className="font-semibold underline hover:text-amber-900">
                                    (250) 941-7870
                                  </a>
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Show technician change options */}
                          {searchedTechNames.length > 0 && (
                            <div className="bg-white border border-gray-200 rounded-lg p-5">
                              <h4 className="font-semibold text-neutral-850 mb-4 text-left">Choose a Different Technician</h4>
                              <div className="space-y-3">
                                {guests.map((guest, idx) => {
                                  // Only show guests whose technician is in the unavailable list
                                  if (!guest.technician?.id || guest.technician.id === 'any') return null
                                  if (!searchedTechNames.includes(guest.technician?.name)) return null

                                  const takenIds = guests
                                    .filter((_, i) => i !== idx)
                                    .map(g => g.technician?.id)
                                    .filter(id => id && id !== 'any')
                                  return (
                                    <div key={idx} className="bg-cream/30 rounded-lg p-4 border border-mist/60">
                                      <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">
                                        {guest.guestName || `Guest ${guest.guestNumber}`}
                                      </p>
                                      <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-400 line-through whitespace-nowrap min-w-[100px]">
                                          {guest.technician?.name}
                                        </span>
                                        <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                        <select
                                          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                          defaultValue=""
                                          onChange={(e) => {
                                            const val = e.target.value
                                            if (val === 'any') {
                                              updateGuestTechnician(idx, { id: 'any', name: 'Any Staff' })
                                            } else {
                                              const tech = allTechnicians.find(t => t.id === val)
                                              if (tech) {
                                                updateGuestTechnician(idx, {
                                                  id: tech.id,
                                                  name: tech.name,
                                                  squareTeamMemberId: tech.squareTeamMemberId || tech.id
                                                })
                                              }
                                            }
                                            setSearchedNextDate(false)
                                            setNextAvailableDate(null)
                                            setSuggestedDates([])
                                            setTimeout(() => handleDateChange(date), 50)
                                          }}
                                        >
                                          <option value="" disabled>Choose technician...</option>
                                          <option value="any">Any Available Staff</option>
                                          {allTechnicians
                                            .filter(t => t.id !== guest.technician?.id && !takenIds.includes(t.id))
                                            .map(tech => (
                                              <option key={tech.id} value={tech.id}>{tech.name}</option>
                                            ))
                                          }
                                        </select>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : unavailableGuests.length > 0 ? (
                        <div className="space-y-4">
                          {/* Technicians that are NOT available on this date */}
                          {notAvailableTechs.length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
                              <h4 className="font-semibold text-amber-900 mb-2">
                                {notAvailableTechs.length === 1 ? 'Technician Not Available' : 'Technicians Not Available'}
                              </h4>
                              <p className="text-sm text-amber-800 mb-3">
                                The following {notAvailableTechs.length === 1 ? 'technician has' : 'technicians have'} no openings on this date:
                              </p>
                              <div className="space-y-3">
                                {notAvailableTechs.map((info, idx) => {
                                  const takenIds = guests
                                    .filter((_, i) => i !== info.guestIndex)
                                    .map(g => g.technician?.id)
                                    .filter(id => id && id !== 'any')

                                  return (
                                    <div key={idx} className="bg-white rounded-lg p-3 border border-amber-200">
                                      <p className="text-xs text-amber-700 mb-1.5">
                                        {info.guestName}
                                      </p>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-400 line-through whitespace-nowrap">
                                          {info.technician?.name}
                                        </span>
                                        <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                        <select
                                          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                          defaultValue=""
                                          onChange={(e) => {
                                            const val = e.target.value
                                            if (val === 'any') {
                                              updateGuestTechnician(info.guestIndex, { id: 'any', name: 'Any Staff' })
                                            } else {
                                              const tech = allTechnicians.find(t => t.id === val)
                                              if (tech) {
                                                updateGuestTechnician(info.guestIndex, {
                                                  id: tech.id,
                                                  name: tech.name,
                                                  squareTeamMemberId: tech.squareTeamMemberId || tech.id
                                                })
                                              }
                                            }
                                            setTimeout(() => handleDateChange(date), 50)
                                          }}
                                        >
                                          <option value="" disabled>Choose technician...</option>
                                          <option value="any">Any Staff</option>
                                          {allTechnicians
                                            .filter(t => {
                                              // Exclude current unavailable tech and already-taken techs
                                              if (t.id === info.technician?.id || takenIds.includes(t.id)) return false
                                              // Only show technicians that are available on this date
                                              // (if we have the availableTechnicianIds from the API)
                                              if (info.availableTechnicianIds && info.availableTechnicianIds.length > 0) {
                                                const techSquareId = t.squareTeamMemberId || t.id
                                                return info.availableTechnicianIds.includes(techSquareId)
                                              }
                                              return true // Fallback: show all if no availability info
                                            })
                                            .map(tech => (
                                              <option key={tech.id} value={tech.id}>{tech.name}</option>
                                            ))
                                          }
                                        </select>
                                      </div>
                                      {info.availableTechnicianIds && info.availableTechnicianIds.length === 0 && (
                                        <p className="text-xs text-amber-600 mt-1">
                                          No other technicians available on this date
                                        </p>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* Technicians that ARE available but listed for context */}
                          {availableTechs.length > 0 && (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left">
                              <div className="space-y-2">
                                {availableTechs.map((info, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span><span className="font-medium">{info.technician?.name}</span> is available for {info.guestName}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Or try a different date */}
                          <button
                            onClick={async () => {
                              // Save tech names before clearing unavailableGuests
                              setSearchedTechNames(unavailableTechNames)
                              setSearchingNextAvailable(true)
                              setUnavailableGuests([])
                              const dates = await findNextAvailableDates(date, 3)
                              setSuggestedDates(dates)
                              setNextAvailableDate(dates.length > 0 ? dates[0].date : null)
                              setSearchedNextDate(true)
                              setSearchingNextAvailable(false)
                            }}
                            className="w-full bg-white text-neutral-850 px-6 py-3 rounded-lg font-semibold border border-gray-200 hover:border-primary hover:text-primary transition-colors"
                          >
                            {unavailableTechNames.length === 1
                              ? `Find Dates for ${unavailableTechNames[0]}`
                              : 'Find Available Dates'}
                          </button>
                        </div>
                      ) : availabilityMessage ? (
                        <div className="text-center space-y-4">
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <p className="text-amber-800">{availabilityMessage}</p>
                          </div>
                          <button
                            onClick={async () => {
                              setSearchingNextAvailable(true)
                              const dates = await findNextAvailableDates(date, 3)
                              setSuggestedDates(dates)
                              setNextAvailableDate(dates.length > 0 ? dates[0].date : null)
                              setSearchedNextDate(true)
                              setSearchingNextAvailable(false)
                            }}
                            className="w-full bg-white text-neutral-850 px-6 py-3 rounded-lg font-semibold border border-gray-200 hover:border-primary hover:text-primary transition-colors"
                          >
                            Find Next Available Dates
                          </button>
                        </div>
                      ) : (
                        <div className="text-center space-y-4">
                          <p className="text-gray-600">
                            No availability found. Try a different date or change your technician selection.
                          </p>
                          <button
                            onClick={() => router.push('/services')}
                            className="w-full bg-neutral-850 text-white px-6 py-3 rounded-lg font-semibold hover:bg-neutral-900 transition-colors"
                          >
                            Change Technician
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
                <button
                  onClick={() => router.push('/review')}
                  className="btn-outline w-full sm:w-auto"
                >
                  Back
                </button>

                <button
                  onClick={handleContinue}
                  disabled={!date || !selectedSlot}
                  className={`btn-primary w-full sm:w-auto ${
                    !date || !selectedSlot
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  Continue
                </button>
              </div>
            </div>

            {/* Summary Sidebar - Desktop */}
            <div className="hidden lg:block w-80 flex-shrink-0">
              <div className="sticky top-24 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-5 py-4 border-b border-gray-100">
                  <h3 className="font-heading text-lg tracking-wide">
                    Appointment Summary
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {groupSize} guest{groupSize !== 1 ? 's' : ''} · {totalServices} service{totalServices !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="p-5">
                  {/* Guests */}
                  <div className="space-y-4 max-h-72 overflow-y-auto">
                    {guests.map((guest, idx) => (
                      <div key={idx} className="pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2 mb-2">
                          {/* Avatar */}
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                            {guest.technician?.name?.substring(0, 2) || 'G' + (idx + 1)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-neutral-850">
                              {guest.services?.[0]?.name || 'No service'}
                            </p>
                            <p className="text-xs text-gray-400">
                              ${guest.services?.reduce((s, svc) => s + svc.price, 0) || 0} · {guest.services?.reduce((s, svc) => s + svc.duration, 0) || 0} min
                            </p>
                          </div>
                        </div>

                        {/* Service details (expandable) */}
                        {guest.services?.length > 0 && (
                          <div className="ml-10 space-y-1">
                            {guest.services.map((service) => (
                              <div key={service.id} className="flex justify-between text-xs">
                                <span className="text-gray-600">{service.name}</span>
                                <span className="text-gray-400">${service.price}</span>
                              </div>
                            ))}
                            {guest.technician && (
                              <p className="text-xs text-gray-400 mt-1">
                                with {guest.technician.name}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="mt-4 pt-4 border-t border-gray-200 bg-gray-50 -mx-5 -mb-5 px-5 py-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-500">Total</span>
                      <span className="text-xl font-heading text-neutral-850">${totalPrice}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Duration</span>
                      <span className="text-sm font-medium text-neutral-850">{totalDuration} min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Summary Bottom Sheet */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="mx-3 mb-3 bg-white rounded-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.15)] overflow-hidden">
          {/* Expanded Content */}
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${summaryExpanded ? 'max-h-96' : 'max-h-0'}`}>
            <div className="p-4 max-h-80 overflow-y-auto border-b border-gray-100">
              {/* Guests */}
              <div className="space-y-3">
                {guests.map((guest, idx) => (
                  <div key={idx} className={idx < guests.length - 1 ? 'pb-3 border-b border-gray-100' : ''}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                        Guest {idx + 1}
                      </span>
                      {guest.technician && (
                        <span className="text-xs text-gray-400">· {guest.technician.name}</span>
                      )}
                    </div>
                    {guest.services?.length > 0 ? (
                      <div className="space-y-1">
                        {guest.services.map((service) => (
                          <div key={service.id} className="flex justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary/50"></div>
                              <span className="text-gray-700">{service.name}</span>
                            </div>
                            <span className="text-gray-500">${service.price}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic pl-4">No services</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="px-4 py-3">
            <button
              type="button"
              onClick={() => setSummaryExpanded(!summaryExpanded)}
              className="flex items-center justify-between w-full"
            >
              <div>
                <p className="text-sm font-semibold text-neutral-850 text-left">
                  {groupSize} guest{groupSize !== 1 ? 's' : ''} · {totalServices} service{totalServices !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-gray-500">
                  ${totalPrice} · {totalDuration} min
                </p>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${summaryExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

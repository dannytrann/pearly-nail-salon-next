'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useBookingStore } from '@/lib/bookingStore'
import ProgressBar from '@/components/ProgressBar'
import LoadingSpinner from '@/components/LoadingSpinner'
import Calendar from '@/components/Calendar'

export default function DateTimePage() {
  const router = useRouter()
  const { groupSize, guests, selectedDate, selectedTime, setDateTime, updateGuestTechnician } = useBookingStore()

  const [date, setDate] = useState(selectedDate || '')
  const [availableSlots, setAvailableSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(selectedTime || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nextAvailableDate, setNextAvailableDate] = useState(null)
  const [searchingNextAvailable, setSearchingNextAvailable] = useState(false)
  const [summaryExpanded, setSummaryExpanded] = useState(false)
  const [unavailableTechInfo, setUnavailableTechInfo] = useState(null)
  const [alternativeTechnicians, setAlternativeTechnicians] = useState([])

  useEffect(() => {
    // Redirect if no bookings
    if (groupSize === 0 || guests.length === 0) {
      router.push('/group-booking')
    }
  }, [groupSize, guests, router])

  // Calculate totals
  const totalPrice = guests.reduce((sum, guest) =>
    sum + (guest.services?.reduce((s, svc) => s + svc.price, 0) || 0), 0)
  // Show the longest service duration (services are done in parallel)
  const totalDuration = Math.max(...guests.map(guest =>
    guest.services?.reduce((s, svc) => s + svc.duration, 0) || 0))
  const totalServices = guests.reduce((sum, guest) =>
    sum + (guest.services?.length || 0), 0)

  // Find the next available date starting from a given date
  const findNextAvailableDate = async (startDate) => {
    const maxDaysToCheck = 30 // Look up to 30 days ahead
    let checkDate = new Date(startDate + 'T00:00:00')
    checkDate.setDate(checkDate.getDate() + 1) // Start from the next day

    for (let i = 0; i < maxDaysToCheck; i++) {
      const dateString = checkDate.toISOString().split('T')[0]

      try {
        const response = await fetch('/api/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: dateString, guests: guests })
        })

        const data = await response.json()

        if (data.success && data.availableSlots && data.availableSlots.length > 0) {
          return dateString
        }
      } catch (err) {
        console.error('Error checking date:', dateString, err)
      }

      checkDate.setDate(checkDate.getDate() + 1)
    }

    return null // No availability found in the next 30 days
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
    setAlternativeTechnicians([])

    if (!newDate) {
      setAvailableSlots([])
      return
    }

    // Fetch available time slots
    setLoading(true)
    try {
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: newDate,
          guests: guests
        })
      })

      const data = await response.json()

      if (data.success) {
        setAvailableSlots(data.availableSlots)

        // Check if specific technicians are unavailable
        if (data.unavailableTechnicians && data.unavailableTechnicians.length > 0) {
          setUnavailableTechInfo({
            technicians: data.unavailableTechnicians,
            date: newDate,
            guestAvailability: data.guestAvailabilityCounts
          })
          // Store alternative technician suggestions
          if (data.alternativeTechnicians && data.alternativeTechnicians.length > 0) {
            setAlternativeTechnicians(data.alternativeTechnicians)
          }
        } else {
          setUnavailableTechInfo(null)
          setAlternativeTechnicians([])
        }

        // If no slots available, find the next available date
        if (data.availableSlots.length === 0) {
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

  // Handle selecting an alternative technician
  const handleSelectAlternative = async (alternative) => {
    // Find which guest had the unavailable technician
    const unavailableTech = unavailableTechInfo?.technicians?.[0]
    if (!unavailableTech) return

    const guestIndex = unavailableTech.guestIndex

    // Update the guest's technician in the store
    updateGuestTechnician(guestIndex, {
      id: alternative.technician.id,
      name: alternative.technician.name,
      squareTeamMemberId: alternative.technician.squareTeamMemberId || alternative.technician.id
    })

    // Clear the unavailable info and alternatives
    setUnavailableTechInfo(null)
    setAlternativeTechnicians([])

    // Navigate to the alternative's next available date
    handleDateChange(alternative.nextAvailableDate)
  }

  // Format date for alternative options (e.g., "Jan 20")
  const formatShortDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const handleContinue = () => {
    if (!date || !selectedSlot) {
      setError('Please select both a date and time')
      return
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
          <p className="text-gray-400 text-center lg:text-left mb-10 tracking-wide">
            Choose your preferred appointment date and time
          </p>

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
                    <div className="text-center py-6">
                      {searchingNextAvailable ? (
                        <p className="text-gray-500">Finding next available date...</p>
                      ) : unavailableTechInfo && unavailableTechInfo.technicians.length > 0 ? (
                        <div className="space-y-4">
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
                            <h4 className="font-semibold text-amber-900 mb-2">Technician Unavailable</h4>
                            <p className="text-sm text-amber-800">
                              {unavailableTechInfo.technicians.map((tech, idx) => (
                                <span key={idx}>
                                  <span className="font-semibold">{tech.technician.name}</span> (Guest {tech.guestNumber})
                                  {idx < unavailableTechInfo.technicians.length - 1 && ', '}
                                </span>
                              ))} {unavailableTechInfo.technicians.length === 1 ? 'is' : 'are'} not available in the next 30 days.
                            </p>
                          </div>

                          {/* Alternative Technicians */}
                          {alternativeTechnicians.length > 0 && (
                            <div className="bg-white border border-gray-200 rounded-lg p-4 text-left">
                              <h4 className="font-semibold text-neutral-850 mb-3">Here are other available technicians:</h4>
                              <div className="space-y-2">
                                {alternativeTechnicians.map((alt, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => handleSelectAlternative(alt)}
                                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-primary/5 border border-gray-200 hover:border-primary rounded-lg transition-all group"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
                                        {alt.technician.name.substring(0, 2).toUpperCase()}
                                      </div>
                                      <div className="text-left">
                                        <p className="font-medium text-neutral-850 group-hover:text-primary">
                                          {alt.technician.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          Available {formatShortDate(alt.nextAvailableDate)} ({alt.slotsAvailable} slot{alt.slotsAvailable !== 1 ? 's' : ''})
                                        </p>
                                      </div>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-400 group-hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="pt-2 border-t border-gray-100">
                            <button
                              onClick={() => router.push('/services')}
                              className="w-full bg-neutral-850 text-white px-6 py-3 rounded-lg font-semibold hover:bg-neutral-900 transition-colors"
                            >
                              Choose Different Technician
                            </button>
                          </div>
                        </div>
                      ) : nextAvailableDate ? (
                        <>
                          <p className="text-gray-600 mb-4">
                            No availability until <span className="font-semibold">{formatNextAvailableDate(nextAvailableDate)}</span>.
                          </p>
                          <button
                            onClick={handleGoToNextAvailable}
                            className="w-full bg-neutral-850 text-white px-6 py-3 rounded-lg font-semibold hover:bg-neutral-900 transition-colors"
                          >
                            Go to next available
                          </button>
                        </>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-gray-600">
                            No availability in the next 30 days. Please contact us directly.
                          </p>
                          <button
                            onClick={() => router.push('/services')}
                            className="w-full bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
                          >
                            Change Technician Selection
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => router.push('/review')}
                  className="btn-outline"
                >
                  Back
                </button>

                <button
                  onClick={handleContinue}
                  disabled={!date || !selectedSlot}
                  className={`btn-primary ${
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

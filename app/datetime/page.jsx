'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useBookingStore } from '@/lib/bookingStore'
import ProgressBar from '@/components/ProgressBar'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function DateTimePage() {
  const router = useRouter()
  const { groupSize, guests, selectedDate, selectedTime, setDateTime } = useBookingStore()

  const [date, setDate] = useState(selectedDate || '')
  const [availableSlots, setAvailableSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(selectedTime || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Redirect if no bookings
    if (groupSize === 0 || guests.length === 0) {
      router.push('/group-booking')
    }
  }, [groupSize, guests, router])

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]

  const handleDateChange = async (newDate) => {
    setDate(newDate)
    setSelectedSlot(null)
    setError('')

    if (!newDate) {
      setAvailableSlots([])
      return
    }

    // Fetch available time slots
    // Pass full guest data so availability can check per-technician
    setLoading(true)
    try {
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: newDate,
          guests: guests // Pass full guest array with technician selections
        })
      })

      const data = await response.json()

      if (data.success) {
        setAvailableSlots(data.availableSlots)
      } else {
        setError('Failed to load available slots')
      }
    } catch (err) {
      setError('Error loading availability')
      console.error(err)
    } finally {
      setLoading(false)
    }
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

      <div className="container-custom py-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-heading tracking-wide mb-2 text-center">
            Select Date & Time
          </h2>
          <p className="text-gray-400 text-center mb-10 tracking-wide">
            Choose your preferred appointment date and time
          </p>

          {/* Date Selection */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-heading tracking-wide mb-4">
              Select Date
            </h3>
            <input
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              min={today}
              className="input-field text-lg"
            />
            {date && (
              <p className="mt-3 text-gray-500 tracking-wide">
                {formatDate(date)}
              </p>
            )}
          </div>

          {/* Time Selection */}
          {date && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-heading tracking-wide mb-4">
                Select Time
              </h3>

              {loading ? (
                <LoadingSpinner size="small" text="Loading available slots..." />
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {availableSlots.map(slot => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-3 px-4 rounded border text-sm font-medium transition-all duration-200 ${
                        selectedSlot === slot
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-neutral-750 border-gray-200 hover:border-primary'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">
                  No available slots for this date
                </p>
              )}
            </div>
          )}

          {/* Selected Summary */}
          {date && selectedSlot && (
            <div className="bg-primary/10 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-heading tracking-wide mb-3">
                Selected Appointment
              </h3>
              <div className="space-y-1 text-sm">
                <p className="text-neutral-750">
                  <span className="text-gray-500">Date:</span> {formatDate(date)}
                </p>
                <p className="text-neutral-750">
                  <span className="text-gray-500">Time:</span> {selectedSlot}
                </p>
                <p className="text-neutral-750">
                  <span className="text-gray-500">Group Size:</span> {groupSize} {groupSize === 1 ? 'person' : 'people'}
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-8 text-sm">
              {error}
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
      </div>
    </>
  )
}

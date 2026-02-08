'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useBookingStore } from '@/lib/bookingStore'
import ProgressBar from '@/components/ProgressBar'

export default function ReviewPage() {
  const router = useRouter()
  const { groupSize, guests, setCurrentGuestIndex } = useBookingStore()

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo({ top: 0, behavior: 'smooth' })

    // Redirect if no bookings
    if (groupSize === 0 || guests.length === 0) {
      router.push('/')
    }
  }, [groupSize, guests, router])

  const handleEditGuest = (guestIndex) => {
    setCurrentGuestIndex(guestIndex)
    router.push('/services')
  }

  const totalPrice = guests.reduce((sum, guest) => sum + guest.totalPrice, 0)
  const maxDuration = Math.max(...guests.map(guest => guest.totalDuration))

  const handleContinue = () => {
    router.push('/datetime')
  }

  return (
    <>
      <ProgressBar currentStep={3} />

      <div className="container-custom py-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-heading text-gray-800 mb-2 text-center">
            Review Your Booking
          </h2>
          <p className="text-gray-600 text-center mb-8">
            Please review all selections before proceeding
          </p>

          {/* Guests Summary */}
          <div className="space-y-4 mb-8">
            {guests.map((guest, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-heading text-gray-800">
                    Guest {guest.guestNumber}{guest.guestName ? `: ${guest.guestName}` : ''}
                  </h3>
                  <button
                    onClick={() => handleEditGuest(index)}
                    className="text-primary hover:text-primary-dark font-semibold transition-colors duration-200"
                  >
                    Edit
                  </button>
                </div>

                {/* Services */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-600 mb-2">
                    Services:
                  </h4>
                  {guest.services.length > 0 ? (
                    <ul className="space-y-2">
                      {guest.services.map(service => (
                        <li
                          key={service.id}
                          className="flex items-center justify-between text-gray-700"
                        >
                          <span>{service.name}</span>
                          <span className="font-semibold">${service.price}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic">No services selected</p>
                  )}
                </div>

                {/* Technician */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-600 mb-1">
                    Technician:
                  </h4>
                  <p className="text-gray-700">
                    {guest.technician?.name || 'Any available'}
                  </p>
                </div>

                {/* Total */}
                <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-600">Total Duration: </span>
                    <span className="font-semibold text-gray-800">
                      {guest.totalDuration} min
                    </span>
                  </div>
                  <div className="text-xl font-heading text-primary">
                    ${guest.totalPrice}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Grand Total */}
          <div className="bg-primary text-white rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 mb-1">Group Total</p>
                <p className="text-3xl font-heading">${totalPrice}</p>
              </div>
              <div className="text-right">
                <p className="text-white/80 mb-1">Estimated Duration</p>
                <p className="text-2xl font-semibold">{maxDuration} min</p>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 rounded-lg p-4 mb-8">
            <p className="text-sm text-gray-700">
              <strong>Note:</strong> The estimated duration is based on the longest service time.
              Multiple guests can be serviced simultaneously by our team.
            </p>
          </div>

          {/* Navigation */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
            <button
              onClick={() => router.push('/services')}
              className="btn-outline w-full sm:w-auto"
            >
              Back to Services
            </button>

            <button
              onClick={handleContinue}
              disabled={guests.some(g => g.services.length === 0)}
              className={`btn-primary w-full sm:w-auto ${
                guests.some(g => g.services.length === 0)
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              Choose Date & Time
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

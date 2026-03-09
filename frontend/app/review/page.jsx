'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useBookingStore } from '@/lib/bookingStore'
import ProgressBar from '@/components/ProgressBar'

export default function ReviewPage() {
  const router = useRouter()
  const { groupSize, guests, setCurrentGuestIndex } = useBookingStore()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

      <div className="bg-cream min-h-screen py-10">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto">

            {/* Page Header */}
            <div className="text-center mb-10">
              <p className="text-secondary font-medium text-xs tracking-[0.3em] uppercase mb-3">Step 3 of 5</p>
              <h2 className="text-3xl font-heading tracking-wide text-neutral-850 mb-2">
                Review Your Booking
              </h2>
              <p className="text-warmgray-light text-sm">
                Please review all selections before proceeding
              </p>
              <div className="flex items-center justify-center gap-3 mt-5">
                <div className="h-px w-8 bg-secondary/40"></div>
                <div className="w-1 h-1 rounded-full bg-secondary/50"></div>
                <div className="h-px w-8 bg-secondary/40"></div>
              </div>
            </div>

            {/* Guest Cards */}
            <div className="space-y-4 mb-8">
              {guests.map((guest, index) => (
                <div key={index} className="bg-white rounded-2xl border border-mist/50 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading text-xl text-neutral-850">
                      {guest.guestName ? guest.guestName : `Guest ${guest.guestNumber}`}
                    </h3>
                    <button
                      onClick={() => handleEditGuest(index)}
                      className="text-sm text-primary hover:text-primary-dark font-medium transition-colors duration-200 flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                  </div>

                  {/* Services */}
                  <div className="mb-4">
                    <p className="text-xs text-warmgray-light tracking-[0.15em] uppercase mb-2">Services</p>
                    {guest.services.length > 0 ? (
                      <ul className="space-y-2">
                        {guest.services.map(service => (
                          <li key={service.id} className="flex items-center justify-between text-sm">
                            <span className="text-neutral-750 flex items-center gap-2">
                              <span className="w-1 h-1 rounded-full bg-secondary/60 flex-shrink-0"></span>
                              {service.name}
                            </span>
                            <span className="font-medium text-neutral-850">${service.price}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-warmgray-light text-sm italic">No services selected</p>
                    )}
                  </div>

                  {/* Technician */}
                  <div className="mb-4">
                    <p className="text-xs text-warmgray-light tracking-[0.15em] uppercase mb-1">Technician</p>
                    <p className="text-neutral-750 text-sm">{guest.technician?.name || 'Any available'}</p>
                  </div>

                  {/* Guest total */}
                  <div className="pt-4 border-t border-mist/50 flex items-center justify-between">
                    <span className="text-sm text-warmgray-light">{guest.totalDuration} min</span>
                    <span className="font-heading text-xl text-primary">${guest.totalPrice}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Grand Total */}
            <div className="bg-primary rounded-2xl p-6 mb-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm mb-1">Group Total</p>
                  <p className="text-3xl font-heading">${totalPrice}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/70 text-sm mb-1">Est. Duration</p>
                  <p className="text-2xl font-semibold">{maxDuration} min</p>
                </div>
              </div>
            </div>

            {/* Info Note */}
            <div className="bg-cream-deep rounded-xl border border-secondary/20 p-4 mb-8">
              <p className="text-sm text-neutral-750">
                <strong>Note:</strong> Estimated duration is based on the longest service time. Multiple guests can be seen simultaneously by our team.
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
                  guests.some(g => g.services.length === 0) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Choose Date &amp; Time
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}

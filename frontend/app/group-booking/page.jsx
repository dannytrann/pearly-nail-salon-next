'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useBookingStore } from '@/lib/bookingStore'
import Link from 'next/link'

function GroupBookingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const setGroupSize = useBookingStore((state) => state.setGroupSize)
  const setPreSelectedService = useBookingStore((state) => state.setPreSelectedService)

  const [preSelectedServiceName, setPreSelectedServiceName] = useState(null)

  const groupSizes = [1, 2, 3, 4, 5, 6]

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Check for pre-selected service from URL
  useEffect(() => {
    const serviceId = searchParams.get('serviceId')
    if (serviceId) {
      // Fetch the service details
      fetch('/api/services')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.services) {
            const service = data.services.find(s => s.id === serviceId)
            if (service) {
              setPreSelectedService(service)
              setPreSelectedServiceName(service.name)
            }
          }
        })
        .catch(err => console.error('Error fetching service:', err))
    } else {
      // Clear any previous pre-selected service
      setPreSelectedService(null)
    }
  }, [searchParams, setPreSelectedService])

  const handleGroupSizeSelect = (size) => {
    setGroupSize(size)
    router.push('/services')
  }

  return (
    <div className="bg-cream min-h-screen">
      {/* Back Link */}
      <div className="border-b border-mist/60">
        <div className="container-custom py-4">
          <Link href="/" className="text-warmgray-light hover:text-primary inline-flex items-center gap-2 text-sm tracking-wide transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Service Menu
          </Link>
        </div>
      </div>

      <div className="container-custom py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-heading tracking-wide mb-4">
            Booking: How many people will be joining you today?
          </h1>

          {preSelectedServiceName && (
            <div className="mb-10 inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Selected: <strong>{preSelectedServiceName}</strong></span>
            </div>
          )}

          {!preSelectedServiceName && <div className="mb-8" />}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-xl mx-auto">
            {groupSizes.map((size) => (
              <button
                key={size}
                onClick={() => handleGroupSizeSelect(size)}
                className="group relative bg-white hover:bg-primary border border-mist/60 hover:border-primary rounded-xl p-8 transition-all duration-300 hover:shadow-lg"
              >
                <div className="text-5xl font-heading text-neutral-850 group-hover:text-white transition-colors duration-300">
                  {size}
                </div>
                <div className="text-sm text-warmgray-light group-hover:text-white/80 mt-2 transition-colors duration-300 tracking-wide">
                  {size === 1 ? 'Person' : 'People'}
                </div>
              </button>
            ))}

            <button
              onClick={() => {
                const customSize = prompt('Enter number of people (7+):')
                if (customSize && !isNaN(customSize) && parseInt(customSize) > 0) {
                  handleGroupSizeSelect(parseInt(customSize))
                }
              }}
              className="group relative bg-white hover:bg-primary border border-mist/60 hover:border-primary rounded-xl p-8 transition-all duration-300 hover:shadow-lg"
            >
              <div className="text-5xl font-heading text-neutral-850 group-hover:text-white transition-colors duration-300">
                7+
              </div>
              <div className="text-sm text-warmgray-light group-hover:text-white/80 mt-2 transition-colors duration-300 tracking-wide">
                More People
              </div>
            </button>
          </div>

          <div className="mt-16 bg-cream-deep/60 rounded-xl p-8 border border-mist/40">
            <h3 className="font-heading text-xl mb-4 tracking-wide">
              Group Booking Benefits
            </h3>
            <ul className="text-left max-w-md mx-auto space-y-3 text-warmgray-light text-sm">
              <li className="flex items-center gap-3">
                <span className="text-secondary">&#10003;</span>
                Book multiple people at once
              </li>
              <li className="flex items-center gap-3">
                <span className="text-secondary">&#10003;</span>
                Choose different services for each person
              </li>
              <li className="flex items-center gap-3">
                <span className="text-secondary">&#10003;</span>
                Select preferred technicians
              </li>
              <li className="flex items-center gap-3">
                <span className="text-secondary">&#10003;</span>
                Coordinate timing for your group
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function GroupBooking() {
  return (
    <Suspense fallback={
      <div className="bg-cream min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-warmgray-light text-sm tracking-wide">Loading...</p>
        </div>
      </div>
    }>
      <GroupBookingContent />
    </Suspense>
  )
}

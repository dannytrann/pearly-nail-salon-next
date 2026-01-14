'use client'

import { useRouter } from 'next/navigation'
import { useBookingStore } from '@/lib/bookingStore'
import Link from 'next/link'

export default function GroupBooking() {
  const router = useRouter()
  const setGroupSize = useBookingStore((state) => state.setGroupSize)

  const groupSizes = [1, 2, 3, 4, 5, 6]

  const handleGroupSizeSelect = (size) => {
    setGroupSize(size)
    router.push('/services')
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Back Link */}
      <div className="border-b border-gray-100">
        <div className="container-custom py-4">
          <Link href="/" className="text-gray-400 hover:text-primary inline-flex items-center gap-2 text-sm tracking-wide transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Service Menu
          </Link>
        </div>
      </div>

      <div className="container-custom py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-heading tracking-wide mb-12">
            Booking: How many people will be joining you today?
          </h1>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-xl mx-auto">
            {groupSizes.map((size) => (
              <button
                key={size}
                onClick={() => handleGroupSizeSelect(size)}
                className="group relative bg-white hover:bg-primary border border-gray-200 hover:border-primary rounded-lg p-8 transition-all duration-300 hover:shadow-lg"
              >
                <div className="text-5xl font-heading text-neutral-850 group-hover:text-white transition-colors duration-300">
                  {size}
                </div>
                <div className="text-sm text-gray-400 group-hover:text-white/80 mt-2 transition-colors duration-300 tracking-wide">
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
              className="group relative bg-white hover:bg-primary border border-gray-200 hover:border-primary rounded-lg p-8 transition-all duration-300 hover:shadow-lg"
            >
              <div className="text-5xl font-heading text-neutral-850 group-hover:text-white transition-colors duration-300">
                7+
              </div>
              <div className="text-sm text-gray-400 group-hover:text-white/80 mt-2 transition-colors duration-300 tracking-wide">
                More People
              </div>
            </button>
          </div>

          <div className="mt-16 bg-gray-50 rounded-lg p-8">
            <h3 className="font-heading text-xl mb-4 tracking-wide">
              Group Booking Benefits
            </h3>
            <ul className="text-left max-w-md mx-auto space-y-3 text-gray-500 text-sm">
              <li className="flex items-center gap-3">
                <span className="text-primary">✓</span>
                Book multiple people at once
              </li>
              <li className="flex items-center gap-3">
                <span className="text-primary">✓</span>
                Choose different services for each person
              </li>
              <li className="flex items-center gap-3">
                <span className="text-primary">✓</span>
                Select preferred technicians
              </li>
              <li className="flex items-center gap-3">
                <span className="text-primary">✓</span>
                Coordinate timing for your group
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

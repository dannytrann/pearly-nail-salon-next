'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useBookingStore } from '@/lib/bookingStore'

export default function ConfirmationPage() {
  const router = useRouter()
  const {
    groupSize,
    guests,
    selectedDate,
    selectedTime,
    contactInfo,
    assignedTechnicians,
    reset
  } = useBookingStore()

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo({ top: 0, behavior: 'smooth' })

    // Redirect if no booking data
    if (groupSize === 0 || guests.length === 0 || !selectedDate || !selectedTime) {
      router.push('/')
    }
  }, [groupSize, guests, selectedDate, selectedTime, router])

  const formatDate = (dateString) => {
    const d = new Date(dateString + 'T00:00:00')
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const totalPrice = guests.reduce((sum, guest) => sum + guest.totalPrice, 0)

  const handleNewBooking = () => {
    reset()
    router.push('/')
  }

  return (
    <div className="container-custom py-12">
      <div className="max-w-3xl mx-auto">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-heading text-gray-800 mb-3">
            Booking Confirmed!
          </h1>
          <p className="text-xl text-gray-600">
            Your group appointment has been successfully booked
          </p>
        </div>

        {/* Booking Details */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-heading text-gray-800 mb-6 pb-4 border-b border-gray-200">
            Booking Details
          </h2>

          {/* Date & Time */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Date</p>
                <p className="text-lg font-semibold text-gray-800">
                  {formatDate(selectedDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Time</p>
                <p className="text-lg font-semibold text-gray-800">
                  {selectedTime}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Contact Person</p>
            <p className="text-lg font-semibold text-gray-800">{contactInfo.name}</p>
            <p className="text-gray-600">{contactInfo.email}</p>
            <p className="text-gray-600">{contactInfo.phone}</p>
          </div>

          {/* Guests Summary */}
          <div className="mb-6">
            <h3 className="text-lg font-heading text-gray-800 mb-4">
              Group Summary ({groupSize} {groupSize === 1 ? 'Person' : 'People'})
            </h3>
            <div className="space-y-4">
              {guests.map((guest, index) => {
                // Find assigned technician info for this guest
                const assignedTech = assignedTechnicians?.find(t => t.guestIndex === index)
                // Prefer the actual assigned name from Square (resolves "Any Staff" to real person).
                // Skip generic "Staff Member" — fall back to the guest's chosen name instead.
                const assigned = assignedTech?.technicianName
                const technicianName = (assigned && assigned !== 'Staff Member')
                  ? assigned
                  : (guest.technician?.name && guest.technician.name !== 'Any Staff')
                    ? guest.technician.name
                    : assigned || 'Staff Member'

                return (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-800">
                        {guest.guestName ? guest.guestName : `Guest ${guest.guestNumber}`}
                      </h4>
                      <span className="text-primary font-semibold">
                        ${guest.totalPrice}
                      </span>
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {guest.services.map(service => (
                        <li key={service.id}>• {service.name}</li>
                      ))}
                    </ul>
                    <p className="text-sm text-gray-600 mt-2">
                      Technician: {technicianName}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Total */}
          <div className="bg-primary text-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <span className="text-lg">Total Amount</span>
              <span className="text-3xl font-heading">${totalPrice}</span>
            </div>
          </div>

          {/* Special Requests */}
          {contactInfo.specialRequests && (
            <div className="mt-6">
              <p className="text-sm text-gray-600 mb-1">Special Requests</p>
              <p className="text-gray-800">{contactInfo.specialRequests}</p>
            </div>
          )}
        </div>

        {/* Next Steps */}
        <div className="bg-orange-50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-heading text-gray-800 mb-3">
            What's Next?
          </h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-primary mr-2 mt-1">✓</span>
              <span>You will receive a confirmation email at {contactInfo.email}</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary mr-2 mt-1">✓</span>
              <span>A confirmation SMS will be sent to {contactInfo.phone}</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary mr-2 mt-1">✓</span>
              <span>Please arrive 5-10 minutes before your appointment time</span>
            </li>
            <li className="flex items-start">
              <span className="text-primary mr-2 mt-1">✓</span>
              <span>If you need to reschedule or cancel, please call us at least 24 hours in advance</span>
            </li>
          </ul>
        </div>

        {/* Salon Contact */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-heading text-gray-800 mb-4">
            Salon Contact
          </h3>
          <div className="space-y-2 text-gray-700">
            <p><strong>Pearly Nails & Spa</strong></p>
            <p>23A-215 Port Augusta St</p>
            <p>Comox, BC V9M 3M9</p>
            <p className="text-sm text-gray-600">(Next to WOOFY'S pet shop)</p>
            <p className="mt-3">Phone: (250) XXX-XXXX</p>
            <p>Email: info@pearlynails.com</p>
          </div>
        </div>

        {/* Actions */}
        <div className="text-center space-y-4">
          <button
            onClick={handleNewBooking}
            className="btn-primary w-full md:w-auto"
          >
            Book Another Group
          </button>
          <p className="text-gray-600">
            Thank you for choosing Pearly Nails & Spa!
          </p>
        </div>
      </div>
    </div>
  )
}

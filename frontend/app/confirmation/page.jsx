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
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
    <div className="bg-cream min-h-screen py-12">
      <div className="container-custom">
        <div className="max-w-2xl mx-auto">

          {/* Success Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-5">
              <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-4xl font-heading tracking-wide text-neutral-850 mb-3">
              Booking Confirmed!
            </h1>
            {/* Gold divider */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-10 bg-gradient-to-r from-transparent to-secondary/50"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-secondary/50"></div>
              <div className="h-px w-10 bg-gradient-to-l from-transparent to-secondary/50"></div>
            </div>
            <p className="text-warmgray-light">
              Your appointment has been successfully booked. We look forward to seeing you!
            </p>
          </div>

          {/* Booking Details Card */}
          <div className="bg-white rounded-2xl border border-mist/50 shadow-sm p-8 mb-5">
            <h2 className="font-heading text-xl tracking-wide text-neutral-850 mb-6 pb-4 border-b border-mist/50">
              Appointment Details
            </h2>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs text-warmgray-light tracking-[0.15em] uppercase mb-1">Date</p>
                <p className="font-medium text-neutral-850">{selectedDate ? formatDate(selectedDate) : ''}</p>
              </div>
              <div>
                <p className="text-xs text-warmgray-light tracking-[0.15em] uppercase mb-1">Time</p>
                <p className="font-medium text-neutral-850">{selectedTime}</p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="mb-6 pb-6 border-b border-mist/50">
              <p className="text-xs text-warmgray-light tracking-[0.15em] uppercase mb-2">Contact Person</p>
              <p className="font-medium text-neutral-850 text-lg">{contactInfo.name}</p>
              <p className="text-neutral-750 text-sm mt-0.5">{contactInfo.email}</p>
              <p className="text-neutral-750 text-sm">{contactInfo.phone}</p>
            </div>

            {/* Guests Summary */}
            <div className="mb-6">
              <p className="text-xs text-warmgray-light tracking-[0.15em] uppercase mb-4">
                Group Summary — {groupSize} {groupSize === 1 ? 'Person' : 'People'}
              </p>
              <div className="space-y-3">
                {guests.map((guest, index) => {
                  const assignedTech = assignedTechnicians?.find(t => t.guestIndex === index)
                  const assigned = assignedTech?.technicianName
                  const technicianName = (assigned && assigned !== 'Staff Member')
                    ? assigned
                    : (guest.technician?.name && guest.technician.name !== 'Any Staff')
                      ? guest.technician.name
                      : assigned || 'Staff Member'

                  return (
                    <div key={index} className="bg-cream-deep/60 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-neutral-850">
                          {guest.guestName ? guest.guestName : `Guest ${guest.guestNumber}`}
                        </h4>
                        <span className="text-primary font-semibold">${guest.totalPrice}</span>
                      </div>
                      <ul className="text-sm text-neutral-750 space-y-0.5 mb-2">
                        {guest.services.map(service => (
                          <li key={service.id} className="flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-secondary/60 flex-shrink-0"></span>
                            {service.name}
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-warmgray-light">Technician: {technicianName}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Total */}
            <div className="bg-primary rounded-xl p-5 text-white">
              <div className="flex items-center justify-between">
                <span className="font-medium tracking-wide">Total Amount</span>
                <span className="text-3xl font-heading">${totalPrice}</span>
              </div>
            </div>

            {/* Special Requests */}
            {contactInfo.specialRequests && (
              <div className="mt-6 pt-5 border-t border-mist/50">
                <p className="text-xs text-warmgray-light tracking-[0.15em] uppercase mb-2">Special Requests</p>
                <p className="text-neutral-750 text-sm">{contactInfo.specialRequests}</p>
              </div>
            )}
          </div>

          {/* What's Next */}
          <div className="bg-cream-deep/80 rounded-2xl border border-mist/50 p-6 mb-5">
            <h3 className="font-heading text-lg tracking-wide text-neutral-850 mb-4">
              What&apos;s Next?
            </h3>
            <ul className="space-y-3">
              {[
                `A confirmation email will be sent to ${contactInfo.email}`,
                `A confirmation SMS will be sent to ${contactInfo.phone}`,
                'Please arrive 5–10 minutes before your appointment',
                'To reschedule or cancel, please call us at least 24 hours in advance',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-neutral-750">
                  <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Salon Contact */}
          <div className="bg-white rounded-2xl border border-mist/50 shadow-sm p-6 mb-8">
            <h3 className="font-heading text-lg tracking-wide text-neutral-850 mb-4">Contact Us</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-neutral-750">
              <div>
                <p className="font-semibold text-neutral-850 mb-1">Pearly Nails &amp; Spa</p>
                <p>23A-215 Port Augusta St</p>
                <p>Comox, BC V9M 3M9</p>
                <p className="text-warmgray-light text-xs mt-1 italic">Next to WOOFY&apos;S pet shop</p>
              </div>
              <div>
                <a href="tel:+12509417870" className="flex items-center gap-2 hover:text-primary transition-colors mb-2">
                  <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  (250) 941-7870
                </a>
                <a href="mailto:scp.deng@gmail.com" className="flex items-center gap-2 hover:text-primary transition-colors text-xs text-warmgray-light">
                  <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  scp.deng@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Action */}
          <div className="text-center">
            <button
              onClick={handleNewBooking}
              className="btn-primary"
            >
              Book Another Appointment
            </button>
            <p className="text-warmgray-light text-sm mt-4">
              Thank you for choosing Pearly Nails &amp; Spa!
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

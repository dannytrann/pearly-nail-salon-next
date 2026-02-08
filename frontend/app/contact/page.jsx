'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useBookingStore } from '@/lib/bookingStore'
import ProgressBar from '@/components/ProgressBar'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function ContactPage() {
  const router = useRouter()
  const {
    groupSize,
    guests,
    selectedDate,
    selectedTime,
    contactInfo,
    setContactInfo,
    setAssignedTechnicians,
    assignedTechnicians: preAssignedTechnicians
  } = useBookingStore()

  const [summaryExpanded, setSummaryExpanded] = useState(false)

  const [formData, setFormData] = useState({
    name: contactInfo.name || '',
    phone: contactInfo.phone || '',
    email: contactInfo.email || '',
    specialRequests: contactInfo.specialRequests || ''
  })

  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo({ top: 0, behavior: 'smooth' })

    // Redirect if no bookings
    if (groupSize === 0 || guests.length === 0 || !selectedDate || !selectedTime) {
      router.push('/')
    }
  }, [groupSize, guests, selectedDate, selectedTime, router])

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    setContactInfo(formData)

    try {
      // Submit booking to API
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          groupSize,
          guests,
          selectedDate,
          selectedTime,
          contactInfo: formData,
          preAssignedTechnicians // Pass pre-computed technician assignments from V2 availability
        })
      })

      const data = await response.json()

      if (data.success) {
        // Save assigned technicians if returned from API
        if (data.assignedTechnicians) {
          setAssignedTechnicians(data.assignedTechnicians)
        }
        router.push('/confirmation')
      } else {
        setErrors({ submit: data.error || 'Failed to create booking' })
      }
    } catch (error) {
      console.error('Booking error:', error)
      setErrors({ submit: 'An error occurred. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  // Calculate totals
  const totalPrice = guests.reduce((sum, guest) =>
    sum + (guest.services?.reduce((s, svc) => s + svc.price, 0) || 0), 0)
  // Show the longest service duration (services are done in parallel)
  const totalDuration = Math.max(...guests.map(guest =>
    guest.services?.reduce((s, svc) => s + svc.duration, 0) || 0))
  const totalServices = guests.reduce((sum, guest) =>
    sum + (guest.services?.length || 0), 0)

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <>
      <ProgressBar currentStep={5} />

      <div className="container-custom py-8 pb-32 lg:pb-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-heading text-gray-800 mb-2 text-center lg:text-left">
            Contact Information
          </h2>
          <p className="text-gray-600 text-center lg:text-left mb-8">
            We'll use this information to confirm your booking
          </p>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Form Column */}
            <div className="flex-1">
              <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 md:p-8">
            {/* Name */}
            <div className="mb-6">
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Phone */}
            <div className="mb-6">
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`input-field ${errors.phone ? 'border-red-500' : ''}`}
                placeholder="(555) 123-4567"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* Email */}
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                placeholder="john@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Special Requests */}
            <div className="mb-6">
              <label htmlFor="specialRequests" className="block text-sm font-semibold text-gray-700 mb-2">
                Special Requests (Optional)
              </label>
              <textarea
                id="specialRequests"
                name="specialRequests"
                value={formData.specialRequests}
                onChange={handleChange}
                rows="4"
                className="input-field resize-none"
                placeholder="Any special requests or notes for your appointment..."
              />
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
                {errors.submit}
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> You will receive a confirmation email and SMS with your booking details.
              </p>
            </div>

            {/* Navigation */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => router.push('/datetime')}
                className="btn-outline w-full sm:w-auto"
                disabled={submitting}
              >
                Back
              </button>

              <button
                type="submit"
                disabled={submitting}
                className={`btn-primary w-full sm:w-auto ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Booking...
                  </span>
                ) : (
                  'Complete Booking'
                )}
              </button>
            </div>
          </form>
            </div>

            {/* Summary Sidebar - Desktop */}
            <div className="hidden lg:block w-80 flex-shrink-0">
              <div className="sticky top-24 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-5 py-4 border-b border-gray-100">
                  <h3 className="font-heading text-lg tracking-wide">
                    Booking Summary
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {groupSize} guest{groupSize !== 1 ? 's' : ''} · {totalServices} service{totalServices !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="p-5">
                  {/* Date & Time */}
                  <div className="mb-4 pb-4 border-b border-gray-100">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Appointment</p>
                    <p className="font-medium text-neutral-850">{formatDate(selectedDate)}</p>
                    <p className="text-sm text-gray-600">{selectedTime}</p>
                  </div>

                  {/* Guests */}
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {guests.map((guest, idx) => (
                      <div key={idx} className="pb-3 border-b border-gray-100 last:border-0 last:pb-0">
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
                                <span className="text-gray-600 truncate pr-2">{service.name}</span>
                                <span className="text-gray-500 flex-shrink-0">${service.price}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">No services</p>
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
              {/* Date & Time */}
              <div className="mb-4 pb-3 border-b border-gray-100">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Appointment</p>
                <p className="font-medium text-neutral-850 text-sm">{formatDate(selectedDate)}</p>
                <p className="text-sm text-gray-600">{selectedTime}</p>
              </div>

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

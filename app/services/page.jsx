'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useBookingStore } from '@/lib/bookingStore'
import ProgressBar from '@/components/ProgressBar'
import ServiceCard from '@/components/ServiceCard'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function ServicesPage() {
  const router = useRouter()
  const {
    groupSize,
    currentGuestIndex,
    guests,
    setCurrentGuestIndex,
    updateGuestServices,
    updateGuestTechnician
  } = useBookingStore()

  const [services, setServices] = useState([])
  const [categories, setCategories] = useState({})
  const [technicians, setTechnicians] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedServices, setSelectedServices] = useState([])
  const [selectedTechnician, setSelectedTechnician] = useState(null)

  useEffect(() => {
    // Redirect if no group size selected
    if (groupSize === 0 || guests.length === 0) {
      router.push('/group-booking')
      return
    }

    // Load services
    fetch('/api/services')
      .then(res => res.json())
      .then(data => {
        setServices(data.services)
        setCategories(data.categories)
        setTechnicians(data.technicians)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error loading services:', error)
        setLoading(false)
      })

    // Load current guest's selections
    const currentGuest = guests[currentGuestIndex]
    if (currentGuest) {
      setSelectedServices(currentGuest.services || [])
      setSelectedTechnician(currentGuest.technician)
    }
  }, [groupSize, currentGuestIndex, guests, router])

  const toggleService = (service) => {
    setSelectedServices(prev => {
      const isSelected = prev.some(s => s.id === service.id)
      if (isSelected) {
        return prev.filter(s => s.id !== service.id)
      } else {
        return [...prev, service]
      }
    })
  }

  const handleNext = () => {
    // Save current guest's selections
    updateGuestServices(currentGuestIndex, selectedServices)
    updateGuestTechnician(currentGuestIndex, selectedTechnician)

    // Move to next guest or next page
    if (currentGuestIndex < groupSize - 1) {
      setCurrentGuestIndex(currentGuestIndex + 1)
      // Reset selections for next guest
      const nextGuest = guests[currentGuestIndex + 1]
      setSelectedServices(nextGuest?.services || [])
      setSelectedTechnician(nextGuest?.technician || null)
      // Scroll to top for next guest
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      router.push('/review')
    }
  }

  const handleBack = () => {
    if (currentGuestIndex > 0) {
      setCurrentGuestIndex(currentGuestIndex - 1)
      const prevGuest = guests[currentGuestIndex - 1]
      setSelectedServices(prevGuest?.services || [])
      setSelectedTechnician(prevGuest?.technician || null)
      // Scroll to top when going back
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      router.push('/group-booking')
    }
  }

  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0)
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0)

  if (loading) {
    return (
      <>
        <ProgressBar currentStep={2} />
        <div className="container-custom py-12">
          <LoadingSpinner text="Loading services..." />
        </div>
      </>
    )
  }

  return (
    <>
      <ProgressBar currentStep={2} />

      <div className="container-custom py-8">
        <div className="max-w-5xl mx-auto">
          {/* Guest Progress */}
          <div className="mb-10 text-center">
            <h2 className="text-3xl md:text-4xl font-heading tracking-wide mb-2">
              Choose Services
            </h2>
            <p className="text-gray-400 tracking-wide">
              Guest {currentGuestIndex + 1} of {groupSize}
            </p>
            {groupSize > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                {Array.from({ length: groupSize }).map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentGuestIndex
                        ? 'bg-primary w-8'
                        : index < currentGuestIndex
                        ? 'bg-primary/50 w-2'
                        : 'bg-gray-200 w-2'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Services by Category */}
          <div className="space-y-10 mb-10">
            {Object.entries(categories).map(([categoryName, categoryServices]) => (
              <div key={categoryName}>
                <h3 className="text-xl font-heading tracking-wide mb-5 pb-2 border-b border-gray-200">
                  {categoryName}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryServices.map(service => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      isSelected={selectedServices.some(s => s.id === service.id)}
                      onToggle={() => toggleService(service)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Technician Selection */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-heading tracking-wide mb-4">
              Preferred Technician
            </h3>
            <p className="text-sm text-gray-400 mb-4">Select a technician or let us assign the best available</p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setSelectedTechnician({ id: 'any', name: 'Any Staff' })}
                className={`px-5 py-2.5 rounded border transition-all duration-200 text-sm tracking-wide ${
                  selectedTechnician?.id === 'any'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-neutral-750 border-gray-200 hover:border-primary'
                }`}
              >
                Any Staff
              </button>
              {technicians.map(tech => (
                <button
                  key={tech.id}
                  onClick={() => setSelectedTechnician(tech)}
                  className={`px-5 py-2.5 rounded border transition-all duration-200 text-sm tracking-wide ${
                    selectedTechnician?.id === tech.id
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-neutral-750 border-gray-200 hover:border-primary'
                  }`}
                >
                  {tech.name}
                </button>
              ))}
            </div>
          </div>

          {/* Summary Bar */}
          <div className="bg-primary/10 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1 tracking-wide">
                  {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} selected
                </p>
                <p className="text-2xl font-heading text-neutral-850">
                  Total: ${totalPrice}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1 tracking-wide">Duration</p>
                <p className="text-xl font-heading text-neutral-850">
                  {totalDuration} min
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="btn-outline"
            >
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={selectedServices.length === 0 || !selectedTechnician}
              className={`btn-primary ${
                (selectedServices.length === 0 || !selectedTechnician)
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              {currentGuestIndex < groupSize - 1 ? 'Next Guest' : 'Review Booking'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

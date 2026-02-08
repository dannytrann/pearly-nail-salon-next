'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useBookingStore } from '@/lib/bookingStore'
import ProgressBar from '@/components/ProgressBar'
import ServiceCard from '@/components/ServiceCard'
import LoadingSpinner from '@/components/LoadingSpinner'
import SelectionSummary from '@/components/SelectionSummary'

export default function ServicesPage() {
  const router = useRouter()
  const {
    groupSize,
    currentGuestIndex,
    guests,
    setCurrentGuestIndex,
    updateGuestServices,
    updateGuestTechnician,
    updateGuestName
  } = useBookingStore()

  const [services, setServices] = useState([])
  const [categories, setCategories] = useState({})
  const [technicians, setTechnicians] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedServices, setSelectedServices] = useState([])
  const [selectedTechnician, setSelectedTechnician] = useState(null)
  const [guestName, setGuestName] = useState('')
  // New: track which step we're on for current guest
  const [step, setStep] = useState('name') // 'name' or 'services' or 'technician'

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

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
      setGuestName(currentGuest.guestName || '')
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

  const removeService = (service) => {
    setSelectedServices(prev => prev.filter(s => s.id !== service.id))
  }

  const handleNext = () => {
    if (step === 'name') {
      // Save name and move to services step
      updateGuestName(currentGuestIndex, guestName)
      setStep('services')
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 50)
    } else if (step === 'services') {
      // Save services and move to technician step
      updateGuestServices(currentGuestIndex, selectedServices)
      setStep('technician')
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 50)
    } else {
      // Save technician and move to next guest or review
      updateGuestTechnician(currentGuestIndex, selectedTechnician)

      if (currentGuestIndex < groupSize - 1) {
        setCurrentGuestIndex(currentGuestIndex + 1)
        // Reset for next guest
        const nextGuest = guests[currentGuestIndex + 1]
        setGuestName(nextGuest?.guestName || '')
        setSelectedServices(nextGuest?.services || [])
        setSelectedTechnician(nextGuest?.technician || null)
        setStep('name') // Reset to name step for next guest
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }, 100)
      } else {
        router.push('/review')
      }
    }
  }

  const handleBack = () => {
    if (step === 'technician') {
      // Go back to services step
      setStep('services')
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 50)
    } else if (step === 'services') {
      // Go back to name step
      setStep('name')
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 50)
    } else if (currentGuestIndex > 0) {
      // Go to previous guest's technician step
      setCurrentGuestIndex(currentGuestIndex - 1)
      const prevGuest = guests[currentGuestIndex - 1]
      setGuestName(prevGuest?.guestName || '')
      setSelectedServices(prevGuest?.services || [])
      setSelectedTechnician(prevGuest?.technician || null)
      setStep('technician') // Go to technician step of previous guest
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }, 100)
    } else {
      router.push('/group-booking')
    }
  }

  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0)
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0)

  // Get technicians already selected by OTHER guests (not current guest)
  const takenTechnicians = guests
    .filter((_, idx) => idx !== currentGuestIndex)
    .map(g => g.technician?.id)
    .filter(id => id && id !== 'any') // "Any Staff" can be selected by multiple guests

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

  // Dynamic button text based on step
  const getNextButtonText = () => {
    if (step === 'name') {
      return 'Choose Services'
    }
    if (step === 'services') {
      return 'Choose Technician'
    }
    return currentGuestIndex < groupSize - 1 ? 'Next Guest' : 'Review Booking'
  }

  // Dynamic disabled state based on step
  const isNextDisabled = step === 'name'
    ? guestName.trim() === ''
    : step === 'services'
    ? selectedServices.length === 0
    : !selectedTechnician

  const nextButtonText = getNextButtonText()

  return (
    <>
      <ProgressBar currentStep={2} />

      <div className="container-custom py-8 pb-32 lg:pb-8 lg:pr-96">
        {/* Main content with space reserved for fixed sidebar on desktop */}
        <div className="max-w-4xl mx-auto lg:mx-0">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Guest Progress */}
            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-3xl md:text-4xl font-heading tracking-wide mb-2">
                {step === 'name' ? 'Enter Your Name' : step === 'services' ? 'Choose Services' : 'Choose Technician'}
              </h2>
              <p className="text-warmgray-light tracking-wide">
                Guest {currentGuestIndex + 1} of {groupSize}
              </p>

              {/* Step indicator for current guest */}
              <div className="flex items-center justify-center lg:justify-start gap-3 mt-4">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                    step === 'name' ? 'bg-primary text-white' : 'bg-primary/20 text-primary'
                  }`}>
                    1
                  </div>
                  <span className={`text-sm ${step === 'name' ? 'text-neutral-850 font-medium' : 'text-warmgray-light'}`}>
                    Name
                  </span>
                </div>
                <div className="w-8 h-px bg-mist"></div>
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                    step === 'services' ? 'bg-primary text-white' : step === 'technician' ? 'bg-secondary/30 text-secondary' : 'bg-mist/60 text-warmgray-light'
                  }`}>
                    2
                  </div>
                  <span className={`text-sm ${step === 'services' ? 'text-neutral-850 font-medium' : 'text-warmgray-light'}`}>
                    Services
                  </span>
                </div>
                <div className="w-8 h-px bg-mist"></div>
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                    step === 'technician' ? 'bg-primary text-white' : 'bg-mist/60 text-warmgray-light'
                  }`}>
                    3
                  </div>
                  <span className={`text-sm ${step === 'technician' ? 'text-neutral-850 font-medium' : 'text-warmgray-light'}`}>
                    Technician
                  </span>
                </div>
              </div>

              {/* Guest progress dots (for multiple guests) */}
              {groupSize > 1 && (
                <div className="flex items-center justify-center lg:justify-start gap-2 mt-4">
                  {Array.from({ length: groupSize }).map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === currentGuestIndex
                          ? 'bg-primary w-8'
                          : index < currentGuestIndex
                          ? 'bg-primary/50 w-2'
                          : 'bg-mist w-2'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Step 1: Guest Name */}
            {step === 'name' && (
              <div className="mb-10">
                <div className="bg-cream-deep/50 rounded-xl p-6 border border-mist/40">
                  <h3 className="text-lg font-heading tracking-wide mb-2">
                    What&apos;s your name?
                  </h3>
                  <p className="text-sm text-warmgray-light mb-6">This helps us identify your booking</p>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && guestName.trim() !== '') {
                        handleNext()
                      }
                    }}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 rounded-xl border border-mist focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-300 text-neutral-850 bg-white"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Step 2: Services by Category */}
            {step === 'services' && (
              <>
                {/* Category Navigation */}
                <div className="mb-10">
                  {/* Decorative top divider */}
                  <div className="h-px bg-gradient-to-r from-transparent via-secondary/30 to-transparent mb-6"></div>

                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3">
                    {Object.keys(categories).map((categoryName, idx) => (
                      <div key={categoryName} className="flex items-center gap-6">
                        <button
                          onClick={() => {
                            const categoryId = `category-${categoryName.replace(/\s+/g, '-').toLowerCase()}`
                            const element = document.getElementById(categoryId)
                            if (element) {
                              const yOffset = -120
                              const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
                              window.scrollTo({ top: y, behavior: 'smooth' })
                            }
                          }}
                          className="group relative text-warmgray-light hover:text-secondary transition-colors duration-300 text-sm tracking-wide font-medium"
                        >
                          {categoryName}
                          <span className="absolute bottom-0 left-0 w-0 h-px bg-secondary group-hover:w-full transition-all duration-300"></span>
                        </button>
                        {idx < Object.keys(categories).length - 1 && (
                          <div className="w-1 h-1 rounded-full bg-secondary/40 hidden sm:block"></div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Decorative bottom divider */}
                  <div className="h-px bg-gradient-to-r from-transparent via-secondary/30 to-transparent mt-6"></div>
                </div>

                {/* Categories */}
                <div className="space-y-10 mb-10">
                  {Object.entries(categories).map(([categoryName, categoryServices]) => (
                    <div
                      key={categoryName}
                      id={`category-${categoryName.replace(/\s+/g, '-').toLowerCase()}`}
                      className="scroll-mt-24"
                    >
                      <h3 className="text-xl font-heading tracking-wide mb-5 pb-2 border-b border-mist/60">
                        {categoryName}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </>
            )}

            {/* Step 3: Technician Selection */}
            {step === 'technician' && (
              <div className="mb-10">
                {/* Selected Services Summary */}
                <div className="bg-white border border-mist/60 rounded-xl p-5 mb-8">
                  <h3 className="text-sm font-semibold text-warmgray-light uppercase tracking-wide mb-3">
                    Selected Services
                  </h3>
                  <div className="space-y-2">
                    {selectedServices.map(service => (
                      <div key={service.id} className="flex justify-between items-center py-2 border-b border-mist/30 last:border-0">
                        <span className="text-neutral-850">{service.name}</span>
                        <span className="text-warmgray-light">${service.price} &middot; {service.duration} min</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-mist/60 flex justify-between">
                    <span className="font-medium text-neutral-850">Total</span>
                    <span className="font-semibold text-neutral-850">${totalPrice} · {totalDuration} min</span>
                  </div>
                </div>

                {/* Technician Selection */}
                <div className="bg-cream-deep/50 rounded-xl p-6 border border-mist/40">
                  <h3 className="text-lg font-heading tracking-wide mb-2">
                    Who would you like?
                  </h3>
                  <p className="text-sm text-warmgray-light mb-6">Select a technician or let us assign the best available</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => setSelectedTechnician({ id: 'any', name: 'Any Staff' })}
                      className={`px-5 py-4 rounded-xl border transition-all duration-300 text-sm tracking-wide ${
                        selectedTechnician?.id === 'any'
                          ? 'bg-primary text-white border-primary shadow-md'
                          : 'bg-white text-neutral-750 border-mist/60 hover:border-primary hover:shadow-sm'
                      }`}
                    >
                      <div className="font-medium">Any Staff</div>
                      <div className={`text-xs mt-1 ${selectedTechnician?.id === 'any' ? 'text-white/80' : 'text-warmgray-light'}`}>
                        First available
                      </div>
                    </button>
                    {technicians.map(tech => {
                      const isTaken = takenTechnicians.includes(tech.id)
                      const takenByGuest = isTaken
                        ? guests.findIndex(g => g.technician?.id === tech.id) + 1
                        : null

                      return (
                        <button
                          key={tech.id}
                          onClick={() => !isTaken && setSelectedTechnician(tech)}
                          disabled={isTaken}
                          className={`px-5 py-4 rounded-xl border transition-all duration-300 text-sm tracking-wide ${
                            selectedTechnician?.id === tech.id
                              ? 'bg-primary text-white border-primary shadow-md'
                              : isTaken
                              ? 'bg-cream-deep/50 text-warmgray-light border-mist/40 cursor-not-allowed'
                              : 'bg-white text-neutral-750 border-mist/60 hover:border-primary hover:shadow-sm'
                          }`}
                        >
                          <div className="font-medium">{tech.name}</div>
                          {isTaken && (
                            <div className="text-xs mt-1 text-warmgray-light">
                              Guest {takenByGuest}
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  {takenTechnicians.length > 0 && (
                    <p className="text-xs text-warmgray-light mt-4 text-center">
                      Some technicians are already selected by other guests
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Back Button - Desktop only (Next is in sidebar) */}
            <div className="hidden lg:block">
              <button
                onClick={handleBack}
                className="btn-outline"
              >
                Back
              </button>
            </div>

            {/* Mobile Navigation - Back button only */}
            <div className="lg:hidden flex items-center justify-start mb-4">
              <button
                onClick={handleBack}
                className="btn-outline"
              >
                Back
              </button>
            </div>
          </div>

          </div>
      </div>

      {/* Fixed Sidebar - Desktop only */}
      <SelectionSummary
        selectedServices={selectedServices}
        selectedTechnician={selectedTechnician}
        onRemoveService={removeService}
        totalPrice={totalPrice}
        totalDuration={totalDuration}
        currentGuestIndex={currentGuestIndex}
        groupSize={groupSize}
        onNext={handleNext}
        isNextDisabled={isNextDisabled}
        nextButtonText={nextButtonText}
        mode="desktop"
        step={step}
      />

      {/* Mobile Bottom Sheet */}
      <SelectionSummary
        selectedServices={selectedServices}
        selectedTechnician={selectedTechnician}
        onRemoveService={removeService}
        totalPrice={totalPrice}
        totalDuration={totalDuration}
        currentGuestIndex={currentGuestIndex}
        groupSize={groupSize}
        guests={guests}
        onNext={handleNext}
        isNextDisabled={isNextDisabled}
        nextButtonText={nextButtonText}
        mode="mobile"
        step={step}
      />
    </>
  )
}

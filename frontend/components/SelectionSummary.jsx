'use client'

import { useState } from 'react'

export default function SelectionSummary({
  selectedServices,
  selectedTechnician,
  onRemoveService,
  totalPrice,
  totalDuration,
  currentGuestIndex,
  groupSize,
  guests = [],
  onNext,
  isNextDisabled,
  nextButtonText,
  mode = 'both', // 'desktop', 'mobile', or 'both'
  step = 'services' // 'services' or 'technician'
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  const serviceCount = selectedServices.length

  // Build combined view of all guests with current guest using live state
  const allGuestsData = guests.map((guest, idx) => {
    if (idx === currentGuestIndex) {
      return {
        guestNumber: idx + 1,
        services: selectedServices,
        technician: selectedTechnician,
        isCurrent: true
      }
    }
    return {
      guestNumber: idx + 1,
      services: guest.services || [],
      technician: guest.technician,
      isCurrent: false
    }
  })

  // Calculate totals across all guests
  const allGuestsServiceCount = allGuestsData.reduce((sum, g) => sum + g.services.length, 0)
  const allGuestsTotalPrice = allGuestsData.reduce((sum, g) =>
    sum + g.services.reduce((s, svc) => s + svc.price, 0), 0)
  // Show longest guest's duration (services are done in parallel)
  const allGuestsTotalDuration = Math.max(...allGuestsData.map(g =>
    g.services.reduce((s, svc) => s + svc.duration, 0)), 0)

  const showDesktop = mode === 'both' || mode === 'desktop'
  const showMobile = mode === 'both' || mode === 'mobile'

  return (
    <>
      {/* Desktop Sidebar - Fixed, positioned closer to content on wide screens */}
      {showDesktop && <div className="hidden lg:block fixed right-8 xl:right-[max(2rem,calc(50vw-36rem))] top-32 w-80 z-40">
        <div className="bg-white border border-mist/60 rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-5 py-4 border-b border-mist/40">
            <h3 className="font-heading text-lg tracking-wide">
              Guest {currentGuestIndex + 1} Selection
            </h3>
            <p className="text-sm text-warmgray-light mt-1">
              {serviceCount} service{serviceCount !== 1 ? 's' : ''} selected
              {step === 'technician' && selectedTechnician && ` · ${selectedTechnician.name}`}
            </p>
            {/* Step indicator */}
            <div className="flex items-center gap-2 mt-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 'services' ? 'bg-primary text-white' : 'bg-secondary/40 text-secondary'
              }`}>1</div>
              <div className="w-4 h-px bg-mist"></div>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 'technician' ? 'bg-primary text-white' : 'bg-mist/70 text-warmgray-light'
              }`}>2</div>
            </div>
          </div>

          {/* Services List */}
          <div className="p-5">
            {serviceCount === 0 ? (
              <p className="text-warmgray-light text-sm text-center py-4">
                No services selected yet
              </p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {selectedServices.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-start justify-between gap-3 pb-3 border-b border-mist/30 last:border-0 last:pb-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-neutral-850 truncate">
                        {service.name}
                      </p>
                      <p className="text-xs text-warmgray-light mt-0.5">
                        ${service.price} &middot; {service.duration} min
                      </p>
                    </div>
                    {step === 'services' && (
                      <button
                        onClick={() => onRemoveService(service)}
                        className="p-1.5 text-warmgray-light hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label={`Remove ${service.name}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Technician */}
            {selectedTechnician && (
              <div className="mt-4 pt-4 border-t border-mist/40">
                <p className="text-xs text-warmgray-light uppercase tracking-wide mb-1">Technician</p>
                <p className="text-sm font-medium text-neutral-850">{selectedTechnician.name}</p>
              </div>
            )}

            {/* Totals */}
            <div className="mt-4 pt-4 border-t border-mist/60 bg-cream-deep/40 -mx-5 -mb-5 px-5 py-4 rounded-b-2xl">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-warmgray-light">Total</span>
                <span className="text-xl font-heading text-neutral-850">${totalPrice}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-warmgray-light">Duration</span>
                <span className="text-sm font-medium text-neutral-850">{totalDuration} min</span>
              </div>
              <button
                onClick={onNext}
                disabled={isNextDisabled}
                className={`w-full btn-primary text-center ${
                  isNextDisabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {nextButtonText}
              </button>
            </div>
          </div>
        </div>
      </div>}

      {/* Mobile Bottom Sheet */}
      {showMobile && <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="mx-3 mb-3 bg-white rounded-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.12)] overflow-hidden border border-mist/40">
        {/* Expanded Content */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isExpanded ? 'max-h-96' : 'max-h-0'
          }`}
        >
          <div className="p-4 max-h-80 overflow-y-auto border-b border-mist/40">
            {allGuestsServiceCount === 0 ? (
              <p className="text-warmgray-light text-sm text-center py-4">
                No services selected yet
              </p>
            ) : (
              <div className="space-y-4">
                {allGuestsData.map((guest) => (
                  <div key={guest.guestNumber} className={`${guest.isCurrent ? '' : 'opacity-70'}`}>
                    {/* Guest Header */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-semibold uppercase tracking-wide ${guest.isCurrent ? 'text-primary' : 'text-warmgray-light'}`}>
                        Guest {guest.guestNumber}
                        {guest.isCurrent && <span className="ml-1 text-[10px] normal-case">(editing)</span>}
                      </span>
                      {guest.technician && (
                        <span className="text-xs text-warmgray-light">
                          &middot; {guest.technician.name}
                        </span>
                      )}
                    </div>

                    {/* Guest Services */}
                    {guest.services.length === 0 ? (
                      <p className="text-xs text-warmgray-light italic pl-4">No services selected</p>
                    ) : (
                      <div className="space-y-2">
                        {guest.services.map((service) => (
                          <div
                            key={`${guest.guestNumber}-${service.id}`}
                            className="flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${guest.isCurrent ? 'bg-primary' : 'bg-mist'}`}></div>
                              <span className="text-sm font-medium text-neutral-850">
                                {service.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-warmgray-light">${service.price}</span>
                              {guest.isCurrent && step === 'services' && (
                                <button
                                  onClick={() => onRemoveService(service)}
                                  className="p-1.5 text-warmgray-light hover:text-red-500 transition-colors"
                                  aria-label={`Remove ${service.name}`}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Divider between guests */}
                    {guest.guestNumber < groupSize && (
                      <div className="mt-3 border-b border-mist/40"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar (Always Visible) */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-3"
            >
              <div>
                <p className="text-sm font-semibold text-neutral-850 text-left">
                  {groupSize > 1 ? `${groupSize} guests · ` : ''}{allGuestsServiceCount} service{allGuestsServiceCount !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-warmgray-light">
                  ${allGuestsTotalPrice} &middot; {allGuestsTotalDuration} min
                </p>
              </div>
              <svg
                className={`w-5 h-5 text-warmgray-light transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={onNext}
              disabled={isNextDisabled}
              className={`btn-primary px-6 py-2.5 text-sm ${
                isNextDisabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {nextButtonText}
            </button>
          </div>
        </div>
        </div>
      </div>}
    </>
  )
}

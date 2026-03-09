'use client'

export default function ProgressBar({ currentStep }) {
  const steps = [
    { number: 1, name: 'Group Size', short: 'Group', path: '/group-booking' },
    { number: 2, name: 'Services', short: 'Services', path: '/services' },
    { number: 3, name: 'Review', short: 'Review', path: '/review' },
    { number: 4, name: 'Date & Time', short: 'Date', path: '/datetime' },
    { number: 5, name: 'Contact', short: 'Contact', path: '/contact' }
  ]

  return (
    <div className="bg-cream border-b border-mist/60">
      <div className="container-custom py-5">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-xs md:text-sm font-medium transition-all duration-300 ${
                    currentStep > step.number
                      ? 'bg-secondary text-white'
                      : currentStep === step.number
                      ? 'bg-primary text-white shadow-sm shadow-primary/30'
                      : 'bg-mist/50 text-warmgray-light'
                  }`}
                >
                  {currentStep > step.number ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>
                {/* Mobile: short name, desktop: full name */}
                <span
                  className={`mt-1.5 tracking-wide leading-tight text-center ${
                    currentStep >= step.number ? 'text-neutral-850' : 'text-warmgray-light'
                  } text-[10px] block md:hidden`}
                >
                  {step.short}
                </span>
                <span
                  className={`mt-1.5 text-xs tracking-wide hidden md:block ${
                    currentStep >= step.number ? 'text-neutral-850' : 'text-warmgray-light'
                  }`}
                >
                  {step.name}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 h-px mx-2 md:mx-3">
                  <div
                    className={`h-full transition-all duration-300 ${
                      currentStep > step.number ? 'bg-secondary/60' : 'bg-mist'
                    }`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

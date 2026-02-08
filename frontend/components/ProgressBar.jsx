'use client'

export default function ProgressBar({ currentStep }) {
  const steps = [
    { number: 1, name: 'Group Size', path: '/group-booking' },
    { number: 2, name: 'Services', path: '/services' },
    { number: 3, name: 'Review', path: '/review' },
    { number: 4, name: 'Date & Time', path: '/datetime' },
    { number: 5, name: 'Contact', path: '/contact' }
  ]

  return (
    <div className="bg-cream border-b border-mist/60">
      <div className="container-custom py-6">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                    currentStep > step.number
                      ? 'bg-secondary text-white'
                      : currentStep === step.number
                      ? 'bg-primary text-white'
                      : 'bg-mist/50 text-warmgray-light'
                  }`}
                >
                  {currentStep > step.number ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={`text-xs mt-2 tracking-wide hidden md:block ${
                    currentStep >= step.number ? 'text-neutral-850' : 'text-warmgray-light'
                  }`}
                >
                  {step.name}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className="flex-1 h-px mx-3">
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

'use client'

export default function ServiceCard({ service, isSelected, onToggle }) {
  return (
    <div
      onClick={onToggle}
      className={`cursor-pointer bg-white rounded-xl p-5 border transition-all duration-300 hover:shadow-md ${
        isSelected
          ? 'border-primary shadow-md bg-primary/[0.04]'
          : 'border-mist/60 hover:border-primary/30'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="font-heading text-lg text-neutral-850 mb-1">
            {service.name}
          </h3>

          {service.description && (
            <p className="text-sm text-warmgray-light mb-3 leading-relaxed line-clamp-2">
              {service.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium text-neutral-850">${service.price}</span>
            <span className="text-mist">&middot;</span>
            <span className="text-warmgray-light">{service.duration} min</span>
          </div>
        </div>

        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0 mt-1 ${
          isSelected
            ? 'border-primary bg-primary'
            : 'border-mist'
        }`}>
          {isSelected && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
    </div>
  )
}

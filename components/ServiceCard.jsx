'use client'

export default function ServiceCard({ service, isSelected, onToggle }) {
  return (
    <div
      onClick={onToggle}
      className={`cursor-pointer bg-white rounded-lg p-5 border transition-all duration-200 hover:shadow-md ${
        isSelected
          ? 'border-primary border-2 shadow-md bg-primary/5'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="font-heading text-lg text-neutral-850 mb-1">
            {service.name}
          </h3>

          {service.description && (
            <p className="text-sm text-gray-400 mb-3 leading-relaxed line-clamp-2">
              {service.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium text-neutral-850">${service.price}</span>
            <span className="text-gray-300">·</span>
            <span className="text-gray-400">{service.duration} min</span>
          </div>
        </div>

        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 mt-1 ${
          isSelected
            ? 'border-primary bg-primary'
            : 'border-gray-300'
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

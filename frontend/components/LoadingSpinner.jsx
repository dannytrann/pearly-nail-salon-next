'use client'

export default function LoadingSpinner({ size = 'medium', text = 'Loading...' }) {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  }

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div
        className={`${sizeClasses[size]} border-4 border-mist border-t-primary rounded-full animate-spin`}
      />
      {text && (
        <p className="mt-4 text-warmgray-light font-medium">{text}</p>
      )}
    </div>
  )
}

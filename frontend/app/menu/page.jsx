'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// Category icons mapping
const categoryIcons = {
  "Kid's (12 yrs old n' Under)": (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  "Manicure (hands)": (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
    </svg>
  ),
  "Pedicure (Feet)": (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  "Waxing": (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  "Other Services": (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  )
}

export default function ServiceMenu() {
  const [categories, setCategories] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCategories(data.categories || {})
        }
        setLoading(false)
      })
      .catch(error => {
        console.error('Error loading services:', error)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-warmgray-light text-sm tracking-wide">Loading services...</p>
        </div>
      </div>
    )
  }

  // Define preferred category order
  const categoryOrder = ["Waxing", "Manicure (hands)", "Pedicure (Feet)", "Kid's (12 yrs old n' Under)", "Other Services"]
  const sortedCategories = Object.entries(categories).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a[0])
    const indexB = categoryOrder.indexOf(b[0])
    if (indexA === -1 && indexB === -1) return 0
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })

  return (
    <div className="bg-cream min-h-screen">
      {/* Decorative Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary rounded-full blur-3xl"></div>
      </div>

      {/* Hero Section */}
      <div className="relative border-b border-mist/60 bg-gradient-to-r from-cream-deep/60 via-cream to-secondary/[0.04]">
        <div className="container-custom py-12">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <p className="text-secondary font-medium text-xs tracking-[0.3em] uppercase mb-2">Welcome to Pearly</p>
              <h1 className="text-3xl md:text-4xl font-heading tracking-wide">
                Service Menu
              </h1>
              <p className="text-warmgray-light mt-2 text-sm tracking-wide">
                Browse our services and book your appointment
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:items-end">
              {/* My Bookings Button */}
              <a
                href="https://book.squareup.com/appointments/jigdrgfr2q4j72/location/L09XRHHBTG8ZV/bookings"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border border-mist bg-white/80 text-neutral-750 hover:bg-primary/5 hover:border-primary/40 transition-all duration-300 text-sm font-medium tracking-wide"
              >
                <svg className="w-4 h-4 text-secondary group-hover:text-primary transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="group-hover:text-primary transition-colors duration-300">My Bookings</span>
                <svg className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>

              {/* Book Now Button */}
              <Link
                href="/group-booking"
                className="group inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-8 py-3.5 rounded-full font-medium transition-all duration-300 text-sm tracking-wide shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5"
              >
                <svg className="w-4 h-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Book Now
                <svg className="w-4 h-4 opacity-60 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              </Link>
            </div>
          </div>
        </div>
        {/* Decorative bottom border */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-secondary/30 to-transparent"></div>
      </div>

      {/* Services List */}
      <div className="relative container-custom py-16">
        {sortedCategories.length > 0 ? (
          <div className="space-y-20">
            {sortedCategories.map(([categoryName, categoryServices], index) => (
              <section key={categoryName} className="relative">
                {/* Decorative element for alternating sections */}
                {index % 2 === 1 && (
                  <div className="absolute -inset-x-4 -inset-y-8 bg-gradient-to-r from-cream-deep/40 via-cream-deep/60 to-cream-deep/40 rounded-3xl -z-10"></div>
                )}

                {/* Category Header */}
                <div className="flex items-center gap-4 mb-10">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary/15 to-secondary/15 text-primary">
                    {categoryIcons[categoryName] || categoryIcons["Other Services"]}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-heading tracking-wide">
                      {categoryName}
                    </h2>
                    <div className="mt-2 h-0.5 bg-gradient-to-r from-primary/30 via-secondary/30 to-transparent rounded-full"></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {categoryServices.map(service => (
                    <ServiceItem key={service.id} service={service} />
                  ))}
                </div>

                {/* Decorative divider between sections */}
                {index < sortedCategories.length - 1 && (
                  <div className="flex items-center justify-center mt-16">
                    <div className="h-px w-16 bg-gradient-to-r from-transparent to-secondary/40"></div>
                    <div className="mx-4 w-1.5 h-1.5 rounded-full bg-secondary/40"></div>
                    <div className="h-px w-16 bg-gradient-to-l from-transparent to-secondary/40"></div>
                  </div>
                )}
              </section>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-warmgray-light">No services available at the moment.</p>
          </div>
        )}

        {/* Bottom CTA Section */}
        <div className="mt-20 text-center">
          <div className="inline-block">
            <div className="flex items-center justify-center mb-4">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-secondary/40"></div>
              <div className="mx-3 text-secondary text-sm tracking-widest">&#10022;</div>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-secondary/40"></div>
            </div>
            <p className="text-warmgray-light text-sm tracking-wide mb-6">Ready to treat yourself?</p>
            <div className="flex flex-col gap-3 items-center">
              {/* My Bookings Button */}
              <a
                href="https://book.squareup.com/appointments/jigdrgfr2q4j72/location/L09XRHHBTG8ZV/bookings"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border border-mist bg-white/80 text-neutral-750 hover:bg-primary/5 hover:border-primary/40 transition-all duration-300 text-sm font-medium tracking-wide"
              >
                <svg className="w-4 h-4 text-secondary group-hover:text-primary transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="group-hover:text-primary transition-colors duration-300">My Bookings</span>
                <svg className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>

              {/* Book Your Appointment Button */}
              <Link
                href="/group-booking"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-10 py-4 rounded-full font-medium transition-all duration-300 text-sm tracking-wide shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5"
              >
                Book Your Appointment
                <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ServiceItem({ service }) {
  return (
    <div className="group relative border border-mist/60 rounded-xl p-5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 bg-white overflow-hidden">
      {/* Subtle gradient accent on hover */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary/60 via-secondary/60 to-primary/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <h3 className="font-heading text-lg mb-2 group-hover:text-primary transition-colors duration-300">
        {service.name}
      </h3>
      {service.description && (
        <p className="text-warmgray-light text-sm leading-relaxed mb-4 line-clamp-2">
          {service.description}
        </p>
      )}
      <div className="flex items-center justify-between pt-3 border-t border-mist/40">
        <div className="text-sm text-warmgray-light">
          <span className="font-semibold text-neutral-850">${service.price}</span>
          <span className="mx-2 text-secondary/60">&middot;</span>
          <span>{service.duration} mins</span>
        </div>
        <Link
          href={`/group-booking?serviceId=${service.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-dark transition-colors tracking-wide group/link"
        >
          Book
          <svg className="w-4 h-4 transition-transform duration-200 group-hover/link:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  )
}

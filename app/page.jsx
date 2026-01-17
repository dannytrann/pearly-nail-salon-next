'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-white to-secondary/5"></div>

        {/* Decorative circles */}
        <div className="absolute top-20 right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-secondary/5 rounded-full blur-3xl"></div>

        <div className="relative container-custom py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            {/* Welcome text */}
            <p className="text-primary font-medium text-sm tracking-[0.3em] uppercase mb-4">
              Welcome to
            </p>

            {/* Main heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading tracking-wide mb-6">
              Pearly Nails & Spa
            </h1>

            {/* Tagline */}
            <p className="text-gray-500 text-lg md:text-xl mb-10 max-w-xl mx-auto leading-relaxed">
              Your destination for beautiful nails and relaxing spa treatments in the heart of Comox, BC
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/group-booking"
                className="group inline-flex items-center justify-center gap-3 bg-primary hover:bg-primary-dark text-white px-10 py-4 rounded-full font-semibold transition-all duration-300 text-base tracking-wide shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 min-w-[200px]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Book Now
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              <a
                href="https://book.squareup.com/appointments/jigdrgfr2q4j72/location/L09XRHHBTG8ZV/bookings"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-3 px-10 py-4 rounded-full border-2 border-neutral-750 text-neutral-750 hover:border-primary hover:text-primary font-semibold transition-all duration-300 text-base tracking-wide min-w-[200px]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                My Appointment
              </a>
            </div>

            {/* View Services Link */}
            <div className="mt-8">
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-colors text-sm font-medium"
              >
                View Our Services
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative divider */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
      </section>

      {/* Business Info Section */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Left: Info Cards */}
            <div className="space-y-6">
              {/* Location Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading text-lg mb-2">Our Location</h3>
                    <p className="text-neutral-750 font-medium">23A-215 Port Augusta St</p>
                    <p className="text-neutral-750">Comox, BC V9M 3M9</p>
                    <p className="text-gray-400 text-sm mt-2">Next to WOOFY'S pet shop</p>
                    <a
                      href="https://maps.google.com/?q=23A-215+Port+Augusta+St+Comox+BC+V9M+3M9"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:text-primary-dark text-sm font-medium mt-3 transition-colors"
                    >
                      Get Directions
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              {/* Contact Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading text-lg mb-2">Contact Us</h3>
                    <a
                      href="tel:+12509417870"
                      className="text-neutral-750 font-medium text-lg hover:text-primary transition-colors block"
                    >
                      (250) 941-7870
                    </a>
                    <a
                      href="mailto:info@pearlynails.com"
                      className="text-gray-500 hover:text-primary transition-colors text-sm"
                    >
                      info@pearlynails.com
                    </a>
                  </div>
                </div>
              </div>

              {/* Hours Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading text-lg mb-3">Business Hours</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Monday - Saturday</span>
                        <span className="text-neutral-750 font-medium">9:00 AM - 6:00 PM</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Sunday</span>
                        <span className="text-neutral-750 font-medium">10:00 AM - 4:00 PM</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-400">
                        Walk-ins welcome! For group bookings, we recommend making a reservation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Map */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full min-h-[400px] lg:min-h-full">
                <iframe
                  src="https://www.google.com/maps?q=215+Port+Augusta+St,+Comox,+BC+V9M+3M9,+Canada&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: '400px' }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Pearly Nails & Spa Location"
                  className="w-full h-full"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Services Preview */}
      <section className="py-16 md:py-20">
        <div className="container-custom">
          <div className="text-center mb-12">
            <p className="text-primary font-medium text-sm tracking-[0.2em] uppercase mb-3">Our Services</p>
            <h2 className="text-3xl md:text-4xl font-heading tracking-wide mb-4">What We Offer</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              From classic manicures to luxurious spa treatments, we have everything you need for beautiful nails and relaxation.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
            {/* Service Cards */}
            <ServicePreviewCard
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                </svg>
              }
              title="Manicures"
              description="Classic to gel"
            />
            <ServicePreviewCard
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              }
              title="Pedicures"
              description="Relaxing foot care"
            />
            <ServicePreviewCard
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              }
              title="Waxing"
              description="Smooth results"
            />
            <ServicePreviewCard
              icon={
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="Kid's Services"
              description="Ages 12 & under"
            />
          </div>

          <div className="text-center mt-10">
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-semibold transition-colors"
            >
              View Full Service Menu
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-primary/5 via-white to-secondary/5">
        <div className="container-custom text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-heading tracking-wide mb-4">
              Ready to Treat Yourself?
            </h2>
            <p className="text-gray-500 mb-8">
              Book your appointment today and let us pamper you with our professional nail and spa services.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/group-booking"
                className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-10 py-4 rounded-full font-semibold transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
              >
                Book Your Appointment
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <a
                href="tel:+12509417870"
                className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full border-2 border-neutral-750 text-neutral-750 hover:border-primary hover:text-primary font-semibold transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function ServicePreviewCard({ icon, title, description }) {
  return (
    <Link
      href="/menu"
      className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-primary/30 transition-all duration-300 text-center"
    >
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-4 group-hover:bg-primary group-hover:text-white transition-all duration-300">
        {icon}
      </div>
      <h3 className="font-heading text-lg mb-1 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </Link>
  )
}

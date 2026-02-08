'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12
    }
  }
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 }
}

export default function HomePage() {
  return (
    <div className="bg-cream">
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[70vh] flex items-center">
        {/* Pearl Orb - Signature iridescent background element */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] md:w-[600px] md:h-[600px] lg:w-[700px] lg:h-[700px] pointer-events-none"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
        >
          <div
            className="w-full h-full rounded-full animate-float"
            style={{
              background: `
                radial-gradient(circle at 35% 28%, rgba(255,255,255,0.85) 0%, transparent 45%),
                radial-gradient(circle at 62% 72%, rgba(196,167,125,0.12) 0%, transparent 35%),
                radial-gradient(circle at 50% 50%, rgba(250,247,244,0.9) 0%, rgba(176,141,141,0.05) 55%, rgba(196,167,125,0.08) 100%)
              `,
              boxShadow: `
                inset 0 -40px 80px rgba(196,167,125,0.08),
                inset 0 30px 60px rgba(255,255,255,0.3),
                0 40px 120px rgba(146,107,107,0.05)
              `
            }}
          />
        </motion.div>

        {/* Subtle warm gradient overlays */}
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-secondary/[0.04] to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-primary/[0.03] to-transparent"></div>

        <div className="relative container-custom py-20 md:py-28">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* Welcome text */}
            <motion.p
              className="text-secondary font-medium text-xs tracking-[0.4em] uppercase mb-6"
              variants={fadeUp}
              transition={{ duration: 0.8 }}
            >
              Welcome to
            </motion.p>

            {/* Main heading */}
            <motion.h1
              className="text-5xl md:text-6xl lg:text-7xl font-heading tracking-wide mb-6 leading-[1.1]"
              variants={fadeUp}
              transition={{ duration: 0.8 }}
            >
              Pearly Nails
              <span className="block text-primary/80">&amp; Spa</span>
            </motion.h1>

            {/* Gold accent divider */}
            <motion.div
              className="flex items-center justify-center gap-3 mb-8"
              variants={fadeUp}
              transition={{ duration: 0.8 }}
            >
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-secondary/50"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-secondary/50"></div>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-secondary/50"></div>
            </motion.div>

            {/* Tagline */}
            <motion.p
              className="text-warmgray-light text-lg md:text-xl mb-12 max-w-lg mx-auto leading-relaxed font-light"
              variants={fadeUp}
              transition={{ duration: 0.8 }}
            >
              Your destination for beautiful nails and relaxing spa treatments in the heart of Comox, BC
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              variants={fadeUp}
              transition={{ duration: 0.8 }}
            >
              <Link
                href="/group-booking"
                className="group inline-flex items-center justify-center gap-3 bg-primary hover:bg-primary-dark text-white px-10 py-4 rounded-full font-medium transition-all duration-300 text-base tracking-wide shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5 min-w-[200px]"
              >
                <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Book Now
                <svg className="w-4 h-4 opacity-60 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              <a
                href="https://book.squareup.com/appointments/jigdrgfr2q4j72/location/L09XRHHBTG8ZV/bookings"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-3 px-10 py-4 rounded-full border border-mist text-neutral-750 hover:border-primary hover:text-primary font-medium transition-all duration-300 text-base tracking-wide min-w-[200px]"
              >
                <svg className="w-5 h-5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                My Appointment
              </a>
            </motion.div>

            {/* View Services Link */}
            <motion.div
              className="mt-10"
              variants={fadeUp}
              transition={{ duration: 0.8 }}
            >
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 text-warmgray-light hover:text-primary transition-colors duration-300 text-sm font-medium tracking-wide"
              >
                View Our Services
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom gold divider */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-secondary/25 to-transparent"></div>
      </section>

      {/* Business Info Section */}
      <section className="py-16 md:py-24 bg-cream-deep/50">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Left: Info Cards */}
            <motion.div
              className="space-y-5"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
            >
              {/* Location Card */}
              <motion.div
                className="bg-white rounded-2xl p-6 shadow-sm border border-mist/50 hover:shadow-md transition-all duration-300"
                variants={fadeUp}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading text-xl mb-2">Our Location</h3>
                    <p className="text-neutral-750 font-medium">23A-215 Port Augusta St</p>
                    <p className="text-neutral-750">Comox, BC V9M 3M9</p>
                    <p className="text-warmgray-light text-sm mt-2 italic">Next to WOOFY&apos;S pet shop</p>
                    <a
                      href="https://maps.google.com/?q=23A-215+Port+Augusta+St+Comox+BC+V9M+3M9"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:text-primary-dark text-sm font-medium mt-3 transition-colors"
                    >
                      Get Directions
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </motion.div>

              {/* Contact Card */}
              <motion.div
                className="bg-white rounded-2xl p-6 shadow-sm border border-mist/50 hover:shadow-md transition-all duration-300"
                variants={fadeUp}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading text-xl mb-2">Contact Us</h3>
                    <a
                      href="tel:+12509417870"
                      className="text-neutral-750 font-medium text-lg hover:text-primary transition-colors block"
                    >
                      (250) 941-7870
                    </a>
                    <a
                      href="mailto:scp.deng@gmail.com"
                      className="text-warmgray-light hover:text-primary transition-colors text-sm"
                    >
                      scp.deng@gmail.com
                    </a>
                  </div>
                </div>
              </motion.div>

              {/* Hours Card */}
              <motion.div
                className="bg-white rounded-2xl p-6 shadow-sm border border-mist/50 hover:shadow-md transition-all duration-300"
                variants={fadeUp}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading text-xl mb-3">Business Hours</h3>
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-warmgray-light text-sm">Monday &mdash; Saturday</span>
                        <span className="text-neutral-750 font-medium text-sm">9:00 AM &mdash; 6:00 PM</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-warmgray-light text-sm">Sunday</span>
                        <span className="text-neutral-750 font-medium text-sm">10:00 AM &mdash; 4:00 PM</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-mist/50">
                      <p className="text-xs text-warmgray-light italic">
                        Walk-ins welcome! For groups, we recommend booking ahead.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right: Map */}
            <motion.div
              className="relative"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeUp}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <div className="bg-white rounded-2xl shadow-sm border border-mist/50 overflow-hidden h-full min-h-[400px] lg:min-h-full">
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
            </motion.div>
          </div>
        </div>
      </section>

      {/* Quick Services Preview */}
      <section className="py-16 md:py-24">
        <div className="container-custom">
          <motion.div
            className="text-center mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            <motion.p
              className="text-secondary font-medium text-xs tracking-[0.3em] uppercase mb-4"
              variants={fadeUp}
              transition={{ duration: 0.6 }}
            >
              Our Services
            </motion.p>
            <motion.h2
              className="text-3xl md:text-4xl font-heading tracking-wide mb-5"
              variants={fadeUp}
              transition={{ duration: 0.6 }}
            >
              What We Offer
            </motion.h2>
            <motion.div
              className="flex items-center justify-center gap-3 mb-6"
              variants={fadeUp}
              transition={{ duration: 0.6 }}
            >
              <div className="h-px w-8 bg-secondary/40"></div>
              <div className="w-1 h-1 rounded-full bg-secondary/50"></div>
              <div className="h-px w-8 bg-secondary/40"></div>
            </motion.div>
            <motion.p
              className="text-warmgray-light max-w-lg mx-auto leading-relaxed"
              variants={fadeUp}
              transition={{ duration: 0.6 }}
            >
              From classic manicures to luxurious spa treatments, we have everything you need for beautiful nails and relaxation.
            </motion.p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6 max-w-4xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
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
              description="Ages 12 &amp; under"
            />
          </motion.div>

          <motion.div
            className="text-center mt-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-medium transition-colors tracking-wide"
            >
              View Full Service Menu
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Warm gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-cream-deep/60 via-cream to-cream-deep/40"></div>

        {/* Small decorative pearl */}
        <div className="absolute right-[8%] top-1/2 -translate-y-1/2 w-[200px] h-[200px] md:w-[280px] md:h-[280px] opacity-30 pointer-events-none hidden md:block">
          <div
            className="w-full h-full rounded-full"
            style={{
              background: `
                radial-gradient(circle at 35% 30%, rgba(255,255,255,0.8) 0%, transparent 50%),
                radial-gradient(circle at 50% 50%, rgba(250,247,244,0.9) 0%, rgba(196,167,125,0.08) 100%)
              `,
              boxShadow: 'inset 0 -20px 40px rgba(196,167,125,0.06), 0 20px 60px rgba(146,107,107,0.04)'
            }}
          />
        </div>

        <div className="relative container-custom text-center">
          <motion.div
            className="max-w-2xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            <motion.div
              className="flex items-center justify-center gap-3 mb-6"
              variants={fadeUp}
              transition={{ duration: 0.6 }}
            >
              <div className="h-px w-8 bg-secondary/40"></div>
              <div className="w-1 h-1 rounded-full bg-secondary/50"></div>
              <div className="h-px w-8 bg-secondary/40"></div>
            </motion.div>
            <motion.h2
              className="text-3xl md:text-4xl font-heading tracking-wide mb-4"
              variants={fadeUp}
              transition={{ duration: 0.6 }}
            >
              Ready to Treat Yourself?
            </motion.h2>
            <motion.p
              className="text-warmgray-light mb-10"
              variants={fadeUp}
              transition={{ duration: 0.6 }}
            >
              Book your appointment today and let us pamper you with our professional nail and spa services.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              variants={fadeUp}
              transition={{ duration: 0.6 }}
            >
              <Link
                href="/group-booking"
                className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-10 py-4 rounded-full font-medium transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5 tracking-wide"
              >
                Book Your Appointment
                <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <a
                href="tel:+12509417870"
                className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full border border-mist text-neutral-750 hover:border-primary hover:text-primary font-medium transition-all duration-300 tracking-wide"
              >
                <svg className="w-5 h-5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call Us
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

function ServicePreviewCard({ icon, title, description }) {
  return (
    <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
      <Link
        href="/menu"
        className="group bg-white rounded-2xl p-6 shadow-sm border border-mist/50 hover:shadow-lg hover:border-primary/30 transition-all duration-300 text-center block h-full"
      >
        <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary mx-auto mb-4 group-hover:bg-primary group-hover:text-white transition-all duration-300">
          {icon}
        </div>
        <h3 className="font-heading text-lg mb-1 group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-warmgray-light text-sm">{description}</p>
      </Link>
    </motion.div>
  )
}

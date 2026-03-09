import './globals.css'
import Image from 'next/image'

export const metadata = {
  title: 'Pearly Nails & Spa - Service Menu',
  description: 'Browse our nail and spa services and book your appointment at Pearly Nails & Spa in Comox, BC',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="bg-cream border-b border-mist/60">
            {/* Thin gold accent line */}
            <div className="h-[2px] bg-gradient-to-r from-transparent via-secondary/50 to-transparent"></div>
            <div className="container-custom">
              {/* Logo row */}
              <div className="flex items-center justify-between py-3 md:justify-center md:pt-5 md:pb-2">
                <a href="/" className="block transition-opacity duration-300 hover:opacity-80">
                  <Image
                    src="/pearly-logo-new.png"
                    alt="Pearly Nails & Spa"
                    width={240}
                    height={86}
                    className="h-12 md:h-20 w-auto"
                    priority
                  />
                </a>
                {/* Mobile nav — sits next to logo */}
                <div className="flex items-center gap-3 md:hidden">
                  <a href="/menu" className="text-warmgray-light hover:text-primary text-xs font-medium tracking-wide transition-colors duration-200">
                    Services
                  </a>
                  <a
                    href="/group-booking"
                    className="inline-flex items-center bg-primary hover:bg-primary-dark text-white text-xs px-4 py-2 rounded-full font-medium transition-all duration-300 tracking-wide shadow-sm shadow-primary/20"
                  >
                    Book Now
                  </a>
                </div>
              </div>
              {/* Desktop nav row */}
              <nav className="hidden md:flex items-center justify-center gap-1 pb-4 text-sm">
                <a href="/" className="px-3 py-1 text-warmgray-light hover:text-primary transition-colors duration-200 tracking-wide">Home</a>
                <span className="text-mist/80 select-none">·</span>
                <a href="/menu" className="px-3 py-1 text-warmgray-light hover:text-primary transition-colors duration-200 tracking-wide">Services</a>
                <span className="text-mist/80 select-none">·</span>
                <a href="tel:+12509417870" className="px-3 py-1 text-warmgray-light hover:text-primary transition-colors duration-200 tracking-wide">
                  (250) 941-7870
                </a>
                <span className="text-mist/80 select-none">·</span>
                <a
                  href="/group-booking"
                  className="ml-1 inline-flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white text-xs px-5 py-1.5 rounded-full font-medium transition-all duration-300 tracking-wide shadow-sm shadow-primary/20"
                >
                  Book Now
                </a>
              </nav>
            </div>
          </header>

          <main className="flex-1">
            {children}
          </main>

          <footer className="bg-neutral-850 text-white py-16 mt-16">
            <div className="container-custom">
              {/* Decorative gold divider */}
              <div className="flex items-center justify-center mb-12">
                <div className="h-px w-16 bg-gradient-to-r from-transparent to-secondary/40"></div>
                <div className="mx-4 w-1.5 h-1.5 rounded-full bg-secondary/50"></div>
                <div className="h-px w-16 bg-gradient-to-l from-transparent to-secondary/40"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div>
                  <h3 className="font-heading text-secondary tracking-[0.15em] uppercase text-sm mb-5">Contact</h3>
                  <div className="space-y-2.5">
                    <a href="tel:+12509417870" className="text-gray-300 hover:text-secondary transition-colors text-sm block">
                      (250) 941-7870
                    </a>
                    <a href="mailto:scp.deng@gmail.com" className="text-gray-300 hover:text-secondary transition-colors text-sm block">
                      scp.deng@gmail.com
                    </a>
                  </div>
                </div>
                <div>
                  <h3 className="font-heading text-secondary tracking-[0.15em] uppercase text-sm mb-5">Visit Us</h3>
                  <p className="text-gray-300 text-sm">23A-215 Port Augusta St</p>
                  <p className="text-gray-300 text-sm">Comox, BC V9M 3M9</p>
                  <p className="text-gray-500 text-xs mt-2.5 italic">Next to WOOFY&apos;S pet shop</p>
                </div>
                <div>
                  <h3 className="font-heading text-secondary tracking-[0.15em] uppercase text-sm mb-5">Hours</h3>
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Mon &mdash; Sat</span>
                      <span className="text-gray-300">9:00 AM &mdash; 6:00 PM</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Sunday</span>
                      <span className="text-gray-300">10:00 AM &mdash; 4:00 PM</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-14 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-gray-600 text-xs tracking-[0.2em] uppercase">&copy; 2026 Pearly Nails &amp; Spa</p>
                {/* Social links placeholder — add your Instagram URL here */}
                <div className="flex items-center gap-4">
                  <a
                    href="https://www.instagram.com/pearlynailscomox"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-secondary transition-colors duration-300"
                    aria-label="Instagram"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  <a
                    href="https://www.facebook.com/pearlynailscomox"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-secondary transition-colors duration-300"
                    aria-label="Facebook"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}

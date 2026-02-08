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
            <div className="container-custom py-5">
              <div className="flex justify-center">
                <a href="/" className="block transition-opacity duration-300 hover:opacity-80">
                  <Image
                    src="/pearly-logo-new.png"
                    alt="Pearly Nails & Spa"
                    width={280}
                    height={100}
                    className="h-20 md:h-28 w-auto"
                    priority
                  />
                </a>
              </div>
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

              <div className="mt-14 pt-8 border-t border-gray-800 text-center">
                <p className="text-gray-600 text-xs tracking-[0.2em] uppercase">&copy; 2026 Pearly Nails &amp; Spa</p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}

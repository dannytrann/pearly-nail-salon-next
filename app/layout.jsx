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
          <header className="bg-white border-b border-gray-100">
            <div className="container-custom py-4">
              {/* Centered logo */}
              <div className="flex justify-center">
                <a href="/" className="block">
                  <Image
                    src="/pearly-logo.webp"
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

          <footer className="bg-neutral-850 text-white py-12 mt-16">
            <div className="container-custom">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div>
                  <h3 className="text-lg font-heading text-white mb-4 tracking-wide">Contact Us</h3>
                  <p className="text-gray-300 text-sm">Phone: (250) 941-7870</p>
                  <p className="text-gray-300 text-sm">Email: info@pearlynails.com</p>
                </div>
                <div>
                  <h3 className="text-lg font-heading text-white mb-4 tracking-wide">Location</h3>
                  <p className="text-gray-300 text-sm">23A-215 Port Augusta St</p>
                  <p className="text-gray-300 text-sm">Comox, BC V9M 3M9</p>
                  <p className="text-gray-400 text-xs mt-2">Next to WOOFY'S pet shop</p>
                </div>
                <div>
                  <h3 className="text-lg font-heading text-white mb-4 tracking-wide">Hours</h3>
                  <p className="text-gray-300 text-sm">Mon-Sat: 9:00 AM - 7:00 PM</p>
                  <p className="text-gray-300 text-sm">Sunday: 10:00 AM - 6:00 PM</p>
                </div>
              </div>
              <div className="mt-10 pt-8 border-t border-gray-700 text-center text-gray-500 text-xs tracking-wide">
                <p>&copy; 2026 Pearly Nails & Spa. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}

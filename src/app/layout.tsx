import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Location Tracker - Real-time GPS Tracking',
  description: 'Track your current location, view location history, and share your coordinates with others.',
  keywords: ['location tracker', 'GPS', 'coordinates', 'geolocation', 'maps'],
  authors: [{ name: 'Location Tracker Team' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen`}>
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">LT</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">Location Tracker</h1>
              </div>
              <nav className="hidden md:flex items-center space-x-6">
                <a href="#tracker" className="text-gray-700 hover:text-blue-600 transition-colors">Tracker</a>
                <a href="#history" className="text-gray-700 hover:text-blue-600 transition-colors">History</a>
                <a href="#share" className="text-gray-700 hover:text-blue-600 transition-colors">Share</a>
              </nav>
              <button className="md:hidden p-2 text-gray-700 hover:text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-6 min-h-screen">
          {children}
        </main>
        
        <footer className="bg-white/50 backdrop-blur-sm border-t border-gray-200 mt-12">
          <div className="container mx-auto px-4 py-6 text-center text-gray-600">
            <p>&copy; 2024 Location Tracker. Built with Next.js and modern web technologies.</p>
            <p className="text-sm mt-2">Your privacy matters - all location data is stored locally on your device.</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
import type { Metadata } from 'next'
import { Inter, Urbanist } from 'next/font/google'
import './globals.css'
import TwelveCashLogo from './components/TwelveCashLogo'
import Button from './components/Button'
import { PlusIcon, SearchIcon } from '@bitcoin-design/bitcoin-icons-react/filled'

const urbanist = Urbanist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Twelve Cash',
  description: 'Simple Bitcoin User Name',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  
  return (
    <html lang="en" className="p-0 m-0">
      <body className={urbanist.className + " p-0 m-0"}>
        <div className="text-purple-800 bg-12teal bg-gradient-to-b from-purple-800/20 from-0% to-purple-800/0 to-50% h-full">
          <header className="border-b border-b-white/40 p-5 flex justify-between items-center gap-4 flex-row sticky top-0 backdrop-blur-2xl">
            <div className="flex flex-col items-center">
              <div className="scale-75 origin-left sm:scale-100">
                <TwelveCashLogo />
              </div>
            </div>
            <nav className="w-full flex flex-row items-center gap-2 justify-end sm:hidden">
              <Button href="/search" size="small" format="secondary">
                Check <SearchIcon className="w-6 h-6" />
              </Button>
              <Button href="/new" size="small">
                New <PlusIcon className="w-6 h-6" />
              </Button>
            </nav>
            <nav className="w-full flex-row items-center gap-2 justify-end hidden sm:flex">
              <Button href="/search" size="medium" format="secondary">
                Check <SearchIcon className="w-6 h-6" />
              </Button>
              <Button href="/new" size="medium">
                New <PlusIcon className="w-6 h-6" />
              </Button>
            </nav>
          </header>
          <div className="min-h-full p-4">
            {children}
          </div>
          <footer className="border-t border-t-purple-800 pt-2 mt-4 text-purple-800">
            <ul className="flex flex-col gap-2 md:flex-row md:gap-4 md: p-4">
              <li><a href="https://github.com/ATLBitLab/twelvecash">Developer Docs</a></li>
              <li>Made with  🧡 at <a href="https://atlbitlab.com/">ATL BitLab</a></li>
            </ul>
          </footer>
        </div>
      </body>
    </html>
  )
}

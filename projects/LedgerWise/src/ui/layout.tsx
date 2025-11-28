import './globals.css'
import './polyfills'
import { Inter, Playfair_Display } from 'next/font/google'
import { WalletProvider } from '@/components/WalletConnect'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })

export const metadata = {
  title: 'LedgerWise - AI Web3 Finance',
  description: 'AI-powered Web3 expense tracker',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans bg-[#fcfcfc] text-[#1a1a1a]">
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  )
}

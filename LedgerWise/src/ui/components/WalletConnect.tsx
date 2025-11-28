'use client'

import '@rainbow-me/rainbowkit/styles.css'
import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { ConnectButton } from '@rainbow-me/rainbowkit'

const config = getDefaultConfig({
  appName: 'AI Web3 Expense Tracker',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [sepolia],
  ssr: true,
})

const queryClient = new QueryClient()

interface WalletConnectProps {
  children: React.ReactNode
}

export function WalletProvider({ children }: WalletConnectProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export function WalletConnectButton() {
  return <ConnectButton />
}

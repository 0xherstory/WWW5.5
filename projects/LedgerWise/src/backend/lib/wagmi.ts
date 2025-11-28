import { createPublicClient, createWalletClient, custom, http } from 'viem'
import { sepolia } from 'viem/chains'

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http()
})

export function getWalletClient() {
  if (typeof window !== 'undefined' && window.ethereum) {
    return createWalletClient({
      chain: sepolia,
      transport: custom(window.ethereum)
    })
  }
  return null
}

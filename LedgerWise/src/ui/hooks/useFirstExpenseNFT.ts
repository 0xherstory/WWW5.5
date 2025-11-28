import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { FIRST_EXPENSE_NFT_ADDRESS, FIRST_EXPENSE_NFT_ABI } from '@/lib/constants'

/**
 * Hook: 铸造首次记账 NFT
 * @returns { mintNFT, isLoading, isSuccess, error, txHash }
 */
export function useMintFirstExpenseNFT() {
  // 1. 准备写入合约
  const {
    writeContract,
    data: hash,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract()

  // 2. 等待交易确认
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({
    hash,
  })

  /**
   * 调用合约的 mintFirstExpense 函数
   */
  const mintNFT = () => {
    writeContract({
      address: FIRST_EXPENSE_NFT_ADDRESS as `0x${string}`,
      abi: FIRST_EXPENSE_NFT_ABI,
      functionName: 'mintFirstExpense',
    })
  }

  return {
    mintNFT,
    isLoading: isWritePending || isConfirming,
    isSuccess: isConfirmed,
    error: writeError || confirmError,
    txHash: hash,
  }
}

/**
 * Hook: 检查用户是否已铸造 NFT
 * @param address - 用户钱包地址
 * @returns { hasMinted, isLoading, error }
 */
export function useCheckHasMinted(address?: `0x${string}`) {
  const {
    data: hasMinted,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: FIRST_EXPENSE_NFT_ADDRESS as `0x${string}`,
    abi: FIRST_EXPENSE_NFT_ABI,
    functionName: 'hasMinted',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  return {
    hasMinted: !!hasMinted,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook: 获取 NFT 余额
 * @param address - 用户钱包地址
 * @returns { balance, isLoading, error }
 */
export function useNFTBalance(address?: `0x${string}`) {
  const {
    data: balance,
    isLoading,
    error,
  } = useReadContract({
    address: FIRST_EXPENSE_NFT_ADDRESS as `0x${string}`,
    abi: FIRST_EXPENSE_NFT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  return {
    balance: balance ? Number(balance) : 0,
    isLoading,
    error,
  }
}

/**
 * Hook: 获取 NFT 元数据 URI
 * @param tokenId - NFT Token ID
 * @returns { metadataURI, isLoading, error }
 */
export function useNFTMetadata(tokenId?: number) {
  const {
    data: metadataURI,
    isLoading,
    error,
  } = useReadContract({
    address: FIRST_EXPENSE_NFT_ADDRESS as `0x${string}`,
    abi: FIRST_EXPENSE_NFT_ABI,
    functionName: 'tokenURI',
    args: tokenId !== undefined ? [BigInt(tokenId)] : undefined,
    query: {
      enabled: tokenId !== undefined,
    },
  })

  return {
    metadataURI: metadataURI as string | undefined,
    isLoading,
    error,
  }
}

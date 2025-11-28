import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { EXPENSE_TRACKER_ADDRESS, EXPENSE_TRACKER_ABI } from '@/lib/constants'

/**
 * 记录结构（与合约对应）
 */
export interface ExpenseRecord {
  cid: string
  timestamp: bigint
}

/**
 * Hook 1: 添加记账记录到链上
 * @returns { addRecord, isLoading, isSuccess, error, txHash }
 */
export function useAddExpenseRecord() {
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
    hash, // 直接使用 useWriteContract 返回的 hash
  })

  /**
   * 调用合约的 addRecord 函数
   * @param cid - IPFS 返回的内容标识符
   */
  const addRecord = (cid: string) => {
    // writeContract 在 Wagmi v2 中返回 void，hash 会自动存储在 data 中
    writeContract({
      address: EXPENSE_TRACKER_ADDRESS as `0x${string}`,
      abi: EXPENSE_TRACKER_ABI,
      functionName: 'addRecord',
      args: [cid],
    })
  }

  return {
    addRecord,
    isLoading: isWritePending || isConfirming, // 正在写入或等待确认
    isSuccess: isConfirmed,                     // 交易已确认
    error: writeError || confirmError,          // 错误信息
    txHash: hash,                               // 交易哈希
  }
}

/**
 * Hook 2: 从链上读取用户的所有记账记录
 * @param address - 用户钱包地址
 * @returns { records, isLoading, error, refetch }
 */
export function useFetchExpenseRecords(address?: `0x${string}`) {
  const {
    data: records,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: EXPENSE_TRACKER_ADDRESS as `0x${string}`,
    abi: EXPENSE_TRACKER_ABI,
    functionName: 'getRecords',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address, // 只有当地址存在时才执行查询
    },
  })

  return {
    records: (records as ExpenseRecord[]) || [], // 记录数组
    isLoading,                                    // 加载状态
    error,                                        // 错误信息
    refetch,                                      // 手动刷新函数
  }
}

/**
 * Hook 3: 获取用户的记录数量
 * @param address - 用户钱包地址
 * @returns { count, isLoading, error }
 */
export function useExpenseRecordCount(address?: `0x${string}`) {
  const {
    data: count,
    isLoading,
    error,
  } = useReadContract({
    address: EXPENSE_TRACKER_ADDRESS as `0x${string}`,
    abi: EXPENSE_TRACKER_ABI,
    functionName: 'getRecordCount',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  return {
    count: count ? Number(count) : 0, // 转换为 number
    isLoading,
    error,
  }
}

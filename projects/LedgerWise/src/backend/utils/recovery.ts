import { decryptData } from './crypto'
import { addTransaction, loadTransactions, StoredTransaction } from './storage'

/**
 * 从 IPFS 检索数据
 * @param cid - IPFS 内容标识符
 * @returns 解密后的数据或 null
 */
export async function retrieveFromIPFS(cid: string): Promise<string | null> {
  try {
    const response = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`)
    if (response.ok) {
      return await response.text()
    }
    return null
  } catch (error) {
    console.error(`Failed to retrieve from IPFS (${cid}):`, error)
    return null
  }
}

/**
 * 从区块链恢复所有交易数据
 * @param records - 从合约读取的记录列表 [{ cid, timestamp }]
 * @param encryptionKey - 解密密钥
 * @param onProgress - 进度回调 (current, total)
 * @returns 成功恢复的交易数量
 */
export async function restoreFromBlockchain(
  records: Array<{ cid: string; timestamp: bigint }>,
  encryptionKey: string,
  onProgress?: (current: number, total: number) => void
): Promise<number> {
  if (!records || records.length === 0) {
    console.log('No records to restore')
    return 0
  }

  let successCount = 0
  const total = records.length

  // 获取现有的 CID 列表，避免重复恢复
  const existingTransactions = loadTransactions()
  const existingCIDs = new Set(existingTransactions.map(t => t.cid).filter(Boolean))

  for (let i = 0; i < records.length; i++) {
    const record = records[i]

    // 跳过已存在的记录
    if (existingCIDs.has(record.cid)) {
      console.log(`Skipping existing CID: ${record.cid}`)
      onProgress?.(i + 1, total)
      continue
    }

    try {
      // 1. 从 IPFS 下载加密数据
      const encryptedData = await retrieveFromIPFS(record.cid)

      if (!encryptedData) {
        console.warn(`Failed to retrieve CID: ${record.cid}`)
        continue
      }

      // 2. 解密数据
      const transaction = decryptData(encryptedData, encryptionKey)

      if (!transaction) {
        console.warn(`Failed to decrypt CID: ${record.cid}`)
        continue
      }

      // 3. 添加 CID 和加密标记
      const storedTransaction: StoredTransaction = {
        ...transaction,
        cid: record.cid,
        encrypted: true
      }

      // 4. 保存到 localStorage
      addTransaction(storedTransaction)
      successCount++

      console.log(`✅ Restored transaction: ${transaction.description} (${record.cid})`)
    } catch (error) {
      console.error(`Error restoring record ${record.cid}:`, error)
    }

    // 更新进度
    onProgress?.(i + 1, total)
  }

  return successCount
}

/**
 * 智能恢复：检测是否需要恢复数据
 * @param address - 钱包地址
 * @param records - 链上记录
 * @param encryptionKey - 解密密钥
 * @param onProgress - 进度回调
 * @returns 恢复的交易数量
 */
export async function smartRestore(
  address: string,
  records: Array<{ cid: string; timestamp: bigint }>,
  encryptionKey: string,
  onProgress?: (current: number, total: number) => void
): Promise<number> {
  const localTransactions = loadTransactions()

  // 场景 1: localStorage 完全为空 → 全量恢复
  if (localTransactions.length === 0 && records.length > 0) {
    console.log('📦 localStorage is empty, performing full restore...')
    return await restoreFromBlockchain(records, encryptionKey, onProgress)
  }

  // 场景 2: 链上记录多于本地记录 → 增量恢复
  if (records.length > localTransactions.length) {
    console.log('📦 Blockchain has more records, performing incremental restore...')
    return await restoreFromBlockchain(records, encryptionKey, onProgress)
  }

  // 场景 3: 数量一致 → 检查是否有新的 CID
  const localCIDs = new Set(localTransactions.map(t => t.cid).filter(Boolean))
  const hasNewRecords = records.some(r => !localCIDs.has(r.cid))

  if (hasNewRecords) {
    console.log('📦 Found new records, performing selective restore...')
    return await restoreFromBlockchain(records, encryptionKey, onProgress)
  }

  console.log('✅ Local data is up to date, no restore needed')
  return 0
}

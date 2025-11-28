'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useSignMessage } from 'wagmi'
import { Sidebar } from '@/components/ui/Sidebar'
import { Dashboard } from '@/components/ui/Dashboard'
import { Transaction } from '@/lib/constants'
import { parseTransactionText } from '@/utils/ai'
import { encryptData, generateEncryptionKey } from '@/utils/crypto'
import { loadTransactions, addTransaction, StoredTransaction } from '@/utils/storage'
import { useAddExpenseRecord, useFetchExpenseRecords } from '@/hooks/useExpenseTracker'
import { useMintFirstExpenseNFT, useCheckHasMinted } from '@/hooks/useFirstExpenseNFT'
import { smartRestore } from '@/utils/recovery'
import MyNFT from '@/components/MyNFT'

export default function DashboardPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { addRecord, isLoading: isBlockchainLoading, isSuccess: isBlockchainSuccess, error: blockchainError } = useAddExpenseRecord()
  const { records: blockchainRecords, isLoading: isLoadingRecords } = useFetchExpenseRecords(address as `0x${string}`)
  const { mintNFT, isLoading: isNFTMinting, isSuccess: isNFTMinted, error: nftError } = useMintFirstExpenseNFT()
  const { hasMinted, refetch: refetchHasMinted } = useCheckHasMinted(address as `0x${string}`)

  const [activeTab, setActiveTab] = useState('dashboard')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [parsedResult, setParsedResult] = useState<Transaction | null>(null)
  const [transactions, setTransactions] = useState<StoredTransaction[]>([])
  const [encryptionKey, setEncryptionKey] = useState('')
  const [uploadStatus, setUploadStatus] = useState<string>('')
  const [isRestoring, setIsRestoring] = useState(false)
  const [hasAttemptedRestore, setHasAttemptedRestore] = useState(false)
  const [showNFTModal, setShowNFTModal] = useState(false)

  // 未连接钱包时跳转到 Landing
  useEffect(() => {
    if (!isConnected) {
      router.push('/')
    }
  }, [isConnected, router])

  // 加载已有交易
  useEffect(() => {
    setTransactions(loadTransactions())
  }, [])

  // 生成加密密钥
  useEffect(() => {
    if (isConnected && address && !encryptionKey) {
      handleGenerateKey()
    }
  }, [isConnected, address, encryptionKey])

  // 监听区块链交易成功
  useEffect(() => {
    if (isBlockchainSuccess) {
      setUploadStatus('✅ 区块链交易确认成功！')
      setTimeout(() => setUploadStatus(''), 3000)
    }
  }, [isBlockchainSuccess])

  // 🎨 首次交易后自动铸造 NFT
  useEffect(() => {
    const attemptNFTMint = async () => {
      // 条件检查：交易成功 + 未铸造过 + 有交易记录
      if (
        isBlockchainSuccess &&
        !hasMinted &&
        !isNFTMinting &&
        transactions.length >= 1 &&
        isConnected
      ) {
        console.log('🎨 Attempting to mint first expense NFT...')
        setUploadStatus('🎨 正在铸造首次记账 NFT...')
        mintNFT()
      }
    }

    attemptNFTMint()
  }, [isBlockchainSuccess, hasMinted, transactions.length, isConnected, isNFTMinting, mintNFT])

  // 监听 NFT 铸造成功
  useEffect(() => {
    if (isNFTMinted) {
      console.log('✅ NFT minted successfully!')
      setUploadStatus('🎉 NFT 铸造成功！')
      setShowNFTModal(true)
      refetchHasMinted() // 刷新铸造状态
      setTimeout(() => setUploadStatus(''), 3000)
    }
  }, [isNFTMinted, refetchHasMinted])

  // 监听 NFT 铸造错误
  useEffect(() => {
    if (nftError) {
      console.error('NFT minting error:', nftError)
      const errorMessage = nftError.message || String(nftError)

      if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
        setUploadStatus('⚠️ NFT 铸造已取消')
      } else if (errorMessage.includes('already minted')) {
        setUploadStatus('⚠️ 您已经铸造过 NFT')
      } else {
        setUploadStatus('⚠️ NFT 铸造失败')
      }

      setTimeout(() => setUploadStatus(''), 5000)
    }
  }, [nftError])

  // 监听区块链交易错误
  useEffect(() => {
    if (blockchainError) {
      console.error('Blockchain error:', blockchainError)

      // 解析错误类型
      const errorMessage = blockchainError.message || String(blockchainError)
      let userMessage = '⚠️ 区块链写入失败'

      if (errorMessage.includes('User rejected') || errorMessage.includes('User denied')) {
        userMessage = '⚠️ 用户取消了交易'
      } else if (errorMessage.includes('insufficient funds')) {
        userMessage = '⚠️ 钱包余额不足（需要 Sepolia ETH）'
      } else if (errorMessage.includes('network')) {
        userMessage = '⚠️ 网络错误，请检查是否在 Sepolia 测试网'
      }

      setUploadStatus(userMessage)
      setTimeout(() => setUploadStatus(''), 8000)
    }
  }, [blockchainError])

  // 🔄 自动从区块链恢复数据
  useEffect(() => {
    const performRestore = async () => {
      // 条件检查：必须满足所有条件
      if (
        !isConnected ||
        !address ||
        !encryptionKey ||
        isLoadingRecords ||
        isRestoring ||
        hasAttemptedRestore
      ) {
        return
      }

      // 检查是否有链上记录
      if (!blockchainRecords || blockchainRecords.length === 0) {
        console.log('No blockchain records found')
        setHasAttemptedRestore(true)
        return
      }

      setIsRestoring(true)
      setUploadStatus('🔄 正在从区块链恢复数据...')

      try {
        const restoredCount = await smartRestore(
          address,
          blockchainRecords,
          encryptionKey,
          (current, total) => {
            setUploadStatus(`🔄 正在恢复数据 ${current}/${total}...`)
          }
        )

        if (restoredCount > 0) {
          setUploadStatus(`✅ 成功恢复 ${restoredCount} 条记录！`)
          // 重新加载 transactions
          setTransactions(loadTransactions())
        } else {
          setUploadStatus('✅ 数据已是最新')
        }

        setTimeout(() => setUploadStatus(''), 3000)
      } catch (error) {
        console.error('Restore failed:', error)
        setUploadStatus('⚠️ 数据恢复失败')
        setTimeout(() => setUploadStatus(''), 5000)
      } finally {
        setIsRestoring(false)
        setHasAttemptedRestore(true)
      }
    }

    performRestore()
  }, [isConnected, address, encryptionKey, blockchainRecords, isLoadingRecords, isRestoring, hasAttemptedRestore])

  const handleGenerateKey = async () => {
    try {
      const signature = await signMessageAsync({ message: 'ExpenseTracker' })
      if (signature) {
        setEncryptionKey(generateEncryptionKey(signature))
      }
    } catch (err) {
      console.error('Failed to generate key:', err)
    }
  }

  const handleAnalyze = async (text: string, image?: File) => {
    setIsLoading(true)
    try {
      let result

      if (image) {
        const base64 = await fileToBase64(image)
        const response = await fetch('/api/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 })
        })
        const data = await response.json()
        if (data.success) {
          result = data.data
        }
      } else {
        result = await parseTransactionText(text)
      }

      if (result) {
        setParsedResult({
          id: Date.now().toString(),
          type: result.type,
          amount: result.amount,
          category: result.category,
          date: result.date,
          description: result.description
        })
      }
    } catch (err) {
      console.error('Parse error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmTransaction = async () => {
    if (!parsedResult) return

    const newTransaction: StoredTransaction = {
      id: parsedResult.id,
      type: parsedResult.type,
      amount: parsedResult.amount,
      category: parsedResult.category as any,
      date: parsedResult.date,
      description: parsedResult.description,
    }

    // 🔐 步骤 1: 加密数据并上传到 IPFS
    if (isConnected && encryptionKey) {
      try {
        setUploadStatus('正在加密数据...')
        const encryptedData = encryptData(newTransaction, encryptionKey)

        setUploadStatus('正在上传到 IPFS...')
        const response = await fetch('/api/ipfs-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: encryptedData }),
        })

        if (response.ok) {
          const result = await response.json()
          const cid = result.cid

          if (cid) {
            newTransaction.cid = cid
            newTransaction.encrypted = true

            // 🔗 步骤 2: 将 CID 写入区块链索引
            setUploadStatus('正在写入区块链...')
            addRecord(cid)
            // 注意：区块链交易确认由 useEffect 监听 isBlockchainSuccess 处理
          }
        } else {
          console.error('IPFS upload failed')
          setUploadStatus('IPFS 上传失败')
        }
      } catch (err) {
        console.error('Upload process failed:', err)
        setUploadStatus('上传过程出错')
      }
    }

    // 📝 步骤 3: 保存到本地存储
    const updated = addTransaction(newTransaction)
    setTransactions(updated)
    setParsedResult(null)

    // 清除状态提示
    setTimeout(() => setUploadStatus(''), 3000)
  }

  const handleBatchImport = async (importedTransactions: Transaction[]) => {
    if (importedTransactions.length === 0) return

    setUploadStatus(`正在导入 ${importedTransactions.length} 条记录...`)

    let successCount = 0
    let failCount = 0

    for (let i = 0; i < importedTransactions.length; i++) {
      const tx = importedTransactions[i]
      
      try {
        const newTransaction: StoredTransaction = {
          id: tx.id || Date.now().toString() + '-' + i,
          type: tx.type,
          amount: tx.amount,
          category: tx.category as any,
          date: tx.date,
          description: tx.description,
        }

        // 🔐 加密并上传到 IPFS
        if (isConnected && encryptionKey) {
          try {
            const encryptedData = encryptData(newTransaction, encryptionKey)
            const response = await fetch('/api/ipfs-upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ data: encryptedData }),
            })

            if (response.ok) {
              const result = await response.json()
              if (result.cid) {
                newTransaction.cid = result.cid
                newTransaction.encrypted = true
                // 写入区块链
                addRecord(result.cid)
              }
            }
          } catch (err) {
            console.error(`Transaction ${i + 1} upload failed:`, err)
          }
        }

        // 📝 保存到本地存储
        const updated = addTransaction(newTransaction)
        setTransactions(updated)
        successCount++

        // 更新进度
        setUploadStatus(`正在导入 ${i + 1}/${importedTransactions.length}...`)
      } catch (err) {
        console.error(`Transaction ${i + 1} import failed:`, err)
        failCount++
      }
    }

    // 显示导入结果
    if (failCount === 0) {
      setUploadStatus(`✅ 成功导入 ${successCount} 条记录！`)
    } else {
      setUploadStatus(`⚠️ 导入完成：成功 ${successCount} 条，失败 ${failCount} 条`)
    }

    setTimeout(() => setUploadStatus(''), 5000)
  }

  const savingsGoals = [
    { id: '1', name: 'Emergency Fund', targetAmount: 2500, savedAmount: 1500, color: '#ef4444', icon: '🚨', estimatedDate: 'Aug 2025', controlledCategories: [] },
    { id: '2', name: 'Vacation Fund', targetAmount: 2000, savedAmount: 700, color: '#a855f7', icon: '🏖️', estimatedDate: 'Dec 2025', controlledCategories: [] },
  ]

  if (!isConnected) return null

  return (
    <>
      <div className="flex min-h-screen bg-[#fcfcfc]">
        <Sidebar
          currentPage={activeTab}
          onNavigate={setActiveTab}
          isCollapsed={isSidebarCollapsed}
        />
        <main className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
          <Dashboard
            activeTab={activeTab}
            savingsGoals={savingsGoals}
            transactions={transactions}
            onAnalyze={handleAnalyze}
            isLoading={isLoading || isBlockchainLoading || isRestoring || isNFTMinting}
            parsedResult={parsedResult}
            onConfirmTransaction={handleConfirmTransaction}
            uploadStatus={uploadStatus}
            walletAddress={address}
            onBatchImport={handleBatchImport}
            hasMinted={hasMinted}
            onMintNFT={mintNFT}
            isNFTMinting={isNFTMinting}
            onShowNFTModal={() => setShowNFTModal(true)}
          />
        </main>
      </div>

      {/* NFT Minting Success Modal */}
      <MyNFT
        isOpen={showNFTModal}
        onClose={() => setShowNFTModal(false)}
        nftImage="/nft-images/first-expense-nft.jpg"
        userName="Alex"
      />
    </>
  )
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}



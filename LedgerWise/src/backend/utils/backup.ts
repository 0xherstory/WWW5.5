import { Transaction } from '@/lib/constants'

interface BackupData {
  version: string
  exportDate: string
  transactionCount: number
  data: Transaction[]
}

/**
 * 下载JSON备份文件
 */
export function downloadBackup(transactions: Transaction[]) {
  const backup: BackupData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    transactionCount: transactions.length,
    data: transactions
  }

  const json = JSON.stringify(backup, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `ai-expense-backup-${Date.now()}.json`
  link.click()

  URL.revokeObjectURL(url)
}

/**
 * 从备份文件恢复数据
 */
export function uploadBackup(file: File): Promise<Transaction[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const backup: BackupData = JSON.parse(content)

        if (!backup.data || !Array.isArray(backup.data)) {
          throw new Error('备份文件格式错误')
        }

        // 验证数据格式
        if (backup.data.length > 0) {
          const firstItem = backup.data[0]
          if (!firstItem.id || !firstItem.type || !firstItem.amount) {
            throw new Error('备份数据不完整')
          }
        }

        resolve(backup.data)
      } catch (error) {
        reject(new Error('备份文件解析失败'))
      }
    }

    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}

/**
 * 导出为CSV格式
 */
export function exportToCSV(transactions: Transaction[]) {
  // CSV Header
  const header = ['日期', '类型', '分类', '金额', '描述', '是否加密', 'IPFS_CID']

  // CSV Rows
  const rows = transactions.map(t => [
    t.date,
    t.type === 'expense' ? '支出' : '收入',
    t.category,
    t.amount.toFixed(2),
    t.description,
    t.encrypted ? '是' : '否',
    t.cid || '-'
  ])

  // Combine
  const csvContent = [header, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')

  // Add BOM for Excel UTF-8 support
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })

  // Download
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `记账数据_${new Date().toISOString().split('T')[0]}.csv`)
  link.click()

  URL.revokeObjectURL(url)
}

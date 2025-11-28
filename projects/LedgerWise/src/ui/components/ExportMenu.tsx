'use client'

import { Transaction } from '@/lib/constants'
import { useState, useRef } from 'react'
import { exportToCSV, downloadBackup, uploadBackup } from '@/utils/backup'

interface ExportMenuProps {
  transactions: Transaction[]
  onImportBackup: (transactions: Transaction[]) => void
}

export default function ExportMenu({ transactions, onImportBackup }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert('暂无数据可导出')
      return
    }
    exportToCSV(transactions)
    setIsOpen(false)
  }

  const handleDownloadBackup = () => {
    if (transactions.length === 0) {
      alert('暂无数据可备份')
      return
    }
    downloadBackup(transactions)
    setIsOpen(false)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
    setIsOpen(false)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const importedData = await uploadBackup(file)
      onImportBackup(importedData)
      alert(`成功恢复 ${importedData.length} 条记账记录！`)
    } catch (error: any) {
      alert(error.message || '备份恢复失败')
    } finally {
      setIsImporting(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="relative">
      {/* 导出按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span className="hidden sm:inline">导出</span>
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* 菜单内容 */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
            <button
              onClick={handleExportCSV}
              disabled={transactions.length === 0}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-xl">📥</span>
              <div>
                <div className="font-medium text-sm">导出 CSV</div>
                <div className="text-xs text-gray-500">Excel 表格格式</div>
              </div>
            </button>

            <button
              onClick={handleDownloadBackup}
              disabled={transactions.length === 0}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-xl">💾</span>
              <div>
                <div className="font-medium text-sm">下载备份</div>
                <div className="text-xs text-gray-500">JSON 完整数据</div>
              </div>
            </button>

            <div className="border-t border-gray-200 my-2"></div>

            <button
              onClick={handleImportClick}
              disabled={isImporting}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 disabled:opacity-50"
            >
              <span className="text-xl">📤</span>
              <div>
                <div className="font-medium text-sm">恢复备份</div>
                <div className="text-xs text-gray-500">从文件恢复</div>
              </div>
            </button>

            {/* 隐藏的文件输入 */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </>
      )}
    </div>
  )
}

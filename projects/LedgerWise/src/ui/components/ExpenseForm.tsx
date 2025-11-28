'use client'

import { useState } from 'react'
import { parseTransactionText, ParseResult } from '@/utils/ai'

interface TransactionFormProps {
  onTransactionAdded: (transaction: ParseResult) => void
}

export default function TransactionForm({ onTransactionAdded }: TransactionFormProps) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [parsedResult, setParsedResult] = useState<ParseResult | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setIsLoading(true)
    setError('')
    setParsedResult(null)
    
    try {
      const result = await parseTransactionText(input.trim())
      if (result) {
        setParsedResult(result)
      } else {
        setError('解析失败，请重新输入')
      }
    } catch (err: any) {
      const errorMessage = err.message || '解析失败，请重试'
      setError(errorMessage)
      console.error('Parse error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (parsedResult) {
      onTransactionAdded(parsedResult)
      setInput('')
      setParsedResult(null)
    }
  }

  const handleCancel = () => {
    setParsedResult(null)
    setError('')
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">添加记账</h2>
      
      {!parsedResult ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="例如：今天吃饭30块"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'AI解析中...' : '提交'}
            </button>
          </div>
          
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
        </form>
      ) : (
        <div className="space-y-4">
          <div className={`p-4 rounded-md ${parsedResult.type === 'income' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <h3 className="font-medium mb-2">AI解析结果：</h3>
            <div className="space-y-1 text-sm">
              <div>类型: {parsedResult.type === 'income' ? '收入' : '支出'}</div>
              <div>金额: ¥{parsedResult.amount}</div>
              <div>分类: {parsedResult.category}</div>
              <div>日期: {parsedResult.date}</div>
              <div>描述: {parsedResult.description}</div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              确认添加
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              重新输入
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

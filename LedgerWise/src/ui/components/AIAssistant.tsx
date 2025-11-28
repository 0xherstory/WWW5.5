'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import ParticleSphere from './ParticleSphere'
import { StoredTransaction } from '@/utils/storage'
import { computeAllScores, InputData, Scores } from '@/utils/financial_health_score'

interface AIAssistantProps {
  transactions: StoredTransaction[]
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const AIAssistant: React.FC<AIAssistantProps> = ({ transactions }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Calculate financial data for AI context
  const getFinancialData = () => {
    const now = new Date()
    const thisMonth = transactions.filter(t => {
      const txDate = new Date(t.date)
      return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear()
    })

    const income = thisMonth
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const total_expense = thisMonth
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const savings = Math.max(0, income - total_expense)
    const debt_payment = 0 // Could be enhanced to track debt separately

    const inputData: InputData = { income, total_expense, savings, debt_payment }
    const scores: Scores = computeAllScores(inputData)

    return {
      income,
      total_expense,
      savings,
      debt_payment,
      ...scores
    }
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const financialData = getFinancialData()

      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_query: userMessage.content,
          financial_data: financialData
        })
      })

      const data = await response.json()

      if (data.success) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error) {
      console.error('AI Assistant error:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="relative w-full h-[calc(100vh-100px)] overflow-hidden animate-in fade-in duration-500">
      {/* Background Layer - Particle Sphere */}
      <div className="absolute inset-0">
        <ParticleSphere />
      </div>

      {/* Chat Interface - Overlaid */}
      <div className="relative z-30 h-full flex flex-col p-6">
        <div className="flex flex-col h-full max-w-4xl mx-auto w-full rounded-3xl overflow-hidden bg-gradient-to-b from-white/5 to-white/0 shadow-2xl border border-white/20">

          {/* Chat Header */}
          <div className="px-6 py-4 rounded-t-3xl bg-gradient-to-r from-amber-100/40 to-orange-100/40 backdrop-blur-sm border-b border-amber-200/50 shadow-sm">
            <h2 className="text-lg font-serif font-bold text-gray-800">AI Financial Assistant</h2>
            <p className="text-sm text-gray-600">Ask me anything about your finances</p>
          </div>

          {/* Chat Messages */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-4"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
              </div>
            ) : (
              messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-lg ${
                      message.role === 'user'
                        ? 'rounded-br-md bg-gradient-to-br from-[#ebc160]/60 via-[#d4af37]/60 to-[#c9a861]/60 backdrop-blur-md text-white border border-white/20'
                        : 'rounded-bl-md bg-gradient-to-br from-white/40 via-gray-50/40 to-white/35 backdrop-blur-md text-gray-800 border border-gray-200/30'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                    <div className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-white/70' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/40 backdrop-blur-md px-4 py-3 rounded-2xl rounded-bl-md border border-gray-200/30 shadow-lg">
                  <Loader2 className="w-5 h-5 animate-spin text-[#ebc160]" />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="px-6 py-4 rounded-b-3xl bg-gradient-to-r from-gray-50/40 to-white/40 backdrop-blur-sm border-t border-gray-200/50 shadow-sm">
            <div className="flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask AI for financial advice..."
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#ebc160]/30 focus:border-[#ebc160] text-sm backdrop-blur-sm"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="px-4 py-3 bg-gradient-to-br from-[#ebc160] to-[#d4af37] text-white rounded-xl hover:from-[#d4af37] hover:to-[#c9a861] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2 text-center drop-shadow-sm">
              ⚠️ AI-generated advice is for reference only. Not financial advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIAssistant

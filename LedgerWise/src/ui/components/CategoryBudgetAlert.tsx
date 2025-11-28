'use client'

interface CategoryBudgetAlertProps {
  category: string
  currentSpending: number
  monthlyLimit: number
  goalName: string
  onClose: () => void
}

export function CategoryBudgetAlert({
  category,
  currentSpending,
  monthlyLimit,
  goalName,
  onClose
}: CategoryBudgetAlertProps) {
  const remaining = monthlyLimit - currentSpending
  const percentUsed = (currentSpending / monthlyLimit) * 100
  const isOver = percentUsed > 100
  const isWarning = percentUsed > 80
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white border-8 w-full max-w-md ${
        isOver ? 'border-red-500' : isWarning ? 'border-yellow-500' : 'border-blue-500'
      }`}>
        {/* Header */}
        <div className={`p-4 border-b-8 ${
          isOver ? 'border-red-500 bg-red-100' : 
          isWarning ? 'border-yellow-500 bg-yellow-100' : 
          'border-blue-500 bg-blue-100'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-gray-600">预算预警</p>
              <h3 className="text-2xl font-black">{category}</h3>
            </div>
            <span className="text-4xl">
              {isOver ? '🚨' : isWarning ? '⚠️' : 'ℹ️'}
            </span>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              此类别会影响您的存钱目标： <span className="font-black">{goalName}</span>
            </p>
            
            <div className="relative h-8 border-4 border-black bg-white overflow-hidden mb-2">
              <div 
                className={`h-full ${
                  isOver ? 'bg-red-400' : isWarning ? 'bg-yellow-400' : 'bg-blue-400'
                }`}
                style={{ width: `${Math.min(percentUsed, 100)}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-black text-black mix-blend-difference">
                  {percentUsed.toFixed(0)}%
                </span>
              </div>
            </div>
            
            <div className="flex justify-between text-sm font-bold">
              <span>目前支出: ${currentSpending.toFixed(2)}</span>
              <span>限制支出: ${monthlyLimit.toFixed(2)}</span>
            </div>
          </div>
          
          {isOver ? (
            <div className="p-4 border-4 border-red-500 bg-red-50">
              <p className="font-black text-red-700 text-center">
                超过目标${Math.abs(remaining).toFixed(2)}元!
              </p>
              <p className="text-sm text-gray-700 text-center mt-2">
                为了达到目标，请考虑减少这方面的支出。
              </p>
            </div>
          ) : isWarning ? (
            <div className="p-4 border-4 border-yellow-500 bg-yellow-50">
              <p className="font-black text-yellow-700 text-center">
                ⚡ 只剩${remaining.toFixed(2)}了!
              </p>
              <p className="text-sm text-gray-700 text-center mt-2">
                您的消费额度快满了，请谨慎消费！
              </p>
            </div>
          ) : (
            <div className="p-4 border-4 border-blue-500 bg-blue-50">
              <p className="font-black text-blue-700 text-center">
                ✓ 剩余${remaining.toFixed(2)}
              </p>
              <p className="text-sm text-gray-700 text-center mt-2">
                继续保持！
              </p>
            </div>
          )}
          
          <button
            onClick={onClose}
            className="w-full neo-btn bg-gray-300 hover:bg-gray-400"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  )
}

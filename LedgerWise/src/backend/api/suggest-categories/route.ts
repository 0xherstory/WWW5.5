import { NextRequest, NextResponse } from 'next/server'
import { Transaction } from '@/lib/constants'

const QWEN_API_KEY = process.env.QWEN_API_KEY || ''
const QWEN_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'

export async function POST(request: NextRequest) {
  try {
    const { transactions }: { transactions: Transaction[] } = await request.json()
    
    if (!transactions || transactions.length === 0) {
      return NextResponse.json(
        { error: 'No transactions provided' },
        { status: 400 }
      )
    }
    
    // Filter to last 30 days of expenses
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentExpenses = transactions.filter(t => 
      t.type === 'expense' && 
      new Date(t.date) > thirtyDaysAgo
    )
    
    if (recentExpenses.length === 0) {
      return NextResponse.json({ suggestions: [] })
    }
    
    // Calculate category spending
    const categoryTotals: Record<string, { total: number; count: number }> = {}
    
    recentExpenses.forEach(t => {
      if (!categoryTotals[t.category]) {
        categoryTotals[t.category] = { total: 0, count: 0 }
      }
      categoryTotals[t.category].total += t.amount
      categoryTotals[t.category].count += 1
    })
    
    // Get top spending categories
    const topCategories = Object.entries(categoryTotals)
      .map(([category, data]) => ({
        category,
        total: data.total,
        count: data.count,
        average: data.total / data.count
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
    
    // Try AI suggestions first
    if (QWEN_API_KEY) {
      try {
        const prompt = `You are a financial advisor helping users set savings goals. 

Based on the following 30-day spending data, suggest which expense categories the user should control and reasonable monthly budget limits:

${topCategories.map(cat => 
  `- ${cat.category}: $${cat.total.toFixed(2)} total, ${cat.count} transactions, $${cat.average.toFixed(2)} average`
).join('\n')}

Provide 3-5 category suggestions with recommended monthly limits. For each category:
- Consider the current spending level
- Suggest a 15-25% reduction that's realistic
- Prioritize categories with highest spending or most transactions

Return ONLY a JSON array in this exact format, no other text:
[
  {
    "category": "category name",
    "currentMonthlyAverage": current_amount_number,
    "suggestedLimit": suggested_amount_number
  }
]`

        const response = await fetch(QWEN_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${QWEN_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'qwen-turbo',
            messages: [
              { role: 'system', content: 'You are a helpful financial advisor. Always respond with valid JSON only.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const content = data.choices[0]?.message?.content || ''
          
          try {
            // Extract JSON from response
            const jsonMatch = content.match(/\[[\s\S]*\]/)
            if (jsonMatch) {
              const suggestions = JSON.parse(jsonMatch[0])
              return NextResponse.json({ suggestions })
            }
          } catch (parseError) {
            console.error('Failed to parse AI response:', parseError)
          }
        }
      } catch (aiError) {
        console.error('AI suggestion error:', aiError)
      }
    }
    
    // Fallback: Use rule-based suggestions
    const fallbackSuggestions = topCategories.map(cat => ({
      category: cat.category,
      currentMonthlyAverage: cat.total,
      suggestedLimit: Math.floor(cat.total * 0.8) // 20% reduction
    }))
    
    return NextResponse.json({ suggestions: fallbackSuggestions })
    
  } catch (error) {
    console.error('Suggest categories error:', error)
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    )
  }
}

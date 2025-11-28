import { NextRequest, NextResponse } from 'next/server'

interface Transaction {
  type: 'income' | 'expense'
  amount: number
  category: string
  date: string
  description: string
}

interface InsightRequest {
  transactions: Transaction[]
}

interface InsightResponse {
  tip: string
  encouragement: string
}

export async function POST(req: NextRequest) {
  try {
    const { transactions }: InsightRequest = await req.json()

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({
        tip: '开始记账，养成良好的财务管理习惯',
        encouragement: '迈出理财第一步，未来可期！'
      })
    }

    // Analyze last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentTransactions = transactions.filter(t => {
      const txDate = new Date(t.date)
      return txDate >= thirtyDaysAgo
    })

    // Calculate statistics
    const totalIncome = recentTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpense = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    // Category breakdown
    const categoryExpenses: { [key: string]: number } = {}
    recentTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount
      })

    const topCategory = Object.entries(categoryExpenses)
      .sort(([, a], [, b]) => b - a)[0]

    // Build analysis context
    const analysisContext = {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: recentTransactions.length,
      topCategory: topCategory ? topCategory[0] : '无',
      topCategoryAmount: topCategory ? topCategory[1] : 0,
      categoryCount: Object.keys(categoryExpenses).length
    }

    // Call Qwen API for insights
    const insights = await generateInsights(analysisContext)

    return NextResponse.json(insights)
  } catch (error: any) {
    console.error('Insights generation error:', error)
    return NextResponse.json(
      { error: '生成建议失败', details: error.message },
      { status: 500 }
    )
  }
}

async function generateInsights(context: any): Promise<InsightResponse> {
  const prompt = `你是一位专业的理财顾问。基于以下用户近30天的财务数据，提供2条简洁的理财建议：

数据摘要：
- 总收入：¥${context.totalIncome.toFixed(2)}
- 总支出：¥${context.totalExpense.toFixed(2)}
- 结余：¥${context.balance.toFixed(2)}
- 记账次数：${context.transactionCount}次
- 最大支出类别：${context.topCategory}（¥${context.topCategoryAmount.toFixed(2)}）

请提供：
1. 优化建议（tip）：针对用户消费习惯的具体改进建议，1句话，不超过30字
2. 正面激励（encouragement）：表扬用户的良好理财行为，1句话，不超过30字

要求：
- 建议要具体、可行
- 语气友好、积极
- 不要使用emoji
- 直接返回JSON格式：{"tip": "...", "encouragement": "..."}

示例输出：
{"tip": "餐饮支出较高，建议每周在家做饭3-4次可节省开支", "encouragement": "坚持记账30天，财务意识明显提升！"}
`

  try {
    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.QWEN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`Qwen API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('No content in Qwen response')
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from response')
    }

    const insights = JSON.parse(jsonMatch[0])

    return {
      tip: insights.tip || '继续保持良好的记账习惯',
      encouragement: insights.encouragement || '每一笔记录都是进步！'
    }
  } catch (error) {
    console.error('Qwen API call failed:', error)

    // Fallback insights based on simple rules
    return generateFallbackInsights(context)
  }
}

function generateFallbackInsights(context: any): InsightResponse {
  const { totalIncome, totalExpense, balance, topCategory } = context

  let tip = '继续保持良好的记账习惯，积累财务数据'
  let encouragement = '每一笔记录都是迈向财务自由的一步！'

  // Generate tip based on spending ratio
  const expenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) : 0

  if (expenseRatio > 0.8) {
    tip = `支出占收入${(expenseRatio * 100).toFixed(0)}%，建议控制${topCategory}类消费`
  } else if (expenseRatio > 0.5) {
    tip = `${topCategory}支出较多，可以尝试设定月度预算`
  } else if (balance > 0) {
    tip = '收支平衡良好，可以考虑将结余用于投资理财'
  }

  // Generate encouragement
  if (balance > 0) {
    encouragement = `本月结余¥${balance.toFixed(2)}，理财规划很成功！`
  } else if (context.transactionCount > 20) {
    encouragement = '记账习惯优秀，财务管理意识值得称赞！'
  } else if (context.transactionCount > 10) {
    encouragement = '坚持记账，财务状况越来越清晰！'
  }

  return { tip, encouragement }
}

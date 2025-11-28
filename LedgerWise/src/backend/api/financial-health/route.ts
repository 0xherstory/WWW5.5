import { NextRequest, NextResponse } from 'next/server'

interface FinancialHealthRequest {
  financial_data: {
    income: number
    total_expense: number
    savings: number
    debt_payment: number
    score_savings: number
    score_debt: number
    score_cashflow: number
    score_spending_pressure: number
    score_total: number
    grade: string
  }
}

function buildPrompt(data: FinancialHealthRequest): string {
  const fd = data.financial_data
  return `You are a personal financial health advisor. Based on the user's financial data and system-calculated scores, provide concise, objective, and actionable financial insights.

DO NOT provide any investment advice. Only give budget, savings, and spending improvement suggestions.

【User Data】
- Monthly Income: $${fd.income}
- Total Expenses: $${fd.total_expense}
- Monthly Savings: $${fd.savings}
- Monthly Debt Payment: $${fd.debt_payment}

【System-Calculated Financial Scores】
(Scores calculated by system rules)
- Savings Capacity (30% weight): ${fd.score_savings} / 100
- Debt Pressure (30% weight): ${fd.score_debt} / 100
- Cash Flow Balance (20% weight): ${fd.score_cashflow} / 100
- Spending Pressure (20% weight): ${fd.score_spending_pressure} / 100

【Total Score Formula】
Total = Savings × 0.3 + Debt × 0.3 + Cash Flow × 0.2 + Spending × 0.2

【User's Financial Health Score】
- Total: ${fd.score_total} / 100
- Grade: ${fd.grade}

Respond STRICTLY in the following format:
----------------------------------------------------
【Financial Status Summary】
(1-2 sentences summarizing overall status, referencing strengths or weaknesses)

【Key Issues】
- List 2-3 most important issues this month
- Max 20 words each
- Must reference specific scores, e.g., "Debt pressure only 40 points"

【Improvement Suggestions】
3 actionable budget/savings suggestions, each containing:
- Title (4-8 words)
- Action description (max 25 words)

【Next Month Reminder】
One future reminder or risk alert (max 20 words)
----------------------------------------------------
Respond STRICTLY in this format. Use English.`
}

async function callQwenAPI(prompt: string) {
  const qwenApiKey = process.env.QWEN_API_KEY
  if (!qwenApiKey) return null

  const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${qwenApiKey}`,
    },
    body: JSON.stringify({
      model: 'qwen-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  })

  if (!response.ok) throw new Error('Qwen API request failed')

  const result = await response.json()
  return result.choices?.[0]?.message?.content
}

async function callClaudeAPI(prompt: string) {
  const claudeApiKey = process.env.CLAUDE_API_KEY
  if (!claudeApiKey) return null

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': claudeApiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    }),
  })

  if (!response.ok) throw new Error('Claude API request failed')

  const result = await response.json()
  return result.content?.[0]?.text
}

export async function POST(request: NextRequest) {
  try {
    const body: FinancialHealthRequest = await request.json()

    const hasQwen = !!process.env.QWEN_API_KEY
    const hasClaude = !!process.env.CLAUDE_API_KEY

    if (!hasQwen && !hasClaude) {
      return NextResponse.json({ error: 'No AI service configured' }, { status: 500 })
    }

    const prompt = buildPrompt(body)
    let aiResponse = null

    try {
      if (hasQwen) {
        aiResponse = await callQwenAPI(prompt)
      }
    } catch (error) {
      console.log('Qwen API failed, trying Claude...', error)
    }

    if (!aiResponse && hasClaude) {
      try {
        aiResponse = await callClaudeAPI(prompt)
      } catch (error) {
        console.error('Claude API also failed:', error)
      }
    }

    if (!aiResponse) {
      return NextResponse.json({ error: 'All AI services failed' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      response: aiResponse
    })

  } catch (error) {
    console.error('Financial Health API error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
